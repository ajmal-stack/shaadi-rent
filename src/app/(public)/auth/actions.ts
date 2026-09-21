"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Returns the public origin URL for the current request.
 * Resolves x-forwarded-host / host dynamically, ensuring that
 * production Vercel domains, custom domains, and localhost dev
 * always generate the correct OAuth callback URL.
 */
function getSiteOrigin(headersList: Headers): string {
  const forwardedHost = headersList.get("x-forwarded-host");
  const host = forwardedHost || headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto");
  const isLocalhost = Boolean(
    !host || host.includes("localhost") || host.includes("127.0.0.1")
  );
  const proto = forwardedProto || (isLocalhost ? "http" : "https");

  // 1. If running with an actual host header in production, use it directly.
  if (host && !isLocalhost) {
    return `${proto}://${host}`;
  }

  // 2. Next, check origin header if present and not localhost
  const originHeader = headersList.get("origin");
  if (originHeader && !originHeader.includes("localhost")) {
    return originHeader;
  }

  // 3. Fallback to production environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && !siteUrl.includes("localhost")) {
    const clean = siteUrl.replace(/\/$/, "");
    return clean.startsWith("http") ? clean : `https://${clean}`;
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    const clean = vercelUrl.replace(/\/$/, "");
    return clean.startsWith("http") ? clean : `https://${clean}`;
  }

  // 4. Localhost fallback
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/**
 * Initiates Google OAuth login.
 *
 * Called via a form action from the login page (Server Action).
 * The OAuth redirect URL is constructed server-side so it is never
 * visible in client-side JavaScript bundles.
 */
export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const headersList = await headers();

  const origin = getSiteOrigin(headersList);

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
    console.error("[signInWithGoogle] OAuth initialization error:", error);
    redirect(`/auth/error?message=${encodeURIComponent(error.message)}`);
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
