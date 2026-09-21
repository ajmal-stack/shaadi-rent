-- =============================================================================
-- Migration 0008: Platform Settings
-- ShaadiRent — Centralised key/value store for admin-configurable parameters.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table
-- key   → unique setting name  (TEXT PRIMARY KEY)
-- value → JSONB so we can store numbers, booleans, strings without casting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every write
CREATE TRIGGER handle_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Seed default values
-- Use ON CONFLICT DO NOTHING so re-running this migration is idempotent.
-- ---------------------------------------------------------------------------
INSERT INTO public.platform_settings (key, value) VALUES
  ('commission_percent',           '15'),
  ('security_deposit_multiplier',  '1.0'),
  ('cancellation_window_hours',    '48'),
  ('min_booking_days_advance',     '2'),
  ('payment_provider',             '"razorpay"'),
  ('escrow_release_buffer_days',   '2'),
  ('auto_refund_enabled',          'true'),
  ('mandatory_kyc_threshold',      '5000'),
  ('enforce_admin_2fa',            'true'),
  ('session_timeout_minutes',      '60'),
  ('sms_booking_alerts',           'true'),
  ('email_dispute_alerts',         'true'),
  ('daily_digest_admin',           'false')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Only admins can read or modify platform settings.
-- ---------------------------------------------------------------------------
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_select_admin"
  ON public.platform_settings
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "platform_settings_update_admin"
  ON public.platform_settings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No INSERT/DELETE policies — rows are seeded once above.
-- Admins update existing rows only via the admin console.
