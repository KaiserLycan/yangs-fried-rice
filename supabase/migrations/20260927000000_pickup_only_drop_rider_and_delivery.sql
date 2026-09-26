-- Issue #114: the shop is pickup-only, so `rider` and `delivery` go.
--
-- Nothing sends an order out any more: customers collect at the counter (or
-- send their own courier), so there is no rider to assign and no delivery row
-- to track. Keeping the tables would keep their data exposure — rider licence
-- numbers, which staff member delivered to which address — for a feature that
-- no longer exists.
--
-- The rows are copied into a private `archive` schema before the tables are
-- dropped. That schema is not in PostgREST's exposed schemas and every grant
-- on it is revoked, so the copies are unreachable from the anon or
-- authenticated keys; they exist so a past delivery can still be looked up by
-- someone with database access if a dispute ever needs it.
--
-- Safe to re-run: every step is guarded on the object still existing.

-- ---------------------------------------------------------------------------
-- 1. Archive
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS archive;
REVOKE ALL ON SCHEMA archive FROM PUBLIC;
REVOKE ALL ON SCHEMA archive FROM anon, authenticated;

DO $$
BEGIN
  IF to_regclass('public.delivery') IS NOT NULL
     AND to_regclass('archive.delivery') IS NULL THEN
    CREATE TABLE archive.delivery AS TABLE public.delivery;
  END IF;

  IF to_regclass('public.rider') IS NOT NULL
     AND to_regclass('archive.rider') IS NULL THEN
    CREATE TABLE archive.rider AS TABLE public.rider;
  END IF;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA archive FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Drop what fed the tables
-- ---------------------------------------------------------------------------

-- The trigger that created a delivery row whenever a delivery order reached
-- `ready` (20260921000003). With no table to write to it would fail every
-- status update on a legacy delivery order.
DROP TRIGGER IF EXISTS trg_create_delivery_for_ready_order ON public."order";
DROP FUNCTION IF EXISTS public.create_delivery_for_ready_order();

-- ---------------------------------------------------------------------------
-- 3. Drop the tables
-- ---------------------------------------------------------------------------

-- `delivery` first: it holds the foreign key to `rider`. Dropping a table
-- also removes it from the `supabase_realtime` publication and drops its
-- policies, so neither needs undoing by hand. No CASCADE on purpose — if
-- anything else still referenced these tables, this should fail loudly.
DROP TABLE IF EXISTS public.delivery;
DROP TABLE IF EXISTS public.rider;

-- ---------------------------------------------------------------------------
-- 4. Rider accounts
-- ---------------------------------------------------------------------------

-- The app no longer has a RIDER role or a /deliver area, so a rider's account
-- has nowhere to land. Disabled rather than deleted or re-roled: the rows,
-- names and history stay, and a manager can re-enable one as STAFF from
-- /manage/employee if that person moves to the counter.
UPDATE public.employee
SET is_account_disabled = true
WHERE upper(trim(role)) IN ('RIDER', 'DELIVERY')
  AND coalesce(is_account_disabled, false) = false;

-- ---------------------------------------------------------------------------
-- 5. Proof-of-delivery photos
-- ---------------------------------------------------------------------------

-- The bucket held photos riders took at customers' doors, and was public:
-- anyone with a file's URL could open it. Nothing uploads to it any more, so
-- it is made private and its policies are removed. The files themselves are
-- kept (deleting storage objects is not something a migration should do
-- silently); they can be cleared from the dashboard once no dispute needs them.
UPDATE storage.buckets SET public = false WHERE id = 'proof-of-delivery';

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual LIKE '%proof-of-delivery%' OR with_check LIKE '%proof-of-delivery%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
