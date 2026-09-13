/**
 * Development-only utility to verify the Supabase connection is reachable.
 *
 * This performs a lightweight health-check ping against the Supabase REST API.
 * It does NOT access any table data or expose credentials.
 *
 * Usage (server-side only):
 *   import { checkSupabaseConnection } from "@/lib/supabase/check-connection";
 *   const { ok, error } = await checkSupabaseConnection();
 */

type ConnectionResult =
  | { ok: true; error: null }
  | { ok: false; error: string };

export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_SUPABASE_URL is not set in environment variables.",
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      error:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables.",
    };
  }

  try {
    // Ping the Supabase REST endpoint — returns 200 if the project is reachable.
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      // Short timeout so it fails fast in dev if misconfigured.
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok || response.status === 200) {
      return { ok: true, error: null };
    }

    return {
      ok: false,
      error: `Supabase responded with status ${response.status}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: `Failed to reach Supabase: ${message}` };
  }
}
