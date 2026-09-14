import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OutfitsClient } from "@/components/admin/OutfitsClient";

export const metadata: Metadata = {
  title: "Outfit Catalog — Admin Console",
  description: "Review, approve, and manage all outfits listed on ShaadiRent.",
};

export default async function AdminOutfitsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("outfits")
    .select(
      `
      id, title, rental_price, security_deposit, status, verification_status,
      city, state, created_at, condition,
      categories ( id, name ),
      profiles!outfits_owner_id_fkey ( id, full_name, email )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load outfits:", error);

  const outfits = (data ?? []).map((o: any) => ({
    ...o,
    categories: (o.categories ?? o["categories!outfits_category_id_fkey"] ?? null) as { id: string; name: string } | null,
    profiles: (o.profiles ?? o["profiles!outfits_owner_id_fkey"] ?? null) as { id: string; full_name: string | null; email: string | null } | null,
  })) as Parameters<typeof OutfitsClient>[0]["initialOutfits"];

  const stats = {
    total: outfits.length,
    pendingReview: outfits.filter((o) => o.verification_status === "pending").length,
    published: outfits.filter((o) => o.status === "published").length,
  };

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Outfit Catalog"
          subtitle="Approve or reject outfit listings. Use filters to find outfits pending verification."
          icon={Shirt}
          breadcrumb={[{ label: "Outfits" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{stats.total}</strong> total
              </span>
              <span>·</span>
              <span>
                <strong className="text-amber-700">{stats.pendingReview}</strong> pending
                review
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700">{stats.published}</strong> published
              </span>
            </div>
          }
        />

        <OutfitsClient initialOutfits={outfits} />
      </div>
    </div>
  );
}
