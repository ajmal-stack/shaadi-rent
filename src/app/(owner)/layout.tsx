import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner route group layout — runs before every page inside (owner)/.
 *
 * Guard: User must be authenticated AND have role = "owner" or "admin".
 * - Unauthenticated → redirect /auth/login
 * - Authenticated but wrong role → redirect /account (not 403, to avoid leaking routes)
 *
 * Admins are allowed because they have super-set access to all owner features.
 *
 * Role is ALWAYS read from the database — never from JWT claims or client input.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch role from profiles table — the source of truth for authorisation.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (role !== "owner" && role !== "admin") {
    // Redirect silently — don't reveal that an owner route exists.
    redirect("/account");
  }

  return <>{children}</>;
}
