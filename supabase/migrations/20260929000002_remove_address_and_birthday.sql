-- No addresses and no birthdays.
--
-- The shop is pickup-only with no integrated delivery service, so there is
-- nothing to deliver to; and there is no birthday promotion, so there is no
-- reason to hold anyone's date of birth. Personal data with no purpose is a
-- liability (Data Privacy Act: proportionality), so it goes, from the
-- database as well as the screens.
--
-- Removed, with the data in them:
--   * `customer_address` (every saved address) and its access rules
--   * `customer.date_of_birth`, `employee.date_of_birth`
--   * `order.delivery_address` (legacy delivery orders from before #114)
--
-- Two functions read those columns and are rebuilt without them:
--   * `submit_cart_to_order` wrote `delivery_address = NULL` on every order.
--     20260928000005's function, with only that column taken out.
--   * `get_customer_stats` (#117, created on the live project) returned
--     `date_of_birth`. Same function without it; its return type changes, so
--     it is dropped and recreated, and its grants are restored.
--
-- `audit_employee_write` still lists `date_of_birth` / `delivery_address` in
-- its personal-data mask. They are only names there, so nothing breaks; they
-- simply never match any more.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Functions that read the columns, rebuilt first
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_cart_to_order(
  p_cart_id              uuid,
  p_order_type           text  DEFAULT 'take_out',
  p_special_instructions text  DEFAULT NULL,
  p_payment_method       text  DEFAULT 'pay-in-store',
  p_expected_prices      jsonb DEFAULT NULL,
  p_discount             jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  -- Issue #115
  v_store         jsonb;
  v_item_count    integer;
  v_price_changes text;
  -- Issue #116
  v_ahead         integer;
  v_promised_at   timestamptz;
  -- Issue #116, ticket 03
  v_discount_type text;
  v_discount_id   text;
  v_name_on_id    text;
  v_photo_path    text;
  v_txn_subtotal  numeric(10,2);
  v_tax           numeric(10,2);
  v_discount      numeric(10,2);
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

  -- #116: the wallet itself (gcash / paymaya) is accepted and recorded.
  IF p_payment_method IS NULL
     OR p_payment_method NOT IN ('gcash', 'paymaya', 'wallet', 'pay-in-store') THEN
    RAISE EXCEPTION 'Choose GCash / Maya or pay in store.' USING HINT = 'INVALID_PAYMENT_METHOD';
  END IF;

  IF v_instructions IS NOT NULL AND length(v_instructions) > 500 THEN
    RAISE EXCEPTION 'Special instructions cannot exceed 500 characters.'
      USING HINT = 'INVALID_INPUT';
  END IF;

  IF p_expected_prices IS NOT NULL AND jsonb_typeof(p_expected_prices) <> 'object' THEN
    RAISE EXCEPTION 'Invalid price check.' USING HINT = 'INVALID_INPUT';
  END IF;

  -- Senior Citizen / PWD discount (#116 ticket 03). One ID per order. -----
  IF p_discount IS NOT NULL AND jsonb_typeof(p_discount) <> 'null' THEN
    IF jsonb_typeof(p_discount) <> 'object' THEN
      RAISE EXCEPTION 'Invalid discount.' USING HINT = 'INVALID_DISCOUNT';
    END IF;

    v_discount_type := p_discount->>'type';
    v_discount_id   := nullif(btrim(coalesce(p_discount->>'id_number', '')), '');
    v_name_on_id    := nullif(btrim(coalesce(p_discount->>'name_on_id', '')), '');
    v_photo_path    := p_discount->>'photo_path';

    IF v_discount_type IS NULL OR v_discount_type NOT IN ('senior_citizen', 'pwd') THEN
      RAISE EXCEPTION 'Choose Senior Citizen or PWD.' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    IF v_discount_id IS NULL OR length(v_discount_id) > 40 THEN
      RAISE EXCEPTION 'Enter the ID number (up to 40 characters).' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    IF v_name_on_id IS NULL OR length(v_name_on_id) > 100 THEN
      RAISE EXCEPTION 'Enter the name on the ID (up to 100 characters).' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    -- The photo must be one this customer uploaded, into their own folder
    -- of the private bucket, and not one already used on another order.
    IF v_photo_path IS NULL
       OR v_photo_path !~ ('^' || v_uid::text || '/[^/]+$')
       OR NOT EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = 'senior-pwd-ids' AND o.name = v_photo_path)
       OR EXISTS (
            SELECT 1 FROM public.transaction t
            WHERE t.discount_id_photo_path = v_photo_path) THEN
      RAISE EXCEPTION 'Add a photo of the ID.' USING HINT = 'INVALID_DISCOUNT';
    END IF;
  END IF;

  -- Is the shop taking orders? (issue #115) --------------------------------
  -- Closed is reported before paused, and paused before busy: at 9pm "we
  -- open at 8" is the useful answer, not "very busy".
  v_store := public.get_store_status();

  IF NOT (v_store->>'is_open')::boolean THEN
    RAISE EXCEPTION 'We''re closed right now. We open at %.',
      to_char(make_time((v_store->>'open_hour')::integer, 0, 0), 'FMHH12:MI AM')
      USING HINT = 'STORE_CLOSED';
  END IF;

  IF (v_store->>'is_paused')::boolean THEN
    RAISE EXCEPTION 'We''re very busy right now. Please try again in a few minutes.'
      USING HINT = 'STORE_PAUSED';
  END IF;

  IF (v_store->>'is_busy')::boolean THEN
    RAISE EXCEPTION 'We''re very busy right now. Please try again in a few minutes.'
      USING HINT = 'STORE_BUSY';
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

  -- Bulk-order cap (issue #115) --------------------------------------------
  SELECT coalesce(sum(ci.quantity), 0)
  INTO v_item_count
  FROM public.cart_item ci
  WHERE ci.cart_id = p_cart_id;

  IF v_item_count > 30 THEN
    RAISE EXCEPTION 'That''s a big order! Please contact us for a bulk order or catering.'
      USING HINT = 'ORDER_TOO_LARGE';
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

  -- Prices changed since the customer looked? (issue #115) -----------------
  -- Every line is priced from the menu below regardless; this only stops the
  -- order being placed at a price the customer never saw. Nothing is
  -- written, so they can review the cart and try again.
  IF p_expected_prices IS NOT NULL THEN
    SELECT string_agg(
             format('%s ₱%s → ₱%s',
                    live.product_name,
                    to_char(live.expected, 'FM999,999,990.00'),
                    to_char(live.unit_price, 'FM999,999,990.00')),
             ', ' ORDER BY live.product_name)
    INTO v_price_changes
    FROM (
      SELECT
        p.product_name,
        (p_expected_prices->>ci.cart_item_id::text)::numeric AS expected,
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
        AND jsonb_typeof(p_expected_prices->ci.cart_item_id::text) = 'number'
    ) AS live
    WHERE abs(live.unit_price - live.expected) >= 0.005;

    IF v_price_changes IS NOT NULL THEN
      RAISE EXCEPTION 'Prices changed: %. Please review your cart.', v_price_changes
        USING HINT = 'PRICE_CHANGED';
    END IF;
  END IF;

  -- A wallet order waits for PayMongo's webhook before the kitchen sees it;
  -- paying at the counter is collected later by design (issue #106).
  v_order_status := CASE WHEN p_payment_method = 'pay-in-store' THEN 'pending' ELSE 'awaiting_payment' END;
  -- #116: record the wallet; `wallet` from an older client stays `paymongo`.
  v_txn_method   := CASE p_payment_method
                      WHEN 'pay-in-store' THEN 'pay_in_store'
                      WHEN 'wallet'       THEN 'paymongo'
                      ELSE p_payment_method
                    END;

  -- #116: the promise. Mirrors ACTIVE_KITCHEN_STATUSES in
  -- lib/orders/kitchen-queue.ts. Worked out here, not passed in, so a
  -- customer cannot promise themselves a time.
  SELECT count(*) INTO v_ahead
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'confirmed', 'preparing');

  v_promised_at := v_now + make_interval(mins => least(60, 15 + 3 * v_ahead) + 5);

  -- Write ------------------------------------------------------------------
  INSERT INTO public."order" (
    customer_id, cart_id, order_status, order_type,
    special_instructions, delivery_fee, created_at, promised_at
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
    v_instructions, 0, v_now, v_promised_at
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
  -- Amount due is always subtotal - discount_amount. Same rounding as
  -- vatBreakdown() / seniorPwdBreakdown() in lib/menu/cart-totals.ts.
  IF v_discount_type IS NULL THEN
    -- #116: tax_amount is the 12% VAT already inside the price.
    v_txn_subtotal := v_subtotal;
    v_tax          := round(v_subtotal * 12 / 112, 2);
    v_discount     := 0;
  ELSE
    -- #116 ticket 03: VAT-exempt, then 20% off what is left.
    -- ₱112 → ₱100 VAT-exempt sales, ₱20 discount, ₱80 due.
    v_txn_subtotal := round(v_subtotal * 100 / 112, 2);
    v_tax          := 0;
    v_discount     := round(v_txn_subtotal * 20 / 100, 2);
  END IF;

  INSERT INTO public.transaction (
    order_id, payment_method, payment_status,
    subtotal, tax_amount, discount_amount, total_paid, transaction_date,
    discount_type, discount_id_number, name_on_id, discount_id_photo_path
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_txn_subtotal, v_tax, v_discount, 0, v_now,
    v_discount_type, v_discount_id, v_name_on_id, v_photo_path
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
$function$;


REVOKE ALL ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb) TO authenticated;

DROP FUNCTION IF EXISTS public.get_customer_stats();

CREATE FUNCTION public.get_customer_stats()
RETURNS TABLE(
  customer_id uuid,
  name text,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  "profileImage_URL" text,
  created_at timestamp with time zone,
  total_orders bigint,
  total_spent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  IF public.current_employee_role() IS DISTINCT FROM 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
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
    u.created_at,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_spent
  FROM public.customer c
  LEFT JOIN auth.users u ON u.id = c.customer_id
  LEFT JOIN public."order" o ON o.customer_id = c.customer_id AND o.order_status = 'completed'
  LEFT JOIN public.transaction t ON t.order_id = o.order_id AND t.payment_status = 'paid'
  GROUP BY c.customer_id, u.created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_customer_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The data
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.customer_address;

ALTER TABLE public.customer DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE public.employee DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE public."order"  DROP COLUMN IF EXISTS delivery_address;

NOTIFY pgrst, 'reload schema';
