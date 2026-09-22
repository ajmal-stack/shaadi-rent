"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingStatus } from "@/types/database";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) throw new Error("Authentication required.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admin privileges required.");

  return { supabase, user };
}

// ─── Helper: update status + log event ────────────────────────────────────────

async function setStatus(
  admin: ReturnType<typeof createAdminClient>,
  bookingId: string,
  userId: string,
  status: BookingStatus,
  note: string
) {
  await admin
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  await admin.from("booking_events").insert({
    booking_id: bookingId,
    status,
    note,
    created_by: userId,
  });
}

function revalidateAll(bookingId: string) {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/inspections");
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  revalidatePath(`/bookings/${bookingId}`);
}

// =============================================================================
// ACTION 1: Confirm Booking
// Confirms booking and auto-marks as dispatched (confirmed → out_for_delivery)
// Admin just clicks "Confirm & Dispatch" — one step instead of three.
// =============================================================================
export async function adminConfirmBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string; newStatus?: BookingStatus }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };
    if (booking.status !== "pending") {
      return { success: false, error: `Booking is already "${booking.status}". Cannot confirm.` };
    }

    // Confirm → skip pickup_scheduled → go directly to out_for_delivery
    await setStatus(admin, bookingId, user.id, "confirmed", "Booking confirmed by admin.");
    await setStatus(admin, bookingId, user.id, "out_for_delivery", "Outfit dispatched to customer.");

    revalidateAll(bookingId);
    return { success: true, newStatus: "out_for_delivery" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// =============================================================================
// ACTION 2: Mark Delivered
// Marks as delivered and activates rental in one step.
// =============================================================================
export async function adminMarkDelivered(
  bookingId: string
): Promise<{ success: boolean; error?: string; newStatus?: BookingStatus }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };

    const validFromStatuses: BookingStatus[] = ["confirmed", "pickup_scheduled", "out_for_delivery"];
    if (!validFromStatuses.includes(booking.status as BookingStatus)) {
      return { success: false, error: `Cannot mark as delivered from status "${booking.status}".` };
    }

    // Delivered → active (customer has it, rental running)
    await setStatus(admin, bookingId, user.id, "delivered", "Outfit delivered to customer.");
    await setStatus(admin, bookingId, user.id, "active", "Rental is now active.");

    revalidateAll(bookingId);
    return { success: true, newStatus: "active" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// =============================================================================
// ACTION 3: Mark Returned
// Marks outfit as returned and auto-starts inspection status.
// =============================================================================
export async function adminMarkReturned(
  bookingId: string
): Promise<{ success: boolean; error?: string; newStatus?: BookingStatus }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };

    const validFromStatuses: BookingStatus[] = ["active", "delivered", "return_scheduled"];
    if (!validFromStatuses.includes(booking.status as BookingStatus)) {
      return { success: false, error: `Cannot mark as returned from status "${booking.status}".` };
    }

    // Returned → inspection (auto-start)
    await setStatus(admin, bookingId, user.id, "returned", "Outfit returned by customer.");
    await setStatus(admin, bookingId, user.id, "inspection", "Post-return inspection started.");

    revalidateAll(bookingId);
    return { success: true, newStatus: "inspection" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// =============================================================================
// ACTION 4: Complete Booking
// Finalises inspection and closes the booking with deposit decision.
// =============================================================================
export async function adminCompleteBooking(
  bookingId: string,
  depositAction: "full_refund" | "partial_refund" | "no_refund",
  deductionAmount?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, status, security_deposit, payment_status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };
    if (booking.status !== "inspection") {
      return { success: false, error: `Booking must be in "inspection" to complete. Current: ${booking.status}` };
    }

    let newPaymentStatus = booking.payment_status;
    let eventNote = notes?.trim() || "Booking completed by admin.";

    if (depositAction === "full_refund") {
      newPaymentStatus = "refunded";
      eventNote = `Booking completed. Full deposit refund of ₹${booking.security_deposit.toLocaleString("en-IN")} approved. ${notes?.trim() || ""}`.trim();
    } else if (depositAction === "partial_refund" && deductionAmount) {
      newPaymentStatus = "partially_refunded";
      const refundAmt = Math.max(0, booking.security_deposit - deductionAmount);
      eventNote = `Booking completed. Partial refund: ₹${refundAmt.toLocaleString("en-IN")} (₹${deductionAmount.toLocaleString("en-IN")} deducted). ${notes?.trim() || ""}`.trim();
    } else {
      eventNote = `Booking completed. Deposit forfeited. ${notes?.trim() || ""}`.trim();
    }

    await admin
      .from("bookings")
      .update({ status: "completed", payment_status: newPaymentStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    await admin.from("booking_events").insert({
      booking_id: bookingId,
      status: "completed",
      note: eventNote,
      created_by: user.id,
    });

    revalidateAll(bookingId);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

// =============================================================================
// Cash Payment + Cancel (utility actions)
// =============================================================================

export async function adminRecordCashPayment(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_number, total_amount, payment_status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };
    if (booking.payment_status === "paid") return { success: false, error: "Payment already recorded." };

    await admin.from("payments").insert({
      booking_id: bookingId,
      amount: booking.total_amount,
      currency: "INR",
      provider: "cash",
      status: "successful",
      metadata: { payment_mode: "cash_on_delivery", confirmed_by: user.id },
    });

    await admin
      .from("bookings")
      .update({ payment_status: "paid", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    await admin.from("booking_events").insert({
      booking_id: bookingId,
      status: "payment_received",
      note: `Cash payment of ₹${booking.total_amount.toLocaleString("en-IN")} confirmed by Admin.`,
      created_by: user.id,
    });

    revalidateAll(bookingId);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}

export async function adminCancelBooking(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();
    const admin = createAdminClient();

    if (!reason?.trim()) return { success: false, error: "Cancellation reason is required." };

    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return { success: false, error: "Booking not found." };
    if (booking.status === "completed" || booking.status === "cancelled") {
      return { success: false, error: `Cannot cancel a booking that is already "${booking.status}".` };
    }

    await admin
      .from("bookings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    await admin.from("booking_events").insert({
      booking_id: bookingId,
      status: "cancelled",
      note: `Admin cancelled. Reason: ${reason.trim()}`,
      created_by: user.id,
    });

    revalidateAll(bookingId);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error." };
  }
}
