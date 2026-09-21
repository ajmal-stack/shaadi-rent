"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformSettings } from "./settings.config";
import { DEFAULT_SETTINGS } from "./settings.config";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Assert the current user is an admin. Throws if not. */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) throw new Error("Authentication required.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

// ── getSettings ──────────────────────────────────────────────────────────────

/**
 * Fetches all platform settings from DB and returns them as a typed object.
 * Falls back to DEFAULT_SETTINGS if the table is empty or an error occurs.
 */
export async function getSettings(): Promise<PlatformSettings> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_settings")
    .select("key, value");

  if (error || !data || data.length === 0) {
    console.warn("[getSettings] Could not load settings from DB:", error?.message);
    return DEFAULT_SETTINGS;
  }

  // Convert rows array → plain object
  const map: Record<string, unknown> = {};
  for (const row of data) {
    map[row.key] = row.value;
  }

  return {
    commission_percent:          (map.commission_percent as number)          ?? DEFAULT_SETTINGS.commission_percent,
    security_deposit_multiplier: (map.security_deposit_multiplier as number) ?? DEFAULT_SETTINGS.security_deposit_multiplier,
    cancellation_window_hours:   (map.cancellation_window_hours as number)   ?? DEFAULT_SETTINGS.cancellation_window_hours,
    min_booking_days_advance:    (map.min_booking_days_advance as number)    ?? DEFAULT_SETTINGS.min_booking_days_advance,
    payment_provider:            (map.payment_provider as "razorpay" | "stripe") ?? DEFAULT_SETTINGS.payment_provider,
    escrow_release_buffer_days:  (map.escrow_release_buffer_days as number)  ?? DEFAULT_SETTINGS.escrow_release_buffer_days,
    auto_refund_enabled:         (map.auto_refund_enabled as boolean)        ?? DEFAULT_SETTINGS.auto_refund_enabled,
    mandatory_kyc_threshold:     (map.mandatory_kyc_threshold as number)     ?? DEFAULT_SETTINGS.mandatory_kyc_threshold,
    enforce_admin_2fa:           (map.enforce_admin_2fa as boolean)          ?? DEFAULT_SETTINGS.enforce_admin_2fa,
    session_timeout_minutes:     (map.session_timeout_minutes as number)     ?? DEFAULT_SETTINGS.session_timeout_minutes,
    sms_booking_alerts:          (map.sms_booking_alerts as boolean)         ?? DEFAULT_SETTINGS.sms_booking_alerts,
    email_dispute_alerts:        (map.email_dispute_alerts as boolean)       ?? DEFAULT_SETTINGS.email_dispute_alerts,
    daily_digest_admin:          (map.daily_digest_admin as boolean)         ?? DEFAULT_SETTINGS.daily_digest_admin,
  };
}

// ── updateSettings ───────────────────────────────────────────────────────────

/**
 * Persists an entire PlatformSettings object to the DB.
 * Each key is upserted so existing rows are updated, not replaced.
 * Only admins can call this action.
 */
export async function updateSettings(
  settings: PlatformSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }

  const admin = createAdminClient();

  const rows = (Object.entries(settings) as [string, unknown][]).map(
    ([key, value]) => ({
      key,
      value: value as import("@/types/database").Json,
      updated_at: new Date().toISOString(),
    })
  );

  const { error } = await admin
    .from("platform_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    console.error("[updateSettings] DB error:", error.message);
    return { success: false, error: "Failed to save settings. Please try again." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

// ── updateSingleSetting ───────────────────────────────────────────────────────

/**
 * Updates a single platform setting by key.
 */
export async function updateSingleSetting(
  key: keyof PlatformSettings,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin();
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("platform_settings")
    .upsert(
      { key, value: value as import("@/types/database").Json, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    console.error("[updateSingleSetting] DB error:", error.message);
    return { success: false, error: "Failed to update setting." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
