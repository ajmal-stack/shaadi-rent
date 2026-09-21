"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus } from "@/types/database";

/**
 * Asserts that the authenticated user is an administrator.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error("Authentication required.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin privileges required.");
  }

  return user;
}

export interface InitiateRefundResult {
  success: boolean;
  error?: string;
  refundId?: string;
  newStatus?: PaymentStatus;
}

/**
 * Initiates a full or partial refund on a payment.
 * Supports Razorpay API when credentials are set, with dev simulation fallback.
 * Updates payments table, bookings payment_status, and logs audit trail in booking_events.
 */
export async function initiateRefund(
  paymentId: string,
  amount: number,
  reason: string
): Promise<InitiateRefundResult> {
  try {
    const user = await assertAdmin();

    if (!paymentId) {
      return { success: false, error: "Payment ID is required." };
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Refund amount must be a positive number." };
    }

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: "Please provide a reason for the refund." };
    }

    const admin = createAdminClient();

    // 1. Fetch payment record
    const { data: payment, error: fetchErr } = await admin
      .from("payments")
      .select(
        `
        id,
        booking_id,
        amount,
        currency,
        status,
        provider,
        provider_payment_id,
        provider_order_id,
        metadata,
        bookings (
          id,
          booking_number,
          total_amount,
          payment_status,
          renter_id,
          owner_id
        )
      `
      )
      .eq("id", paymentId)
      .single();

    if (fetchErr || !payment) {
      return { success: false, error: "Payment record not found." };
    }

    // 2. Eligibility checks
    if (payment.status !== "successful" && payment.status !== "partially_refunded") {
      return {
        success: false,
        error: `Only successful or partially refunded payments can be refunded (current status: ${payment.status}).`,
      };
    }

    // Calculate previously refunded amount from metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMeta = (payment.metadata as Record<string, any>) || {};
    const existingRefunds: Array<{
      refund_id: string;
      amount: number;
      reason: string;
      processed_at: string;
      processed_by: string;
    }> = Array.isArray(currentMeta.refunds) ? currentMeta.refunds : [];

    const previouslyRefunded = existingRefunds.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );

    const remainingRefundable = Math.max(0, payment.amount - previouslyRefunded);

    if (amount > remainingRefundable) {
      return {
        success: false,
        error: `Requested refund of ₹${amount.toLocaleString(
          "en-IN"
        )} exceeds the remaining refundable amount of ₹${remainingRefundable.toLocaleString(
          "en-IN"
        )}.`,
      };
    }

    // 3. Process with Payment Gateway (Razorpay) or simulate
    let refundId = "";
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (
      razorpayKey &&
      razorpaySecret &&
      payment.provider === "razorpay" &&
      payment.provider_payment_id &&
      !payment.provider_payment_id.startsWith("sim_")
    ) {
      try {
        const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString(
          "base64"
        );
        const res = await fetch(
          `https://api.razorpay.com/v1/payments/${payment.provider_payment_id}/refund`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: Math.round(amount * 100), // amount in paise
              notes: {
                reason: trimmedReason,
                admin_id: user.id,
                payment_id: paymentId,
              },
            }),
          }
        );

        const rzpResult = await res.json();
        if (!res.ok) {
          console.error("[Razorpay Refund Error]", rzpResult);
          return {
            success: false,
            error:
              rzpResult.error?.description ||
              "Payment gateway rejected the refund request.",
          };
        }
        refundId = rzpResult.id;
      } catch (err: unknown) {
        console.error("[Razorpay Refund Network Error]", err);
        return {
          success: false,
          error: "Failed to connect to Razorpay refund endpoint.",
        };
      }
    } else {
      // Dev / Test simulation
      refundId = `rfnd_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 4. Determine new statuses
    const totalRefundedNow = previouslyRefunded + amount;
    const isFullRefund = totalRefundedNow >= payment.amount;
    const newPaymentStatus: PaymentStatus = isFullRefund
      ? "refunded"
      : "partially_refunded";
    const newBookingPaymentStatus = isFullRefund
      ? "refunded"
      : "partially_refunded";

    // 5. Update payments table
    const updatedRefunds = [
      ...existingRefunds,
      {
        refund_id: refundId,
        amount,
        reason: trimmedReason,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      },
    ];

    const { error: paymentUpdateErr } = await admin
      .from("payments")
      .update({
        status: newPaymentStatus,
        metadata: {
          ...currentMeta,
          refunds: updatedRefunds,
          last_refund_id: refundId,
          last_refund_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (paymentUpdateErr) {
      console.error("[initiateRefund] Payment update error:", paymentUpdateErr);
      return {
        success: false,
        error: "Refund processed at gateway but failed to update payment record.",
      };
    }

    // 6. Update linked booking & add audit event
    if (payment.booking_id) {
      await admin
        .from("bookings")
        .update({
          payment_status: newBookingPaymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.booking_id);

      await admin.from("booking_events").insert({
        booking_id: payment.booking_id,
        status: "refund_processed",
        note: `Admin processed refund of ₹${amount.toLocaleString(
          "en-IN"
        )} (${newPaymentStatus}). Reason: ${trimmedReason} [Refund ID: ${refundId}]`,
        created_by: user.id,
      });
    }

    // 7. Revalidate Next.js cache
    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    if (payment.booking_id) {
      revalidatePath(`/bookings/${payment.booking_id}`);
    }

    return {
      success: true,
      refundId,
      newStatus: newPaymentStatus,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

/**
 * Approves and releases escrow funds to the owner for a completed booking.
 */
export async function releaseEscrow(
  bookingId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await assertAdmin();

    if (!bookingId) {
      return { success: false, error: "Booking ID is required." };
    }

    const admin = createAdminClient();

    // Fetch booking
    const { data: booking, error: fetchErr } = await admin
      .from("bookings")
      .select("id, booking_number, status, payment_status, owner_id, rental_amount")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return { success: false, error: "Booking not found." };
    }

    if (booking.payment_status !== "paid") {
      return {
        success: false,
        error: `Cannot release escrow for booking with payment status "${booking.payment_status}".`,
      };
    }

    // Log release event in booking_events
    const releaseNote =
      notes?.trim() ||
      `Admin approved and released payout escrow (₹${booking.rental_amount.toLocaleString(
        "en-IN"
      )}) to owner.`;

    await admin.from("booking_events").insert({
      booking_id: bookingId,
      status: "escrow_released",
      note: releaseNote,
      created_by: user.id,
    });

    await admin
      .from("bookings")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    revalidatePath("/admin/payments");
    revalidatePath("/admin");
    revalidatePath("/earnings");
    revalidatePath(`/bookings/${bookingId}`);

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}
