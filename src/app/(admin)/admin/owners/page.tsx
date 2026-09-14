import type { Metadata } from "next";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OwnersClient } from "@/components/admin/OwnersClient";

export const metadata: Metadata = {
  title: "Owner Management — Admin Console",
  description: "View and manage all verified outfit owners on ShaadiRent.",
};

export default async function AdminOwnersPage() {
  const supabase = await createClient();

  // Fetch owners
  const { data: ownerProfiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, city, state, verification_status, created_at")
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load owners:", error);

  // Fetch their applications (latest per user)
  const { data: applications } = await supabase
    .from("owner_applications")
    .select("id, user_id, status, submitted_at")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  // Fetch outfit counts per owner
  const { data: outfitData } = await supabase
    .from("outfits")
    .select("owner_id");

  const outfitCountMap = (outfitData ?? []).reduce<Record<string, number>>(
    (acc, o) => {
      acc[o.owner_id] = (acc[o.owner_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const appMap = (applications ?? []).reduce<
    Record<string, { id: string; status: string; submitted_at: string | null }>
  >((acc, a) => {
    // Take the first (most recent) app per user
    if (!acc[a.user_id]) acc[a.user_id] = a;
    return acc;
  }, {});

  const owners = (ownerProfiles ?? []).map((p) => ({
    ...p,
    application: appMap[p.id],
    outfit_count: outfitCountMap[p.id] ?? 0,
  }));

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Verified Owners"
          subtitle="All users with the owner role. Manage verification status and view their application details."
          icon={Store}
          breadcrumb={[{ label: "Owners" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{owners.length}</strong> owners
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700">
                  {owners.filter((o) => o.verification_status === "verified").length}
                </strong>{" "}
                verified
              </span>
            </div>
          }
        />

        <OwnersClient owners={owners} />
      </div>
    </div>
  );
}
