import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase Admin client using the service-role secret key.
 * This client BYPASSES Row Level Security — use only in Server Actions
 * and Route Handlers that have already performed their own auth/authz checks.
 *
 * ⚠️  Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role environment variables.");
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      // Service role key — no session management needed
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
