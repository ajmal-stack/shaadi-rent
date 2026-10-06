"use server";

/**
 * confirmPaymentFromReturn
 *
 * Called by the payment-return page after Cashfree's API confirms the order
 * is PAID. This is a fallback for when the webhook doesn't fire (e.g. localhost
 * sandbox testing). In production the webhook handles this; here we do it
 * idempotently so double-execution is safe.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cashfree } from "@/lib/cashfree/client";

export async function confirmPaymentFromReturn(
  bookingId: string,
  cfOrderId: string
): Promise<{ ok: boolean }> {
  const admin = createAdminClient();

  // Fetch the current booking state
  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, payment_status, outfit_id, rental_start_date, rental_end_date")
    .eq("id", bookingId)
    .single();

  if (!booking) return { ok: false };

  // Already confirmed — idempotent no-op
  if (booking.payment_status === "paid") return { ok: true };

  // 1. Update booking → confirmed + paid
  await admin
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // 2. Fetch payment transaction details from Cashfree
  let cfPaymentId: string | null = null;
  try {
    const paymentsRes = await cashfree.PGOrderFetchPayments(cfOrderId);
    const successfulPayment = paymentsRes?.data?.find(
      (p) => p.payment_status === "SUCCESS"
    );
    if (successfulPayment?.cf_payment_id) {
      cfPaymentId = String(successfulPayment.cf_payment_id);
    }
  } catch (err) {
    console.warn("[confirmPaymentFromReturn] PGOrderFetchPayments warning:", err);
  }

  // 3. Update payment record status
  await admin
    .from("payments")
    .update({
      status: "successful",
      provider: "cashfree",
      provider_order_id: cfOrderId,
      ...(cfPaymentId ? { provider_payment_id: cfPaymentId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("booking_id", bookingId);

  // 3. Block the availability window so the calendar shows it as booked
  await admin.from("outfit_availability").insert({
    outfit_id: booking.outfit_id,
    start_date: booking.rental_start_date,
    end_date: booking.rental_end_date,
    status: "blocked",
  });

  // 4. Log status history
  await admin.from("booking_status_history").insert({
    booking_id: bookingId,
    status: "confirmed",
    notes: `Payment confirmed via return-page verification — CF order ${cfOrderId}`,
  });

  return { ok: true };
}

// ── getBookingPaymentSession ──────────────────────────────────────────────────

/**
 * Fetches the stored Cashfree payment_session_id for a booking that is still
 * in "pending" payment status. Used by the booking detail page to render a
 * "Retry Payment" banner without creating a new Cashfree order.
 *
 * Returns null if the booking is already paid, cancelled, or belongs to
 * a different user.
 */
export async function getBookingPaymentSession(
  bookingId: string
): Promise<{ paymentSessionId: string; totalAmount: number } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Verify booking belongs to this user and payment is still pending
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, payment_status, total_amount, status")
    .eq("id", bookingId)
    .eq("renter_id", user.id)
    .single();

  if (
    !booking ||
    booking.payment_status === "paid" ||
    booking.status === "cancelled"
  ) {
    return null;
  }

  // Fetch the most recent payment record with a session id
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("metadata")
    .eq("booking_id", bookingId)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionId = (payment?.metadata as any)?.payment_session_id as
    | string
    | undefined;

  if (!sessionId) return null;

  return { paymentSessionId: sessionId, totalAmount: booking.total_amount };
}

