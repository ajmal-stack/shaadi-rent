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

/** Allowed customer-driven status transitions */
const CUSTOMER_TRANSITIONS: Record<string, string> = {
  delivered: "active",             // Customer confirms receipt
  active: "return_scheduled",      // Customer requests return pickup
};

/** Allowed owner-driven status transitions */
const OWNER_TRANSITIONS: Record<string, string[]> = {
  pending:          ["confirmed", "cancelled"],
  confirmed:        ["pickup_scheduled", "cancelled"],
  pickup_scheduled: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  return_scheduled: ["returned"],
  returned:         ["inspection"],
};

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

// ── updateBookingStatus (Customer) ─────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { error: "Authentication required." };
  }

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, status, renter_id")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.renter_id !== user.id) {
    return { error: "You are not authorised to update this booking." };
  }

  const allowedNext = CUSTOMER_TRANSITIONS[booking.status];
  if (!allowedNext || allowedNext !== newStatus) {
    return {
      error: `Cannot transition from "${booking.status}" to "${newStatus}" as a customer.`,
    };
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("bookings")
    .update({ status: newStatus as import("@/types/database").BookingStatus, updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[updateBookingStatus] Error:", JSON.stringify(updateErr));
    return { error: "Failed to update booking status. Please try again." };
  }

  await admin.from("booking_events").insert({
    booking_id: bookingId,
    status: newStatus,
    note: `Status updated by customer: ${booking.status} -> ${newStatus}`,
    created_by: user.id,
  }).then(({ error }) => {
    if (error) console.error("[updateBookingStatus] Event log error:", JSON.stringify(error));
  });

  return {};
}

// ── updateBookingStatusAsOwner ─────────────────────────────────────────────────

/**
 * Owner-driven status transitions:
 *   pending          -> confirmed | cancelled  (accept or reject)
 *   confirmed        -> cancelled              (cancel before dispatch)
 *   pickup_scheduled -> out_for_delivery       (hand over to delivery)
 *   return_scheduled -> returned               (confirm outfit received back)
 *   returned         -> inspection             (start post-return inspection)
 *
 * Admins bypass the transition allowlist and can set any status.
 */
export async function updateBookingStatusAsOwner(
  bookingId: string,
  newStatus: string,
  notes?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return { error: "Authentication required." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = profile?.role === "owner";

  if (!isAdmin && !isOwner) {
    return { error: "Only owners or admins can perform this action." };
  }

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, status, owner_id")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { error: "Booking not found." };

  if (!isAdmin && booking.owner_id !== user.id) {
    return { error: "You are not the owner of this booking." };
  }

  const allowed = OWNER_TRANSITIONS[booking.status] ?? [];
  if (!isAdmin && !allowed.includes(newStatus)) {
    return { error: `Cannot transition from "${booking.status}" to "${newStatus}".` };
  }

  const admin = createAdminClient();

  const { error: updateErr } = await admin
    .from("bookings")
    .update({
      status: newStatus as import("@/types/database").BookingStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateErr) {
    console.error("[updateBookingStatusAsOwner]", JSON.stringify(updateErr));
    return { error: "Failed to update booking status. Please try again." };
  }

  await admin.from("booking_events").insert({
    booking_id: bookingId,
    status: newStatus,
    note: notes ?? `Owner action: ${booking.status} -> ${newStatus}`,
    created_by: user.id,
  });

  return {};
}
