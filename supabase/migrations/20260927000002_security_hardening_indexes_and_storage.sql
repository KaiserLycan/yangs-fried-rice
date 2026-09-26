-- Issue #114: the rest of the security and database pass.
--
--   1. Disabled employees stop counting as employees in RLS.
--   2. Staff/manager checks on the order tables go through that helper.
--   3. Nobody can promote themselves or re-enable their own account.
--   4. Every SECURITY DEFINER function pins search_path; the auth trigger's
--      function can no longer be called over the API.
--   5. Indexes for the queries the app actually runs.
--   6. employee."phone-num" → employee.phone_number.
--   7. A private `senior-pwd-ids` bucket for Senior Citizen / PWD ID photos.

-- ---------------------------------------------------------------------------
-- 1. current_employee_role() ignores disabled accounts
-- ---------------------------------------------------------------------------

-- Every staff policy that goes through this helper (employee, delivery-era
-- tables, add-on lines, menu, notifications) now refuses a disabled account
-- at the database, not only in the app. The employee can still read their
-- own row — `employee_select_own_or_staff` matches on employee_id first —
-- which is what the sign-in screen needs to say "your account is disabled".
CREATE OR REPLACE FUNCTION public.current_employee_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT upper(trim(e.role))
  FROM public.employee e
  WHERE e.employee_id = auth.uid()
    AND coalesce(e.is_account_disabled, false) = false
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 2. Staff policies on the order tables use the helper
-- ---------------------------------------------------------------------------

-- These tested `auth.uid() IN (SELECT employee_id FROM employee …)`, which
-- let a disabled employee keep reading and changing orders straight through
-- the REST API. Same roles as before, now disabled-aware.

DROP POLICY IF EXISTS "employee_select_all_orders" ON public."order";
CREATE POLICY "employee_select_all_orders" ON public."order"
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_and_manager_update_orders" ON public."order";
CREATE POLICY "staff_and_manager_update_orders" ON public."order"
  FOR UPDATE TO authenticated
  USING (public.current_employee_role() IN ('MANAGER', 'STAFF'))
  WITH CHECK (public.current_employee_role() IN ('MANAGER', 'STAFF'));

DROP POLICY IF EXISTS "employee_select_all_order_items" ON public.order_item;
CREATE POLICY "employee_select_all_order_items" ON public.order_item
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

DROP POLICY IF EXISTS "employee_select_all_order_add_on" ON public.order_add_on;
CREATE POLICY "employee_select_all_order_add_on" ON public.order_add_on
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

DROP POLICY IF EXISTS "employee_select_all_transactions" ON public.transaction;
CREATE POLICY "employee_select_all_transactions" ON public.transaction
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_manager_insert_transactions" ON public.transaction;
CREATE POLICY "staff_manager_insert_transactions" ON public.transaction
  FOR INSERT TO authenticated
  WITH CHECK (public.current_employee_role() IN ('MANAGER', 'STAFF'));

DROP POLICY IF EXISTS "staff_manager_update_transactions" ON public.transaction;
CREATE POLICY "staff_manager_update_transactions" ON public.transaction
  FOR UPDATE TO authenticated
  USING (public.current_employee_role() IN ('MANAGER', 'STAFF'))
  WITH CHECK (public.current_employee_role() IN ('MANAGER', 'STAFF'));

-- ---------------------------------------------------------------------------
-- 3. No self-promotion, no self-re-enable
-- ---------------------------------------------------------------------------

-- Known gap 1 in 20260925000001: `employee_update_own_or_manager` lets an
-- employee update their own row, and RLS cannot restrict columns, so a STAFF
-- account could set its own role to MANAGER. A disabled employee could also
-- flip is_account_disabled back. Column grants would not work — managers
-- update the same columns through the same role — so a trigger checks it.
CREATE OR REPLACE FUNCTION public.guard_employee_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role, and managers acting through their session, are trusted.
  IF auth.uid() IS NULL OR public.current_employee_role() = 'MANAGER' THEN
    RETURN NEW;
  END IF;

  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    RAISE EXCEPTION 'An employee id cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF upper(trim(coalesce(NEW.role, ''))) IS DISTINCT FROM upper(trim(coalesce(OLD.role, ''))) THEN
    RAISE EXCEPTION 'Only a manager can change an employee''s role.' USING ERRCODE = '42501';
  END IF;

  -- Deactivating yourself is allowed (lib/actions/employee-profile.ts);
  -- undoing it is a manager's call.
  IF coalesce(OLD.is_account_disabled, false) AND NOT coalesce(NEW.is_account_disabled, false) THEN
    RAISE EXCEPTION 'Only a manager can re-enable an account.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_employee_self_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_employee_self_update ON public.employee;
