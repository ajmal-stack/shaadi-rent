/**
 * POST /api/cashfree/webhook
 *
 * Cashfree sends a signed webhook payload whenever a payment changes state.
 * We verify the signature, then update the booking's payment_status and
 * booking_status accordingly.
 *
 * Cashfree webhook signature verification:
 *   https://docs.cashfree.com/docs/webhook-security
 *
 * Signature algorithm: HMAC-SHA256 over
 *   `${timestamp}${rawBody}` using the Secret Key, then base64-encoded.
 * The timestamp comes from the `x-webhook-timestamp` header.
 * The signature comes from the `x-webhook-signature` header.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const CF_SECRET = process.env.CASHFREE_SECRET_KEY ?? "";

/** Verify Cashfree webhook signature */
function verifySignature(
  rawBody: string,
  timestamp: string,
  receivedSig: string
): boolean {
  const signedPayload = `${timestamp}${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", CF_SECRET)
    .update(signedPayload)
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(receivedSig)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const receivedSig = req.headers.get("x-webhook-signature") ?? "";

  // ── Signature verification ──────────────────────────────────────────────────
  if (!verifySignature(rawBody, timestamp, receivedSig)) {
    console.error("[CF Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = payload?.type as string | undefined;
  const data = payload?.data as Record<string, unknown> | undefined;

  // ── Handle Refund Webhooks ─────────────────────────────────────────────────
  if (type?.startsWith("REFUND_")) {
    const refundObj = data?.refund as Record<string, unknown> | undefined;
    const cfOrderId =
      (refundObj?.order_id as string | undefined) ||
      ((data?.order as Record<string, unknown> | undefined)?.order_id as string | undefined);
    const cfRefundId = refundObj?.cf_refund_id as string | undefined;
    const refundStatus = refundObj?.refund_status as string | undefined; // SUCCESS | FAILED
    const refundAmount = Number(refundObj?.refund_amount) || 0;

    if (!cfOrderId) return NextResponse.json({ received: true });

    const admin = createAdminClient();
    const { data: paymentRow } = await admin
      .from("payments")
      .select("id, booking_id, amount, status, metadata")
      .eq("provider_order_id", cfOrderId)
      .maybeSingle();

    if (!paymentRow) {
      console.warn("[CF Webhook] No payment record for refund order:", cfOrderId);
      return NextResponse.json({ received: true });
    }

    if (refundStatus === "SUCCESS") {
      const currentMeta = (paymentRow.metadata as Record<string, unknown>) || {};
      const existingRefunds = Array.isArray(currentMeta.refunds) ? currentMeta.refunds : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const previouslyRefunded = existingRefunds.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const isFullRefund = (previouslyRefunded + refundAmount) >= paymentRow.amount;
      const newStatus = isFullRefund ? "refunded" : "partially_refunded";

      // If cfRefundId is already logged, don't duplicate
      const alreadyLogged = existingRefunds.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.cf_refund_id === cfRefundId || r.refund_id === cfRefundId
      );

      const updatedRefunds = alreadyLogged
        ? existingRefunds
        : [
            ...existingRefunds,
            {
              refund_id: cfRefundId || `cf_rfnd_${Date.now()}`,
              cf_refund_id: cfRefundId,
              amount: refundAmount,
              reason: "Cashfree Webhook Confirmation",
              processed_at: new Date().toISOString(),
            },
          ];

      await admin
        .from("payments")
        .update({
          status: newStatus,
          provider: "cashfree",
          metadata: {
            ...currentMeta,
            refunds: updatedRefunds,
            last_refund_id: cfRefundId || currentMeta.last_refund_id,
            last_refund_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentRow.id);

      if (paymentRow.booking_id) {
        await admin
          .from("bookings")
          .update({
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentRow.booking_id);

        await admin.from("booking_events").insert({
          booking_id: paymentRow.booking_id,
          status: "refund_processed",
          note: `Cashfree verified refund of ₹${refundAmount.toLocaleString("en-IN")} [Refund ID: ${cfRefundId || "N/A"}]`,
        });
      }
      console.log(`[CF Webhook] Refund SUCCESS confirmed for order ${cfOrderId}`);
    }

    return NextResponse.json({ received: true });
  }

  // We only care about payment events from here
  if (!type?.startsWith("PAYMENT_")) {
    return NextResponse.json({ received: true });
  }

  const order = data?.order as Record<string, unknown> | undefined;
  const payment = data?.payment as Record<string, unknown> | undefined;

  const cfOrderId = order?.order_id as string | undefined;
  const cfPaymentId = payment?.cf_payment_id as string | undefined;
  const paymentStatus = payment?.payment_status as string | undefined; // SUCCESS | FAILED | PENDING | USER_DROPPED | etc.

  if (!cfOrderId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  // Look up our payment record by provider_order_id
  const { data: paymentRow } = await admin
    .from("payments")
    .select("id, booking_id, status")
    .eq("provider_order_id", cfOrderId)
    .maybeSingle();

  if (!paymentRow) {
    // May arrive before our insert completes — log and return 200 so CF retries
    console.warn("[CF Webhook] No payment record for CF order:", cfOrderId);
    return NextResponse.json({ received: true });
  }

  const bookingId = paymentRow.booking_id;

  // ── Map Cashfree status → our internal statuses ──────────────────────────────
  const isSuccess = paymentStatus === "SUCCESS";
  const isFailed =
    paymentStatus === "FAILED" || paymentStatus === "CANCELLED";

  if (isSuccess) {
    // 1. Update payment record
    await admin
      .from("payments")
      .update({
        provider_payment_id: String(cfPaymentId ?? ""),
        status: "successful",
        metadata: payload as unknown as import("@/types/database").Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    // 2. Update booking — confirmed + paid
    await admin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // 3. Block availability window
    const { data: booking } = await admin
      .from("bookings")
      .select("outfit_id, rental_start_date, rental_end_date")
      .eq("id", bookingId)
      .single();

    if (booking) {
      await admin.from("outfit_availability").insert({
        outfit_id: booking.outfit_id,
        start_date: booking.rental_start_date,
        end_date: booking.rental_end_date,
        status: "blocked",
      });
    }

    // 4. Add status history entry
    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      status: "confirmed",
      notes: `Payment successful — Cashfree order ${cfOrderId}, payment ${cfPaymentId}`,
    });

    console.log(`[CF Webhook] Payment SUCCESS — booking ${bookingId} confirmed`);
  } else if (isFailed) {
    // Update payment record to failed
    await admin
      .from("payments")
      .update({
        provider_payment_id: String(cfPaymentId ?? ""),
        status: "failed",
        metadata: payload as unknown as import("@/types/database").Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentRow.id);

    // Leave booking as 'pending' so the user can retry payment
    // (we do NOT cancel it here — the return_url handler cancels after timeout)
    await admin.from("booking_status_history").insert({
      booking_id: bookingId,
      status: "pending",
      notes: `Payment ${paymentStatus} — Cashfree order ${cfOrderId}`,
    });

    console.log(`[CF Webhook] Payment ${paymentStatus} — booking ${bookingId}`);
  }

  return NextResponse.json({ received: true });
}
