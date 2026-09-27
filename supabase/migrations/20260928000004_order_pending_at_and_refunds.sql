-- Issue #115: when an order started waiting for the store, and refunds for
-- paid orders that get cancelled.
--
-- 1. order.pending_at
--    The 20-minute "store didn't confirm" timeout, the 10-minute prompt on
--    tracking and the 5-minute flash on the Orders page / KDS all count from
--    the moment the order reached the kitchen queue — not from created_at.
--    A GCash / Maya order is created at `awaiting_payment` and only becomes
--    `pending` when PayMongo confirms; counted from created_at, one paid at
--    minute 25 would be auto-cancelled the instant it arrived. A trigger
--    stamps pending_at whenever the status becomes `pending`, so no code
--    path (checkout, webhook, switch-to-cash) has to remember to.
--
-- 2. Refund on cancel
--    A paid wallet order that is cancelled — by the customer, by staff, or
--    by the 20-minute timeout — has taken money for food nobody will cook.
--    A trigger marks its PayMongo transaction `refund_pending`; the
--    `process-refunds` edge function (Phase 6) sends the refund and records
--    the outcome in the new columns below.

-- ---------------------------------------------------------------------------
-- 1. order.pending_at
-- ---------------------------------------------------------------------------

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS pending_at timestamptz;

COMMENT ON COLUMN public."order".pending_at IS
  'When the order last became pending (entered the kitchen queue). Set by trg_set_order_pending_at. The 20-minute unaccepted timeout counts from here.';

-- Orders already pending get now(), not their created_at: counted from
-- created_at, every old pending order would be auto-cancelled (and, if paid,
-- refunded) by the first sweep after the cron job is scheduled. now() gives
-- them the same 20 minutes a new order gets. Runs before the trigger exists.
UPDATE public."order"
SET pending_at = now()
WHERE order_status = 'pending'
  AND pending_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_order_pending_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_status = 'pending'
     AND (TG_OP = 'INSERT' OR OLD.order_status IS DISTINCT FROM 'pending')
  THEN
    NEW.pending_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_order_pending_at() FROM PUBLIC, anon, authenticated;

-- Fires after trg_guard_customer_order_update (triggers run in name order,
-- "guard" < "set"). The guard's column check is unaffected: this only
-- writes pending_at on a change *to* pending, which customers cannot make.
DROP TRIGGER IF EXISTS trg_set_order_pending_at ON public."order";
CREATE TRIGGER trg_set_order_pending_at
  BEFORE INSERT OR UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.set_order_pending_at();

-- The timeout sweep looks for old pending orders; keep that cheap.
CREATE INDEX IF NOT EXISTS order_pending_at_idx
  ON public."order" (pending_at)
  WHERE order_status = 'pending';

-- ---------------------------------------------------------------------------
-- 2. Refund bookkeeping on transaction
-- ---------------------------------------------------------------------------

ALTER TABLE public.transaction
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_refund_id  text,
  ADD COLUMN IF NOT EXISTS refund_error        text,
  ADD COLUMN IF NOT EXISTS refunded_at         timestamptz;

COMMENT ON COLUMN public.transaction.provider_payment_id IS
  'PayMongo payment id (pay_…), stored by payment-webhook. The Refunds API needs it; provider_reference_id holds the payment intent (pi_…).';
COMMENT ON COLUMN public.transaction.provider_refund_id IS
  'PayMongo refund id (ref_…), stored by process-refunds.';
COMMENT ON COLUMN public.transaction.refund_error IS
  'Why the last automatic refund attempt failed, shown to managers on the dashboard.';

-- payment_status values from here on: pending, paid, failed, refunded,
-- refund_pending (cancelled after payment, refund not yet sent) and
-- refund_failed (PayMongo refused; a manager refunds by hand).

-- ---------------------------------------------------------------------------
-- 3. Cancelling a paid wallet order marks it for refund
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER: the customer who cancels their own order has no write
-- access to `transaction` (it has only SELECT policies), and the refund must
-- still be recorded. It touches only the cancelled order's own rows, and
-- only ones PayMongo actually took money for. Pay-in-store takings are not
-- matched: that cash is handed back at the counter.
CREATE OR REPLACE FUNCTION public.flag_refund_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.transaction
  SET payment_status = 'refund_pending',
      refund_error   = NULL
  WHERE order_id = NEW.order_id
    AND payment_status = 'paid'
    AND payment_method = 'paymongo'
    AND provider_reference_id IS NOT NULL;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.flag_refund_on_cancel() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_flag_refund_on_cancel ON public."order";
CREATE TRIGGER trg_flag_refund_on_cancel
  AFTER UPDATE OF order_status ON public."order"
  FOR EACH ROW
  WHEN (NEW.order_status = 'cancelled' AND OLD.order_status IS DISTINCT FROM 'cancelled')
  EXECUTE FUNCTION public.flag_refund_on_cancel();

NOTIFY pgrst, 'reload schema';
