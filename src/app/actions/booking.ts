"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cashfree } from "@/lib/cashfree/client";
import type { DeliveryAddress } from "@/types/database";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  outfitId: string;
  ownerId: string;
  eventDate: string;        // YYYY-MM-DD — the wedding day
  rentalStartDate: string;  // YYYY-MM-DD — delivery day (event - 2)
  rentalEndDate: string;    // YYYY-MM-DD — return pickup day (event + 1)
  rentalAmount: number;
  securityDeposit: number;
  deliveryAddress: DeliveryAddress;
  /** Customer's name (from profile) for Cashfree order */
  customerName?: string;
  /** Customer's email (from auth) for Cashfree order */
  customerEmail?: string;
  /** Customer's phone for Cashfree order */
  customerPhone?: string;
  /** "online" = Cashfree payment gateway | "cod" = Cash on Delivery */
  paymentMethod?: "online" | "cod";
}

export interface CreateBookingResult {
  error?: string;
  /** Cashfree payment_session_id — passed to the JS SDK on the client (online only) */
  paymentSessionId?: string;
  /** The booking's UUID — used to build return URLs */
  bookingId?: string;
  /** Set for COD bookings — booking is already confirmed, navigate straight to /confirmed */
  codBookingId?: string;
  /** The Cashfree order_id we created (e.g. "SR-20260913-A1B2C3") */
  cfOrderId?: string;
}

