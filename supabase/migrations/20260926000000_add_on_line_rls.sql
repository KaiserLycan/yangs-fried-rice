-- Row Level Security for the per-line add-on tables.
--
-- `cart_item_add_on` and `order_item_add_on` were the two public tables left
-- with RLS off and no policies (see note 3 in
-- 20260925000001_restore_employee_rider_rls.sql). With RLS off, the grants in
-- 000_remote_schema.sql apply unfiltered: anyone holding the anon key — which
-- ships in the browser bundle — could read every customer's add-on choices
-- and insert, change or delete rows in anyone's cart or order.
--
-- The policies mirror the parent tables exactly, so nothing the app does
-- today is refused:
--
--   cart_item_add_on   follows cart_item: the customer who owns the cart
--                      reads it; adds and removes only while the cart is not
--                      final (`lib/actions/cart.ts` inserts, and a line's
--                      add-ons go with it through ON DELETE CASCADE, which
--                      is not subject to RLS).
--   order_item_add_on  follows order_item: the customer who placed the order
--                      reads and inserts (`submitCart` inserts with the
--                      customer's session), and any employee reads (the KDS
--                      and orders screens join it via `lib/actions/orders.ts`).
--
-- Employee checks go through `public.current_employee_role()`, the SECURITY
-- DEFINER helper from 20260921000004_lock_down_public_tables.sql, rather than
-- `auth.uid() IN (SELECT employee_id FROM employee)`: that subquery runs
-- under the caller's own RLS on `employee`, which is how the policies in
-- 004_employee_profile_rls.sql ended up recursing and being switched off.
--
-- Service-role callers (the PayMongo webhook, admin actions) bypass RLS and
-- are unaffected.
--
-- Safe to re-run: every policy is dropped before it is created.

ALTER TABLE public.cart_item_add_on  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_add_on ENABLE ROW LEVEL SECURITY;

-- Signed-out callers have no business with either table.
REVOKE ALL ON TABLE public.cart_item_add_on  FROM anon;
REVOKE ALL ON TABLE public.order_item_add_on FROM anon;

-- ---------------------------------------------------------------------------
-- cart_item_add_on
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "customer_select_own_cart_item_add_on" ON public.cart_item_add_on;
CREATE POLICY "customer_select_own_cart_item_add_on" ON public.cart_item_add_on
  FOR SELECT TO authenticated
  USING (cart_item_id IN (
    SELECT ci.cart_item_id
    FROM public.cart_item ci
    JOIN public.cart c ON c.cart_id = ci.cart_id
    WHERE c.customer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "customer_insert_own_cart_item_add_on" ON public.cart_item_add_on;
CREATE POLICY "customer_insert_own_cart_item_add_on" ON public.cart_item_add_on
  FOR INSERT TO authenticated
  WITH CHECK (cart_item_id IN (
    SELECT ci.cart_item_id
    FROM public.cart_item ci
    JOIN public.cart c ON c.cart_id = ci.cart_id
    WHERE c.customer_id = auth.uid() AND c.is_final = false
  ));

DROP POLICY IF EXISTS "customer_delete_own_cart_item_add_on" ON public.cart_item_add_on;
CREATE POLICY "customer_delete_own_cart_item_add_on" ON public.cart_item_add_on
  FOR DELETE TO authenticated
  USING (cart_item_id IN (
    SELECT ci.cart_item_id
    FROM public.cart_item ci
    JOIN public.cart c ON c.cart_id = ci.cart_id
    WHERE c.customer_id = auth.uid() AND c.is_final = false
  ));

-- No UPDATE policy: an add-on row is a (line, add-on) pair, and changing a
-- line's add-ons is a delete plus an insert. Nothing in the app updates one.

-- ---------------------------------------------------------------------------
-- order_item_add_on
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "customer_select_own_order_item_add_on" ON public.order_item_add_on;
CREATE POLICY "customer_select_own_order_item_add_on" ON public.order_item_add_on
  FOR SELECT TO authenticated
  USING (order_item_id IN (
    SELECT oi.order_item_id
    FROM public.order_item oi
    JOIN public."order" o ON o.order_id = oi.order_id
    WHERE o.customer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "customer_insert_own_order_item_add_on" ON public.order_item_add_on;
CREATE POLICY "customer_insert_own_order_item_add_on" ON public.order_item_add_on
  FOR INSERT TO authenticated
  WITH CHECK (order_item_id IN (
    SELECT oi.order_item_id
    FROM public.order_item oi
    JOIN public."order" o ON o.order_id = oi.order_id
    WHERE o.customer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "employee_select_all_order_item_add_on" ON public.order_item_add_on;
CREATE POLICY "employee_select_all_order_item_add_on" ON public.order_item_add_on
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

-- Order history is append-only for customers: no UPDATE or DELETE policy.

NOTIFY pgrst, 'reload schema';