CREATE TRIGGER trg_guard_employee_self_update
  BEFORE UPDATE ON public.employee
  FOR EACH ROW EXECUTE FUNCTION public.guard_employee_self_update();

-- Same hole on `customer`: `customer_update_own` allows any column, so a
-- disabled customer could re-enable themselves with one REST call.
CREATE OR REPLACE FUNCTION public.guard_customer_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_employee_role() = 'MANAGER' THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'A customer id cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF coalesce(OLD.is_account_disabled, false) AND NOT coalesce(NEW.is_account_disabled, false) THEN
    RAISE EXCEPTION 'Only the store can re-enable an account.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_customer_self_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_customer_self_update ON public.customer;
CREATE TRIGGER trg_guard_customer_self_update
  BEFORE UPDATE ON public.customer
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_self_update();

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER hygiene
-- ---------------------------------------------------------------------------

-- A SECURITY DEFINER function without a fixed search_path resolves unqualified
-- names through the caller's path, which a caller can influence. Pin every
-- one in `public` rather than listing them, so a function added before this
-- ran is not missed.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn.sig);
  END LOOP;
END $$;

-- The auth.users trigger function. It is only meant to run as a trigger, but
-- as a public function it was also callable by anyone over /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.handle_password_timestamp_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_password_timestamp()        FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------------

-- Customer order history: WHERE customer_id = ? ORDER BY created_at DESC.
CREATE INDEX IF NOT EXISTS order_customer_id_created_at_idx
  ON public."order" (customer_id, created_at DESC);

-- Orders page / KDS: WHERE order_status IN (…) ORDER BY created_at.
CREATE INDEX IF NOT EXISTS order_order_status_created_at_idx
  ON public."order" (order_status, created_at);

-- Every order detail read, and the RLS subqueries that join through order.
CREATE INDEX IF NOT EXISTS order_item_order_id_idx
  ON public.order_item (order_id);

CREATE INDEX IF NOT EXISTS transaction_order_id_idx
  ON public.transaction (order_id);

-- ---------------------------------------------------------------------------
-- 6. employee."phone-num" → employee.phone_number
-- ---------------------------------------------------------------------------

-- Matches customer.phone_number, and no longer needs quoting everywhere.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee' AND column_name = 'phone-num'
  ) THEN
    ALTER TABLE public.employee RENAME COLUMN "phone-num" TO phone_number;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. senior-pwd-ids: private bucket, signed URLs only
-- ---------------------------------------------------------------------------

-- Senior Citizen / PWD ID photos are government IDs. The bucket is private
-- from the start: no public URL exists for any file in it. Files are stored
-- under `<customer uuid>/…`, the customer can upload and read only their own
-- folder, and staff read through short-lived signed URLs created on the
-- server (lib/storage/senior-pwd-ids.ts). 2 MB, images only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'senior-pwd-ids',
  'senior-pwd-ids',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
SET public             = false,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "senior_pwd_ids_customer_insert_own" ON storage.objects;
CREATE POLICY "senior_pwd_ids_customer_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'senior-pwd-ids'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "senior_pwd_ids_customer_select_own" ON storage.objects;
CREATE POLICY "senior_pwd_ids_customer_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'senior-pwd-ids'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Staff verify the ID at the counter, so they can read (and therefore sign)
-- any file in the bucket; they delete it once the order is done.
DROP POLICY IF EXISTS "senior_pwd_ids_staff_select" ON storage.objects;
CREATE POLICY "senior_pwd_ids_staff_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'senior-pwd-ids'
    AND public.current_employee_role() IN ('MANAGER', 'STAFF')
  );

DROP POLICY IF EXISTS "senior_pwd_ids_staff_delete" ON storage.objects;
CREATE POLICY "senior_pwd_ids_staff_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'senior-pwd-ids'
    AND public.current_employee_role() IN ('MANAGER', 'STAFF')
  );

NOTIFY pgrst, 'reload schema';
