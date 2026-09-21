-- ============================================================
-- Migration: QA fixes — staff/rider visibility, delivery queue, roles
--
-- Safe to run more than once: every statement is idempotent
-- (DROP POLICY IF EXISTS / CREATE OR REPLACE / IF NOT EXISTS / guarded
-- DO blocks). Nothing here deletes rows or drops columns.
--
-- Run AFTER 20260921000002_schema_drift_and_review_rpc_cleanup.sql.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Customer table: let employees read customers, managers manage them
-- ------------------------------------------------------------
-- Why: staff and riders saw "Walk-in Customer" and no phone number because
-- the only policy on `customer` lets a customer read THEIR OWN row. The
-- reports page (registered-customer count) and the manager Customers page
-- need the same read access, and a manager must be able to edit / delete
-- customers from that page.
--
-- The three "own row" policies are re-created here exactly as they appear in
-- supabase/profile-rls-and-triggers.sql, so this is correct whether or not
-- that file was ever run.

ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_select_own" ON public.customer;
CREATE POLICY "customer_select_own" ON public.customer
  FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_update_own" ON public.customer;
CREATE POLICY "customer_update_own" ON public.customer
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_insert_own" ON public.customer;
CREATE POLICY "customer_insert_own" ON public.customer
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Any signed-in employee (manager, staff, rider) can READ customers.
DROP POLICY IF EXISTS "employee_select_all_customers" ON public.customer;
CREATE POLICY "employee_select_all_customers" ON public.customer
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.employee e WHERE e.employee_id = auth.uid())
  );

-- Only managers can change or remove customers.
DROP POLICY IF EXISTS "manager_update_customers" ON public.customer;
CREATE POLICY "manager_update_customers" ON public.customer
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee e
      WHERE e.employee_id = auth.uid() AND upper(trim(e.role)) = 'MANAGER'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employee e
      WHERE e.employee_id = auth.uid() AND upper(trim(e.role)) = 'MANAGER'
    )
  );

DROP POLICY IF EXISTS "manager_delete_customers" ON public.customer;
CREATE POLICY "manager_delete_customers" ON public.customer
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee e
      WHERE e.employee_id = auth.uid() AND upper(trim(e.role)) = 'MANAGER'
    )
  );


-- ------------------------------------------------------------
-- 2. Delivery queue: create a `delivery` row when a delivery order is ready
-- ------------------------------------------------------------
-- Why: the rider screen lists rows from the `delivery` table, and nothing
-- ever inserted one — so riders saw an empty queue no matter how many orders
-- were out for delivery. This trigger creates the row (status 'pending',
-- no rider yet) the moment a DELIVERY-type order reaches 'ready' or
-- 'out_for_delivery'. The app does the same thing in
-- lib/orders/order-side-effects.ts; both are idempotent, so having both is
-- fine.

CREATE OR REPLACE FUNCTION public.create_delivery_for_ready_order()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $function$
BEGIN
  IF lower(coalesce(NEW.order_type, '')) = 'delivery'
     AND NEW.order_status IN ('ready', 'out_for_delivery')
     AND NOT EXISTS (
       SELECT 1 FROM public.delivery d WHERE d.order_id = NEW.order_id
     )
  THEN
    INSERT INTO public.delivery (order_id, delivery_status)
    VALUES (NEW.order_id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_create_delivery_for_ready_order ON public."order";
CREATE TRIGGER trg_create_delivery_for_ready_order
  AFTER INSERT OR UPDATE OF order_status, order_type ON public."order"
  FOR EACH ROW
  EXECUTE FUNCTION public.create_delivery_for_ready_order();

-- Back-fill: delivery orders that are ALREADY ready / out for delivery but
-- have no delivery row (so riders can see them now, not only new ones).
INSERT INTO public.delivery (order_id, delivery_status)
SELECT o.order_id, 'pending'
FROM public."order" o
WHERE lower(coalesce(o.order_type, '')) = 'delivery'
  AND o.order_status IN ('ready', 'out_for_delivery')
  AND NOT EXISTS (
    SELECT 1 FROM public.delivery d WHERE d.order_id = o.order_id
  );

-- One delivery per order. Created only if no order currently has two rows
-- (an existing duplicate would make the index fail, so it is skipped with a
-- notice instead of aborting the whole migration).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.delivery
    WHERE order_id IS NOT NULL
    GROUP BY order_id HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'delivery_order_id_unique skipped: some orders already have more than one delivery row.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS delivery_order_id_unique
      ON public.delivery (order_id);
  END IF;
END $$;


-- ------------------------------------------------------------
-- 3. Roles: merge Server / Cook / Cashier into STAFF, RIDER for Delivery
-- ------------------------------------------------------------
-- Why: the employee directory now offers exactly Manager / Staff / Delivery.
-- Older rows were stored as 'Server', 'Cook', 'Cashier', 'Manager' (mixed
-- case) etc. The app already normalises them when it reads, but the database
-- policies compare the literal 'MANAGER' / 'STAFF', so a row stored as
-- 'Manager' silently lost its permissions. This makes the stored values
-- match. Rows with any other value are left untouched.

UPDATE public.employee
SET role = CASE
  WHEN upper(trim(role)) = 'MANAGER' THEN 'MANAGER'
  WHEN upper(trim(role)) IN ('STAFF', 'SERVER', 'COOK', 'CASHIER') THEN 'STAFF'
  WHEN upper(trim(role)) IN ('RIDER', 'DELIVERY') THEN 'RIDER'
  ELSE role
END
WHERE role IS NOT NULL
  AND role IS DISTINCT FROM CASE
    WHEN upper(trim(role)) = 'MANAGER' THEN 'MANAGER'
    WHEN upper(trim(role)) IN ('STAFF', 'SERVER', 'COOK', 'CASHIER') THEN 'STAFF'
    WHEN upper(trim(role)) IN ('RIDER', 'DELIVERY') THEN 'RIDER'
    ELSE role
  END;

-- From now on only the three canonical roles can be written. NOT VALID means
-- existing rows are not re-checked (so an unusual leftover value can't make
-- this fail); every new or edited row must comply.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_role_check'
  ) THEN
    ALTER TABLE public.employee
      ADD CONSTRAINT employee_role_check
      CHECK (role IS NULL OR role IN ('MANAGER', 'STAFF', 'RIDER')) NOT VALID;
  END IF;
END $$;


-- ------------------------------------------------------------
-- 4. One active cart per customer
-- ------------------------------------------------------------
-- Why: nothing stopped two "active" carts existing for the same customer
-- (the app does check-then-insert), and the cart reader then picks one at
-- random. Skipped with a notice if duplicates already exist.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.cart
    WHERE is_final = false AND customer_id IS NOT NULL
    GROUP BY customer_id HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'one_active_cart_per_customer skipped: some customers already have more than one active cart.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_cart_per_customer
      ON public.cart (customer_id)
      WHERE is_final = false;
  END IF;
END $$;
