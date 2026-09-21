"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Auth Helper ──────────────────────────────────────────────────────────────

/** Returns the current user + verifies they are an owner (or admin). */
async function getOwnerUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Authentication required.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    throw new Error("Only owners can manage listings.");
  }

  return user;
}

// ── pauseListing ─────────────────────────────────────────────────────────────

/** Pause a published listing (status: published → paused). */
export async function pauseListing(
  outfitId: string
): Promise<{ error?: string }> {
  let user;
  try {
    user = await getOwnerUser();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const admin = createAdminClient();

  // First verify this outfit belongs to this owner
  const { data: outfit, error: fetchErr } = await admin
    .from("outfits")
    .select("id, status, owner_id")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) return { error: "Outfit not found." };
  if (outfit.owner_id !== user.id) return { error: "You do not own this outfit." };
  if (outfit.status !== "published") return { error: "Only published listings can be paused." };

  const { error } = await admin
    .from("outfits")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("id", outfitId);

  if (error) {
    console.error("pauseListing error:", error);
    return { error: error.message || "Failed to pause listing. Please try again." };
  }

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return {};
}

// ── unpauseListing ───────────────────────────────────────────────────────────

/** Resume a paused listing (status: paused → published). */
export async function unpauseListing(
  outfitId: string
): Promise<{ error?: string }> {
  let user;
  try {
    user = await getOwnerUser();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const admin = createAdminClient();

  const { data: outfit, error: fetchErr } = await admin
    .from("outfits")
    .select("id, status, owner_id, verification_status")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) return { error: "Outfit not found." };
  if (outfit.owner_id !== user.id) return { error: "You do not own this outfit." };
  if (outfit.status !== "paused") return { error: "Only paused listings can be resumed." };
  if (outfit.verification_status !== "approved") {
    return { error: "This listing is not verified yet and cannot be published." };
  }

  const { error } = await admin
    .from("outfits")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", outfitId);

  if (error) {
    console.error("unpauseListing error:", error);
    return { error: error.message || "Failed to resume listing. Please try again." };
  }

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return {};
}

// ── archiveListing ───────────────────────────────────────────────────────────

/** Soft-delete a listing (status → archived). Does NOT hard delete. */
export async function archiveListing(
  outfitId: string
): Promise<{ error?: string }> {
  let user;
  try {
    user = await getOwnerUser();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const admin = createAdminClient();

  const { data: outfit, error: fetchErr } = await admin
    .from("outfits")
    .select("id, status, owner_id")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) return { error: "Outfit not found." };
  if (outfit.owner_id !== user.id) return { error: "You do not own this outfit." };
  if (outfit.status === "archived") return { error: "This listing is already archived." };

  const { error } = await admin
    .from("outfits")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", outfitId);

  if (error) {
    console.error("archiveListing error:", error);
    return { error: error.message || "Failed to archive listing. Please try again." };
  }

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return {};
}

// ── unarchiveListing ─────────────────────────────────────────────────────────

/** Restore an archived listing back to 'paused' (or 'draft' if not approved). */
export async function unarchiveListing(
  outfitId: string
): Promise<{ error?: string; restoredStatus?: string }> {
  let user;
  try {
    user = await getOwnerUser();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const admin = createAdminClient();

  const { data: outfit, error: fetchErr } = await admin
    .from("outfits")
    .select("id, status, owner_id, verification_status")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) return { error: "Outfit not found." };
  if (outfit.owner_id !== user.id) return { error: "You do not own this outfit." };
  if (outfit.status !== "archived") return { error: "Only archived listings can be restored." };

  const targetStatus = outfit.verification_status === "approved" ? "paused" : "draft";

  const { error } = await admin
    .from("outfits")
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq("id", outfitId);

  if (error) {
    console.error("unarchiveListing error:", error);
    return { error: error.message || "Failed to restore listing. Please try again." };
  }

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  return { restoredStatus: targetStatus };
}

// ── updateListing ────────────────────────────────────────────────────────────

export interface UpdateListingInput {
  title: string;
  description?: string | null;
  brand?: string | null;
  color?: string | null;
  rental_price: number;
  security_deposit: number;
  condition: "like_new" | "excellent" | "good";
}

/** Edit basic details of an outfit owned by the current user. */
export async function updateListing(
  outfitId: string,
  input: UpdateListingInput
): Promise<{ error?: string }> {
  let user;
  try {
    user = await getOwnerUser();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  // Validation
  if (!input.title?.trim()) return { error: "Title is required." };
  if (!input.rental_price || input.rental_price <= 0) {
    return { error: "Rental price must be greater than 0." };
  }
  if (input.security_deposit < 0) {
    return { error: "Security deposit cannot be negative." };
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: outfit, error: fetchErr } = await admin
    .from("outfits")
    .select("id, owner_id, status")
    .eq("id", outfitId)
    .single();

  if (fetchErr || !outfit) return { error: "Outfit not found." };
  if (outfit.owner_id !== user.id) return { error: "You do not own this outfit." };
  if (outfit.status === "archived") {
    return { error: "Archived listings cannot be edited." };
  }

  const { error } = await admin
    .from("outfits")
    .update({
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      brand: input.brand?.trim() ?? null,
      color: input.color?.trim() ?? null,
      rental_price: input.rental_price,
      security_deposit: input.security_deposit,
      condition: input.condition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outfitId);

  if (error) {
    console.error("updateListing error:", error);
    return { error: error.message || "Failed to update listing. Please try again." };
  }

  revalidatePath("/listings");
  revalidatePath("/dashboard");
  revalidatePath(`/outfits`);
  return {};
}

// ── redirectToListings ────────────────────────────────────────────────────────

/**
 * Called after listing wizard submit — redirects to /listings
 * so the owner can see their newly submitted outfit.
 */
export async function redirectToOwnerListings() {
  redirect("/listings");
}
