"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ToggleWishlistResult {
  success: boolean;
  isWishlisted?: boolean;
  requireAuth?: boolean;
  error?: string;
}

/**
 * Toggles an outfit in the current user's wishlist.
 * Returns requireAuth: true if the user is not signed in.
 */
export async function toggleWishlist(
  outfitId: string
): Promise<ToggleWishlistResult> {
  if (!outfitId) {
    return { success: false, error: "Outfit ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      success: false,
      requireAuth: true,
      error: "Please sign in to save outfits to your wishlist.",
    };
  }

  // 1. Check if outfit is already in user's wishlist
  const { data: existing, error: fetchErr } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[toggleWishlist] Error checking wishlist:", fetchErr);
    return { success: false, error: "Failed to check wishlist status." };
  }

  // 2. If present, remove; if not, add
  if (existing) {
    const { error: deleteErr } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", existing.id);

    if (deleteErr) {
      console.error("[toggleWishlist] Delete error:", deleteErr);
      return { success: false, error: "Failed to remove outfit from wishlist." };
    }

    revalidatePath("/wishlist");
    revalidatePath("/browse");
    revalidatePath("/");
    return { success: true, isWishlisted: false };
  } else {
    const { error: insertErr } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        outfit_id: outfitId,
      });

    if (insertErr) {
      console.error("[toggleWishlist] Insert error:", insertErr);
      return { success: false, error: "Failed to add outfit to wishlist." };
    }

    revalidatePath("/wishlist");
    revalidatePath("/browse");
    revalidatePath("/");
    return { success: true, isWishlisted: true };
  }
}

/**
 * Returns an array of outfit IDs saved in the current user's wishlist.
 */
export async function getWishlistOutfitIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlists")
    .select("outfit_id")
    .eq("user_id", user.id);

  if (error || !data) return [];
  return data.map((row) => row.outfit_id);
}

/**
 * Directly removes an outfit from the user's wishlist (used from the Wishlist page).
 */
export async function removeFromWishlist(
  outfitId: string
): Promise<{ success: boolean; error?: string }> {
  if (!outfitId) return { success: false, error: "Outfit ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("outfit_id", outfitId);

  if (error) {
    console.error("[removeFromWishlist] Error:", error);
    return { success: false, error: "Failed to remove item from wishlist." };
  }

  revalidatePath("/wishlist");
  revalidatePath("/browse");
  revalidatePath("/");
  return { success: true };
}
