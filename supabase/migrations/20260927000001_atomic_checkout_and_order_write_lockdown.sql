-- Issue #114 (limitations #15 and #21): one atomic way to place an order,
-- and no other way for a customer to write one.
--
-- Before this, `submitCart` tried a `submit_cart_to_order` function that no
-- migration ever created, so every order went through its fallback: check
-- `cart.is_final`, insert the order, insert the lines, and only then mark
-- the cart final — five separate requests. Two quick taps on "Place order"
-- (or two tabs) made two orders from one cart, and a failure between the
-- inserts left an order with no lines.
--
-- Worse, that fallback only worked because customers held INSERT policies on
-- `order`, `order_item`, `order_add_on` and `order_item_add_on` that checked
-- nothing but ownership. The anon key and the customer's token are both in
-- the browser, so anyone could skip the app and write an order that was
-- already `preparing`, with ₱1 prices, straight into the kitchen queue.
--
-- Now:
--   * `submit_cart_to_order` does the whole checkout in one transaction,
--     with the cart row locked (`SELECT … FOR UPDATE`) for its duration, and
--     prices every line from `product` / `add_on` itself.
--   * `order.cart_id` records which cart an order came from, and a unique
--     index on it makes a second order from the same cart impossible even if
--     the lock were somehow bypassed.
--   * The customer INSERT policies are dropped, so the function is the only
--     way a customer's order is written.
--   * `customer_cancel_own_orders` can only move status to `cancelled` and
--     fill the cancellation fields — a trigger refuses any other column.

-- ---------------------------------------------------------------------------
-- 1. order.cart_id, backfilled, unique
-- ---------------------------------------------------------------------------

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS cart_id uuid
  REFERENCES public.cart(cart_id) ON DELETE SET NULL;

COMMENT ON COLUMN public."order".cart_id IS
  'The cart this order was placed from. Unique: one cart can produce at most one order.';

-- Existing orders: the link was only recorded the other way round, on
-- cart.order_id. Checked live before writing this: no order_id appears on
-- more than one cart, so the unique index below cannot fail on old data.
UPDATE public."order" o
SET cart_id = c.cart_id
FROM public.cart c
WHERE c.order_id = o.order_id
  AND o.cart_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS order_cart_id_key
  ON public."order" (cart_id);

-- ---------------------------------------------------------------------------
-- 2. submit_cart_to_order
-- ---------------------------------------------------------------------------

-- Errors are raised with a HINT carrying a stable code (CART_LOCKED,
-- ACCOUNT_DISABLED, …). PostgREST passes `hint` through to supabase-js, and
-- `lib/actions/cart.ts` maps it onto the ActionResult `code` the UI already
-- understands. The message itself is written to be shown to the customer.
--
-- Pickup-only: `p_order_type` is `take_out` or `dine_in`, there is no
-- delivery fee or address, and the payment method is the wallet or paying at
-- the counter.

CREATE OR REPLACE FUNCTION public.submit_cart_to_order(
  p_cart_id              uuid,
  p_order_type           text DEFAULT 'take_out',
  p_special_instructions text DEFAULT NULL,
  p_payment_method       text DEFAULT 'pay-in-store'
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
    special_instructions, delivery_fee, delivery_address, created_at
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
    v_instructions, 0, NULL, v_now
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

COMMENT ON FUNCTION public.submit_cart_to_order(uuid, text, text, text) IS
  'Places the caller''s cart as a pickup order in one transaction. The only way a customer can create an order.';

REVOKE ALL ON FUNCTION public.submit_cart_to_order(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart_to_order(uuid, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. No direct customer writes to order tables
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "customer_insert_own_orders"             ON public."order";
DROP POLICY IF EXISTS "customer_insert_own_order_items"        ON public.order_item;
DROP POLICY IF EXISTS "customer_insert_own_order_add_on"       ON public.order_add_on;
DROP POLICY IF EXISTS "customer_insert_own_order_item_add_on"  ON public.order_item_add_on;

-- ---------------------------------------------------------------------------
-- 4. customer_cancel_own_orders: status and cancellation fields only
-- ---------------------------------------------------------------------------

-- The policy says which rows (your own, still `pending`) and what they may
-- become (`cancelled`). RLS cannot say which *columns* change, and column
-- grants are no use here because staff update `order` through the same
-- `authenticated` role. So a trigger does it: for a caller who is not staff,
-- everything except the three cancellation columns must be unchanged.
DROP POLICY IF EXISTS "customer_cancel_own_orders" ON public."order";
CREATE POLICY "customer_cancel_own_orders" ON public."order"
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() AND order_status = 'pending')
  WITH CHECK (customer_id = auth.uid() AND order_status = 'cancelled');

CREATE OR REPLACE FUNCTION public.guard_customer_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (webhooks, server actions using the admin client) has no
  -- auth.uid(); staff are governed by their own policy. Only a signed-in
  -- non-employee is restricted here.
  IF auth.uid() IS NULL OR public.current_employee_role() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - ARRAY['order_status', 'cancelled_at', 'cancellation_reason'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['order_status', 'cancelled_at', 'cancellation_reason'])
  THEN
    RAISE EXCEPTION 'Customers can only cancel an order, not change it.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_customer_order_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_customer_order_update ON public."order";
CREATE TRIGGER trg_guard_customer_order_update
  BEFORE UPDATE ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_order_update();

NOTIFY pgrst, 'reload schema';
