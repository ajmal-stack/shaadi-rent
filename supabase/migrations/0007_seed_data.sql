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
