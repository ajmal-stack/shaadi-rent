"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Review } from "@/types/database";

export interface SubmitReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface SubmitReviewResult {
  success: boolean;
  error?: string;
  reviewId?: string;
}

/**
 * Submits a customer review for a completed booking.
 * Validates that:
 * 1. The user is logged in.
 * 2. The user is the renter of this booking.
 * 3. The booking status is 'completed'.
 * 4. The user has not already reviewed this booking.
 * 5. Rating is an integer between 1 and 5.
 */
export async function submitBookingReview(
  input: SubmitReviewInput
): Promise<SubmitReviewResult> {
  const { bookingId, rating, comment } = input;

  if (!bookingId) {
    return { success: false, error: "Booking ID is required." };
  }

  const roundedRating = Math.round(rating);
  if (!roundedRating || roundedRating < 1 || roundedRating > 5) {
    return { success: false, error: "Please select a star rating from 1 to 5." };
  }

  const trimmedComment = comment?.trim() || null;
  if (trimmedComment && trimmedComment.length > 2000) {
    return { success: false, error: "Review comment cannot exceed 2000 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "You must be signed in to submit a review." };
  }

  const admin = createAdminClient();

  // 1. Fetch booking to verify renter and status
  const { data: booking, error: bookingErr } = await admin
    .from("bookings")
    .select(
      `
      id,
      renter_id,
      owner_id,
      outfit_id,
      status,
      outfits!bookings_outfit_id_fkey ( slug )
    `
    )
    .eq("id", bookingId)
    .single();

  if (bookingErr || !booking) {
    return { success: false, error: "Booking not found." };
  }

  if (booking.renter_id !== user.id) {
    return { success: false, error: "You are not authorized to review this booking." };
  }

  if (booking.status !== "completed") {
    return {
      success: false,
      error: "Reviews can only be submitted once the rental is completed.",
    };
  }

  // 2. Check if a review already exists for this booking & reviewer
  const { data: existingReview } = await admin
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existingReview) {
    return {
      success: false,
      error: "You have already submitted a review for this rental booking.",
    };
  }

  // 3. Insert review
  const { data: newReview, error: insertErr } = await admin
    .from("reviews")
    .insert({
      booking_id: booking.id,
      reviewer_id: user.id,
      reviewee_id: booking.owner_id,
      outfit_id: booking.outfit_id,
      rating: roundedRating,
      comment: trimmedComment,
    })
    .select("id")
    .single();

  if (insertErr || !newReview) {
    console.error("Failed to insert review:", insertErr);
    return {
      success: false,
      error: insertErr?.message || "Failed to submit review. Please try again.",
    };
  }

  // 4. Log booking event audit record
  try {
    await admin.from("booking_events").insert({
      booking_id: booking.id,
      status: "review_submitted",
      note: `Renter submitted a ${roundedRating}-star review${
        trimmedComment ? `: "${trimmedComment.slice(0, 100)}..."` : ""
      }`,
      created_by: user.id,
    });
  } catch (e) {
    // Non-fatal if booking_events logging fails
    console.warn("Could not insert booking event for review:", e);
  }

  // 5. Revalidate paths
  const outfitSlug = (booking.outfits as unknown as { slug?: string } | null)?.slug;
  if (outfitSlug) {
    revalidatePath(`/outfits/${outfitSlug}`);
  }
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");

  return {
    success: true,
    reviewId: newReview.id,
  };
}

/**
 * Fetches existing review submitted for a specific booking by the authenticated renter.
 */
export async function getBookingReview(bookingId: string): Promise<{
  review: Review | null;
  error?: string;
}> {
  if (!bookingId) {
    return { review: null, error: "Booking ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { review: null };
  }

  const admin = createAdminClient();
  const { data: review, error } = await admin
    .from("reviews")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching booking review:", error);
    return { review: null, error: error.message };
  }

  return { review };
}
