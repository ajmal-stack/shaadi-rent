"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Unauthorized: Please sign in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null, error: "Permission denied: Admin access required." };
  }

  return { supabase, error: null };
}

export async function updateUserRole(
  userId: string,
  newRole: "customer" | "owner"
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole as UserRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true, error: null };
}

export async function updateUserVerification(
  userId: string,
  status: "pending" | "verified" | "rejected"
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (!supabase) return { success: false, error: authError };

  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin/owners");
  return { success: true, error: null };
}
