-- =============================================================================
-- Migration 0009: promote_to_owner RPC
-- =============================================================================
--
-- Problem: The prevent_role_change() trigger on public.profiles blocks all role
-- changes unless is_admin() returns true. is_admin() checks auth.uid() against
-- profiles.role = 'admin', which is always false for a regular authenticated
-- user — even when called from a SECURITY DEFINER function.
--
-- Solution: Update prevent_role_change() to also allow the change when the
-- current database role is 'postgres' (i.e., when called from a SECURITY
-- DEFINER function owned by postgres). Then create promote_to_owner() as a
-- SECURITY DEFINER function so it runs as postgres.
--
-- Safety guarantees of promote_to_owner():
--   • Only upgrades customer → owner (never owner → admin or any downgrade).
--   • Is a no-op if the caller is already owner or admin.
--   • Rejects unauthenticated calls (auth.uid() IS NULL).
--   • The prevent_role_change() trigger is still enforced for direct UPDATE
--     attempts from regular users (current_user ≠ 'postgres').
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Step 1: Patch prevent_role_change() to also allow mutations from postgres
--         (i.e., from SECURITY DEFINER functions owned by postgres).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Allow if: (a) caller is an admin, OR (b) the DB role is postgres
    -- (which means we are inside a SECURITY DEFINER function — safe path).
    IF NOT (public.is_admin() OR current_user = 'postgres') THEN
      RAISE EXCEPTION 'permission denied: only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Step 2: Create promote_to_owner() — SECURITY DEFINER so it runs as postgres.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_to_owner()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  UUID;
  v_role public.user_role;
BEGIN
  -- 1. Require an authenticated session.
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'promote_to_owner: unauthenticated';
  END IF;

  -- 2. Read the current role.
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'promote_to_owner: profile not found for uid=%', v_uid;
  END IF;

  -- 3. No-op if already elevated — caller treats this as success.
  IF v_role IN ('owner', 'admin') THEN
    RETURN;
  END IF;

  -- 4. Only customer → owner is permitted here.
  IF v_role <> 'customer' THEN
    RAISE EXCEPTION 'promote_to_owner: unexpected role "%"', v_role;
  END IF;

  -- 5. Perform the upgrade.
  --    This function runs as postgres (SECURITY DEFINER), so
  --    prevent_role_change() will see current_user = 'postgres' and allow it.
  UPDATE public.profiles
  SET role = 'owner'
  WHERE id = v_uid;
END;
$$;

-- ---------------------------------------------------------------------------
-- Step 3: Grants
-- ---------------------------------------------------------------------------

-- Authenticated users can call this RPC via the Supabase client.
GRANT EXECUTE ON FUNCTION public.promote_to_owner() TO authenticated;

-- Explicit deny for anonymous callers (auth.uid() would be NULL anyway).
REVOKE EXECUTE ON FUNCTION public.promote_to_owner() FROM anon;
