"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Initiates Google OAuth login.
 *
 * Called via a form action from the login page (Server Action).
 * The OAuth redirect URL is constructed server-side so it is never
 * visible in client-side JavaScript bundles.
 *
 * Security:
 * - No client secrets are read here — Supabase handles the OAuth dance.
 * - The redirectTo URL is derived from the request `origin` header,
 *   which Next.js makes available server-side.
 * - Role is NOT set here — the handle_new_user() DB trigger always assigns
 *   'customer'. Admin role requires direct DB intervention.
 * - The `next` param is validated server-side to be an internal path only.
 */
export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  // Read the `next` param from the form (hidden input) — validate it is internal.
  const rawNext = formData.get("next")?.toString() ?? "";
  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "";

  // Append next to the callback URL so /auth/callback can redirect there.
  const callbackUrl = safeNext
    ? `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
    : `${origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        // Request a refresh token so sessions can be extended server-side.
        access_type: "offline",
        // Force the account picker to appear so users can switch accounts.
        prompt: "select_account",
      },
    },
  });

  if (error) {
    // Redirect to error page — do not expose raw error details in the URL.
    redirect("/auth/error");
  }

  if (data.url) {
    // Redirect the browser to Google's OAuth consent screen.
    redirect(data.url);
  }
}

/**
 * Signs the current user out and redirects to /auth/login.
 *
 * Called via a form action from SignOutButton (Client Component).
 * Supabase clears the auth cookies on sign-out.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
