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
