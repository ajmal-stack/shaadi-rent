/**
 * Platform settings types and default values.
 * This file has NO "use server" directive — it is a plain shared config module
 * that can be imported from both Server Actions and Client Components.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlatformSettings {
  // General & Fees
  commission_percent: number;
  security_deposit_multiplier: number;
  cancellation_window_hours: number;
  min_booking_days_advance: number;

  // Payment Gateway & Escrow
  payment_provider: "razorpay" | "stripe";
  escrow_release_buffer_days: number;
  auto_refund_enabled: boolean;

  // Identity & Security
  mandatory_kyc_threshold: number;
  enforce_admin_2fa: boolean;
  session_timeout_minutes: number;

  // Notifications
  sms_booking_alerts: boolean;
  email_dispute_alerts: boolean;
  daily_digest_admin: boolean;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

/** Fallback values used if the DB is empty or unreachable. */
export const DEFAULT_SETTINGS: PlatformSettings = {
  commission_percent: 15,
  security_deposit_multiplier: 1.0,
  cancellation_window_hours: 48,
  min_booking_days_advance: 2,
  payment_provider: "razorpay",
  escrow_release_buffer_days: 2,
  auto_refund_enabled: true,
  mandatory_kyc_threshold: 5000,
  enforce_admin_2fa: true,
  session_timeout_minutes: 60,
  sms_booking_alerts: true,
  email_dispute_alerts: true,
  daily_digest_admin: false,
};
