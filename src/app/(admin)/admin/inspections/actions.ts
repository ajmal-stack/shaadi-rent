"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InspectionType, ConditionStatus } from "@/types/database";

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

export interface CreateInspectionInput {
  booking_id: string;
  inspection_type: InspectionType;
  condition_status: ConditionStatus;
  deduction_amount?: number;
  notes?: string;
  assigned_to?: string | null;
}

export interface CreateInspectionResult {
  success: boolean;
  error?: string;
  id?: string;
}

/**
 * Creates a new garment quality inspection report (Pre-rental dispatch or Post-return check).
 * Logs an audit trail event in booking_events and revalidates relevant paths.
 */
export async function createInspection(
  input: CreateInspectionInput
): Promise<CreateInspectionResult> {
  try {
    const { user } = await assertAdmin();
    const adminClient = createAdminClient();

    if (!input.booking_id) {
      return { success: false, error: "Please select a booking to inspect." };
    }

    if (!input.inspection_type) {
      return { success: false, error: "Inspection type is required." };
    }

    if (!input.condition_status) {
      return { success: false, error: "Garment condition status is required." };
    }

    const deduction = Math.max(0, Number(input.deduction_amount || 0));

    // Verify booking exists
    const { data: booking, error: bookingErr } = await adminClient
      .from("bookings")
      .select("id, booking_number, status, security_deposit")
      .eq("id", input.booking_id)
      .single();

    if (bookingErr || !booking) {
      return { success: false, error: "Selected booking not found." };
    }

    // Insert inspection report
    const { data: report, error: insertErr } = await adminClient
      .from("inspection_reports")
      .insert({
        booking_id: input.booking_id,
        inspection_type: input.inspection_type,
        condition_status: input.condition_status,
        deduction_amount: deduction,
        notes: input.notes?.trim() || null,
        created_by: user.id,
        assigned_to: input.assigned_to || null,
      })
      .select("id")
      .single();

    if (insertErr || !report) {
      console.error("Failed to insert inspection report:", insertErr);
      return {
        success: false,
        error: insertErr?.message || "Failed to save inspection report.",
      };
    }

    // Audit log in booking_events
    try {
      const typeLabel =
        input.inspection_type === "pre_rental" ? "Pre-rental dispatch" : "Post-return";
      const conditionLabel = input.condition_status.replace(/_/g, " ");
      const deductionNote = deduction > 0 ? ` (Deduction: ₹${deduction.toLocaleString("en-IN")})` : "";
      const noteText = `${typeLabel} inspection logged: Condition is ${conditionLabel}${deductionNote}.${
        input.notes ? ` Notes: ${input.notes.trim()}` : ""
      }`;

      await adminClient.from("booking_events").insert({
        booking_id: input.booking_id,
        status: "inspection_logged",
        note: noteText,
        created_by: user.id,
      });
    } catch (auditErr) {
      console.error("Failed to log booking_event audit trail:", auditErr);
    }

    revalidatePath("/admin/inspections");
    revalidatePath("/admin/bookings");
    revalidatePath(`/bookings/${input.booking_id}`);

    return { success: true, id: report.id };
  } catch (err: any) {
    console.error("createInspection exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while creating the inspection.",
    };
  }
}

export interface UpdateAssigneeResult {
  success: boolean;
  error?: string;
}

/**
 * Updates the assigned inspector for an existing inspection report.
 */
export async function updateInspectionAssignee(
  inspectionId: string,
  assignedTo: string | null
): Promise<UpdateAssigneeResult> {
  try {
    await assertAdmin();
    const adminClient = createAdminClient();

    if (!inspectionId) {
      return { success: false, error: "Inspection ID is required." };
    }

    const { error: updateErr } = await adminClient
      .from("inspection_reports")
      .update({ assigned_to: assignedTo || null })
      .eq("id", inspectionId);

    if (updateErr) {
      console.error("Failed to update inspection assignee:", updateErr);
      return {
        success: false,
        error: updateErr.message || "Failed to update assigned inspector.",
      };
    }

    revalidatePath("/admin/inspections");
    return { success: true };
  } catch (err: any) {
    console.error("updateInspectionAssignee exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while reassigning inspector.",
    };
  }
}

/**
 * Approves a post-return inspection report and transitions the booking status to "completed".
 */
export async function completeInspectionAndBooking(
  bookingId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await assertAdmin();
    const adminClient = createAdminClient();

    if (!bookingId) {
      return { success: false, error: "Booking ID is required." };
    }

    const { data: booking, error: bErr } = await adminClient
      .from("bookings")
      .select("id, status, booking_number")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return { success: false, error: "Booking not found." };
    }

    const { error: updateErr } = await adminClient
      .from("bookings")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("Failed to mark booking completed:", updateErr);
      return { success: false, error: updateErr.message };
    }

    await adminClient.from("booking_events").insert({
      booking_id: bookingId,
      status: "completed",
      note: notes?.trim() || "Admin approved post-return inspection and marked booking as completed.",
      created_by: user.id,
    });

    revalidatePath("/admin/inspections");
    revalidatePath("/admin/bookings");
    revalidatePath(`/bookings/${bookingId}`);

    return { success: true };
  } catch (err: any) {
    console.error("completeInspectionAndBooking exception:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while completing booking.",
    };
  }
}

