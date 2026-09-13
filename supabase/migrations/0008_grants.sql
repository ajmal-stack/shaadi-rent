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
