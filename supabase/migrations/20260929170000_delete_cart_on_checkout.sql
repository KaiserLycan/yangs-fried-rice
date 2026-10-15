-- One cart per customer, deleted at checkout.
--
-- Until now checkout kept the cart row (is_final = true) next to the order, so
-- a customer collected one finished cart per order. The order already holds
-- everything it needs (order_item with name, price and notes, order_item_add_on,
-- order_add_on, totals), so checkout now deletes the cart instead and a
-- customer has at most one cart: the one they are filling.
--
-- Removed: cart.is_final, cart.status, cart.submitted_at, cart.order_id and
-- order.cart_id. They only existed to link a finished cart to its order.

-- 1. Finished carts are redundant. Items and add-ons cascade.
DELETE FROM public.cart WHERE is_final;

-- 2. Policies and the unique index that mention is_final.
DROP POLICY IF EXISTS "customer_delete_own_cart_add_on" ON public.cart_add_on;
DROP POLICY IF EXISTS "customer_delete_own_cart_item_add_on" ON public.cart_item_add_on;
DROP POLICY IF EXISTS "customer_delete_own_cart_items" ON public.cart_item;
DROP POLICY IF EXISTS "customer_insert_own_cart_add_on" ON public.cart_add_on;
DROP POLICY IF EXISTS "customer_insert_own_cart_item_add_on" ON public.cart_item_add_on;
DROP POLICY IF EXISTS "customer_insert_own_cart_items" ON public.cart_item;
DROP POLICY IF EXISTS "customer_update_own_cart" ON public.cart;
DROP POLICY IF EXISTS "customer_update_own_cart_items" ON public.cart_item;
DROP INDEX IF EXISTS public.one_active_cart_per_customer;

-- 3. Columns.
ALTER TABLE public."order" DROP COLUMN cart_id;
ALTER TABLE public.cart
  DROP COLUMN is_final,
  DROP COLUMN status,
  DROP COLUMN submitted_at,
  DROP COLUMN order_id;

-- 4. One cart per customer, for every cart that exists.
CREATE UNIQUE INDEX one_cart_per_customer ON public.cart USING btree (customer_id);

-- 5. The same policies, without the is_final test.
CREATE POLICY "customer_delete_own_cart_add_on" ON public.cart_add_on FOR DELETE TO authenticated
  USING (cart_id IN (SELECT cart.cart_id FROM public.cart WHERE cart.customer_id = auth.uid()));
CREATE POLICY "customer_delete_own_cart_item_add_on" ON public.cart_item_add_on FOR DELETE TO authenticated
  USING (cart_item_id IN (SELECT ci.cart_item_id FROM public.cart_item ci
    JOIN public.cart c ON c.cart_id = ci.cart_id WHERE c.customer_id = auth.uid()));
CREATE POLICY "customer_delete_own_cart_items" ON public.cart_item FOR DELETE TO authenticated
  USING (cart_id IN (SELECT cart.cart_id FROM public.cart WHERE cart.customer_id = auth.uid()));
CREATE POLICY "customer_insert_own_cart_add_on" ON public.cart_add_on FOR INSERT TO authenticated
  WITH CHECK (cart_id IN (SELECT cart.cart_id FROM public.cart WHERE cart.customer_id = auth.uid()));
CREATE POLICY "customer_insert_own_cart_item_add_on" ON public.cart_item_add_on FOR INSERT TO authenticated
  WITH CHECK (cart_item_id IN (SELECT ci.cart_item_id FROM public.cart_item ci
    JOIN public.cart c ON c.cart_id = ci.cart_id WHERE c.customer_id = auth.uid()));
CREATE POLICY "customer_insert_own_cart_items" ON public.cart_item FOR INSERT TO authenticated
  WITH CHECK (cart_id IN (SELECT cart.cart_id FROM public.cart WHERE cart.customer_id = auth.uid()));
CREATE POLICY "customer_update_own_cart" ON public.cart FOR UPDATE TO authenticated
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());
CREATE POLICY "customer_update_own_cart_items" ON public.cart_item FOR UPDATE TO authenticated
  USING (cart_id IN (SELECT cart.cart_id FROM public.cart WHERE cart.customer_id = auth.uid()));

