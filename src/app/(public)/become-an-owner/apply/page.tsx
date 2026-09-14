import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerApplicationWizard } from "@/components/owner-application/OwnerApplicationWizard";

export const metadata: Metadata = {
  title: "Owner Application — ShaadiRent",
  description: "Complete your 5-step ShaadiRent owner application to begin listing bridal and wedding ensembles.",
};

export default async function OwnerApplicationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/become-an-owner/apply");
  }

  // Check profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "owner" || profile?.role === "admin") {
    redirect("/list-your-outfit/details");
  }

  // Check if an application already exists
  const { data: application } = await supabase
    .from("owner_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // If already pending under review, take them to the status screen
  if (application?.status === "pending") {
    redirect("/become-an-owner/status");
  }

  return (
    <OwnerApplicationWizard
      userId={user.id}
      userEmail={user.email || profile?.email || ""}
      initialApplication={application}
    />
  );
}
