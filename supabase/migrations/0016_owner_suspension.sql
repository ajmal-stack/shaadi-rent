-- =============================================================================
-- Migration 0016: Owner Suspension Column on Profiles
-- =============================================================================

-- Add is_suspended column to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for performance when filtering suspended owners
CREATE INDEX IF NOT EXISTS idx_profiles_is_suspended
ON public.profiles(is_suspended);

-- Schema documentation comment
COMMENT ON COLUMN public.profiles.is_suspended IS 'Flag indicating whether the owner/user account has been suspended by an administrator.';
