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

  // 1. Fetch owners
  const { data: ownerProfiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, city, state, avatar_url, verification_status, is_suspended, created_at"
    )
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load owners:", error);

  // 2. Fetch platform commission percentage
  const { data: commissionSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "commission_percent")
    .maybeSingle();

  const commissionPercent =
    typeof commissionSetting?.value === "number" ? commissionSetting.value : 15;

  // 3. Fetch their applications (latest per user)
  const { data: applications } = await supabase
    .from("owner_applications")
    .select("id, user_id, status, submitted_at, admin_notes")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const appMap = (applications ?? []).reduce<
    Record<
      string,
      { id: string; status: string; submitted_at: string | null; admin_notes: string | null }
    >
  >((acc, a) => {
    if (!acc[a.user_id]) acc[a.user_id] = a;
    return acc;
  }, {});

  // 4. Fetch outfits per owner
  const { data: outfitData } = await supabase
    .from("outfits")
    .select("id, owner_id, title, slug, status, rental_price")
    .order("created_at", { ascending: false });

  const outfitsByOwner = (outfitData ?? []).reduce<
    Record<string, Array<{ id: string; title: string; slug?: string; status: string; rental_price: number }>>
  >((acc, o) => {
    if (!acc[o.owner_id]) acc[o.owner_id] = [];
    acc[o.owner_id].push({
      id: o.id,
      title: o.title,
      slug: o.slug,
      status: o.status,
      rental_price: Number(o.rental_price ?? 0),
    });
    return acc;
  }, {});

  // 5. Fetch bookings per owner (for total orders & earnings)
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("id, owner_id, status, payment_status, rental_amount");

  const bookingsByOwner = (bookingsData ?? []).reduce<
    Record<string, Array<{ id: string; status: string; payment_status: string; rental_amount: number }>>
  >((acc, b) => {
    if (!acc[b.owner_id]) acc[b.owner_id] = [];
    acc[b.owner_id].push({
      id: b.id,
      status: b.status,
      payment_status: b.payment_status,
      rental_amount: Number(b.rental_amount ?? 0),
    });
    return acc;
  }, {});

  // 6. Aggregate rich owner objects
  const owners = (ownerProfiles ?? []).map((p) => {
    const ownerOutfits = outfitsByOwner[p.id] ?? [];
    const ownerBookings = bookingsByOwner[p.id] ?? [];

    const totalRealizedEarnings = ownerBookings
      .filter((b) => b.payment_status === "paid" || b.status === "completed")
      .reduce((sum, b) => {
        const gross = Number(b.rental_amount ?? 0);
        const fee = (gross * commissionPercent) / 100;
        return sum + (gross - fee);
      }, 0);

    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      avatar_url: (p as any).avatar_url ?? null,
      city: p.city,
      state: p.state,
      verification_status: p.verification_status,
      is_suspended: Boolean((p as any).is_suspended),
      created_at: p.created_at,
      application: appMap[p.id] ?? null,
      outfit_count: ownerOutfits.length,
      published_outfits_count: ownerOutfits.filter((o) => o.status === "published").length,
      paused_outfits_count: ownerOutfits.filter((o) => o.status === "paused").length,
      total_bookings_count: ownerBookings.length,
      completed_bookings_count: ownerBookings.filter((b) => b.status === "completed").length,
      total_earnings: Math.round(totalRealizedEarnings),
      outfits_sample: ownerOutfits.slice(0, 6),
    };
  });

  const verifiedCount = owners.filter((o) => o.verification_status === "verified").length;
  const suspendedCount = owners.filter((o) => o.is_suspended).length;

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Verified Owners & Boutiques"
          subtitle="All wardrobe owners on ShaadiRent. Review profiles, performance metrics, and manage account standing."
          icon={Store}
          breadcrumb={[{ label: "Owners" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800 dark:text-stone-200">{owners.length}</strong> owners
              </span>
              <span>·</span>
              <span>
                <strong className="text-emerald-700 dark:text-emerald-400">
                  {verifiedCount}
                </strong>{" "}
                verified
              </span>
              {suspendedCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-rose-700 dark:text-rose-400 font-semibold">
                    {suspendedCount} suspended
                  </span>
                </>
              )}
            </div>
          }
        />

        <OwnersClient owners={owners} />
      </div>
    </div>
  );
}
