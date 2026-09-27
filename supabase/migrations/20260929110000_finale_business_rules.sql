-- FINALE.md business rules (limitations L1, L6, L8, L18; panel F14, F18, F19;
-- DBA review 7.2, 7.3; legal 6.2).
--
-- * store_setting.last_order_minutes: no new orders in the last N minutes
--   before closing, so the kitchen can finish (L1).
-- * product.prep_minutes: the promise is built from the slowest dish (F18).
-- * order.no_show_reason: staff mark a ready order the customer never
--   collected; two cash no-shows switch pay-in-store off for that account
--   (F14, L18).
-- * order.cash_tendered: "I'll pay with ₱1,000" so the counter has change (L8).
-- * transaction.tip_amount: a peso tip for the staff, kept out of total_paid
--   so sales reports stay sales (F19).
-- * trg_guard_order_status: the order state machine, enforced in the
--   database, with a 10-minute undo for a mis-tapped "Picked up" (7.2, 9.9).
-- * purge_expired_personal_data(): the retention rules, run nightly (6.2).

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_setting
  ADD COLUMN IF NOT EXISTS last_order_minutes integer NOT NULL DEFAULT 30;
ALTER TABLE public.store_setting DROP CONSTRAINT IF EXISTS store_setting_last_order_minutes_check;
ALTER TABLE public.store_setting
  ADD CONSTRAINT store_setting_last_order_minutes_check CHECK (last_order_minutes BETWEEN 0 AND 180);

ALTER TABLE public.product
  ADD COLUMN IF NOT EXISTS prep_minutes integer NOT NULL DEFAULT 10;
ALTER TABLE public.product DROP CONSTRAINT IF EXISTS product_prep_minutes_check;
ALTER TABLE public.product
  ADD CONSTRAINT product_prep_minutes_check CHECK (prep_minutes BETWEEN 1 AND 120);
COMMENT ON COLUMN public.product.prep_minutes IS
  'Minutes the kitchen needs for one of this dish. The checkout promise uses the slowest dish in the cart.';

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS no_show_reason text,
  ADD COLUMN IF NOT EXISTS cash_tendered numeric(10,2);
ALTER TABLE public."order" DROP CONSTRAINT IF EXISTS order_no_show_reason_check;
ALTER TABLE public."order"
  ADD CONSTRAINT order_no_show_reason_check CHECK (
    no_show_reason IS NULL
    OR (order_status = 'cancelled' AND no_show_reason IN ('unreachable', 'wrong_info', 'refused', 'no_show'))
  );
ALTER TABLE public."order" DROP CONSTRAINT IF EXISTS order_cash_tendered_check;
ALTER TABLE public."order"
  ADD CONSTRAINT order_cash_tendered_check CHECK (cash_tendered IS NULL OR cash_tendered > 0);
COMMENT ON COLUMN public."order".no_show_reason IS
  'Set when staff cancel a ready order the customer never collected: unreachable, wrong_info, refused or no_show.';
COMMENT ON COLUMN public."order".cash_tendered IS
  'Pay-in-store: the note the customer said they will pay with, so the counter can prepare change.';

ALTER TABLE public.transaction
  ADD COLUMN IF NOT EXISTS tip_amount numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.transaction DROP CONSTRAINT IF EXISTS transaction_tip_amount_check;
ALTER TABLE public.transaction
  ADD CONSTRAINT transaction_tip_amount_check CHECK (tip_amount BETWEEN 0 AND 5000);
COMMENT ON COLUMN public.transaction.tip_amount IS
  'Tip for the staff, in pesos. Not part of total_paid, which stays the sale.';

-- ---------------------------------------------------------------------------
-- Store status: is_accepting = open and before the last-order cut-off.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_store_status() RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_s          public.store_setting%ROWTYPE;
  v_now        time := (now() AT TIME ZONE 'Asia/Manila')::time;
  v_active     integer;
  v_paused     boolean;
  v_open       boolean;
  v_last_order time;
