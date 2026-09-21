"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { extractCloudinaryPublicId } from "@/lib/utils/image";

// ─── Cloudinary Delete Helper ─────────────────────────────────────────────────

/**
 * Deletes a Cloudinary image by its secure_url.
 * Runs server-side only — uses CLOUDINARY_API_SECRET which is never sent
 * to the browser.
 * Non-fatal: logs a warning but does not throw on failure.
 */
async function deleteCloudinaryImage(secureUrl: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("deleteCloudinaryImage: missing Cloudinary env vars");
    return;
  }

  const publicId = extractCloudinaryPublicId(secureUrl);
  if (!publicId) {
    // Not a Cloudinary URL (e.g. legacy Supabase path) — nothing to do.
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Compute SHA-1 signature: sign "public_id=<id>&timestamp=<ts><secret>"
  const crypto = await import("crypto");
  const signingStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(signingStr)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body }
  );

  if (!res.ok) {
    const text = await res.text();
    console.warn("deleteCloudinaryImage: Cloudinary API error", res.status, text);
  }
}

// ─── Slug Generation ──────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// ─── Promote to Owner ─────────────────────────────────────────────────────────

/**
 * Calls the SECURITY DEFINER RPC promote_to_owner() which upgrades
 * a 'customer' profile to 'owner'. Does nothing if already owner/admin.
 * The RPC must exist in Supabase (see implementation plan for SQL).
 */
export async function promoteToOwner(): Promise<{
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.rpc("promote_to_owner" as any);
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// ─── Get Current User Profile ─────────────────────────────────────────────────

export async function getCurrentUserProfile(): Promise<{
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single();

  return data;
}

// ─── Step 1 — Create Draft Outfit ─────────────────────────────────────────────

export interface CreateOutfitInput {
  categoryId: string;
  title: string;
  description: string;
  brand: string;
  color: string;
  size: string;
  condition: "like_new" | "excellent" | "good";
  city: string;
  district: string;
  state: string;
}

export async function createDraftOutfit(input: CreateOutfitInput): Promise<{
  outfitId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { outfitId: null, error: "Not authenticated" };
  }

  // Verify role server-side — never trust client
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { outfitId: null, error: "You must be registered as an owner to list outfits." };
  }

  const slug = generateSlug(input.title);

  const { data, error } = await supabase
    .from("outfits")
    .insert({
      owner_id: user.id, // Always from session — never from client input
      category_id: input.categoryId,
      title: input.title.trim(),
      slug,
      description: input.description.trim() || null,
      brand: input.brand.trim() || null,
      color: input.color.trim() || null,
      size: input.size.trim() || null,
      condition: input.condition,
      city: input.city.trim() || null,
      district: input.district.trim() || null,
      state: input.state.trim() || null,
      rental_price: 0, // Required field — placeholder until Step 4
      security_deposit: 0,
      status: "draft",           // Never set by client to anything else
      verification_status: "pending", // Never set by client
    })
    .select("id")
    .single();

  if (error) {
    return { outfitId: null, error: error.message };
  }

  return { outfitId: data.id, error: null };
}

// ─── Step 1 — Update Existing Draft Outfit Details ───────────────────────────

export async function updateDraftOutfitDetails(
  outfitId: string,
  input: CreateOutfitInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify ownership server-side
  const { data: existing } = await supabase
    .from("outfits")
    .select("owner_id, status")
    .eq("id", outfitId)
    .single();

  if (!existing || existing.owner_id !== user.id) {
    return { error: "Outfit not found or access denied." };
  }

  if (existing.status !== "draft") {
    return { error: "Only draft outfits can be edited this way." };
  }

  const { error } = await supabase
    .from("outfits")
    .update({
      category_id: input.categoryId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      brand: input.brand.trim() || null,
      color: input.color.trim() || null,
      size: input.size.trim() || null,
      condition: input.condition,
      city: input.city.trim() || null,
      district: input.district.trim() || null,
      state: input.state.trim() || null,
    })
    .eq("id", outfitId)
    .eq("owner_id", user.id); // Double-check via RLS and explicit filter

  return { error: error?.message ?? null };
}

