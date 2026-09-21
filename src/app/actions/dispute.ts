"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dispute, DisputeStatus } from "@/types/database";

export interface CreateDisputeInput {
  bookingId: string;
  reason: string;
  description?: string;
  amount?: number;
}

export interface CreateDisputeResult {
  success: boolean;
  error?: string;
  disputeId?: string;
}

/**
 * Creates a dispute for a booking raised by the renter.
 * Validates renter authorization, checks eligibility, records the dispute,
 * moves the booking status to 'disputed', and logs a booking event.
 */
export async function createDispute(
  input: CreateDisputeInput
): Promise<CreateDisputeResult> {
  const { bookingId, reason, description, amount } = input;

  if (!bookingId) {
    return { success: false, error: "Booking ID is required." };
  }

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    return { success: false, error: "Please select or provide a reason for the dispute." };
  }

  if (amount !== undefined && amount !== null && (isNaN(amount) || amount < 0)) {
    return { success: false, error: "Claimed amount must be a valid positive number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "You must be signed in to raise a dispute." };
  }

  const admin = createAdminClient();

  // 1. Fetch booking and verify renter ownership
  const { data: booking, error: bookingFetchErr } = await admin
    .from("bookings")
    .select("id, booking_number, renter_id, owner_id, status")
    .eq("id", bookingId)
    .single();

  if (bookingFetchErr || !booking) {
    return { success: false, error: "Booking not found." };
  }

  if (booking.renter_id !== user.id) {
    return { success: false, error: "You are not authorized to dispute this booking." };
  }

  if (booking.status === "cancelled") {
    return { success: false, error: "Cannot raise a dispute on a cancelled booking." };
  }

  // 2. Check for an already active dispute on this booking
  const { data: activeDispute } = await admin
    .from("disputes")
    .select("id, status")
    .eq("booking_id", bookingId)
    .in("status", ["open", "under_review"])
    .limit(1)
    .maybeSingle();

  if (activeDispute) {
    return {
      success: false,
      error: "An active dispute is already under review for this booking.",
    };
  }

  // 3. Insert dispute record
  const { data: dispute, error: disputeInsertErr } = await admin
    .from("disputes")
    .insert({
      booking_id: bookingId,
      raised_by: user.id,
      reason: trimmedReason,
      description: description?.trim() || null,
      amount: amount && amount > 0 ? Number(amount) : null,
      status: "open" as DisputeStatus,
    })
    .select("id")
    .single();

  if (disputeInsertErr || !dispute) {
    console.error("[createDispute] Error inserting dispute:", disputeInsertErr);
    return {
      success: false,
      error: "Failed to submit dispute. Please try again or contact support.",
    };
  }

  // 4. Update booking status to 'disputed'
  const { error: bookingUpdateErr } = await admin
    .from("bookings")
    .update({
      status: "disputed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (bookingUpdateErr) {
    console.error("[createDispute] Error updating booking status:", bookingUpdateErr);
    // Non-fatal for dispute row, but log and continue
  }

  // 5. Add audit event to booking_events
  const claimNote = amount && amount > 0 ? ` (Claim: ₹${Number(amount).toLocaleString("en-IN")})` : "";
  await admin.from("booking_events").insert({
    booking_id: bookingId,
    status: "disputed",
    note: `Dispute raised by customer: ${trimmedReason}${claimNote}`,
    created_by: user.id,
  });

  // 6. Revalidate cache
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
  revalidatePath("/admin/disputes");
  revalidatePath("/admin");

  return { success: true, disputeId: dispute.id };
}

/**
 * Fetches the most recent dispute for a booking (accessible by renter or owner).
 */
export async function getDisputeForBooking(
  bookingId: string
): Promise<{ dispute: Dispute | null; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { dispute: null, error: error.message };
  }

  return { dispute: (data as Dispute) || null };
}
