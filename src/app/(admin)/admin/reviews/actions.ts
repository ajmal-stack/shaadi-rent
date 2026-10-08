"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { supabase: null, error: "Admin access required" };

  return { supabase, error: null };
}

export async function deleteReview(
  reviewId: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { data: review } = await supabase
    .from("reviews")
    .select("outfit_id, booking_id, outfits!reviews_outfit_id_fkey ( slug )")
    .eq("id", reviewId)
    .maybeSingle();

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) return { success: false, error: error.message };

  const outfitSlug = (review?.outfits as unknown as { slug?: string } | null)?.slug;
  if (outfitSlug) {
    revalidatePath(`/outfits/${outfitSlug}`);
  }
  if (review?.booking_id) {
    revalidatePath(`/bookings/${review.booking_id}`);
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return { success: true, error: null };
}
