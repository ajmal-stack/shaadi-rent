import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler — /auth/callback
 *
 * After the user completes Google OAuth, Google redirects back to this route
 * with a short-lived `code` query parameter. This handler:
 *
 *  1. Checks for an `error` param first (user denied access, etc.).
 *  2. Exchanges the code for a Supabase session using the server-side client.
 *  3. On success, redirects to `next` param (if provided and safe) or /account.
 *  4. On failure, redirects to /auth/error with error description.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");

  // Optional next redirect — validated to be a relative internal path only.
  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/account";

  if (oauthError) {
    console.error("[AuthCallback] OAuth error from provider:", oauthError, oauthErrorDesc);
    const errMessage = oauthErrorDesc || oauthError;
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errMessage)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session established successfully
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    console.error("[AuthCallback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
    );
  }

  // No code present — redirect to error page
  console.error("[AuthCallback] No authorization code received in callback URL.");
  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent("No authorization code received from provider.")}`
  );
}
