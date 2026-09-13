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