// ── createBooking ──────────────────────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { error: "You must be signed in to make a booking." };
  }

  const {
    outfitId,
    ownerId,
    eventDate,
    rentalStartDate,
    rentalEndDate,
    rentalAmount,
    securityDeposit,
    deliveryAddress,
  } = input;

  // Cannot rent your own outfit
  if (user.id === ownerId) {
    return { error: "You cannot rent your own outfit." };
  }

  // Verify outfit is available
  const { data: outfit, error: outfitErr } = await supabase
    .from("outfits")
    .select("id, status, verification_status")
    .eq("id", outfitId)
    .single();

  if (outfitErr || !outfit) {
    return { error: "This outfit is no longer available." };
  }
  if (outfit.status !== "published" || outfit.verification_status !== "approved") {
    return { error: "This outfit is no longer accepting bookings." };
  }

  const admin = createAdminClient();

  // Check blocked availability windows
  const { data: availConflicts } = await admin
    .from("outfit_availability")
    .select("id")
    .eq("outfit_id", outfitId)
    .in("status", ["blocked", "maintenance"])
    .lte("start_date", rentalEndDate)
    .gte("end_date", rentalStartDate);

  if (availConflicts && availConflicts.length > 0) {
    return {
      error:
        "This outfit was just reserved for overlapping dates. Please choose a different date.",
    };
  }

  // Check existing booking conflicts
  const { data: bookingConflicts } = await admin
    .from("bookings")
    .select("id")
    .eq("outfit_id", outfitId)
    .not("status", "in", '("cancelled","returned","completed","inspection")')
    .lte("rental_start_date", rentalEndDate)
    .gte("rental_end_date", rentalStartDate);

  if (bookingConflicts && bookingConflicts.length > 0) {
    return {
      error:
        "Another customer just booked this outfit for the same dates. Please try a different date.",
    };
  }

  // ── Compute amounts ──────────────────────────────────────────────────────────
  const deliveryFee = 0; // TODO: add distance-based pricing
  const serviceFee = Math.round(rentalAmount * 0.05);
  const totalAmount = rentalAmount + securityDeposit + deliveryFee + serviceFee;

  // ── Insert booking row (status=pending, payment=pending) ─────────────────────
  const { data: newBooking, error: insertErr } = await admin
    .from("bookings")
    .insert({
      outfit_id: outfitId,
      renter_id: user.id,
      owner_id: ownerId,
      event_date: eventDate,
      rental_start_date: rentalStartDate,
      rental_end_date: rentalEndDate,
      rental_amount: rentalAmount,
      security_deposit: securityDeposit,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      total_amount: totalAmount,
      status: "pending",          // stays pending until payment succeeds
      payment_status: "pending",
      // delivery_address stored as JSONB
      delivery_address: deliveryAddress as unknown as Record<string, string>,
    })
    .select("id, booking_number")
    .single();

  if (insertErr || !newBooking) {
    console.error("[createBooking] Insert error:", JSON.stringify(insertErr));
    return { error: "Failed to create your booking. Please try again." };
  }

  // ── COD path: confirm immediately, no payment gateway needed ─────────────────
  if (input.paymentMethod === "cod") {
    await admin
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "cod_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", newBooking.id);

    await admin
      .from("booking_status_history")
      .insert({
        booking_id: newBooking.id,
        status: "confirmed",
        notes: "Booking confirmed via Cash on Delivery — payment due at delivery",
        changed_by: user.id,
      })
      .then(({ error }) => {
        if (error)
          console.error("[createBooking] COD history error:", JSON.stringify(error));
      });

    // Block availability immediately (no payment to wait for)
    await admin.from("outfit_availability").insert({
      outfit_id: outfitId,
      start_date: rentalStartDate,
      end_date: rentalEndDate,
      status: "blocked",
    });

    return { codBookingId: newBooking.id };
  }

  // ── Online path: log creation, then create Cashfree order ───────────────────
  await admin
    .from("booking_status_history")
    .insert({
      booking_id: newBooking.id,
      status: "pending",
      notes: "Booking created — awaiting online payment",
      changed_by: user.id,
    })
    .then(({ error }) => {
      if (error)
        console.error("[createBooking] Status history error:", JSON.stringify(error));
    });

  // ── Create Cashfree order ────────────────────────────────────────────────────
  // booking_number is already in "SR-YYYYMMDD-XXXXXX" format from the DB function
  const cfOrderId = newBooking.booking_number;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let cfResponse;
  try {
    cfResponse = await cashfree.PGCreateOrder({
      order_id: cfOrderId,
      order_amount: totalAmount,
      order_currency: "INR",
      order_note: `ShaadiRent booking ${newBooking.booking_number}`,
      customer_details: {
        customer_id: user.id,
        customer_name: input.customerName ?? "ShaadiRent Customer",
        customer_email: input.customerEmail ?? user.email ?? "noreply@shaadirent.com",
        customer_phone: input.customerPhone ?? deliveryAddress.phone,
      },
      order_meta: {
        // Cashfree will redirect here after payment attempt
        return_url: `${siteUrl}/bookings/${newBooking.id}/payment-return?order_id={order_id}`,
        notify_url: `${siteUrl}/api/cashfree/webhook`,
      },
      order_tags: {
        booking_id: newBooking.id,
        booking_number: newBooking.booking_number,
        outfit_id: outfitId,
      },
    });
  } catch (cfErr) {
    console.error("[createBooking] Cashfree order creation error:", cfErr);
    // Clean up: soft-cancel the booking we just created
    await admin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", newBooking.id);
    return {
      error:
        "Unable to initiate payment. Please try again in a moment.",
    };
  }

  const paymentSessionId = cfResponse?.data?.payment_session_id;
  if (!paymentSessionId) {
    console.error("[createBooking] No payment_session_id in CF response:", cfResponse?.data);
    await admin.from("bookings").update({ status: "cancelled" }).eq("id", newBooking.id);
    return { error: "Payment gateway error. Please try again." };
  }

  // ── Store Cashfree order ref in payments table ───────────────────────────────
  await admin
    .from("payments")
    .insert({
      booking_id: newBooking.id,
      provider: "cashfree",
      provider_order_id: cfOrderId,
      amount: totalAmount,
      currency: "INR",
      status: "created",
      metadata: { cf_order_id: cfOrderId, payment_session_id: paymentSessionId },
    })
    .then(({ error }) => {
      if (error)
        console.error("[createBooking] Payments insert error:", JSON.stringify(error));
    });

  return {
    bookingId: newBooking.id,
    paymentSessionId,
    cfOrderId,
  };
}

// ── updateBookingStatus (Customer) — DISABLED ──────────────────────────────────
// All booking status changes are now exclusively handled by Admin.

export async function updateBookingStatus(
  _bookingId: string,
  _newStatus: string
): Promise<{ error?: string }> {
  return {
    error:
      "Booking status changes are managed by ShaadiRent admin. Please contact support if you need assistance.",
  };
}

// ── updateBookingStatusAsOwner — DISABLED ──────────────────────────────────────

export async function updateBookingStatusAsOwner(
  _bookingId: string,
  _newStatus: string,
  _notes?: string
): Promise<{ error?: string }> {
  return {
    error:
      "Booking status changes are managed by ShaadiRent admin. Please contact support if you need assistance.",
  };
}
