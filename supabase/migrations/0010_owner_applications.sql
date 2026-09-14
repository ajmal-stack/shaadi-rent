-- =============================================================================
-- Migration 0010: Owner Applications & Verification Workflow
-- =============================================================================
--
-- Implements the multi-step owner application verification pipeline:
--   1. owner_applications table tracking applicant details, ID docs, and status.
--   2. Supports draft saves as the user progresses through the 5 steps.
--   3. RLS policies allowing applicants to manage their own applications
--      and platform admins to review all applications.
--   4. admin_review_owner_application() RPC (SECURITY DEFINER) for atomic
--      approval (promoting customer -> owner) or rejection with feedback.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Owner Applications Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),

  -- Step 1: Personal Details
  full_name             TEXT,
  email                 TEXT,
  phone                 TEXT,
  alt_phone             TEXT,
  dob                   DATE,
  gender                TEXT CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
  bio                   TEXT,

  -- Step 2: Mobile OTP Verification
  phone_verified        BOOLEAN NOT NULL DEFAULT false,
  otp_code              TEXT,
  otp_expires_at        TIMESTAMPTZ,
  otp_attempts          INTEGER NOT NULL DEFAULT 0,

  -- Step 3: Identity Verification (Cloudinary URLs)
  id_type               TEXT CHECK (id_type IN ('aadhaar', 'passport', 'pan', 'driving_license', 'voter_id')),
  id_number             TEXT,
  id_front_url          TEXT,
  id_back_url           TEXT,

  -- Step 4: Residential / Pickup Address
  address_line1         TEXT,
  address_line2         TEXT,
  city                  TEXT,
  district              TEXT,
  state                 TEXT,
  pincode               TEXT,
  landmark              TEXT,

  -- Step 5: Declaration & Agreement
  agreed_to_terms       BOOLEAN NOT NULL DEFAULT false,
  declaration_accepted  BOOLEAN NOT NULL DEFAULT false,
  signature_name        TEXT,
  agreed_at             TIMESTAMPTZ,

  -- Admin Review Details
  admin_notes           TEXT,
  reviewed_by           UUID REFERENCES public.profiles(id),
  reviewed_at           TIMESTAMPTZ,
  submitted_at          TIMESTAMPTZ,

  -- System Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_applications_user_id ON public.owner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_applications_status ON public.owner_applications(status);
CREATE INDEX IF NOT EXISTS idx_owner_applications_created_at ON public.owner_applications(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS handle_owner_applications_updated_at ON public.owner_applications;
CREATE TRIGGER handle_owner_applications_updated_at
  BEFORE UPDATE ON public.owner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Row Level Security (RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own application
DROP POLICY IF EXISTS "owner_applications_select_own" ON public.owner_applications;
CREATE POLICY "owner_applications_select_own" ON public.owner_applications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all applications
DROP POLICY IF EXISTS "owner_applications_select_admin" ON public.owner_applications;
CREATE POLICY "owner_applications_select_admin" ON public.owner_applications
  FOR SELECT
  USING (public.is_admin());

-- Applicants can submit/draft an application for their own user_id
DROP POLICY IF EXISTS "owner_applications_insert_own" ON public.owner_applications;
CREATE POLICY "owner_applications_insert_own" ON public.owner_applications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Applicants can update their own application
DROP POLICY IF EXISTS "owner_applications_update_own" ON public.owner_applications;
CREATE POLICY "owner_applications_update_own" ON public.owner_applications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update applications (e.g. status, admin_notes)
DROP POLICY IF EXISTS "owner_applications_update_admin" ON public.owner_applications;
CREATE POLICY "owner_applications_update_admin" ON public.owner_applications
  FOR UPDATE
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Admin Review RPC Function (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_review_owner_application(
  p_application_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid UUID;
  v_user_id   UUID;
  v_status    TEXT;
  v_result    JSONB;
BEGIN
  -- 1. Ensure caller is authenticated and has admin role
  v_admin_uid := auth.uid();
  IF v_admin_uid IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: only platform admins can review owner applications';
  END IF;

  -- 2. Validate action
  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid action: must be either "approved" or "rejected"';
  END IF;

  -- 3. Lock and retrieve application
  SELECT user_id, status
  INTO v_user_id, v_status
  FROM public.owner_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'application not found with id: %', p_application_id;
  END IF;

  -- 4. Update the application
  UPDATE public.owner_applications
  SET status = p_action,
      admin_notes = p_notes,
      reviewed_by = v_admin_uid,
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_application_id;

  -- 5. Cascade profile updates
  IF p_action = 'approved' THEN
    UPDATE public.profiles
    SET role = 'owner',
        verification_status = 'verified',
        phone = COALESCE((SELECT phone FROM public.owner_applications WHERE id = p_application_id), phone),
        updated_at = NOW()
    WHERE id = v_user_id;
  ELSIF p_action = 'rejected' THEN
    UPDATE public.profiles
    SET verification_status = 'rejected',
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'user_id', v_user_id,
    'action', p_action,
    'reviewed_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Table & RPC Grants
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.owner_applications TO authenticated;
GRANT ALL ON public.owner_applications TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_review_owner_application(UUID, TEXT, TEXT) TO authenticated;
