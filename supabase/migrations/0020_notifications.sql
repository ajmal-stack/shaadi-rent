-- =============================================================================
-- Migration 0020: Notifications Table & Audit Log
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id      UUID         REFERENCES public.bookings(id) ON DELETE SET NULL,
  event           TEXT         NOT NULL,
  title           TEXT         NOT NULL,
  message         TEXT         NOT NULL,
  channels        JSONB        NOT NULL DEFAULT '[]'::jsonb,
  delivery_status JSONB        NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB        DEFAULT '{}'::jsonb,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_booking_id ON public.notifications(booking_id);

-- Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role and admin can do anything
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