// ─── Step 2 — Save Measurements ───────────────────────────────────────────────

export interface MeasurementsInput {
  bust: string;
  waist: string;
  hip: string;
  shoulder: string;
  length: string;
  sleeve_length: string;
}

export async function saveMeasurements(
  outfitId: string,
  input: MeasurementsInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: outfit } = await supabase
    .from("outfits")
    .select("owner_id")
    .eq("id", outfitId)
    .single();

  if (!outfit || outfit.owner_id !== user.id) {
    return { error: "Outfit not found or access denied." };
  }

  const parseNum = (s: string) => {
    const n = parseFloat(s);
    return isNaN(n) || n <= 0 ? null : n;
  };

  // Check if measurements already exist
  const { data: existing } = await supabase
    .from("outfit_measurements")
    .select("id")
    .eq("outfit_id", outfitId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("outfit_measurements")
      .update({
        bust: parseNum(input.bust),
        waist: parseNum(input.waist),
        hip: parseNum(input.hip),
        shoulder: parseNum(input.shoulder),
        length: parseNum(input.length),
        sleeve_length: parseNum(input.sleeve_length),
      })
      .eq("outfit_id", outfitId);

    return { error: error?.message ?? null };
  } else {
    const { error } = await supabase.from("outfit_measurements").insert({
      outfit_id: outfitId,
      bust: parseNum(input.bust),
      waist: parseNum(input.waist),
      hip: parseNum(input.hip),
      shoulder: parseNum(input.shoulder),
      length: parseNum(input.length),
      sleeve_length: parseNum(input.sleeve_length),
    });

    return { error: error?.message ?? null };
  }
}

// ─── Step 3 — Save Image Record ───────────────────────────────────────────────

