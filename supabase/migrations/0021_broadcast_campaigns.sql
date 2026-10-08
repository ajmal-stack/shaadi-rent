-- =============================================================================
-- Migration 0021: Admin Broadcast Campaigns & Promotional Offers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT         NOT NULL,
  message          TEXT         NOT NULL,
  offer_code       TEXT,
  discount_percent INT,
  target_audience  TEXT         NOT NULL DEFAULT 'all', -- 'all', 'promotions_opted', 'customers', 'owners'
  channels         JSONB        NOT NULL DEFAULT '["in_app"]'::jsonb,
  action_url       TEXT,
  recipients_count INT          NOT NULL DEFAULT 0,
  created_by       UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata         JSONB        DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for admin dashboard speed
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_created_at ON public.broadcast_campaigns(created_at DESC);

-- Row Level Security
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can view and create broadcasts
DROP POLICY IF EXISTS "broadcast_campaigns_admin_all" ON public.broadcast_campaigns;
CREATE POLICY "broadcast_campaigns_admin_all"
  ON public.broadcast_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

GRANT ALL ON public.broadcast_campaigns TO service_role;
GRANT SELECT, INSERT ON public.broadcast_campaigns TO authenticated;
