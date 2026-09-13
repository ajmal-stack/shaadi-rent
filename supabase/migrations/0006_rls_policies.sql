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
