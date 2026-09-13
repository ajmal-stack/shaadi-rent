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
