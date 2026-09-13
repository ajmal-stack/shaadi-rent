-- =============================================================================
-- Migration 0002: Profiles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared utility: auto-update updated_at on any table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profiles table
-- id mirrors auth.users.id — cascade delete keeps orphans away.
-- NOTE: is_admin() and current_user_role() are defined AFTER this table
--       because LANGUAGE SQL functions are validated at creation time.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id                   UUID                       PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  phone                TEXT,
  email                TEXT,
  avatar_url           TEXT,
  role                 public.user_role            NOT NULL DEFAULT 'customer',
  city                 TEXT,
  district             TEXT,
  state                TEXT,
  verification_status  public.verification_status  NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Admin check — defined AFTER profiles table so the SQL body can be validated.
-- SECURITY DEFINER so it runs as the function owner (postgres), not the caller.
-- This makes it safe to use in RLS policies and triggers without privilege
-- escalation by a regular user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Convenience: return the current user's role (used in RLS policies)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Trigger: prevent non-admins from changing their own role.
-- Defence-in-depth alongside RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'permission denied: only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Trigger: keep updated_at fresh
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: create a minimal profiles row when a new auth user signs up.
-- SECURITY DEFINER so it can write to public.profiles regardless of RLS.
-- Role is always 'customer' — admin must manually elevate via DB console.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, verification_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'customer',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_profiles_role     ON public.profiles(role);
CREATE INDEX idx_profiles_district ON public.profiles(district);
