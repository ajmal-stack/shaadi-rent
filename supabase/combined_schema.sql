-- =============================================================================
-- Migration 0001: Extensions & Enums
-- ShaadiRent — peer-to-peer wedding outfit rental marketplace
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- User roles
CREATE TYPE public.user_role AS ENUM (
  'customer',
  'owner',
  'admin'
);

-- Profile / document verification status
CREATE TYPE public.verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Category gender type
CREATE TYPE public.gender_type AS ENUM (
  'bride',
  'groom',
  'unisex'
);

-- Physical condition of an outfit
CREATE TYPE public.outfit_condition AS ENUM (
  'like_new',
  'excellent',
  'good'
);

-- Listing lifecycle status
CREATE TYPE public.outfit_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'paused',
  'rented',
  'archived'
);

-- Admin verification of a listing
CREATE TYPE public.outfit_verification_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'changes_requested'
);

-- Outfit image type
CREATE TYPE public.image_type AS ENUM (
  'front',
  'back',
  'side',
  'detail',
  'label',
  'damage',
  'other'
);

-- Availability slot status
CREATE TYPE public.availability_status AS ENUM (
  'available',
  'blocked',
  'maintenance'
);

-- Booking lifecycle status
CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'confirmed',
  'pickup_scheduled',
  'out_for_delivery',
  'delivered',
  'active',
  'return_scheduled',
  'returned',
  'inspection',
  'completed',
  'cancelled',
  'disputed'
);

-- Payment status on a booking
CREATE TYPE public.booking_payment_status AS ENUM (
  'pending',
  'paid',
  'partially_refunded',
  'refunded',
  'failed'
);

-- Payment record status (provider-level)
CREATE TYPE public.payment_status AS ENUM (
  'created',
  'pending',
  'successful',
  'failed',
  'refunded',
  'partially_refunded'
);

-- Dispute lifecycle status
CREATE TYPE public.dispute_status AS ENUM (
  'open',
  'under_review',
  'resolved',
  'rejected'
);

-- Inspection timing type
CREATE TYPE public.inspection_type AS ENUM (
  'pre_rental',
  'post_return'
);

-- Condition assessed during inspection
CREATE TYPE public.condition_status AS ENUM (
  'good',
  'minor_damage',
  'major_damage',
  'missing_item'
);
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
-- =============================================================================
-- Migration 0003: Categories
-- =============================================================================