export async function saveImageRecord(
  outfitId: string,
  storagePath: string,
  imageType: string,
  sortOrder: number
): Promise<{ imageId: string | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { imageId: null, error: "Not authenticated" };

  const { data: outfit } = await supabase
    .from("outfits")
    .select("owner_id")
    .eq("id", outfitId)
    .single();

  if (!outfit || outfit.owner_id !== user.id) {
    return { imageId: null, error: "Outfit not found or access denied." };
  }

  const { data, error } = await supabase
    .from("outfit_images")
    .insert({
      outfit_id: outfitId,
      storage_path: storagePath,
      image_type: imageType as "front" | "back" | "side" | "detail" | "label" | "damage" | "other",
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  return { imageId: data?.id ?? null, error: error?.message ?? null };
}

// ─── Step 3 — Delete Image Record ────────────────────────────────────────────

export async function deleteImageRecord(
  imageId: string,
  outfitId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch the storage_path before deleting so we can remove it from Cloudinary.
  const { data: imageRow } = await supabase
    .from("outfit_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("outfit_id", outfitId)
    .single();

  // Delete the DB record first.
  const { error } = await supabase
    .from("outfit_images")
    .delete()
    .eq("id", imageId)
    .eq("outfit_id", outfitId); // RLS also enforces this

  if (error) return { error: error.message };

  // Best-effort: delete from Cloudinary (non-fatal if it fails).
  if (imageRow?.storage_path) {
    await deleteCloudinaryImage(imageRow.storage_path);
  }

  return { error: null };
}

// ─── Step 3 — Update Image Sort Order ────────────────────────────────────────

export async function updateImageSortOrders(
  outfitId: string,
  updates: Array<{ imageId: string; sortOrder: number }>
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  for (const update of updates) {
    const { error } = await supabase
      .from("outfit_images")
      .update({ sort_order: update.sortOrder })
      .eq("id", update.imageId)
      .eq("outfit_id", outfitId);

    if (error) return { error: error.message };
  }

  return { error: null };
}

// ─── Step 4 — Save Pricing ────────────────────────────────────────────────────

export interface PricingInput {
  rentalPrice: number;
  securityDeposit: number;
  purchasePrice?: number | null;
}

export async function savePricing(
  outfitId: string,
  input: PricingInput
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: outfit } = await supabase
    .from("outfits")
    .select("owner_id, status")
    .eq("id", outfitId)
    .single();

  if (!outfit || outfit.owner_id !== user.id) {
    return { error: "Outfit not found or access denied." };
  }

  if (outfit.status !== "draft") {
    return { error: "Only draft outfits can be edited." };
  }

  const { error } = await supabase
    .from("outfits")
    .update({
      rental_price: input.rentalPrice,
      security_deposit: input.securityDeposit,
      purchase_price: input.purchasePrice ?? null,
    })
    .eq("id", outfitId)
    .eq("owner_id", user.id);

  return { error: error?.message ?? null };
}

// ─── Step 5 — Save Availability Windows ──────────────────────────────────────

export interface AvailabilityWindowInput {
  startDate: string;
  endDate: string;
  status: "available" | "blocked";
}

export async function saveAvailability(
  outfitId: string,
  windows: AvailabilityWindowInput[]
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: outfit } = await supabase
    .from("outfits")
    .select("owner_id")
    .eq("id", outfitId)
    .single();

  if (!outfit || outfit.owner_id !== user.id) {
    return { error: "Outfit not found or access denied." };
  }

  // Delete existing availability records for this outfit first
  await supabase
    .from("outfit_availability")
    .delete()
    .eq("outfit_id", outfitId);

  if (windows.length === 0) {
    return { error: null };
  }

  const { error } = await supabase.from("outfit_availability").insert(
    windows.map((w) => ({
      outfit_id: outfitId,
      start_date: w.startDate,
      end_date: w.endDate,
      status: w.status,
    }))
  );

  return { error: error?.message ?? null };
}

// ─── Step 6 — Submit for Verification ────────────────────────────────────────

export async function submitForVerification(
  outfitId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: outfit } = await supabase
    .from("outfits")
    .select("owner_id, status, rental_price, title, category_id")
    .eq("id", outfitId)
    .single();

  if (!outfit || outfit.owner_id !== user.id) {
    return { error: "Outfit not found or access denied." };
  }

  if (outfit.status !== "draft") {
    return { error: "Outfit is not in draft state." };
  }

  // Basic server-side validation before submission
  if (!outfit.title?.trim()) {
    return { error: "Outfit title is required." };
  }
  if (!outfit.category_id) {
    return { error: "Category is required." };
  }
  if (!outfit.rental_price || outfit.rental_price <= 0) {
    return { error: "A valid rental price is required before submitting." };
  }

  // Check that at least one image exists
  const { data: images } = await supabase
    .from("outfit_images")
    .select("id")
    .eq("outfit_id", outfitId)
    .limit(1);

  if (!images || images.length === 0) {
    return { error: "At least one photo is required before submitting." };
  }

  // Transition: draft → pending_review
  // The trigger prevent_outfit_self_approval() allows this transition.
  const { error } = await supabase
    .from("outfits")
    .update({ status: "pending_review" })
    .eq("id", outfitId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  redirect("/listings");
}

// ─── Load Outfit for Preview ──────────────────────────────────────────────────

export async function loadOutfitForPreview(outfitId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("outfits")
    .select(`
      id, title, description, brand, color, size, condition,
      rental_price, security_deposit, purchase_price,
      city, district, state, status, verification_status,
      category:categories!inner(id, name, slug, gender_type),
      images:outfit_images(id, storage_path, image_type, sort_order),
      measurements:outfit_measurements(
        bust, waist, hip, shoulder, length, sleeve_length, custom_measurements
      ),
      availability:outfit_availability(
        id, start_date, end_date, status
      )
    `)
    .eq("id", outfitId)
    .eq("owner_id", user.id) // Only owner can preview their own draft
    .single();

  return data;
}
