import type { Metadata } from "next";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReviewsClient } from "@/components/admin/ReviewsClient";

export const metadata: Metadata = {
  title: "Reviews — Admin Console",
  description: "Moderate outfit reviews and ratings from renters.",
};

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      profiles!reviews_reviewer_id_fkey ( id, full_name ),
      outfits!reviews_outfit_id_fkey ( id, title )
    `
    )
    .order("created_at", { ascending: false });

  if (error) console.error("Failed to load reviews:", error);

  const reviews = (data ?? []).map((r: any) => ({
    id: r.id as string,
    rating: r.rating as number,
    comment: r.comment as string | null,
    created_at: r.created_at as string,
    reviewer: (r.profiles ?? r["profiles!reviews_reviewer_id_fkey"] ?? null) as { id: string; full_name: string | null } | null,
    outfit: (r.outfits ?? r["outfits!reviews_outfit_id_fkey"] ?? null) as { id: string; title: string } | null,
  }));

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  return (
    <div className="py-8 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
        <AdminPageHeader
          title="Customer Reviews"
          subtitle="Moderate garment reviews, renter feedback, and star ratings across the platform."
          icon={Star}
          breadcrumb={[{ label: "Reviews" }]}
          metaLine={
            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>
                <strong className="text-stone-800">{reviews.length}</strong> total reviews
              </span>
              <span>·</span>
              <span>
                Avg rating: <strong className="text-amber-700">{avgRating} ★</strong>
              </span>
            </div>
          }
        />

        <ReviewsClient initialReviews={reviews} />
      </div>
    </div>
  );
}
