"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DisputeStatus } from "@/types/database";
import { notifyDisputeAlert } from "@/lib/notifications";

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

  // Fetch booking_id so we can send notifications
  const admin = createAdminClient();
  const { data: dispute } = await admin
    .from("disputes")
    .select("booking_id, reason")
    .eq("id", disputeId)
    .single();

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

  // Notify renter & owner about the dispute resolution update
  if (dispute?.booking_id) {
    try {
      await notifyDisputeAlert(dispute.booking_id, dispute.reason || `Dispute ${action}`);
    } catch (notifErr) {
      console.warn("[resolveDispute] Notification error:", notifErr);
    }
  }

  revalidatePath("/admin/disputes");
  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function markDisputeUnderReview(
  disputeId: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  // Fetch booking_id for notification
  const admin = createAdminClient();
  const { data: dispute } = await admin
    .from("disputes")
    .select("booking_id, reason")
    .eq("id", disputeId)
    .single();

  const { error } = await supabase
    .from("disputes")
    .update({
      status: "under_review" as DisputeStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  if (error) return { success: false, error: error.message };

  // Notify parties that the dispute is now under review
  if (dispute?.booking_id) {
    try {
      await notifyDisputeAlert(dispute.booking_id, dispute.reason || "Dispute is under review");
    } catch (notifErr) {
      console.warn("[markDisputeUnderReview] Notification error:", notifErr);
    }
  }

  revalidatePath("/admin/disputes");
  return { success: true, error: null };
}
