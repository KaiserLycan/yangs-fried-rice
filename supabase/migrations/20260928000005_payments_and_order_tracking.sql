-- Issue #116, ticket 02: payments and order tracking.
--
--   1. One spelling per payment value, and CHECK rules so it stays that way.
--   2. Completing a pay-in-store order marks its payment `paid`.
--   3. (moved) `submit_cart_to_order` changes live in 20260928000004, on top
--      of issue #115's version of the function.
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

NOTIFY pgrst, 'reload schema';
