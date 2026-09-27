-- Issue #116, ticket 02: payments and order tracking.
--
--   1. One spelling per payment value, and CHECK rules so it stays that way.
--   2. Completing a pay-in-store order marks its payment `paid`.
--   3. `submit_cart_to_order` saves which wallet was used, the VAT inside
--      the total (`tax_amount`), and the time the order was promised by.
--   4. `order.promised_at` — set once, never changed.
--   5. `order_status_log` — one row per status change, written by a trigger.

-- ---------------------------------------------------------------------------
-- 1. Payment values
-- ---------------------------------------------------------------------------

-- Checked live on 2026-09-27. Methods seen: cash_on_delivery, paymongo,
-- pay_in_store, gcash, GCash, cash. Statuses seen: pending, paid, Paid,
-- failed, refunded, completed.
--
-- `cash_on_delivery` becomes `pay_in_store`: the shop is pickup-only (#114),
-- and both mean cash handed over on collection.
-- `paymongo` stays: it means "paid by wallet" on rows written before the
-- wallet was recorded, and GCash cannot be told from Maya for those.

UPDATE public.transaction
SET payment_method = CASE lower(btrim(payment_method))
    WHEN 'cash'             THEN 'pay_in_store'
    WHEN 'cash_on_delivery' THEN 'pay_in_store'
    WHEN 'cash-on-delivery' THEN 'pay_in_store'
    WHEN 'pay-in-store'     THEN 'pay_in_store'
    WHEN 'maya'             THEN 'paymaya'
    ELSE lower(btrim(payment_method))
  END
WHERE payment_method IS NOT NULL;

UPDATE public.transaction
SET payment_status = CASE lower(btrim(payment_status))
    WHEN 'completed' THEN 'paid'
    ELSE lower(btrim(payment_status))
  END
WHERE payment_status IS NOT NULL;

ALTER TABLE public.transaction
  DROP CONSTRAINT IF EXISTS transaction_payment_method_check,
  ADD CONSTRAINT transaction_payment_method_check
    CHECK (payment_method IN ('pay_in_store', 'gcash', 'paymaya', 'paymongo'));

ALTER TABLE public.transaction
  DROP CONSTRAINT IF EXISTS transaction_payment_status_check,
  ADD CONSTRAINT transaction_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

COMMENT ON COLUMN public.transaction.payment_method IS
  'pay_in_store, gcash or paymaya. paymongo = a wallet payment from before the wallet was recorded.';

-- ---------------------------------------------------------------------------
-- 2. order.promised_at
-- ---------------------------------------------------------------------------

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS promised_at timestamptz;

COMMENT ON COLUMN public."order".promised_at IS
  'The ready-by time quoted when the order was placed. Set once by submit_cart_to_order; never changed.';

CREATE OR REPLACE FUNCTION public.freeze_order_promised_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.promised_at IS NOT NULL
     AND NEW.promised_at IS DISTINCT FROM OLD.promised_at THEN
    RAISE EXCEPTION 'promised_at is set when the order is placed and cannot be changed.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_order_promised_at ON public."order";
CREATE TRIGGER trg_freeze_order_promised_at
  BEFORE UPDATE OF promised_at ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.freeze_order_promised_at();

-- ---------------------------------------------------------------------------
-- 3. order_status_log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_status_log (
  log_id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public."order"(order_id) ON DELETE CASCADE,
  from_status text,
  to_status   text,
  changed_by  uuid,
  reason      text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_status_log IS
  'One row per order_status change, written by trg_log_order_status. from_status is NULL for the row written when the order is placed.';
COMMENT ON COLUMN public.order_status_log.changed_by IS
  'auth.uid() of whoever made the change. NULL for the service role (PayMongo webhook).';
COMMENT ON COLUMN public.order_status_log.reason IS
  'The cancellation reason. Filled only when to_status is cancelled.';

CREATE INDEX IF NOT EXISTS order_status_log_order_id_changed_at_idx
  ON public.order_status_log (order_id, changed_at);

ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;

-- Read-only for everyone: only the trigger writes, as the table owner.
DROP POLICY IF EXISTS "customer_read_own_order_status_log" ON public.order_status_log;
CREATE POLICY "customer_read_own_order_status_log" ON public.order_status_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public."order" o
    WHERE o.order_id = order_status_log.order_id
      AND o.customer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "employee_read_order_status_log" ON public.order_status_log;
CREATE POLICY "employee_read_order_status_log" ON public.order_status_log
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IS NOT NULL);

REVOKE ALL ON public.order_status_log FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.order_status_log FROM authenticated;
GRANT SELECT ON public.order_status_log TO authenticated;

CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from text := CASE WHEN TG_OP = 'UPDATE' THEN OLD.order_status END;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.order_status IS NOT DISTINCT FROM OLD.order_status THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.order_status_log (order_id, from_status, to_status, changed_by, reason)
  VALUES (
    NEW.order_id,
    v_from,
    NEW.order_status,
    auth.uid(),
    CASE WHEN NEW.order_status = 'cancelled' THEN NEW.cancellation_reason END
  );

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_order_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_log_order_status ON public."order";
CREATE TRIGGER trg_log_order_status
  AFTER INSERT OR UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

-- The tracking screen listens for new rows to stamp each stage live.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_status_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_log;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Completing a pay-in-store order marks it paid
-- ---------------------------------------------------------------------------

-- Staff press "Picked Up" when the customer pays at the counter and takes
-- the food. Before this, the payment stayed `pending` with total_paid = 0,
-- so revenue reports (which sum total_paid) left out every counter sale.
--
-- A trigger rather than app code: staff cannot write `transaction` (it has
-- only SELECT policies), and every path that completes an order is covered.

CREATE OR REPLACE FUNCTION public.mark_pay_in_store_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_status IS DISTINCT FROM 'completed'
     OR OLD.order_status IS NOT DISTINCT FROM 'completed' THEN
    RETURN NULL;
  END IF;

  UPDATE public.transaction t
  SET payment_status = 'paid',
      total_paid = greatest(0,
          coalesce((SELECT sum(oi.subtotal) FROM public.order_item oi   WHERE oi.order_id = NEW.order_id), 0)
        + coalesce((SELECT sum(oa.price)    FROM public.order_add_on oa WHERE oa.order_id = NEW.order_id), 0)
        + coalesce(NEW.delivery_fee, 0)
        - coalesce(t.discount_amount, 0))
  WHERE t.order_id = NEW.order_id
    AND t.payment_method = 'pay_in_store'
    AND t.payment_status = 'pending';

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_pay_in_store_paid() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_mark_pay_in_store_paid ON public."order";
CREATE TRIGGER trg_mark_pay_in_store_paid
  AFTER UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.mark_pay_in_store_paid();

-- ---------------------------------------------------------------------------
-- 5. submit_cart_to_order: wallet, VAT, promised_at
-- ---------------------------------------------------------------------------

-- Same as 20260927000001 except:
--   * p_payment_method takes `gcash` / `paymaya` so the wallet is recorded.
--     `wallet` is still accepted (saved as `paymongo`) so a browser on the
--     old build keeps working during the deploy.
--   * tax_amount = the 12% VAT already inside the price: total × 12 / 112.
--   * promised_at = now + the same wait lib/eta/engine.ts quotes for pickup:
--     15 min + 3 per order ahead in the kitchen, capped at 60, plus the
--     5-minute upper edge of the window. Worked out here, not passed in,
--     so a customer cannot promise themselves a time.

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
  v_ahead         integer;
  v_promised_at   timestamptz;
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

  IF p_payment_method IS NULL
     OR p_payment_method NOT IN ('gcash', 'paymaya', 'wallet', 'pay-in-store') THEN
    RAISE EXCEPTION 'Choose GCash / Maya or pay in store.' USING HINT = 'INVALID_PAYMENT_METHOD';
  END IF;

  IF v_instructions IS NOT NULL AND length(v_instructions) > 500 THEN
    RAISE EXCEPTION 'Special instructions cannot exceed 500 characters.'
      USING HINT = 'INVALID_INPUT';
  END IF;

  -- Lock the cart for the rest of the transaction --------------------------
  SELECT * INTO v_cart
  FROM public.cart
  WHERE cart_id = p_cart_id
  FOR UPDATE;

  IF NOT FOUND OR v_cart.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Cart not found.' USING HINT = 'NOT_FOUND';
  END IF;

  IF v_cart.is_final THEN
    RAISE EXCEPTION 'Cart is already submitted and locked.' USING HINT = 'CART_LOCKED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_item WHERE cart_id = p_cart_id) THEN
    RAISE EXCEPTION 'Cannot submit an empty cart.' USING HINT = 'EMPTY_CART';
  END IF;

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

  v_order_status := CASE WHEN p_payment_method = 'pay-in-store' THEN 'pending' ELSE 'awaiting_payment' END;
  v_txn_method   := CASE p_payment_method
                      WHEN 'pay-in-store' THEN 'pay_in_store'
                      WHEN 'wallet'       THEN 'paymongo'
                      ELSE p_payment_method
                    END;

  -- The promise ------------------------------------------------------------
  -- Mirrors ACTIVE_KITCHEN_STATUSES in lib/orders/kitchen-queue.ts.
  SELECT count(*) INTO v_ahead
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'confirmed', 'preparing');

  v_promised_at := v_now + make_interval(mins => least(60, 15 + 3 * v_ahead) + 5);

  -- Write ------------------------------------------------------------------
  INSERT INTO public."order" (
    customer_id, cart_id, order_status, order_type,
    special_instructions, delivery_fee, delivery_address, created_at, promised_at
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
    v_instructions, 0, NULL, v_now, v_promised_at
  )
  RETURNING order_id INTO v_order_id;

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

  INSERT INTO public.order_add_on (order_id, addon_id, price)
  SELECT v_order_id, ca.addon_id, a.price
  FROM public.cart_add_on ca
  JOIN public.add_on a ON a.addon_id = ca.addon_id
  WHERE ca.cart_id = p_cart_id;

  SELECT
    coalesce((SELECT sum(subtotal) FROM public.order_item   WHERE order_id = v_order_id), 0)
  + coalesce((SELECT sum(price)    FROM public.order_add_on WHERE order_id = v_order_id), 0)
  INTO v_subtotal;

  -- Prices already include VAT. Same rounding as vatBreakdown() in
  -- lib/menu/cart-totals.ts, so the receipt and this row agree.
  INSERT INTO public.transaction (
    order_id, payment_method, payment_status,
    subtotal, tax_amount, discount_amount, total_paid, transaction_date
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_subtotal, round(v_subtotal * 12 / 112, 2), 0, 0, v_now
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

NOTIFY pgrst, 'reload schema';