-- 6. promo_quote no longer has a finished cart to refuse.
CREATE OR REPLACE FUNCTION public.promo_quote(p_cart_id uuid, p_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_cart public.cart%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.' USING HINT = 'UNAUTHORIZED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customer WHERE customer_id = v_uid) THEN
    RAISE EXCEPTION 'You are not registered as a customer.' USING HINT = 'FORBIDDEN';
  END IF;

  SELECT * INTO v_cart FROM public.cart WHERE cart_id = p_cart_id;
  IF NOT FOUND OR v_cart.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Cart not found.' USING HINT = 'NOT_FOUND';
  END IF;

  RETURN public.promo_code_discount(p_cart_id, p_code, v_uid, false);
END;
$$;

-- 7. submit_cart_to_order: deletes the cart once the order is written.
CREATE OR REPLACE FUNCTION public.submit_cart_to_order(p_cart_id uuid, p_order_type text DEFAULT 'take_out'::text, p_special_instructions text DEFAULT NULL::text, p_payment_method text DEFAULT 'pay-in-store'::text, p_expected_prices jsonb DEFAULT NULL::jsonb, p_discount jsonb DEFAULT NULL::jsonb, p_fulfillment_method text DEFAULT 'self_pickup'::text, p_tip numeric DEFAULT 0, p_cash_tendered numeric DEFAULT NULL::numeric, p_promo_code text DEFAULT NULL::text, p_expected_promo_discount numeric DEFAULT NULL::numeric) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
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
  -- FINALE: business rules
  v_cart_total    numeric(10,2);
  v_due           numeric(10,2);
  v_tip           numeric(10,2) := round(coalesce(p_tip, 0), 2);
  v_tendered      numeric(10,2) := round(p_cash_tendered, 2);
  v_strikes       integer;
  v_paid_cash     integer;
  v_last_order    time;
  v_max_prep      integer;
  v_extra_prep    integer;
  -- Promo codes
  v_promo_code     text := nullif(upper(btrim(coalesce(p_promo_code, ''))), '');
  v_promo          jsonb;
  v_promo_id       uuid;
  v_promo_discount numeric(10,2) := 0;
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

  IF p_fulfillment_method IS NULL OR p_fulfillment_method NOT IN ('self_pickup', '3rd_party_courier') THEN
    RAISE EXCEPTION 'Tell us who is picking up the order.' USING HINT = 'INVALID_INPUT';
  END IF;

  IF v_instructions IS NOT NULL AND length(v_instructions) > 500 THEN
    RAISE EXCEPTION 'Special instructions cannot exceed 500 characters.'
      USING HINT = 'INVALID_INPUT';
  END IF;

  IF v_tip < 0 OR v_tip > 5000 THEN
    RAISE EXCEPTION 'A tip can be from ₱0 to ₱5,000.' USING HINT = 'INVALID_INPUT';
  END IF;

  IF v_tendered IS NOT NULL AND p_payment_method <> 'pay-in-store' THEN
    RAISE EXCEPTION 'Change is only for paying in store.' USING HINT = 'INVALID_INPUT';
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

  -- A promo code is one discount; Senior / PWD is another. One per order.
  IF v_promo_code IS NOT NULL AND v_discount_type IS NOT NULL THEN
    RAISE EXCEPTION 'A promo code can''t be combined with the Senior Citizen / PWD discount.'
      USING HINT = 'PROMO_NOT_COMBINABLE';
  END IF;

  -- Is the shop taking orders? (issue #115) --------------------------------
  -- Closed is reported before paused, and paused before busy: at 9pm "we
  -- open at 8" is the useful answer, not "very busy".
  v_store := public.get_store_status();

  IF NOT (v_store->>'is_open')::boolean THEN
    RAISE EXCEPTION 'We''re closed right now. We open at %.',
      to_char((v_store->>'open_time')::time, 'FMHH12:MI AM')
      USING HINT = 'STORE_CLOSED';
  END IF;

  IF NOT (v_store->>'is_accepting')::boolean THEN
    RAISE EXCEPTION 'Last orders were at % today. We open again at %.',
      to_char((v_store->>'last_order_time')::time, 'FMHH12:MI AM'),
      to_char((v_store->>'open_time')::time, 'FMHH12:MI AM')
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
  -- finds the cart already deleted and stops. That is the double-submit fix.
  SELECT * INTO v_cart
  FROM public.cart
  WHERE cart_id = p_cart_id
  FOR UPDATE;

  -- Someone else's cart reads as not found, so ids cannot be probed.
  IF NOT FOUND OR v_cart.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Cart not found.' USING HINT = 'NOT_FOUND';
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

  -- Per-dish limit (issue #115) --------------------------------------------
  SELECT p.product_name
  INTO v_unavailable
  FROM public.cart_item ci
  JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id
  GROUP BY p.product_id, p.product_name
  HAVING sum(ci.quantity) > 20
  LIMIT 1;

  IF v_unavailable IS NOT NULL THEN
    RAISE EXCEPTION 'You can only order up to 20 of each dish (%).', v_unavailable
      USING HINT = 'ITEM_LIMIT_EXCEEDED';
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

  -- What the order will cost, priced exactly as the lines below are -------
  SELECT
      coalesce((
        SELECT sum((p.product_price + coalesce((
                  SELECT sum(a.price)
                  FROM public.cart_item_add_on cia
                  JOIN public.add_on a ON a.addon_id = cia.addon_id
                  WHERE cia.cart_item_id = ci.cart_item_id), 0)) * ci.quantity)
        FROM public.cart_item ci
        JOIN public.product p ON p.product_id = ci.product_id
        WHERE ci.cart_id = p_cart_id), 0)
    + coalesce((
        SELECT sum(a.price)
        FROM public.cart_add_on ca
        JOIN public.add_on a ON a.addon_id = ca.addon_id
        WHERE ca.cart_id = p_cart_id), 0)
  INTO v_cart_total;

  -- Minimum order (L6): below this the kitchen loses money on the ticket.
  IF v_cart_total < 150 THEN
    RAISE EXCEPTION 'The minimum order is ₱150. Add ₱% more to check out.',
      to_char(150 - v_cart_total, 'FM999,990.00')
      USING HINT = 'ORDER_TOO_SMALL';
  END IF;

  -- Promo code: priced by the same function the checkout preview calls,
  -- with the promotion row locked so a usage limit can't be overrun by two
  -- orders at once. Refused outright if it no longer gives the discount the
  -- customer was shown.
  IF v_promo_code IS NOT NULL THEN
    v_promo          := public.promo_code_discount(p_cart_id, v_promo_code, v_uid, true);
    v_promo_id       := (v_promo->>'promotion_id')::uuid;
    v_promo_code     := v_promo->>'code';
    v_promo_discount := (v_promo->>'discount')::numeric;

    IF p_expected_promo_discount IS NOT NULL
       AND abs(v_promo_discount - p_expected_promo_discount) >= 0.005 THEN
      RAISE EXCEPTION 'Your promo discount is now ₱%. Please review your order.',
        to_char(v_promo_discount, 'FM999,990.00')
        USING HINT = 'PROMO_CHANGED';
    END IF;
  END IF;

  -- What the customer owes (tip aside): the Senior/PWD rule mirrors below.
  v_due := CASE WHEN v_discount_type IS NULL THEN v_cart_total - v_promo_discount
                ELSE round(v_cart_total * 100 / 112, 2) - round(round(v_cart_total * 100 / 112, 2) * 20 / 100, 2)
           END;

  IF p_payment_method = 'pay-in-store' THEN
    -- No-shows (F14, L18): two unpaid pick-ups and cash is off the table.
    SELECT count(*) INTO v_strikes
    FROM public."order" o
    JOIN public.transaction t ON t.order_id = o.order_id
    WHERE o.customer_id = v_uid
      AND o.no_show_reason IS NOT NULL
      AND t.payment_method = 'pay_in_store';

    IF v_strikes >= 2 THEN
      RAISE EXCEPTION 'Pay in store isn''t available on this account after % missed pick-ups. Please pay with GCash or Maya.', v_strikes
        USING HINT = 'CASH_BLOCKED';
    END IF;

    -- Cash cap (L6): the counter shouldn't hold a big unpaid order.
    IF v_due + v_tip > 2000 THEN
      RAISE EXCEPTION 'Orders over ₱2,000 must be paid with GCash or Maya.'
        USING HINT = 'CASH_LIMIT';
    END IF;

    -- A new account's first cash order is capped lower (L18).
    SELECT count(*) INTO v_paid_cash
    FROM public."order" o
    JOIN public.transaction t ON t.order_id = o.order_id
    WHERE o.customer_id = v_uid
      AND o.order_status = 'completed'
      AND t.payment_method = 'pay_in_store';

    IF v_paid_cash = 0 AND v_due + v_tip > 1000 THEN
      RAISE EXCEPTION 'Your first pay-in-store order can be up to ₱1,000. Pay with GCash or Maya for a bigger one.'
        USING HINT = 'FIRST_CASH_LIMIT';
    END IF;

    -- "Change for ₱___" (L8): enough to cover the bill, and not absurd.
    IF v_tendered IS NOT NULL AND (v_tendered < v_due + v_tip OR v_tendered > v_due + v_tip + 5000) THEN
      RAISE EXCEPTION 'The cash you''ll bring must cover the ₱% total.', to_char(v_due + v_tip, 'FM999,990.00')
        USING HINT = 'INVALID_INPUT';
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
  WHERE order_status IN ('pending', 'preparing');

  SELECT coalesce(max(p.prep_minutes), 10)
  INTO v_max_prep
  FROM public.cart_item ci
  JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id;

  v_extra_prep := coalesce((v_store->>'extra_prep_minutes')::integer, 0);

  v_promised_at := v_now + make_interval(
    mins => least(90, v_max_prep + least(20, greatest(0, v_item_count - 1)) + 3 * v_ahead + v_extra_prep) + 5);

  -- Write ------------------------------------------------------------------
  INSERT INTO public."order" (
    customer_id, order_status, order_type,
    special_instructions, delivery_fee, created_at,
    promised_at, fulfillment_method, cash_tendered
  )
  VALUES (
    v_uid, v_order_status, p_order_type,
    v_instructions, 0, v_now,
    v_promised_at, p_fulfillment_method, v_tendered
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
    -- #116: tax_amount is the 12% VAT already inside the price — of what is
    -- actually paid, so after any promo discount.
    v_txn_subtotal := v_subtotal;
    v_discount     := least(v_promo_discount, v_subtotal);
    v_tax          := round((v_subtotal - v_discount) * 12 / 112, 2);
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
    discount_type, discount_id_number, name_on_id, discount_id_photo_path,
    tip_amount, promotion_id, promo_code
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_txn_subtotal, v_tax, v_discount, 0, v_now,
    coalesce(v_discount_type, CASE WHEN v_promo_id IS NOT NULL THEN 'promo' END),
    v_discount_id, v_name_on_id, v_photo_path,
    v_tip, v_promo_id, v_promo_code
  );

  -- The order now holds everything (lines, add-ons, prices, totals), so the
  -- cart goes. Its items and add-ons cascade. The customer starts a fresh
  -- cart on their next add; there is never more than one per customer.
  DELETE FROM public.cart WHERE cart_id = p_cart_id;

  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_status', v_order_status
  );
END;
$_$;

-- 8. Nightly purge: every cart is now unsubmitted, so the age test is enough.
CREATE OR REPLACE FUNCTION public.purge_expired_personal_data() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_attempts      integer;
  v_notifications integer;
  v_carts         integer;
  v_issues        integer;
BEGIN
  DELETE FROM public.login_attempt WHERE attempted_at < now() - interval '30 days';
  GET DIAGNOSTICS v_attempts = ROW_COUNT;

  DELETE FROM public.notification
  WHERE (is_read AND created_at < now() - interval '90 days')
     OR created_at < now() - interval '180 days';
  GET DIAGNOSTICS v_notifications = ROW_COUNT;

  DELETE FROM public.cart c
  WHERE coalesce(c.updated_at, now()) < now() - interval '30 days';
  GET DIAGNOSTICS v_carts = ROW_COUNT;

  UPDATE public.order_issue
  SET note = NULL
  WHERE resolved_at < now() - interval '180 days'
    AND note IS NOT NULL;
  GET DIAGNOSTICS v_issues = ROW_COUNT;

  RETURN jsonb_build_object(
    'login_attempts', v_attempts,
    'notifications',  v_notifications,
    'carts',          v_carts,
    'issue_notes',    v_issues
  );
END;
$$;
