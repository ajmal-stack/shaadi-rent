-- =============================================================================
-- Migration 0019: Saved Delivery Address on Profiles
-- Enables 1-click checkout by persisting the customer's preferred delivery address
-- =============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS saved_address JSONB;

COMMENT ON COLUMN public.profiles.saved_address IS 'Customer preferred delivery address JSONB for 1-click checkout';
