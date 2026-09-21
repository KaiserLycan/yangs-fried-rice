-- ============================================================
-- Migration: close the open tables (Phase 4 security testing)
--
-- FINDING (critical). These tables had NO row-level security and full
-- INSERT/UPDATE/DELETE grants to the `anon` role:
--
--     product, categories, add_on, delivery, notification,
--     reports, customer_address
--
-- The anon key is public — it ships inside the browser bundle — so anybody
-- could call Supabase's REST API directly and rewrite the menu, read every
-- customer's home address, or delete delivery records. No login required,
-- and nothing in the Next.js app was involved, so application-side checks
-- could not have stopped it.
--
-- This migration turns RLS on, adds policies matching what each screen
-- legitimately does, and takes the write grants away from `anon`.
--
-- Safe to run more than once. Nothing is deleted.
-- Run AFTER 20260921000003_qa_fixes_rls_delivery_roles.sql.
-- ============================================================


-- ------------------------------------------------------------
-- Helper: is the caller an employee, and of which role?
-- ------------------------------------------------------------
-- SECURITY DEFINER so a policy can look the caller up in `employee` without
-- being blocked by the policies on `employee` itself. It answers only about
-- the person making the request, so it cannot be used to read anyone's data.

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
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_menu_manager()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT public.current_employee_role() IN ('MANAGER', 'STAFF');
$$;

GRANT EXECUTE ON FUNCTION public.current_employee_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_menu_manager() TO anon, authenticated;


-- ------------------------------------------------------------
-- 1. Menu tables: the world may read, only staff may write
-- ------------------------------------------------------------
-- The menu is public by design (a signed-out visitor browses it), so SELECT
-- stays open. Writing is limited to Manager and Staff, who are the roles that
-- can open /manage/menu.

ALTER TABLE public.product    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_on     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_product" ON public.product;
CREATE POLICY "anyone_can_read_product" ON public.product
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "staff_write_product" ON public.product;
CREATE POLICY "staff_write_product" ON public.product
  FOR ALL TO authenticated
  USING (public.is_menu_manager())
  WITH CHECK (public.is_menu_manager());

DROP POLICY IF EXISTS "anyone_can_read_categories" ON public.categories;
CREATE POLICY "anyone_can_read_categories" ON public.categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "staff_write_categories" ON public.categories;
CREATE POLICY "staff_write_categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_menu_manager())
  WITH CHECK (public.is_menu_manager());

DROP POLICY IF EXISTS "anyone_can_read_add_on" ON public.add_on;
CREATE POLICY "anyone_can_read_add_on" ON public.add_on
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "staff_write_add_on" ON public.add_on;
CREATE POLICY "staff_write_add_on" ON public.add_on
  FOR ALL TO authenticated
  USING (public.is_menu_manager())
  WITH CHECK (public.is_menu_manager());


-- ------------------------------------------------------------
-- 2. Delivery: the customer it belongs to, employees, and the rider
-- ------------------------------------------------------------
-- The customer's tracking screen reads the delivery row for their own order;
-- riders read the queue and update the one they are carrying; staff see all.

ALTER TABLE public.delivery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_select_own_delivery" ON public.delivery;
CREATE POLICY "customer_select_own_delivery" ON public.delivery
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT order_id FROM public."order" WHERE customer_id = auth.uid())
  );

DROP POLICY IF EXISTS "employee_select_all_delivery" ON public.delivery;
CREATE POLICY "employee_select_all_delivery" ON public.delivery
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

-- A rider may take an unassigned delivery or change their own (which is what
-- handing one back does). They cannot touch another rider's.
DROP POLICY IF EXISTS "rider_update_own_or_unassigned_delivery" ON public.delivery;
CREATE POLICY "rider_update_own_or_unassigned_delivery" ON public.delivery
  FOR UPDATE TO authenticated
  USING (
    rider_id IS NULL
    OR rider_id IN (SELECT rider_id FROM public.rider WHERE employee_id = auth.uid())
    OR public.is_menu_manager()
  )
  WITH CHECK (
    rider_id IS NULL
    OR rider_id IN (SELECT rider_id FROM public.rider WHERE employee_id = auth.uid())
    OR public.is_menu_manager()
  );

DROP POLICY IF EXISTS "staff_insert_delivery" ON public.delivery;
CREATE POLICY "staff_insert_delivery" ON public.delivery
  FOR INSERT TO authenticated
  WITH CHECK (public.is_menu_manager());


-- ------------------------------------------------------------
-- 3. Customer addresses: the customer's own, and employees may read
-- ------------------------------------------------------------
-- Home addresses are the most sensitive rows in the database. A rider needs
-- to read the one they are delivering to, which the employee read covers.

ALTER TABLE public.customer_address ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_address_select_own" ON public.customer_address;
CREATE POLICY "customer_address_select_own" ON public.customer_address
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_address_insert_own" ON public.customer_address;
CREATE POLICY "customer_address_insert_own" ON public.customer_address
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_address_update_own" ON public.customer_address;
CREATE POLICY "customer_address_update_own" ON public.customer_address
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_address_delete_own" ON public.customer_address;
CREATE POLICY "customer_address_delete_own" ON public.customer_address
  FOR DELETE TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "employee_select_all_customer_address" ON public.customer_address;
CREATE POLICY "employee_select_all_customer_address" ON public.customer_address
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);


-- ------------------------------------------------------------
-- 4. Notifications: strictly the customer's own
-- ------------------------------------------------------------

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_select_own_notification" ON public.notification;
CREATE POLICY "customer_select_own_notification" ON public.notification
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_update_own_notification" ON public.notification;
CREATE POLICY "customer_update_own_notification" ON public.notification
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_delete_own_notification" ON public.notification;
CREATE POLICY "customer_delete_own_notification" ON public.notification
  FOR DELETE TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "staff_insert_notification" ON public.notification;
CREATE POLICY "staff_insert_notification" ON public.notification
  FOR INSERT TO authenticated
  WITH CHECK (public.is_menu_manager());


-- ------------------------------------------------------------
-- 5. Reports: managers only
-- ------------------------------------------------------------

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_manage_reports" ON public.reports;
CREATE POLICY "manager_manage_reports" ON public.reports
  FOR ALL TO authenticated
  USING (public.current_employee_role() = 'MANAGER')
  WITH CHECK (public.current_employee_role() = 'MANAGER');


-- ------------------------------------------------------------
-- 6. Take the write grants away from the public anon role
-- ------------------------------------------------------------
-- RLS above is the real control. This is the second lock: a signed-out
-- caller has no business writing to any of these tables, so the privilege
-- is removed entirely rather than left to a policy to refuse.
-- `anon` keeps SELECT where the table is meant to be publicly readable.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.product          FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.categories       FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.add_on           FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.delivery         FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.notification     FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.reports          FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.customer_address FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.customer         FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.employee         FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.rider            FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public."order"          FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.order_item       FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.transaction      FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.review           FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cart             FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.cart_item        FROM anon;

-- Sensitive tables should not be readable by a signed-out caller either.
REVOKE SELECT ON TABLE public.customer         FROM anon;
REVOKE SELECT ON TABLE public.customer_address FROM anon;
REVOKE SELECT ON TABLE public.employee         FROM anon;
REVOKE SELECT ON TABLE public.rider            FROM anon;
REVOKE SELECT ON TABLE public.reports          FROM anon;
REVOKE SELECT ON TABLE public.notification     FROM anon;

NOTIFY pgrst, 'reload schema';
