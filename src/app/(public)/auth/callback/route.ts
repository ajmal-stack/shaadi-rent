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
 *  4. On failure, redirects to /auth/error.
 *
 * Security:
 * - The access/refresh tokens are stored in httpOnly cookies by Supabase —
 *   they are NEVER included in the redirect URL.
 * - We call createClient() (server-side) so cookie-writing is server-controlled.
 * - The `next` param is validated to only allow internal paths (must start with /)
 *   to prevent open redirect attacks.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  // Supabase/OAuth providers send an `error` param when the user denies access
  // or something goes wrong on the provider's side.
  const oauthError = searchParams.get("error");

  // Optional next redirect — validated to be a relative internal path only.
  const nextParam = searchParams.get("next");
  const safeNext =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/account";

  if (oauthError) {
    // Do not reflect the OAuth error string into the URL to avoid
    // information leakage; just show the generic error page.
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Session established — handle_new_user() trigger has created/confirmed
      // the profiles row. Redirect to the requested page or /account.
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // No code present, or code exchange failed — redirect to error page.
  return NextResponse.redirect(`${origin}/auth/error`);
}
