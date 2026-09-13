-- =============================================================================
-- ShaadiRent — Schema & Security Audit Queries
-- Run these in Supabase SQL Editor to verify the database foundation.
-- =============================================================================

-- ── 1. TABLE EXISTENCE ──────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ── 2. ROW LEVEL SECURITY STATUS ────────────────────────────────────────────
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ── 3. ALL RLS POLICIES ─────────────────────────────────────────────────────
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual      AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ── 4. FOREIGN KEYS ─────────────────────────────────────────────────────────
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS references_table,
  ccu.column_name AS references_column,
  rc.delete_rule  AS on_delete
FROM information_schema.table_constraints        AS tc
JOIN information_schema.key_column_usage         AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema   = kcu.table_schema
JOIN information_schema.constraint_column_usage  AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema   = tc.table_schema
JOIN information_schema.referential_constraints  AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema    = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ── 5. CHECK CONSTRAINTS ────────────────────────────────────────────────────
SELECT tc.table_name, tc.constraint_name, cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON cc.constraint_name  = tc.constraint_name
  AND cc.constraint_schema = tc.table_schema
WHERE tc.table_schema   = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- ── 6. NOT NULL COLUMNS ─────────────────────────────────────────────────────
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema  = 'public'
  AND is_nullable   = 'NO'
ORDER BY table_name, ordinal_position;

-- ── 7. TRIGGERS ─────────────────────────────────────────────────────────────
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Auth trigger (must exist on auth.users)
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table  = 'users';

-- ── 8. INDEXES ───────────────────────────────────────────────────────────────
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ── 9. ENUM TYPES ───────────────────────────────────────────────────────────
SELECT
  t.typname    AS enum_name,
  e.enumlabel  AS enum_value
FROM pg_type t
JOIN pg_enum e  ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY t.typname, e.enumsortorder;

-- ── 10. FUNCTIONS (security check) ──────────────────────────────────────────
SELECT
  routine_name,
  routine_type,
  security_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ── 11. SECURITY: Verify is_admin() is SECURITY DEFINER ─────────────────────
SELECT proname AS function_name, prosecdef AS is_security_definer
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('is_admin', 'current_user_role', 'handle_new_user',
                  'prevent_role_change', 'prevent_outfit_self_approval');

-- ── 12. BOOKING OVERLAP RISK CHECK ──────────────────────────────────────────
-- Shows whether there is any DB-level constraint preventing overlapping bookings.
-- Expected result: no such constraint exists yet (to be added in booking step).
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.bookings'::regclass
ORDER BY conname;

-- ── 13. CATEGORY SEED DATA ───────────────────────────────────────────────────
SELECT id, name, slug, gender_type, is_active FROM public.categories ORDER BY gender_type, name;
