"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
}

export interface CreateBookingResult {
  error?: string;
}

/** Customer status transitions — DISABLED: All changes now admin-only */
const CUSTOMER_TRANSITIONS: Record<string, string> = {};

/** Owner status transitions — DISABLED: All changes now admin-only */
const OWNER_TRANSITIONS: Record<string, string[]> = {};

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

  if (user.id === ownerId) {
    return { error: "You cannot rent your own outfit." };
  }

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

  const { data: availConflicts } = await admin
    .from("outfit_availability")
    .select("id")
    .eq("outfit_id", outfitId)
    .in("status", ["blocked", "maintenance"])
    .lte("start_date", rentalEndDate)
    .gte("end_date", rentalStartDate);

  if (availConflicts && availConflicts.length > 0) {
    return {
      error: "This outfit was just reserved for overlapping dates. Please choose a different date.",
    };
  }

  const { data: bookingConflicts } = await admin
    .from("bookings")
    .select("id")
    .eq("outfit_id", outfitId)
    .not("status", "in", '("cancelled","returned","completed","inspection")')
    .lte("rental_start_date", rentalEndDate)
    .gte("rental_end_date", rentalStartDate);

  if (bookingConflicts && bookingConflicts.length > 0) {
    return {
      error: "Another customer just booked this outfit for the same dates. Please try a different date.",
    };
  }

  const deliveryFee = 0;
  const serviceFee = Math.round(rentalAmount * 0.05);
  const totalAmount = rentalAmount + securityDeposit + deliveryFee + serviceFee;

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
      status: "confirmed",
      payment_status: "pending",
      delivery_address: deliveryAddress as unknown as Record<string, string>,
    })
    .select("id")
    .single();

  if (insertErr || !newBooking) {
    console.error("[createBooking] Insert error:", JSON.stringify(insertErr));
    return { error: "Failed to create your booking. Please try again." };
  }

  const { error: availErr } = await admin.from("outfit_availability").insert({
    outfit_id: outfitId,
    start_date: rentalStartDate,
    end_date: rentalEndDate,
    status: "blocked",
  });

  if (availErr) {
    console.error("[createBooking] Availability block error:", JSON.stringify(availErr));
  }

  await admin.from("booking_events").insert({
    booking_id: newBooking.id,
    status: "confirmed",
    note: "Booking created by customer",
    created_by: user.id,
  }).then(({ error }) => {
    if (error) console.error("[createBooking] Event log error:", JSON.stringify(error));
  });

  redirect(`/bookings/${newBooking.id}/confirmed`);
}

// ── updateBookingStatus (Customer) — DISABLED ──────────────────────────────────
// All booking status changes are now exclusively handled by Admin.
// This function is kept for reference but always returns an error.

export async function updateBookingStatus(
  _bookingId: string,
  _newStatus: string
): Promise<{ error?: string }> {
  return {
    error: "Booking status changes are managed by ShaadiRent admin. Please contact support if you need assistance.",
  };
}

// ── updateBookingStatusAsOwner — DISABLED ──────────────────────────────────────
// All booking status changes are now exclusively handled by Admin.
// This function is kept for reference but always returns an error.

export async function updateBookingStatusAsOwner(
  _bookingId: string,
  _newStatus: string,
  _notes?: string
): Promise<{ error?: string }> {
  return {
    error: "Booking status changes are managed by ShaadiRent admin. Please contact support if you need assistance.",
  };
}
