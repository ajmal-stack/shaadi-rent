-- =============================================================================
-- Migration 0013: Wishlists / Saved Outfits
-- Allows customers to bookmark/save outfits for their wedding/events.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  outfit_id  UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, outfit_id)
);

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_outfit_id ON public.wishlists(outfit_id);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only view, insert, and delete their own wishlist items
DROP POLICY IF EXISTS "wishlists_select_own" ON public.wishlists;
CREATE POLICY "wishlists_select_own" ON public.wishlists
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_insert_own" ON public.wishlists;
CREATE POLICY "wishlists_insert_own" ON public.wishlists
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "wishlists_delete_own" ON public.wishlists;
CREATE POLICY "wishlists_delete_own" ON public.wishlists
  FOR DELETE USING (user_id = auth.uid());

-- Permissions
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
