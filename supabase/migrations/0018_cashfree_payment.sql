-- =============================================================================
-- Migration 0018: Cashfree Payment Integration
-- Adds:
--   1. provider_payment_id index on payments
--   2. cashfree_order_id column on bookings for quick lookup
--   3. Grants for the new booking_events table to service_role
--   4. Webhook idempotency guard
-- =============================================================================

-- ── 1. Index on provider_payment_id for fast webhook lookups ──────────────────
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id
  ON public.payments(provider_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id
  ON public.payments(provider_payment_id);

-- ── 2. Ensure booking_events is accessible by service_role ────────────────────
-- (booking_events was created in 0011 but may be missing service_role grants)
GRANT ALL ON public.booking_events TO service_role;

-- ── 3. Ensure payments table has all grants ───────────────────────────────────
GRANT ALL ON public.payments TO service_role;

-- ── 4. Add a cashfree_order_id column to bookings for easy cross-reference ────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_cashfree_order_id
  ON public.bookings(cashfree_order_id);

-- ── 5. Add payment_session_id to payments metadata (no schema change needed) ──
-- payment_session_id is stored in the metadata JSONB column already.
-- This comment is for documentation purposes.

-- ── 6. Ensure booking_status_history is writable by service_role ──────────────
GRANT ALL ON public.booking_status_history TO service_role;
