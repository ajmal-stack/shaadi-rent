-- =============================================================================
-- Migration 0012: Fix Outfit Resume Trigger (prevent_outfit_self_approval)
-- =============================================================================
--
-- Problem:
-- When an owner unpauses (resumes) an outfit that was already approved by an
-- admin, the prevent_outfit_self_approval() trigger blocks the update because
-- NEW.status = 'published' AND OLD.status != 'published'.
--
-- Additionally, service-role calls (createAdminClient) have auth.uid() = NULL,
-- which caused is_admin() to return FALSE, also triggering this exception.
--
-- Fix:
-- 1. Allow service_role and postgres roles unconditionally.
-- 2. Allow admins unconditionally.
-- 3. Allow non-admin owners to transition status: 'paused' -> 'published'
--    ONLY IF the outfit was already approved (verification_status = 'approved').
-- 4. Continue strictly blocking unapproved outfits (draft, pending_review, etc.)
--    from being directly published by non-admins.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_outfit_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Service role or postgres superuser is always exempt (admin API / server actions)
  IF (auth.jwt() ->> 'role') = 'service_role' OR current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- 2. Admin users are exempt
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- 3. Non-admins cannot change verification_status
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    RAISE EXCEPTION 'permission denied: only admins can change outfit verification status';
  END IF;

  -- 4. Non-admins cannot directly publish outfits, UNLESS it is already approved
  --    and is currently paused (owner resuming an approved listing).
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    IF NOT (OLD.status = 'paused' AND OLD.verification_status = 'approved') THEN
      RAISE EXCEPTION 'permission denied: only admins can publish outfits';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