CREATE TABLE public.categories (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT         NOT NULL,
  slug         TEXT         NOT NULL UNIQUE,
  gender_type  public.gender_type NOT NULL,
  description  TEXT,
  image_url    TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER handle_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
-- =============================================================================
-- Migration 0004: Outfits, Images, Measurements, Availability
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Outfits
-- ---------------------------------------------------------------------------
CREATE TABLE public.outfits (
  id                    UUID                              PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID                              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id           UUID                              NOT NULL REFERENCES public.categories(id),
  title                 TEXT                              NOT NULL,
  slug                  TEXT                              NOT NULL UNIQUE,
  description           TEXT,
  brand                 TEXT,
  purchase_price        NUMERIC(10, 2)                    CHECK (purchase_price >= 0),
  rental_price          NUMERIC(10, 2)                    NOT NULL CHECK (rental_price >= 0),
  security_deposit      NUMERIC(10, 2)                    NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  size                  TEXT,
  condition             public.outfit_condition           NOT NULL DEFAULT 'good',
  color                 TEXT,
  status                public.outfit_status              NOT NULL DEFAULT 'draft',
  verification_status   public.outfit_verification_status NOT NULL DEFAULT 'pending',
  district              TEXT,
  city                  TEXT,
  state                 TEXT,
  created_at            TIMESTAMPTZ                       NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ                       NOT NULL DEFAULT NOW()
);

-- Prevent owners from self-approving their own listings or directly publishing.
-- Admins are exempt. Runs as SECURITY DEFINER so is_admin() has privileges.
CREATE OR REPLACE FUNCTION public.prevent_outfit_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Cannot change verification_status at all
    IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
      RAISE EXCEPTION 'permission denied: only admins can change outfit verification status';
    END IF;
    -- Cannot directly set status to published (must go through review → admin approval)
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
      RAISE EXCEPTION 'permission denied: only admins can publish outfits';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_outfit_update_protection
  BEFORE UPDATE ON public.outfits
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_outfit_self_approval();

CREATE TRIGGER handle_outfits_updated_at
  BEFORE UPDATE ON public.outfits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Outfit Images (many per outfit, path-only — no binary storage in Postgres)
-- ---------------------------------------------------------------------------
CREATE TABLE public.outfit_images (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id     UUID              NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  storage_path  TEXT              NOT NULL,
  image_type    public.image_type NOT NULL DEFAULT 'other',
  sort_order    INTEGER           NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Outfit Measurements (one-to-one — UNIQUE on outfit_id)
-- ---------------------------------------------------------------------------
CREATE TABLE public.outfit_measurements (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id            UUID        NOT NULL UNIQUE REFERENCES public.outfits(id) ON DELETE CASCADE,
  bust                 NUMERIC(6, 2),
  waist                NUMERIC(6, 2),
  hip                  NUMERIC(6, 2),
  shoulder             NUMERIC(6, 2),
  length               NUMERIC(6, 2),
  sleeve_length        NUMERIC(6, 2),
  custom_measurements  JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER handle_outfit_measurements_updated_at
  BEFORE UPDATE ON public.outfit_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Outfit Availability (blocked/available date windows per outfit)
-- ---------------------------------------------------------------------------
CREATE TABLE public.outfit_availability (
  id          UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id   UUID                      NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  start_date  DATE                      NOT NULL,
  end_date    DATE                      NOT NULL,
  status      public.availability_status NOT NULL DEFAULT 'available',
  created_at  TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_availability_dates CHECK (start_date <= end_date)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_outfits_owner_id              ON public.outfits(owner_id);
CREATE INDEX idx_outfits_category_id           ON public.outfits(category_id);
CREATE INDEX idx_outfits_slug                  ON public.outfits(slug);
CREATE INDEX idx_outfits_status                ON public.outfits(status);
CREATE INDEX idx_outfits_verification_status   ON public.outfits(verification_status);
CREATE INDEX idx_outfits_district              ON public.outfits(district);
CREATE INDEX idx_outfits_city                  ON public.outfits(city);

-- Composite index tuned for the most common public listing query
CREATE INDEX idx_outfits_public_listing
  ON public.outfits(status, verification_status)
  WHERE status = 'published' AND verification_status = 'approved';

CREATE INDEX idx_outfit_images_outfit_id        ON public.outfit_images(outfit_id);
CREATE INDEX idx_outfit_availability_outfit_id  ON public.outfit_availability(outfit_id);
-- =============================================================================
-- Migration 0005: Bookings, Status History, Payments, Reviews, Disputes,
--                 Inspection Reports
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: generate a collision-resistant human-readable booking number
-- Format: SR-YYYYMMDD-XXXXXX  (e.g. SR-20260913-A1B2C3)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  candidate TEXT;
  already_exists BOOLEAN;
BEGIN
  LOOP
    candidate := 'SR-'
      || TO_CHAR(NOW(), 'YYYYMMDD')
      || '-'
      || UPPER(SUBSTRING(encode(gen_random_bytes(4), 'hex'), 1, 6));
    SELECT EXISTS(
      SELECT 1 FROM public.bookings WHERE booking_number = candidate
    ) INTO already_exists;
    EXIT WHEN NOT already_exists;
  END LOOP;
  RETURN candidate;
END;
$$;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id                  UUID                         PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number      TEXT                         NOT NULL UNIQUE DEFAULT '',
  outfit_id           UUID                         NOT NULL REFERENCES public.outfits(id),
  renter_id           UUID                         NOT NULL REFERENCES public.profiles(id),
  owner_id            UUID                         NOT NULL REFERENCES public.profiles(id),
  event_date          DATE,
  rental_start_date   DATE                         NOT NULL,
  rental_end_date     DATE                         NOT NULL,
  rental_amount       NUMERIC(10, 2)               NOT NULL CHECK (rental_amount >= 0),
  security_deposit    NUMERIC(10, 2)               NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  delivery_fee        NUMERIC(10, 2)               NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  service_fee         NUMERIC(10, 2)               NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  total_amount        NUMERIC(10, 2)               NOT NULL CHECK (total_amount >= 0),
  status              public.booking_status         NOT NULL DEFAULT 'pending',
  payment_status      public.booking_payment_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_booking_dates CHECK (rental_start_date <= rental_end_date)
);

-- Auto-assign booking_number on insert
CREATE OR REPLACE FUNCTION public.set_booking_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := public.generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_number_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_number();

CREATE TRIGGER handle_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Booking Status History (audit trail)
-- ---------------------------------------------------------------------------
CREATE TABLE public.booking_status_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL,
  changed_by  UUID        REFERENCES public.profiles(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Payments
-- provider_payment_id / provider_order_id set by server-side Razorpay webhook.
-- Payment records must never be created or modified from the browser directly.
-- ---------------------------------------------------------------------------
CREATE TABLE public.payments (
  id                  UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID                  NOT NULL REFERENCES public.bookings(id),
  provider            TEXT                  NOT NULL DEFAULT 'razorpay',
  provider_payment_id TEXT,
  provider_order_id   TEXT,
  amount              NUMERIC(10, 2)         NOT NULL CHECK (amount >= 0),
  currency            TEXT                  NOT NULL DEFAULT 'INR',
  status              public.payment_status  NOT NULL DEFAULT 'created',
  metadata            JSONB,
  created_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE TRIGGER handle_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Reviews
-- A reviewer can only submit one review per booking (UNIQUE constraint).
-- The RLS policy (migration 0006) enforces booking must be completed.
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID        NOT NULL REFERENCES public.bookings(id),
  reviewer_id  UUID        NOT NULL REFERENCES public.profiles(id),
  reviewee_id  UUID        NOT NULL REFERENCES public.profiles(id),
  outfit_id    UUID        NOT NULL REFERENCES public.outfits(id),
  rating       INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_booking_reviewer UNIQUE (booking_id, reviewer_id)
);

-- ---------------------------------------------------------------------------
-- Disputes
-- ---------------------------------------------------------------------------
CREATE TABLE public.disputes (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID                  NOT NULL REFERENCES public.bookings(id),
  raised_by         UUID                  NOT NULL REFERENCES public.profiles(id),
  reason            TEXT                  NOT NULL,
  description       TEXT,
  amount            NUMERIC(10, 2)         CHECK (amount >= 0),
  status            public.dispute_status  NOT NULL DEFAULT 'open',
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE TRIGGER handle_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Inspection Reports
-- Created server-side (by admin or automated system) — not by renters.
-- ---------------------------------------------------------------------------
CREATE TABLE public.inspection_reports (
  id               UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID                    NOT NULL REFERENCES public.bookings(id),
  inspection_type  public.inspection_type  NOT NULL,
  condition_status public.condition_status NOT NULL,
  notes            TEXT,
  deduction_amount NUMERIC(10, 2)          NOT NULL DEFAULT 0 CHECK (deduction_amount >= 0),
  created_by       UUID                    REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_bookings_outfit_id       ON public.bookings(outfit_id);
CREATE INDEX idx_bookings_renter_id       ON public.bookings(renter_id);
CREATE INDEX idx_bookings_owner_id        ON public.bookings(owner_id);
CREATE INDEX idx_bookings_status          ON public.bookings(status);
CREATE INDEX idx_bookings_event_date      ON public.bookings(event_date);

CREATE INDEX idx_booking_history_booking_id ON public.booking_status_history(booking_id);
CREATE INDEX idx_payments_booking_id        ON public.payments(booking_id);
CREATE INDEX idx_reviews_outfit_id          ON public.reviews(outfit_id);
CREATE INDEX idx_reviews_reviewer_id        ON public.reviews(reviewer_id);
CREATE INDEX idx_disputes_booking_id        ON public.disputes(booking_id);
-- =============================================================================
-- Migration 0006: Row Level Security Policies
-- =============================================================================
-- Design principles:
--   • RLS is the authoritative security layer — UI is not trusted.
--   • is_admin() is SECURITY DEFINER — cannot be spoofed by a regular user.
--   • Payments and inspection reports are mutated server-side only.
--   • Owners cannot self-approve listings (enforced by trigger in 0004 + RLS here).
--   • Customers cannot change booking/payment status.
-- =============================================================================

-- Enable RLS on every user/business table
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports   ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES
-- =============================================================================
-- Users can only see their own profile (and admins can see all).
-- Public profile info (e.g. for reviews) will be exposed via a restricted view later.
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Users can update their own profile.
-- Role change is blocked by the prevent_role_change() trigger in 0002.
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- Profiles are created by the handle_new_user() SECURITY DEFINER trigger.
-- No direct INSERT from the client is needed or allowed.

-- =============================================================================
-- CATEGORIES
-- =============================================================================
-- Anyone (including unauthenticated) can read active categories.
CREATE POLICY "categories_select_active" ON public.categories
  FOR SELECT
  USING (is_active = TRUE);

-- Only admins can manage categories.
CREATE POLICY "categories_all_admin" ON public.categories
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- OUTFITS
-- =============================================================================
-- Anon / customer: can see published + admin-approved listings only.
CREATE POLICY "outfits_select_public" ON public.outfits
  FOR SELECT
  USING (
    status = 'published'
    AND verification_status = 'approved'
  );

-- Owner: can always see their own outfits regardless of status.
CREATE POLICY "outfits_select_own" ON public.outfits
  FOR SELECT
  USING (owner_id = auth.uid());

-- Admin: full access.
CREATE POLICY "outfits_all_admin" ON public.outfits
  FOR ALL
  USING (public.is_admin());

-- Owner: can create new listings (must start as draft, pending review).
CREATE POLICY "outfits_insert_owner" ON public.outfits
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND public.current_user_role() = 'owner'
    AND status = 'draft'
    AND verification_status = 'pending'
  );

-- Owner: can update their own outfits.
-- Trigger prevent_outfit_self_approval() in 0004 blocks verification_status changes
-- and direct publishing — no need to duplicate that logic here.
CREATE POLICY "outfits_update_own" ON public.outfits
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =============================================================================
-- OUTFIT IMAGES
-- =============================================================================
CREATE POLICY "outfit_images_select_public" ON public.outfit_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_images.outfit_id
        AND (
          (o.status = 'published' AND o.verification_status = 'approved')
          OR o.owner_id = auth.uid()
        )
    )
  );

CREATE POLICY "outfit_images_insert_owner" ON public.outfit_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_images.outfit_id
        AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "outfit_images_delete_owner" ON public.outfit_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_images.outfit_id
        AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "outfit_images_all_admin" ON public.outfit_images
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- OUTFIT MEASUREMENTS
-- =============================================================================
CREATE POLICY "outfit_measurements_select_public" ON public.outfit_measurements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_measurements.outfit_id
        AND (
          (o.status = 'published' AND o.verification_status = 'approved')
          OR o.owner_id = auth.uid()
        )
    )
  );

CREATE POLICY "outfit_measurements_owner_write" ON public.outfit_measurements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_measurements.outfit_id
        AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "outfit_measurements_all_admin" ON public.outfit_measurements
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- OUTFIT AVAILABILITY
-- =============================================================================
CREATE POLICY "outfit_availability_select_public" ON public.outfit_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_availability.outfit_id
        AND (
          (o.status = 'published' AND o.verification_status = 'approved')
          OR o.owner_id = auth.uid()
        )
    )
  );

