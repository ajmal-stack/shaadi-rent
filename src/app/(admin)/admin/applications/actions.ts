"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adminReviewApplicationAction(
  applicationId: string,
  action: "approved" | "rejected",
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized: Please sign in as an admin." };
  }

  // Ensure caller is an admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Permission denied: Admin access required." };
  }

  // Fetch application to get user_id
  const { data: app, error: appErr } = await supabase
    .from("owner_applications")
    .select("user_id, phone")
    .eq("id", applicationId)
    .single();

  if (appErr || !app) {
    return { success: false, error: "Application not found." };
  }

  // Attempt RPC first
  try {
    const { error: rpcErr } = await supabase.rpc(
      "admin_review_owner_application",
      {
        p_application_id: applicationId,
        p_action: action,
        p_notes: notes?.trim() || null,
      }
    );

    if (!rpcErr) {
      revalidatePath("/admin");
      revalidatePath("/admin/applications");
      revalidatePath("/become-an-owner/status");
      revalidatePath("/list-your-outfit");
      return { success: true, error: null };
    }
  } catch {
    // If RPC fails (e.g. migration not run yet or cache delay), fallback to direct updates
  }

  // Direct database fallback
  const now = new Date().toISOString();

  const { error: updateAppErr } = await supabase
    .from("owner_applications")
    .update({
      status: action,
      admin_notes: notes?.trim() || null,
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", applicationId);

  if (updateAppErr) {
    return { success: false, error: updateAppErr.message };
  }

  if (action === "approved") {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        role: "owner",
        verification_status: "verified",
        phone: app.phone || undefined,
        updated_at: now,
      })
      .eq("id", app.user_id);

    if (profileErr) {
      return {
        success: false,
        error: `Application marked approved, but role update failed: ${profileErr.message}`,
      };
    }
  } else if (action === "rejected") {
    await supabase
      .from("profiles")
      .update({
        verification_status: "rejected",
        updated_at: now,
      })
      .eq("id", app.user_id);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/become-an-owner/status");
  revalidatePath("/list-your-outfit");

  return { success: true, error: null };
}
