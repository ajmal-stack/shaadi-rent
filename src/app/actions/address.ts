"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeliveryAddress } from "@/types/database";

export interface GetSavedAddressResult {
  address: DeliveryAddress | null;
  hasFullAddress: boolean;
  source?: "profile" | "last_booking" | "partial" | "none";
}

/**
 * Retrieves the customer's saved delivery address for 1-click checkout.
 * Checks in priority order:
 * 1. Explicit `saved_address` in customer's profile.
 * 2. Most recent booking's `delivery_address`.
 * 3. Fallback partial profile fields (full name, phone, city, state).
 */
export async function getSavedDeliveryAddress(): Promise<GetSavedAddressResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { address: null, hasFullAddress: false, source: "none" };
  }

  const admin = createAdminClient();

  // 1. Check if profiles has an explicit saved_address
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone, city, state, saved_address")
      .eq("id", user.id)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saved = (profile as any)?.saved_address as DeliveryAddress | null;
    if (saved && saved.full_name && saved.address_line1 && saved.city && saved.pincode) {
      return {
        address: saved,
        hasFullAddress: true,
        source: "profile",
      };
    }

    // 2. Fallback to user's last booking with a delivery address
    const { data: lastBooking } = await admin
      .from("bookings")
      .select("delivery_address")
      .eq("renter_id", user.id)
      .not("delivery_address", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingAddr = (lastBooking as any)?.delivery_address as DeliveryAddress | null;
    if (
      bookingAddr &&
      bookingAddr.full_name &&
      bookingAddr.address_line1 &&
      bookingAddr.city &&
      bookingAddr.pincode
    ) {
      // Auto-save to profile for future calls
      try {
        await admin
          .from("profiles")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ saved_address: bookingAddr } as any)
          .eq("id", user.id);
      } catch (e) {
        console.warn("Could not backfill saved_address into profile:", e);
      }

      return {
        address: bookingAddr,
        hasFullAddress: true,
        source: "last_booking",
      };
    }

    // 3. Partial prefill from profile contact details
    if (profile && (profile.full_name || profile.phone || profile.city)) {
      return {
        address: {
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          address_line1: "",
          address_line2: "",
          city: profile.city || "",
          state: profile.state || "",
          pincode: "",
        },
        hasFullAddress: false,
        source: "partial",
      };
    }
  } catch (err) {
    console.error("Error fetching saved delivery address:", err);
  }

  return { address: null, hasFullAddress: false, source: "none" };
}

/**
 * Persists the customer's delivery address for future 1-click rentals.
 */
export async function saveDeliveryAddress(
  address: DeliveryAddress
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Must be signed in to save delivery address." };
  }

  if (
    !address.full_name?.trim() ||
    !address.address_line1?.trim() ||
    !address.city?.trim() ||
    !address.pincode?.trim()
  ) {
    return { success: false, error: "Please provide a complete address." };
  }

  const admin = createAdminClient();

  try {
    const updatePayload: Record<string, unknown> = {
      saved_address: address,
      updated_at: new Date().toISOString(),
    };

    if (address.phone) updatePayload.phone = address.phone;
    if (address.city) updatePayload.city = address.city;
    if (address.state) updatePayload.state = address.state;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await admin.from("profiles").update(updatePayload as any).eq("id", user.id);

    if (error) {
      console.error("Failed to save delivery address:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/account");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save address.";
    return { success: false, error: msg };
  }
}
