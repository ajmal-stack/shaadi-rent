import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";
import type { OutfitCardData } from "@/components/browse/OutfitCard";

export const metadata: Metadata = {
  title: "My Wishlist — ShaadiRent",
  description: "Your saved bridal lehengas, sherwanis, and wedding couture outfits.",
};

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/wishlist");
  }

  // Fetch wishlisted outfits for current user
  const { data: rawWishlists, error } = await supabase
    .from("wishlists")
    .select(
      `
      id,
      created_at,
      outfits (
        id,
        title,
        slug,
        brand,
        rental_price,
        security_deposit,
        size,
        condition,
        city,
        state,
        district,
        verification_status,
        category:categories (
          id,
          name,
          slug,
          gender_type
        ),
        images:outfit_images (
          id,
          storage_path,
          image_type,
          sort_order
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[WishlistPage] Error fetching wishlists:", error);
  }

  // Extract outfits
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outfits: OutfitCardData[] = (rawWishlists || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((w: any) => w.outfits)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-2xs border border-rose-200/70">
              <Heart size={20} className="fill-rose-600 text-rose-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-stone-900">
                My Wishlist
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Saved outfits for your upcoming weddings and celebrations
              </p>
            </div>
          </div>
        </div>

        {/* Wishlist Grid */}
        <WishlistGrid initialOutfits={outfits} />
      </div>
    </div>
  );
}
