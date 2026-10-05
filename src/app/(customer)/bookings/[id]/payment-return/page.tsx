/**
 * /bookings/[id]/payment-return
 *
 * Cashfree redirects here after the customer completes (or abandons) payment.
 * URL: /bookings/{id}/payment-return?order_id={order_id}
 *
 * This server component verifies the order status via Cashfree API, then:
 * - If PAID   → confirms the booking in DB (idempotent) + redirects to /confirmed
 * - If FAILED → redirects to /payment-failed
 * - Otherwise → redirects to /payment-pending
 *
 * NOTE: The webhook is the primary handler in production. This page acts as a
 * reliable fallback for sandbox/localhost where the webhook URL is unreachable.
 */

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cashfree } from "@/lib/cashfree/client";
import { confirmPaymentFromReturn } from "@/app/actions/payment";

interface PaymentReturnProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order_id?: string }>;
}

export default async function PaymentReturnPage({
  params,
  searchParams,
}: PaymentReturnProps) {
  const { id: bookingId } = await params;
  const { order_id: cfOrderId } = await searchParams;

  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/bookings/${bookingId}/payment-return`);
  }

  // Verify this booking belongs to the current user
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, payment_status, booking_number")
    .eq("id", bookingId)
    .eq("renter_id", user.id)
    .single();

  if (!booking) notFound();

  // Fast path — webhook already processed this
  if (booking.payment_status === "paid") {
    redirect(`/bookings/${bookingId}/confirmed`);
  }

  // ── Verify with Cashfree API ─────────────────────────────────────────────────
  if (cfOrderId) {
    let orderStatus: string | undefined;

    try {
      const orderRes = await cashfree.PGFetchOrder(cfOrderId);
      orderStatus = orderRes?.data?.order_status;
    } catch (err) {
      // Only genuine API errors land here (redirect() is called outside this block)
      console.error("[PaymentReturn] CF order fetch error:", err);
      redirect(`/bookings/${bookingId}/payment-pending`);
    }

    if (orderStatus === "PAID") {
      // Confirm the booking in the DB (idempotent — safe if webhook already ran)
      await confirmPaymentFromReturn(bookingId, cfOrderId);
      redirect(`/bookings/${bookingId}/confirmed`);
    }

    if (orderStatus === "EXPIRED" || orderStatus === "CANCELLED") {
      redirect(`/bookings/${bookingId}/payment-failed`);
    }

    // ACTIVE or PENDING — payment not completed yet
    redirect(`/bookings/${bookingId}/payment-pending`);
  }

  // No order_id in URL — user hit back
  redirect(`/bookings/${bookingId}/payment-pending`);

}