CREATE POLICY "outfit_availability_owner_write" ON public.outfit_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = outfit_availability.outfit_id
        AND o.owner_id = auth.uid()
    )
  );

CREATE POLICY "outfit_availability_all_admin" ON public.outfit_availability
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- BOOKINGS
-- =============================================================================
-- Renter can see their own bookings.
CREATE POLICY "bookings_select_renter" ON public.bookings
  FOR SELECT
  USING (renter_id = auth.uid());

-- Owner can see bookings for their outfits.
CREATE POLICY "bookings_select_owner" ON public.bookings
  FOR SELECT
  USING (owner_id = auth.uid());

-- Customer can create a booking (must start as pending, unpaid).
-- Status/payment_status transitions happen server-side only.
CREATE POLICY "bookings_insert_customer" ON public.bookings
  FOR INSERT
  WITH CHECK (
    renter_id = auth.uid()
    AND public.current_user_role() = 'customer'
    AND status = 'pending'
    AND payment_status = 'pending'
  );

-- Admins have full booking access.
CREATE POLICY "bookings_all_admin" ON public.bookings
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- BOOKING STATUS HISTORY
-- =============================================================================
CREATE POLICY "booking_history_select_party" ON public.booking_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_status_history.booking_id
        AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

CREATE POLICY "booking_history_all_admin" ON public.booking_status_history
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- PAYMENTS
-- =============================================================================
-- Payment records are created/mutated server-side (service role / Edge Functions).
-- Renter can read their payment records.
CREATE POLICY "payments_select_renter" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND b.renter_id = auth.uid()
    )
  );

