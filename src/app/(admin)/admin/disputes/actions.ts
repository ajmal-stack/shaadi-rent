"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DisputeStatus } from "@/types/database";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, userId: null, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { supabase: null, userId: null, error: "Admin access required" };

  return { supabase, userId: user.id, error: null };
}

export async function resolveDispute(
  disputeId: string,
  action: "resolved" | "rejected",
  resolutionNotes: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const newStatus: DisputeStatus = action;

  const { error } = await supabase
    .from("disputes")
    .update({
      status: newStatus,
      resolution_notes: resolutionNotes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/disputes");
  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function markDisputeUnderReview(
  disputeId: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("disputes")
    .update({
      status: "under_review" as DisputeStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/disputes");
  return { success: true, error: null };
}
