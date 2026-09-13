import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { AuthUser } from "@/components/layout/MobileMenu";

/**
 * Main site navigation — Server Component.
 *
 * Fetches authenticated user and profile on the server so the navbar
 * renders the correct auth state on first paint with zero hydration flicker.
 * Renders the fully responsive Navbar client component.
 */
export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile for role and avatar
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, avatar_url, full_name")
        .eq("id", user.id)
        .single()
    : { data: null };

  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        name:
          profile?.full_name ??
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "User",
        email: user.email ?? "",
        avatarUrl:
          profile?.avatar_url ??
          (user.user_metadata?.avatar_url as string | undefined) ??
          null,
        role: profile?.role ?? "customer",
      }
    : null;

  return <Navbar user={authUser} />;
}