-- Owner can read payment records for their outfits' bookings.
CREATE POLICY "payments_select_owner" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND b.owner_id = auth.uid()
    )
  );

-- Only admins/service role can write payment records.
CREATE POLICY "payments_all_admin" ON public.payments
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- REVIEWS
-- =============================================================================
-- Public: readable for published outfits.
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.outfits o
      WHERE o.id = reviews.outfit_id
        AND o.status = 'published'
        AND o.verification_status = 'approved'
    )
  );

-- Reviewer can see their own review even if the outfit is no longer published.
CREATE POLICY "reviews_select_own" ON public.reviews
  FOR SELECT
  USING (reviewer_id = auth.uid());

-- Can only submit a review if you have a completed booking for that outfit.
CREATE POLICY "reviews_insert_customer" ON public.reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = reviews.booking_id
        AND b.renter_id = auth.uid()
        AND b.status = 'completed'
    )
  );

CREATE POLICY "reviews_all_admin" ON public.reviews
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- DISPUTES
-- =============================================================================
-- Renter or owner on the booking can see disputes.
CREATE POLICY "disputes_select_party" ON public.disputes
  FOR SELECT
  USING (
    raised_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

-- Either booking party can raise a dispute.
CREATE POLICY "disputes_insert_party" ON public.disputes
  FOR INSERT
  WITH CHECK (
    raised_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
        AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

-- Only admins resolve/update disputes.
CREATE POLICY "disputes_all_admin" ON public.disputes
  FOR ALL
  USING (public.is_admin());

-- =============================================================================
-- INSPECTION REPORTS
-- =============================================================================
-- Renter and owner can read inspection reports for their bookings.
CREATE POLICY "inspection_reports_select_party" ON public.inspection_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = inspection_reports.booking_id
        AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

-- Inspection reports are created/managed by admins / service-role only.
CREATE POLICY "inspection_reports_all_admin" ON public.inspection_reports
  FOR ALL
  USING (public.is_admin());
-- =============================================================================
-- Migration 0007: Seed Data (development only)
-- Do NOT run in production unless intentionally seeding categories.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- Bride and Groom categories as specified in the product spec.
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, slug, gender_type, description, is_active)
VALUES
  -- ── Bride ──────────────────────────────────────────────────────────────────
  (
    'Bridal Lehenga',
    'bridal-lehenga',
    'bride',
    'Traditional and designer bridal lehengas for the perfect wedding look',
    TRUE
  ),
  (
    'Saree',
    'saree',
    'bride',
    'Elegant silk and designer sarees for brides and bridesmaids',
    TRUE
  ),
  (
    'Gown',
    'gown',
    'bride',
    'Designer bridal gowns and evening gowns for reception and cocktail events',
    TRUE
  ),
  (
    'Anarkali',
    'anarkali',
    'bride',
    'Graceful Anarkali suits for mehendi, sangeet and wedding functions',
    TRUE
  ),
  (
    'Bridal Accessories',
    'bridal-accessories',
    'bride',
    'Maang tikka, nath, haar, bangles and complete bridal jewellery sets',
    TRUE
  ),

  -- ── Groom ──────────────────────────────────────────────────────────────────
  (
    'Sherwani',
    'sherwani',
    'groom',
    'Classic and designer sherwanis for grooms — baarat to reception',
    TRUE
  ),
  (
    'Indo-Western',
    'indo-western',
    'groom',
    'Contemporary indo-western outfits blending tradition and modern style',
    TRUE
  ),
  (
    'Suit',
    'suit',
    'groom',
    'Premium three-piece and two-piece suits for grooms and groomsmen',
    TRUE
  ),
  (
    'Tuxedo',
    'tuxedo',
    'groom',
    'Formal tuxedos for reception, cocktail evenings and destination weddings',
    TRUE
  ),
  (
    'Kurta',
    'kurta',
    'groom',
    'Elegant kurta sets for haldi, mehendi, sangeet and pre-wedding functions',
    TRUE
  ),
  (
    'Mojari',
    'mojari',
    'groom',
    'Traditional hand-embroidered mojaris and jutis for grooms',
    TRUE
  ),
  (
    'Groom Accessories',
    'groom-accessories',
    'groom',
    'Safa, turban, kalgi, dupatta, brooch and complete groom accessory sets',
    TRUE
  );
-- =============================================================================
-- Migration 0008: PostgreSQL Role Grants
--
-- CRITICAL: When tables are created via the SQL editor (not the Supabase
-- dashboard GUI), Supabase does NOT automatically grant the anon,
-- authenticated, or service_role PostgreSQL roles access to those tables.
-- Without these grants, PostgREST rejects queries before RLS even runs.
--
-- This migration explicitly grants the minimum necessary permissions.
-- RLS policies (migration 0006) still control which ROWS each role can see.
-- Grants only control whether the role can access the TABLE at all.
-- =============================================================================

-- ── Schema usage ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ── service_role: full access, bypasses RLS (used by server-side code only) ──
GRANT ALL ON ALL TABLES   IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ── anon (unauthenticated): read-only on truly public tables ─────────────────
-- RLS policies in 0006 control which rows are actually returned.
GRANT SELECT ON public.categories           TO anon;
GRANT SELECT ON public.outfits              TO anon;
GRANT SELECT ON public.outfit_images        TO anon;
GRANT SELECT ON public.outfit_measurements  TO anon;
GRANT SELECT ON public.outfit_availability  TO anon;
GRANT SELECT ON public.reviews              TO anon;

-- ── authenticated: row access controlled entirely by RLS policies ─────────────
-- profiles
GRANT SELECT, UPDATE              ON public.profiles             TO authenticated;

-- categories (read-only for non-admins)
GRANT SELECT                      ON public.categories           TO authenticated;

-- outfit management
GRANT SELECT, INSERT, UPDATE      ON public.outfits              TO authenticated;
GRANT SELECT, INSERT, DELETE      ON public.outfit_images        TO authenticated;
GRANT SELECT, INSERT, UPDATE      ON public.outfit_measurements  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outfit_availability TO authenticated;

-- bookings (status transitions are server-side only — no UPDATE for authenticated)
GRANT SELECT, INSERT              ON public.bookings             TO authenticated;
GRANT SELECT                      ON public.booking_status_history TO authenticated;

-- payments (read-only; written by server-side webhook handler)
GRANT SELECT                      ON public.payments             TO authenticated;

-- reviews and disputes
GRANT SELECT, INSERT              ON public.reviews              TO authenticated;
GRANT SELECT, INSERT              ON public.disputes             TO authenticated;

-- inspection_reports (read-only for booking parties; written server-side)
GRANT SELECT                      ON public.inspection_reports   TO authenticated;

-- ── Sequences (for UUID-generating functions if needed) ──────────────────────
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
