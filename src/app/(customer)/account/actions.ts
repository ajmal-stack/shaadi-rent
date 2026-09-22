"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

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

  const updates: ProfileUpdate = {
    full_name: fullName,
    phone: phone || null,
    city: city || null,
    district: district || null,
    state: state || null,
    updated_at: new Date().toISOString(),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  };

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

// ── TASK 11.1: Password Change Action ──────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function changePasswordAction(
  currentPassword: string | undefined,
  newPassword: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { success: false, error: "You must be logged in to change your password." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  // Detect if user already has an email/password identity
  const providers = (user.app_metadata?.providers as string[]) ?? [
    user.app_metadata?.provider ?? "email",
  ];
  const hasExistingPassword =
    providers.includes("email") ||
    (user.identities?.some((i) => i.provider === "email") ?? false);

  // If user already has a password, verify their current password
  if (hasExistingPassword) {
    if (!currentPassword) {
      return { success: false, error: "Current password is required." };
    }

    if (user.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        return { success: false, error: "Current password is incorrect. Please try again." };
      }
    }
  }

  // Set or update the password in Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message || "Failed to update password." };
  }

  revalidatePath("/account");
  return { success: true };
}

// ── TASK 11.2: Notification Preferences Action ─────────────────────────────────

export interface NotificationPreferences {
  email_bookings: boolean;
  sms_alerts: boolean;
  whatsapp_updates: boolean;
  promotions: boolean;
}

export async function updateNotificationPrefsAction(
  prefs: NotificationPreferences
): Promise<{ success: boolean; error?: string; data?: NotificationPreferences }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { success: false, error: "You must be logged in to update preferences." };
  }

  // Update in profiles table
  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      notification_prefs: prefs as any,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Failed to update notification_prefs in profiles:", dbError);
  }

  // Also sync to auth user_metadata as reliable fallback
  try {
    await supabase.auth.updateUser({
      data: { notification_prefs: prefs },
    });
  } catch (err) {
    console.error("Auth metadata notification_prefs sync error:", err);
  }

  revalidatePath("/account");
  return { success: true, data: prefs };
}

// ── TASK 11.3: Delete Account Action (Danger Zone) ────────────────────────────

export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return { success: false, error: "You must be logged in to delete your account." };
  }

  // 1. Safety check: Active bookings as renter
  const { data: activeRenterBookings } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("renter_id", user.id)
    .in("status", [
      "confirmed",
      "pickup_scheduled",
      "out_for_delivery",
      "delivered",
      "active",
      "return_scheduled",
      "disputed",
    ]);

  if (activeRenterBookings && activeRenterBookings.length > 0) {
    return {
      success: false,
      error:
        "Cannot delete account with active outfit rentals. Please return all garments before deleting your account.",
    };
  }

  // 2. Safety check: Active bookings on owner's listed outfits (if user is owner)
  const { data: ownerOutfits } = await supabase
    .from("outfits")
    .select("id")
    .eq("owner_id", user.id);

  if (ownerOutfits && ownerOutfits.length > 0) {
    const outfitIds = ownerOutfits.map((o) => o.id);
    const { data: activeOwnerBookings } = await supabase
      .from("bookings")
      .select("id, status")
      .in("outfit_id", outfitIds)
      .in("status", [
        "confirmed",
        "pickup_scheduled",
        "out_for_delivery",
        "delivered",
        "active",
        "return_scheduled",
        "disputed",
      ]);

    if (activeOwnerBookings && activeOwnerBookings.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete account while other customers have active rentals on your wardrobe listings.",
      };
    }
  }

  // 3. Delete user via Admin Client (cascades to profiles, wishlists, reviews, etc.)
  try {
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Admin deleteUser error:", deleteError);
      return { success: false, error: deleteError.message || "Failed to delete account." };
    }
  } catch (err: any) {
    console.error("Error creating admin client or deleting user:", err);
    return { success: false, error: err?.message || "Failed to delete account." };
  }

  // 4. Sign out the current session
  await supabase.auth.signOut();

  return { success: true };
}
