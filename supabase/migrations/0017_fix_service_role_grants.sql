-- =============================================================================
-- Migration 0017: Grant service_role access to tables created after 0008_grants
--
-- The GRANT ALL ON ALL TABLES blanket in 0008 only covers tables that existed
-- at that point. Tables added by later migrations (booking_events,
-- booking_status_history, inspection_reports, wishlists, owner_applications,
-- platform_settings) may be missing grants for service_role.
-- This migration explicitly re-grants to ensure coverage.
-- =============================================================================

-- Re-grant ALL to service_role for any tables added after migration 0008
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

-- Explicit grants for tables confirmed to need them (belt-and-suspenders)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_events          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_status_history  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_reports      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists               TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owner_applications      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings       TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments                TO service_role;

-- Also grant authenticated users read access to booking_events for their own bookings
-- (RLS policy controls which rows they can see)
GRANT SELECT ON public.booking_events TO authenticated;
