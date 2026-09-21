import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Next.js proxy / middleware — runs on every non-static request.
 *
 * Responsibilities:
 *  1. Refresh expired Supabase auth tokens by calling getUser().
 *  2. Protect /account routes — unauthenticated users are redirected to /auth/login.
 *  3. Redirect already-authenticated users away from /auth/login to target page.
 *  4. Copy refreshed session cookies to any redirect responses.
 */
export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request);

  // MUST call getUser() — validates JWT and refreshes session if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Route protection ────────────────────────────────────────────────────────
  const isProtectedPath = pathname.startsWith("/account");

  if (!user && isProtectedPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Forward any session cookies to the redirect response
    getResponse().cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Authenticated users don't need to see the login page
  if (user && pathname === "/auth/login") {
    const nextParam = request.nextUrl.searchParams.get("next");
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/account";

    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = safeNext;
    targetUrl.search = "";
    const redirectResponse = NextResponse.redirect(targetUrl);

    // Forward any session cookies to the redirect response
    getResponse().cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Return the response that carries any refreshed-session cookies
  return getResponse();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - common static extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
