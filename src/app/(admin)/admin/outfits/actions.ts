"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OutfitVerificationStatus } from "@/types/database";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { supabase: null, error: "Admin access required" };

  return { supabase, error: null };
}

export async function updateOutfitVerification(
  outfitId: string,
  verificationStatus: OutfitVerificationStatus,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const updateData: {
    verification_status: OutfitVerificationStatus;
    updated_at: string;
    status?: "published" | "paused";
  } = {
    verification_status: verificationStatus,
    updated_at: new Date().toISOString(),
  };

  // When approved, auto-publish the outfit
  if (verificationStatus === "approved") {
    updateData.status = "published";
  }
  // When rejected or changes requested, pause the outfit
  if (verificationStatus === "rejected" || verificationStatus === "changes_requested") {
    updateData.status = "paused";
  }

  const { error } = await supabase
    .from("outfits")
    .update(updateData)
    .eq("id", outfitId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/outfits");
  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function archiveOutfit(
  outfitId: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("outfits")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", outfitId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/outfits");
  return { success: true, error: null };
}
