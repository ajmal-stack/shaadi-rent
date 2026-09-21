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
  const { pathname } = request.nextUrl;

  const isProtectedPath = pathname.startsWith("/account");
  const isAuthLogin = pathname === "/auth/login";

  // Check if any supabase auth cookie is present
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  // FAST PATH: For public browsing routes (like /browse, /outfits, /, etc.)
  // Skip the blocking 1.4-second network call to Supabase auth in middleware!
  if (!isProtectedPath && !isAuthLogin) {
    if (!hasAuthCookie || pathname.startsWith("/browse") || pathname.startsWith("/outfits")) {
      return NextResponse.next({ request });
    }
  }

  const { supabase, getResponse } = createMiddlewareClient(request);

  // MUST call getUser() — validates JWT and refreshes session if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route protection ────────────────────────────────────────────────────────
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