BEGIN
  SELECT * INTO v_s FROM public.store_setting WHERE id;

  IF NOT FOUND THEN
    v_s.is_paused          := false;
    v_s.paused_until       := NULL;
    v_s.extra_prep_minutes := 0;
    v_s.max_active_orders  := 20;
    v_s.open_time          := time '08:00';
    v_s.close_time         := time '18:00';
    v_s.is_force_open      := false;
    v_s.last_order_minutes := 30;
  END IF;

  SELECT count(*) INTO v_active
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'preparing');

  v_paused := v_s.is_paused
          AND (v_s.paused_until IS NULL OR v_s.paused_until > now());

  v_open := v_s.is_force_open OR (v_now >= v_s.open_time AND v_now < v_s.close_time);
  -- Never before opening time: a cut-off longer than the day means "no cut-off".
  v_last_order := greatest(v_s.open_time, v_s.close_time - make_interval(mins => v_s.last_order_minutes));

  RETURN jsonb_build_object(
    'is_open',            v_open,
    'is_accepting',       v_s.is_force_open OR (v_open AND v_now < v_last_order),
    'last_order_time',    to_char(v_last_order, 'HH24:MI'),
    'last_order_minutes', v_s.last_order_minutes,
    'is_paused',          v_paused,
    'paused_until',       CASE WHEN v_paused THEN v_s.paused_until END,
    'is_busy',            v_active >= v_s.max_active_orders,
    'active_orders',      v_active,
    'max_active_orders',  v_s.max_active_orders,
    'open_time',          to_char(v_s.open_time,  'HH24:MI'),
    'close_time',         to_char(v_s.close_time, 'HH24:MI'),
    'extra_prep_minutes', v_s.extra_prep_minutes,
    'is_force_open',      v_s.is_force_open
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- The order state machine (7.2). Mirrors VALID_TRANSITIONS in
-- lib/validation/orders.ts, plus the legacy received/confirmed statuses and a
-- 10-minute undo of "Picked up" (FINALE 9.9).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_order_status() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_from text := OLD.order_status;
  v_to   text := NEW.order_status;
BEGIN
  IF v_to IS NOT DISTINCT FROM v_from THEN
    RETURN NEW;
  END IF;

  IF (v_from, v_to) IN (
       ('awaiting_payment', 'pending'), ('awaiting_payment', 'payment_failed'), ('awaiting_payment', 'cancelled'),
       ('payment_failed', 'pending'), ('payment_failed', 'awaiting_payment'), ('payment_failed', 'cancelled'),
       ('pending', 'preparing'), ('pending', 'cancelled'),
       ('received', 'preparing'), ('received', 'cancelled'),
       ('confirmed', 'preparing'), ('confirmed', 'ready'), ('confirmed', 'cancelled'),
       ('preparing', 'ready'), ('preparing', 'cancelled'),
       ('ready', 'completed'), ('ready', 'cancelled'),
       ('out_for_delivery', 'completed'), ('out_for_delivery', 'cancelled')
     ) THEN
    RETURN NEW;
  END IF;

  -- Undo a mis-tapped "Picked up": back to ready, within 10 minutes.
  IF v_from = 'completed' AND v_to = 'ready'
     AND OLD.completed_at IS NOT NULL AND OLD.completed_at > now() - interval '10 minutes' THEN
    NEW.completed_at := NULL;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'An order can''t go from % to %.', v_from, v_to
    USING HINT = 'INVALID_TRANSITION', ERRCODE = '23514';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_order_status ON public."order";
CREATE TRIGGER trg_guard_order_status
  BEFORE UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_status();

-- Undoing "Picked up" also undoes the pay-in-store settlement that
-- mark_pay_in_store_paid made when it was completed.
CREATE OR REPLACE FUNCTION public.unsettle_pay_in_store_on_undo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.order_status = 'completed' AND NEW.order_status = 'ready' THEN
    UPDATE public.transaction
    SET payment_status = 'pending', total_paid = 0
    WHERE order_id = NEW.order_id
      AND payment_method = 'pay_in_store'
      AND payment_status = 'paid';
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.unsettle_pay_in_store_on_undo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_unsettle_pay_in_store_on_undo ON public."order";
CREATE TRIGGER trg_unsettle_pay_in_store_on_undo
  AFTER UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.unsettle_pay_in_store_on_undo();

-- ---------------------------------------------------------------------------
-- Checkout: minimum order, cash caps, no-show strikes, tip, change-for, the
-- last-order cut-off and a prep-time based promise. Two new parameters, so
-- the old signature is dropped and grants re-applied.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb, text);

CREATE OR REPLACE FUNCTION public.submit_cart_to_order(p_cart_id uuid, p_order_type text DEFAULT 'take_out'::text, p_special_instructions text DEFAULT NULL::text, p_payment_method text DEFAULT 'pay-in-store'::text, p_expected_prices jsonb DEFAULT NULL::jsonb, p_discount jsonb DEFAULT NULL::jsonb, p_fulfillment_method text DEFAULT 'self_pickup'::text, p_tip numeric DEFAULT 0, p_cash_tendered numeric DEFAULT NULL::numeric) RETURNS jsonb
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

  -- What the customer owes (tip aside): the Senior/PWD rule mirrors below.
  v_due := CASE WHEN v_discount_type IS NULL THEN v_cart_total
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
  WHERE order_status IN ('pending', 'received', 'confirmed', 'preparing');

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
    customer_id, cart_id, order_status, order_type,
    special_instructions, delivery_fee, created_at,
    promised_at, fulfillment_method, cash_tendered
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
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
    discount_type, discount_id_number, name_on_id, discount_id_photo_path,
    tip_amount
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_txn_subtotal, v_tax, v_discount, 0, v_now,
    v_discount_type, v_discount_id, v_name_on_id, v_photo_path,
    v_tip
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
$_$;

REVOKE ALL ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb, text, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_cart_to_order(uuid, text, text, text, jsonb, jsonb, text, numeric, numeric) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Retention (legal review 6.2). What is kept, and for how long, is set out
-- in the privacy notice (app/privacy/page.tsx); this is the part a database
-- can do on its own. Orders and payments are kept: they are the sales books
-- the BIR can ask for.
--   * sign-in attempts ............ 30 days (rate limiting only needs a day)
--   * read notifications .......... 90 days; unread ones 180 days
--   * carts never checked out ..... 30 days after their last change
--   * problem-report notes ........ cleared 180 days after being resolved
-- ---------------------------------------------------------------------------
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
  WHERE NOT c.is_final
    AND c.order_id IS NULL
    AND coalesce(c.updated_at, now()) < now() - interval '30 days'
    AND NOT EXISTS (SELECT 1 FROM public."order" o WHERE o.cart_id = c.cart_id);
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
REVOKE ALL ON FUNCTION public.purge_expired_personal_data() FROM PUBLIC, anon, authenticated;

-- 03:00 Manila (19:00 UTC), when the shop is closed.
SELECT cron.schedule('purge-expired-personal-data', '0 19 * * *',
  $$SELECT public.purge_expired_personal_data()$$);
