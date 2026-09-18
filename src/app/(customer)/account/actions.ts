"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  data?: {
    full_name: string | null;
    phone: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    avatar_url: string | null;
  };
}

export async function updateProfileAction(
  formData: FormData
): Promise<UpdateProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return {
      success: false,
      error: "You must be logged in to update your profile.",
    };
  }

  const fullName = formData.get("full_name")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const city = formData.get("city")?.toString().trim();
  const district = formData.get("district")?.toString().trim();
  const state = formData.get("state")?.toString().trim();
  const avatarUrl = formData.get("avatar_url")?.toString().trim();

  if (!fullName) {
    return { success: false, error: "Full Name is required." };
  }

  // If phone is provided, validate length
  if (phone) {
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      return {
        success: false,
        error: "Please enter a valid 10-digit mobile number.",
      };
    }
  }

  const updates: Record<string, string | null> = {
    full_name: fullName,
    phone: phone || null,
    city: city || null,
    district: district || null,
    state: state || null,
    updated_at: new Date().toISOString(),
  };

  if (avatarUrl) {
    updates.avatar_url = avatarUrl;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    console.error("Profile update error:", updateError);
    return {
      success: false,
      error: updateError.message || "Failed to update profile.",
    };
  }

  // Sync auth user_metadata as well
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
    });
  } catch (err) {
    console.error("Auth metadata sync error:", err);
  }

  revalidatePath("/account");
  revalidatePath("/profile");
  revalidatePath("/", "layout");

  return {
    success: true,
    data: {
      full_name: fullName,
      phone: phone || null,
      city: city || null,
      district: district || null,
      state: state || null,
      avatar_url: avatarUrl || null,
    },
  };
}
