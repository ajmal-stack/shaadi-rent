import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Next.js middleware — runs on every non-static request.
 *
 * Responsibilities:
 *  1. Refresh expired Supabase auth tokens by calling getUser().
 *     This is the ONLY correct way to refresh sessions in middleware;
 *     getSession() reads only from the cookie and does not validate with Supabase.
 *  2. Protect /account (and future /account/**) routes — unauthenticated
 *     users are redirected to /auth/login.
 *  3. Redirect already-authenticated users away from /auth/login to /account.
 */
export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request);

  // MUST call getUser() — this validates the JWT with Supabase and
  // refreshes the session if needed, writing updated cookies via setAll().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Route protection ────────────────────────────────────────────────────────
  // Unauthenticated users cannot access /account or any sub-path.
  const isProtectedPath = pathname.startsWith("/account");

  if (!user && isProtectedPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users don't need to see the login page.
  if (user && pathname === "/auth/login") {
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = "/account";
    return NextResponse.redirect(accountUrl);
  }

  // Return the response that carries any refreshed-session cookies.
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
