import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /list-your-outfit layout
 *
 * Auth guard: redirects to login if unauthenticated.
 * Role guard: redirects to /become-an-owner if user is not an owner/admin.
 * Owners must register before accessing the listing wizard.
 */
export default async function ListYourOutfitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/list-your-outfit");
  }

  // Role must come from the DB — never trust JWT claims or client input.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (role !== "owner" && role !== "admin") {
    // Check if user has an active application
    const { data: application } = await supabase
      .from("owner_applications")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (application?.status === "pending" || application?.status === "rejected") {
      redirect("/become-an-owner/status");
    }

    // Not yet applied — send them through the onboarding overview
    redirect("/become-an-owner");
  }

  return <>{children}</>;
}
