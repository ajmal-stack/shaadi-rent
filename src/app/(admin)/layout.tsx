import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin route group layout — runs before every page inside (admin)/.
 *
 * Guard: User must be authenticated AND have role = "admin".
 * - Unauthenticated → redirect /auth/login
 * - Authenticated but not admin → redirect /account
 *
 * Security note: The admin role can only be assigned via direct database
 * manipulation (the handle_new_user() trigger always assigns "customer").
 * There is no UI or API that allows self-promotion to admin.
 *
 * Role is ALWAYS read from the database — never from JWT claims or cookies.
 */
export default async function AdminLayout({
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

  // Fetch role from profiles — the authoritative source of truth.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Redirect silently — don't leak admin route existence to non-admins.
    redirect("/account");
  }

  // Fetch pending applications count for badge
  const { count: pendingCount } = await supabase
    .from("owner_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const adminName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    "Admin";

  return (
    <AdminSidebar
      pendingApplications={pendingCount ?? 0}
      adminName={adminName}
      adminEmail={user.email ?? ""}
      adminAvatar={profile?.avatar_url ?? null}
    >
      {children}
    </AdminSidebar>
  );
}
