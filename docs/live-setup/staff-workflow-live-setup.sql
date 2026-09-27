-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- DO NOT RUN THIS VERSION. It was built on a branch that predates the
-- `development` checkout (#115 store hours, #116 discount, price check). Its
-- submit_cart_to_order section adds a second, older checkout function next
-- to the live one. To be regenerated after merging `development`.
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
DO $$ BEGIN RAISE EXCEPTION 'Superseded: do not run this version of staff-workflow-live-setup.sql (see header).'; END $$;

-- =============================================================================
-- Yang's Fried Rice — staff workflow: LIVE DATABASE SETUP
-- Generated from supabase/migrations/ (do not edit by hand; regenerate).
--
-- HOW TO USE
--   1. Supabase dashboard → SQL Editor → New query.
--   2. Paste this WHOLE file. Click Run once.
--   3. The result grid at the bottom is a checklist. Every row must say PASS.
--
-- SAFE TO RUN MORE THAN ONCE. Everything is IF NOT EXISTS / CREATE OR REPLACE
-- or guarded, and the whole file is one transaction: if anything fails,
-- nothing is changed and the error says where.
--
-- It covers migrations 20260928000003 → 20260928000011. 0004 and 0005 are
-- not included on purpose: 0009 and 0011 replace every function they define
-- (0004's version let signed-in customers read the whole customer list).
--
-- WHAT IT CHANGES
--   • order.fulfillment_method / order.ready_at columns (if missing)
--   • product_price_log table + triggers: only MANAGERs can set/change prices
--   • report functions: get_cash_remitted_daily, get_sales_by_hour,
--     get_sales_by_weekday; get_cash_remitted, get_payment_method_breakdown,
--     get_cancellation_reason_breakdown redefined on Manila days
--   • submit_cart_to_order gains p_fulfillment_method (old 4-arg version dropped)
--   • get_customer_stats(p_search) replaces get_customer_stats()
--   • makes sure public."order" is in the supabase_realtime publication
--
-- DEPLOY ORDER: run this BEFORE (or together with) deploying the new app
-- code. The new checkout sends p_fulfillment_method; against the old
-- database function that call fails and nobody can place an order.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Preflight: stop with a clear message if the database is not the one
--    these migrations expect (instead of failing half way with a cryptic one).
-- -----------------------------------------------------------------------------
DO $preflight$
DECLARE
  missing text[] := ARRAY[]::text[];
  req record;
BEGIN
  IF to_regprocedure('public.current_employee_role()') IS NULL THEN
    missing := missing || 'function public.current_employee_role() (migration 20260927000002)';
  END IF;

  FOR req IN
    SELECT * FROM (VALUES
      ('order', 'order_status'), ('order', 'order_type'), ('order', 'created_at'),
      ('order', 'completed_at'), ('order', 'cancelled_at'), ('order', 'cancellation_reason'),
      ('order', 'cart_id'), ('order', 'special_instructions'), ('order', 'delivery_fee'),
      ('order', 'delivery_address'), ('order', 'customer_id'),
      ('transaction', 'payment_method'), ('transaction', 'payment_status'), ('transaction', 'total_paid'),
      ('transaction', 'subtotal'), ('transaction', 'transaction_date'),
      ('product', 'product_price'), ('product', 'archived_at'), ('product', 'is_available'),
      ('order_item', 'product_name'), ('order_item', 'unit_price'),
      ('cart', 'is_final'), ('cart', 'status'), ('cart', 'order_id'), ('cart', 'submitted_at'), ('cart', 'updated_at'),
      ('cart_item', 'quantity'), ('cart_item_add_on', 'addon_id'), ('cart_add_on', 'addon_id'),
      ('order_add_on', 'price'), ('order_item_add_on', 'addon_id'), ('add_on', 'price'),
      ('customer', 'is_account_disabled'), ('customer', 'date_of_birth'), ('customer', 'profileImage_URL'),
      ('employee', 'role')
    ) AS t(tbl, col)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = req.tbl AND column_name = req.col
    ) THEN
      missing := missing || format('column public.%I.%I', req.tbl, req.col);
    END IF;
  END LOOP;

  IF array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION 'Preflight failed — this database is missing: %', array_to_string(missing, '; ')
      USING HINT = 'Apply the earlier migrations in supabase/migrations/ first. Nothing was changed.';
  END IF;
END;
$preflight$;


-- #############################################################################
-- Phase 1 — fulfillment_method columns, pay-in-store total_paid backfill, filter indexes
-- (20260928000003_phase_1_schema_and_fixes.sql)
-- #############################################################################

-- Phase 1 Schema changes and data fixes

-- 1. Add fulfillment_method to cart and order tables
-- No default: a default answered the question for every order before any
-- customer was asked (see 20260928000006 / 20260928000010). IF NOT EXISTS so
-- the file is safe to re-run.
ALTER TABLE "public"."cart"
  ADD COLUMN IF NOT EXISTS "fulfillment_method" text;

ALTER TABLE "public"."order"
  ADD COLUMN IF NOT EXISTS "fulfillment_method" text;

-- 2. Backfill for total_paid on completed pay-in-store orders
UPDATE "public"."transaction" t
SET 
  payment_status = 'paid',
  total_paid = (
    SELECT COALESCE(SUM(oi.subtotal), 0)
    FROM "public"."order_item" oi
    WHERE oi.order_id = t.order_id
  ) + (
    SELECT COALESCE(SUM(oa.price), 0)
    FROM "public"."order_add_on" oa
    WHERE oa.order_id = t.order_id
  ) + COALESCE(o.delivery_fee, 0)
FROM "public"."order" o
WHERE o.order_id = t.order_id
  AND o.order_status = 'completed'
  AND t.total_paid = 0
  AND t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash');

-- 3. Add indexes for new filters to avoid full table scans
CREATE INDEX IF NOT EXISTS order_created_at_idx ON "public"."order" (created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_payment_method_idx ON "public"."transaction" (payment_method);


-- #############################################################################
-- Phase 8 — no fake 'self_pickup' default
-- (20260928000006_phase_8_fulfillment_default.sql)
-- #############################################################################

-- Drop default and nullify existing false defaults for fulfillment_method
--
-- The 'self_pickup' values being cleared here came from the column default
-- added in 20260928000003, not from any customer: nothing wrote the column
-- until checkout started asking (20260928000010). Once that migration has
-- run, 'self_pickup' is a real answer, so the clean-up only happens while its
-- CHECK constraint does not exist yet. Re-running this file later (a
-- `db push` after the live SQL was pasted by hand) must not erase choices.

ALTER TABLE "public"."cart"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

ALTER TABLE "public"."order"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_fulfillment_method_check'
  ) THEN
    UPDATE "public"."cart"
    SET fulfillment_method = NULL
    WHERE fulfillment_method = 'self_pickup';

    UPDATE "public"."order"
    SET fulfillment_method = NULL
    WHERE fulfillment_method = 'self_pickup';
  END IF;
END;
$$;


-- #############################################################################
-- Phase 10 — order.ready_at for pick-up timers
-- (20260928000007_phase_b_kds_payment.sql)
-- #############################################################################

-- Add ready_at to track when an order transitions to 'ready'
ALTER TABLE "public"."order"
  ADD COLUMN IF NOT EXISTS "ready_at" timestamp with time zone;

-- Backfill legacy orders currently stuck in 'ready'
UPDATE "public"."order"
SET ready_at = created_at + interval '15 minutes'
WHERE order_status = 'ready' AND ready_at IS NULL;


-- #############################################################################
-- Manager-only prices + product_price_log
-- (20260928000008_product_price_log.sql)
-- #############################################################################

-- Menu prices: manager-only, with a price history.
--
-- 1. `product_price_log` records every price a product has had: the starting
--    price when it is created, then one row per change, with who made it.
-- 2. Only a MANAGER may set or change `product_price`. Staff keep write access
--    to the rest of the menu (availability, names, photos) through the
--    existing `staff_write_product` policy; RLS cannot compare old and new
--    column values, so the price rule is a trigger.
--
-- Writes from outside a signed-in session (service role: seeds, migrations,
-- the SQL editor) have no auth.uid() and are not blocked.

-- ---------------------------------------------------------------------------
-- 1. Price history table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_price_log (
  log_id      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid          NOT NULL REFERENCES public.product (product_id) ON DELETE CASCADE,
  old_price   numeric(10,2),                      -- NULL for the starting price
  new_price   numeric(10,2) NOT NULL,
  changed_by  uuid,                               -- auth.uid(); NULL for service-role writes
  changed_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_price_log_product_idx
  ON public.product_price_log (product_id, changed_at DESC);

ALTER TABLE public.product_price_log ENABLE ROW LEVEL SECURITY;

-- Managers read the history. Nobody writes it directly: only the trigger
-- below (SECURITY DEFINER) inserts, and rows are never edited or removed.
DROP POLICY IF EXISTS "manager_read_price_log" ON public.product_price_log;
CREATE POLICY "manager_read_price_log" ON public.product_price_log
  FOR SELECT TO authenticated
  USING (public.current_employee_role() = 'MANAGER');

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_price_log FROM anon, authenticated;
GRANT SELECT ON public.product_price_log TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Only managers set prices
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_product_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- service role
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.product_price IS DISTINCT FROM OLD.product_price)
     AND coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Only a manager can set or change menu prices.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_product_price ON public.product;
CREATE TRIGGER trg_guard_product_price
  BEFORE INSERT OR UPDATE OF product_price ON public.product
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_price();

-- ---------------------------------------------------------------------------
-- 3. Log every price
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_product_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by)
    VALUES (NEW.product_id, NULL, NEW.product_price, auth.uid());
  ELSIF NEW.product_price IS DISTINCT FROM OLD.product_price THEN
    INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by)
    VALUES (NEW.product_id, OLD.product_price, NEW.product_price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_product_price ON public.product;
CREATE TRIGGER trg_log_product_price
  AFTER INSERT OR UPDATE OF product_price ON public.product
  FOR EACH ROW EXECUTE FUNCTION public.log_product_price();

REVOKE EXECUTE ON FUNCTION public.guard_product_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_product_price()   FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Seed the history with today's prices, so every product has a start
-- ---------------------------------------------------------------------------

INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by, changed_at)
SELECT p.product_id, NULL, p.product_price, NULL, now()
FROM public.product p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_price_log l WHERE l.product_id = p.product_id
);


