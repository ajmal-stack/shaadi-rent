-- =============================================================================
-- Migration 0011: Booking Flow Enhancements
-- Adds: delivery_address to bookings, booking_events audit log
-- Note: reviews table already exists; we only patch RLS if needed.
-- =============================================================================

-- ── 1. Add delivery address & notes to bookings ───────────────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS delivery_address jsonb,
  ADD COLUMN IF NOT EXISTS booking_notes text;

-- ── 2. booking_events audit table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status      text NOT NULL,
  note        text,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);

-- ── 3. RLS for booking_events ─────────────────────────────────────────────────
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_events_select_participants" ON booking_events;
CREATE POLICY "booking_events_select_participants"
  ON booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_events.booking_id
        AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

-- ── 4. Patch reviews RLS (table already exists with reviewer_id column) ────────
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;

CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ── 5. Grants ─────────────────────────────────────────────────────────────────
GRANT SELECT ON booking_events TO authenticated;
GRANT INSERT ON booking_events TO authenticated;
