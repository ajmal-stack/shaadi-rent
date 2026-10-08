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

// ── Transactional Notifications Actions (Feature 7) ──────────────────────────

export interface UserNotificationItem {
  id: string;
  booking_id: string | null;
  event: string;
  title: string;
  message: string;
  channels: string[];
  delivery_status: Record<string, any>;
  metadata: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export async function getUserNotificationsAction(): Promise<{
  success: boolean;
  notifications?: UserNotificationItem[];
  unreadCount?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[getUserNotificationsAction] Error:", error);
    return { success: true, notifications: [], unreadCount: 0 };
  }

  const notifications = (data || []) as unknown as UserNotificationItem[];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return { success: true, notifications, unreadCount };
}

export async function markNotificationReadAction(notificationId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[markNotificationReadAction] Error:", error);
    return { success: false };
  }

  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<{ success: boolean; count?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id");

  if (error) {
    console.error("[markAllNotificationsReadAction] Error:", error);
    return { success: false };
  }

  return { success: true, count: data?.length || 0 };
}

export async function sendTestNotificationAction(): Promise<{
  success: boolean;
  error?: string;
  report?: Record<string, unknown>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return { success: false, error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, phone, notification_prefs")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, error: "Profile not found." };

  const { dispatchNotification } = await import("@/lib/notifications");

  const recipient = {
    userId: user.id,
    name: (profile.full_name as string | null) || "User",
    email: (profile.email as string | null) || null,
    phone: (profile.phone as string | null) || null,
    role: "renter" as const,
    notificationPrefs: (profile.notification_prefs as {
      email_bookings?: boolean;
      sms_alerts?: boolean;
      whatsapp_updates?: boolean;
      promotions?: boolean;
    } | null) || null,
  };

  const testData = {
    bookingId: undefined,
    bookingNumber: "TEST-0000",
    outfitId: "test-outfit-id",
    outfitTitle: "ShaadiRent Notification Test",
    rentalStartDate: new Date().toISOString().split("T")[0],
    rentalEndDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    rentalAmount: 5000,
    securityDeposit: 2000,
    totalAmount: 7000,
  };

  const report = await dispatchNotification({
    event: "test_notification",
    recipient,
    data: testData,
  });

  return { success: true, report: report as Record<string, unknown> };
}