-- #############################################################################
-- Report breakdowns (hour / weekday / payment / cancel reason) + daily cash remitted
-- (20260928000009_report_breakdowns_and_daily_cash.sql)
-- #############################################################################

-- Report breakdowns by hour of day and weekday, and cash remitted per day.
--
-- Every day and hour here is Manila time. A UTC cut-off puts a 7 AM order on
-- the previous day and the dinner rush at 11:00–13:00, which is no use to
-- anyone reading the report at the counter.
--
-- "Cash remitted" is money taken at the counter: completed pay-in-store
-- orders, dated by when they were completed (handed over and paid), falling
-- back to when they were placed for older rows without a completed_at.
--
-- The earlier functions from 20260928000005 are redefined with the same
-- signatures so their day boundaries match: the CSV puts them side by side.

-- ---------------------------------------------------------------------------
-- 1. Cash remitted, one row per day
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_cash_remitted_daily(start_date date, end_date date)
RETURNS TABLE (day date, total_orders bigint, cash_total numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    (coalesce(o.completed_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date AS day,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS cash_total
  FROM public.transaction t
  JOIN public."order" o ON o.order_id = t.order_id
  WHERE t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash')
    AND t.payment_status = 'paid'
    AND o.order_status = 'completed'
    AND (coalesce(o.completed_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date
        BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- The range total, now the sum of the daily rows.
CREATE OR REPLACE FUNCTION public.get_cash_remitted(start_date date, end_date date)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(SUM(d.cash_total), 0)
    FROM public.get_cash_remitted_daily(start_date, end_date) d
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Sales by hour of day (0–23) and by weekday (0 = Sunday … 6 = Saturday)
-- ---------------------------------------------------------------------------
-- Completed orders only, dated by when they were placed: this is about when
-- customers order, i.e. when the kitchen is busy.

CREATE OR REPLACE FUNCTION public.get_sales_by_hour(start_date date, end_date date)
RETURNS TABLE (hour integer, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    h.hour,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM generate_series(0, 23) AS h(hour)
  LEFT JOIN public."order" o
    ON o.order_status = 'completed'
   AND EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Manila')::integer = h.hour
   AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  LEFT JOIN public.transaction t ON t.order_id = o.order_id
  GROUP BY h.hour
  ORDER BY h.hour;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_weekday(start_date date, end_date date)
RETURNS TABLE (weekday integer, weekday_name text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    w.dow AS weekday,
    (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[w.dow + 1] AS weekday_name,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM generate_series(0, 6) AS w(dow)
  LEFT JOIN public."order" o
    ON o.order_status = 'completed'
   AND EXTRACT(DOW FROM o.created_at AT TIME ZONE 'Asia/Manila')::integer = w.dow
   AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  LEFT JOIN public.transaction t ON t.order_id = o.order_id
  GROUP BY w.dow
  ORDER BY w.dow;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Earlier breakdowns, same signatures, Manila days
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_payment_method_breakdown(start_date date, end_date date)
RETURNS TABLE (method text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    -- One label per kind of payment, however the row spelled it.
    CASE
      WHEN t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash') THEN 'Pay in store'
      WHEN t.payment_method IN ('paymongo', 'gcash', 'paymaya') THEN 'GCash / e-wallet'
      ELSE coalesce(t.payment_method, 'Unknown')
    END AS method,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM public."order" o
  JOIN public.transaction t ON t.order_id = o.order_id
  WHERE o.order_status = 'completed'
    AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 3 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellation_reason_breakdown(start_date date, end_date date)
RETURNS TABLE (reason text, total_orders bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(trim(o.cancellation_reason), ''), 'No reason provided') AS reason,
    COUNT(o.order_id) AS total_orders
  FROM public."order" o
  WHERE o.order_status = 'cancelled'
    AND (coalesce(o.cancelled_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date
        BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 2 DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grants: signed-in callers only; each function checks for MANAGER itself
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'get_cash_remitted_daily(date, date)',
    'get_cash_remitted(date, date)',
    'get_sales_by_hour(date, date)',
    'get_sales_by_weekday(date, date)',
    'get_payment_method_breakdown(date, date)',
    'get_cancellation_reason_breakdown(date, date)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END;
$$;


-- #############################################################################
-- Checkout stores SELF PICKUP / 3RD PARTY COURIER
-- (20260928000010_checkout_fulfillment_method.sql)
-- #############################################################################

-- Who collects the order: the customer, or a courier they booked.
--
-- `order.fulfillment_method` was added in 20260928000003 and its default
-- dropped in 20260928000006, but nothing ever wrote it, so every order was
-- NULL and the staff screens' 3RD PARTY COURIER / SELF PICKUP badge never
-- showed. The customer now picks at checkout and `submit_cart_to_order`
-- stores it.
--
--   self_pickup        the customer walks up to the counter
--   3rd_party_courier  a Lalamove / Grab / … rider collects on their behalf
--
-- Older orders stay NULL ("not specified" on the staff screens); guessing
-- would put a wrong label in front of the person handing the food over.

-- ---------------------------------------------------------------------------
-- 1. Allowed values
-- ---------------------------------------------------------------------------

-- Earlier experiments used other spellings ('unspecified', 'take_out', …).
-- None of them came from a customer's choice, so they become "not specified"
-- rather than stopping the constraint from being added.
UPDATE public."order"
SET fulfillment_method = NULL
WHERE fulfillment_method IS NOT NULL
  AND fulfillment_method NOT IN ('self_pickup', '3rd_party_courier');

ALTER TABLE public."order"
  DROP CONSTRAINT IF EXISTS order_fulfillment_method_check;
ALTER TABLE public."order"
  ADD CONSTRAINT order_fulfillment_method_check
  CHECK (fulfillment_method IS NULL OR fulfillment_method IN ('self_pickup', '3rd_party_courier'));

-- ---------------------------------------------------------------------------
-- 2. submit_cart_to_order takes the choice
-- ---------------------------------------------------------------------------
-- A fifth parameter makes a new overload, and a call naming only the first
-- four would then match both. The old signature is dropped so there is one.
-- The body is 20260927000001's, plus the new column.

DROP FUNCTION IF EXISTS public.submit_cart_to_order(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_cart_to_order(
  p_cart_id              uuid,
  p_order_type           text DEFAULT 'take_out',
  p_special_instructions text DEFAULT NULL,
  p_payment_method       text DEFAULT 'pay-in-store',
  p_fulfillment_method   text DEFAULT 'self_pickup'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid           uuid := auth.uid();
  v_cart          public.cart%ROWTYPE;
  v_disabled      boolean;
  v_unavailable   text;
  v_order_id      uuid;
  v_order_status  text;
  v_txn_method    text;
  v_instructions  text := nullif(btrim(coalesce(p_special_instructions, '')), '');
  v_line          record;
  v_order_item_id uuid;
  v_subtotal      numeric(10,2);
  v_now           timestamptz := now();
BEGIN
  -- Who is asking ----------------------------------------------------------
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.' USING HINT = 'UNAUTHORIZED';
  END IF;

  SELECT coalesce(c.is_account_disabled, false)
  INTO v_disabled
  FROM public.customer c
  WHERE c.customer_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You are not registered as a customer.' USING HINT = 'FORBIDDEN';
  END IF;
  IF v_disabled THEN
    RAISE EXCEPTION 'Your account has been disabled. Please contact the store.'
      USING HINT = 'ACCOUNT_DISABLED';
  END IF;

  -- What they asked for ----------------------------------------------------
  IF p_order_type IS NULL OR p_order_type NOT IN ('take_out', 'dine_in') THEN
    RAISE EXCEPTION 'We only take pickup orders.' USING HINT = 'INVALID_ORDER_TYPE';
  END IF;

  IF p_payment_method IS NULL OR p_payment_method NOT IN ('wallet', 'pay-in-store') THEN
    RAISE EXCEPTION 'Choose GCash / Maya or pay in store.' USING HINT = 'INVALID_PAYMENT_METHOD';
  END IF;

  IF p_fulfillment_method IS NULL OR p_fulfillment_method NOT IN ('self_pickup', '3rd_party_courier') THEN
    RAISE EXCEPTION 'Tell us who is picking up the order.' USING HINT = 'INVALID_INPUT';
  END IF;

  IF v_instructions IS NOT NULL AND length(v_instructions) > 500 THEN
    RAISE EXCEPTION 'Special instructions cannot exceed 500 characters.'
      USING HINT = 'INVALID_INPUT';
  END IF;

  -- Lock the cart for the rest of the transaction --------------------------
  -- A second call for the same cart waits here until this one commits, then
  -- sees is_final = true and stops. That is the double-submit fix.
  SELECT * INTO v_cart
  FROM public.cart
  WHERE cart_id = p_cart_id
  FOR UPDATE;

  -- Someone else's cart reads as not found, so ids cannot be probed.
  IF NOT FOUND OR v_cart.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Cart not found.' USING HINT = 'NOT_FOUND';
  END IF;

  IF v_cart.is_final THEN
    RAISE EXCEPTION 'Cart is already submitted and locked.' USING HINT = 'CART_LOCKED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_item WHERE cart_id = p_cart_id) THEN
    RAISE EXCEPTION 'Cannot submit an empty cart.' USING HINT = 'EMPTY_CART';
  END IF;

  -- Everything in the cart must still be on sale. A line whose product was
  -- deleted, archived or switched off since it was added is named, so the
  -- customer knows what to remove.
  SELECT string_agg(DISTINCT coalesce(p.product_name, 'An item that was removed from the menu'), ', ')
  INTO v_unavailable
  FROM public.cart_item ci
  LEFT JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id
    AND (p.product_id IS NULL OR p.archived_at IS NOT NULL OR p.is_available IS FALSE);

  IF v_unavailable IS NOT NULL THEN
    RAISE EXCEPTION 'No longer available: %. Remove it from your cart to continue.', v_unavailable
      USING HINT = 'ITEM_UNAVAILABLE';
  END IF;

  -- A wallet order waits for PayMongo's webhook before the kitchen sees it;
  -- paying at the counter is collected later by design (issue #106).
  v_order_status := CASE WHEN p_payment_method = 'wallet' THEN 'awaiting_payment' ELSE 'pending' END;
  v_txn_method   := CASE WHEN p_payment_method = 'wallet' THEN 'paymongo'         ELSE 'pay_in_store' END;

  -- Write ------------------------------------------------------------------
  INSERT INTO public."order" (
    customer_id, cart_id, order_status, order_type,
    special_instructions, delivery_fee, delivery_address, created_at,
    fulfillment_method
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
    v_instructions, 0, NULL, v_now,
    p_fulfillment_method
  )
  RETURNING order_id INTO v_order_id;

  -- Lines are priced here, from the menu, never from anything the browser
  -- sent. unit_price includes the line's add-ons; subtotal is unit × qty —
  -- the same figures the cart showed.
  FOR v_line IN
    SELECT
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      ci.special_instructions,
      p.product_name,
      p.product_price
        + coalesce((
            SELECT sum(a.price)
            FROM public.cart_item_add_on cia
            JOIN public.add_on a ON a.addon_id = cia.addon_id
            WHERE cia.cart_item_id = ci.cart_item_id
          ), 0) AS unit_price
    FROM public.cart_item ci
    JOIN public.product p ON p.product_id = ci.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    INSERT INTO public.order_item (
      order_id, product_id, quantity, subtotal,
      special_instructions, product_name, unit_price
    )
    VALUES (
      v_order_id, v_line.product_id, v_line.quantity,
      v_line.unit_price * v_line.quantity,
      v_line.special_instructions, v_line.product_name, v_line.unit_price
    )
    RETURNING order_item_id INTO v_order_item_id;

    INSERT INTO public.order_item_add_on (order_item_id, addon_id)
    SELECT v_order_item_id, cia.addon_id
    FROM public.cart_item_add_on cia
    JOIN public.add_on a ON a.addon_id = cia.addon_id
    WHERE cia.cart_item_id = v_line.cart_item_id;
  END LOOP;

  -- Order-level add-ons (rice, drinks …), priced from add_on now.
  INSERT INTO public.order_add_on (order_id, addon_id, price)
  SELECT v_order_id, ca.addon_id, a.price
  FROM public.cart_add_on ca
  JOIN public.add_on a ON a.addon_id = ca.addon_id
  WHERE ca.cart_id = p_cart_id;

  SELECT
    coalesce((SELECT sum(subtotal) FROM public.order_item   WHERE order_id = v_order_id), 0)
  + coalesce((SELECT sum(price)    FROM public.order_add_on WHERE order_id = v_order_id), 0)
  INTO v_subtotal;

  -- The payment row every order needs: `create-payment-intent` reuses it for
  -- a wallet order, and the counter marks it paid for pay-in-store.
  INSERT INTO public.transaction (
    order_id, payment_method, payment_status,
    subtotal, tax_amount, discount_amount, total_paid, transaction_date
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_subtotal, 0, 0, 0, v_now
  );

  UPDATE public.cart
  SET is_final     = true,
      status       = 'submitted',
      order_id     = v_order_id,
      submitted_at = v_now,
      updated_at   = v_now
  WHERE cart_id = p_cart_id;

  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_status', v_order_status,
    'cart_id',      p_cart_id,
    'is_final',     true
  );
END;
$$;

COMMENT ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, text) IS
  'Places the caller''s cart as a pickup order in one transaction. The only way a customer can create an order.';

REVOKE ALL ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, text) TO authenticated;

-- PostgREST caches function signatures; tell it the old one is gone.
NOTIFY pgrst, 'reload schema';


-- #############################################################################
-- Customer list stats: search parameter + manager guard fix
-- (20260928000011_customer_stats_search_and_guard.sql)
-- #############################################################################

-- get_customer_stats: search inside the function, and a manager check that
-- actually refuses non-employees.
--
-- 1. The guard in 20260928000004 was
--      IF public.current_employee_role() != 'MANAGER' THEN RAISE ...
--    For a signed-in customer the role is NULL, `NULL != 'MANAGER'` is NULL,
--    and the IF does not fire — so any customer could call the function over
--    the REST API and read every customer's name, email and phone number.
--    It is now `coalesce(..., '') <> 'MANAGER'`.
--
-- 2. The Customers page searched by building a PostgREST `.or()` filter out
--    of the search box text. That string is filter syntax, not a value: a
--    comma or bracket typed into the box broke the query, and a crafted one
--    could add conditions of its own. The search is now a parameter, matched
--    here as a plain value (with LIKE wildcards escaped).

DROP FUNCTION IF EXISTS public.get_customer_stats();

CREATE OR REPLACE FUNCTION public.get_customer_stats(p_search text DEFAULT NULL)
RETURNS TABLE (
  customer_id uuid,
  name text,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  "profileImage_URL" text,
  date_of_birth date,
  created_at timestamptz,
  total_orders bigint,
  total_spent numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pattern text;
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF nullif(btrim(coalesce(p_search, '')), '') IS NOT NULL THEN
    v_pattern := '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    c.customer_id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone_number,
    c."profileImage_URL",
    c.date_of_birth,
    u.created_at,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_spent
  FROM public.customer c
  LEFT JOIN auth.users u ON u.id = c.customer_id
  LEFT JOIN public."order" o ON o.customer_id = c.customer_id AND o.order_status = 'completed'
  LEFT JOIN public.transaction t ON t.order_id = o.order_id AND t.payment_status = 'paid'
  WHERE v_pattern IS NULL
     OR c.name ILIKE v_pattern
     OR c.email ILIKE v_pattern
     OR c.phone_number ILIKE v_pattern
  GROUP BY c.customer_id, u.created_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats(text) TO authenticated;

NOTIFY pgrst, 'reload schema';


-- #############################################################################
-- Realtime: the KDS chime and live refresh listen for changes on "order".
-- (Added in 20260928000000; repeated here in case that never reached live.)
-- #############################################################################
DO $realtime$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."order";
  END IF;
END;
$realtime$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- VERIFICATION — this is the grid you see after Run. Every row should be PASS.
-- =============================================================================
SELECT n AS "#", check_name AS "check", CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS status, detail
FROM (VALUES
  (1, 'order.fulfillment_method column',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order' AND column_name='fulfillment_method'),
      'Holds SELF PICKUP / 3RD PARTY COURIER'),
  (2, 'order.fulfillment_method has no default',
      NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order' AND column_name='fulfillment_method' AND column_default IS NOT NULL),
      'A default would answer for customers who were never asked'),
  (3, 'fulfillment CHECK constraint',
      EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_fulfillment_method_check'),
      'Only NULL, self_pickup, 3rd_party_courier'),
  (4, 'order.ready_at column',
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order' AND column_name='ready_at'),
      'Pick-up timers on the KDS'),
  (5, 'product_price_log table with RLS',
      EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace s ON s.oid=c.relnamespace WHERE s.nspname='public' AND c.relname='product_price_log' AND c.relrowsecurity),
      'Managers read it; only the trigger writes'),
  (6, 'price guard trigger',
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_guard_product_price' AND NOT tgisinternal),
      'Staff cannot set or change product_price'),
  (7, 'price log trigger',
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_log_product_price' AND NOT tgisinternal),
      'Every price change is recorded'),
  (8, 'every product has a starting price in the log',
      NOT EXISTS (SELECT 1 FROM public.product p WHERE NOT EXISTS (SELECT 1 FROM public.product_price_log l WHERE l.product_id=p.product_id)),
      (SELECT count(*) || ' log rows for ' || (SELECT count(*) FROM public.product) || ' products' FROM public.product_price_log)),
  (9, 'report functions present',
      to_regprocedure('public.get_cash_remitted_daily(date,date)') IS NOT NULL
      AND to_regprocedure('public.get_sales_by_hour(date,date)') IS NOT NULL
      AND to_regprocedure('public.get_sales_by_weekday(date,date)') IS NOT NULL
      AND to_regprocedure('public.get_cash_remitted(date,date)') IS NOT NULL
      AND to_regprocedure('public.get_payment_method_breakdown(date,date)') IS NOT NULL
      AND to_regprocedure('public.get_cancellation_reason_breakdown(date,date)') IS NOT NULL,
      'Daily cash, hour, weekday, payment method, cancel reason, cash total'),
  (10, 'report functions use Manila time',
      (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('public.get_payment_method_breakdown(date,date)')) LIKE '%Asia/Manila%',
      'Old UTC versions from 20260928000005 were replaced'),
  (11, 'exactly one submit_cart_to_order, with p_fulfillment_method',
      (SELECT count(*) FROM pg_proc WHERE proname='submit_cart_to_order' AND pronamespace='public'::regnamespace) = 1
      AND to_regprocedure('public.submit_cart_to_order(uuid,text,text,text,text)') IS NOT NULL,
      'Old 4-argument version dropped'),
  (12, 'get_customer_stats(p_search) and no old no-arg version',
      to_regprocedure('public.get_customer_stats(text)') IS NOT NULL
      AND to_regprocedure('public.get_customer_stats()') IS NULL,
      'Search runs in SQL, not in a PostgREST filter string'),
  (13, 'get_customer_stats refuses non-managers',
      (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('public.get_customer_stats(text)')) LIKE '%coalesce(public.current_employee_role(), '''') <> ''MANAGER''%',
      'The old check let signed-in customers read every customer'),
  (14, 'order is in the realtime publication',
      EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order'),
      'KDS chime + live refresh'),
  (15, 'no order has an invalid fulfillment_method',
      NOT EXISTS (SELECT 1 FROM public."order" WHERE fulfillment_method IS NOT NULL AND fulfillment_method NOT IN ('self_pickup','3rd_party_courier')),
      (SELECT count(*) FILTER (WHERE fulfillment_method IS NULL) || ' not specified, '
            || count(*) FILTER (WHERE fulfillment_method='self_pickup') || ' self pickup, '
            || count(*) FILTER (WHERE fulfillment_method='3rd_party_courier') || ' courier' FROM public."order"))
) AS checks(n, check_name, ok, detail)
ORDER BY n;
