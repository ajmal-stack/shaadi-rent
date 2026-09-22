"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Asserts that the current authenticated user has administrator privileges.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    throw new Error("Authentication required. Please sign in as an admin.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Access denied. Admin privileges required.");
  }

  return { supabase, user };
}

export interface OwnerActionResult {
  success: boolean;
  error?: string;
  pausedCount?: number;
}

/**
 * Suspends an outfit boutique owner.
 * Marks profile.is_suspended = true and automatically pauses all currently published outfits
 * to prevent new rental bookings from being placed with a non-compliant owner.
 */
export async function suspendOwner(
  ownerId: string,
  reason?: string
): Promise<OwnerActionResult> {
  try {
    await assertAdmin();
    const adminClient = createAdminClient();

    if (!ownerId) {
      return { success: false, error: "Owner ID is required." };
    }

    // 1. Update owner's profile to is_suspended = true
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        is_suspended: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (profileErr) {
      console.error("Failed to suspend owner in profiles:", profileErr);
      return {
        success: false,
        error: profileErr.message || "Failed to update owner suspension status.",
      };
    }

    // 2. Automatically pause all published outfits belonging to this owner
    const { data: pausedOutfits, error: outfitsErr } = await adminClient
      .from("outfits")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", ownerId)
      .eq("status", "published")
      .select("id");

    if (outfitsErr) {
      console.error("Failed to pause outfits for suspended owner:", outfitsErr);
    }

    // Revalidate paths
    revalidatePath("/admin/owners");
    revalidatePath("/browse");
    revalidatePath("/outfits");
    revalidatePath("/(owner)/listings", "page");

    return {
      success: true,
      pausedCount: pausedOutfits ? pausedOutfits.length : 0,
    };
  } catch (err: any) {
    console.error("suspendOwner exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while suspending owner.",
    };
  }
}

/**
 * Restores an owner account from suspension.
 * Marks profile.is_suspended = false.
 */
export async function unsuspendOwner(
  ownerId: string
): Promise<OwnerActionResult> {
  try {
    await assertAdmin();
    const adminClient = createAdminClient();

    if (!ownerId) {
      return { success: false, error: "Owner ID is required." };
    }

    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        is_suspended: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ownerId);

    if (profileErr) {
      console.error("Failed to unsuspend owner:", profileErr);
      return {
        success: false,
        error: profileErr.message || "Failed to restore owner account.",
      };
    }

    revalidatePath("/admin/owners");
    revalidatePath("/browse");
    return { success: true };
  } catch (err: any) {
    console.error("unsuspendOwner exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while unsuspending owner.",
    };
  }
}
