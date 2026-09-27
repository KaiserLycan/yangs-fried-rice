-- Cancel orders whose payment was started and never finished.
--
-- `submitCart` creates the `order` row before PayMongo is contacted, so a
-- customer who abandons the wallet page leaves a row at `awaiting_payment`
-- behind. Those are already kept out of the kitchen, manage and rider
-- queues, so nobody cooks them — they simply accumulate (issue #106).
--
-- The app does this lazily: `lib/checkout/expire-abandoned-orders.ts` runs
-- for the signed-in customer whenever checkout or their order history would
-- otherwise show them an unpaid order. That covers everyone who comes back.
-- It cannot cover the customer who never returns, which is exactly the row
-- that sits there longest — hence this.
--
-- APPLYING THIS CHANGES NOTHING ON ITS OWN. It creates a function; nothing
-- calls it. To make it sweep, schedule it (pg_cron, or any external timer
-- hitting it through PostgREST):
--
--   SELECT cron.schedule('expire-abandoned-orders', '*/15 * * * *',
--                        $$SELECT public.expire_abandoned_orders()$$);
--
-- Deliberately NOT scheduled here: pg_cron is not enabled on every project,
-- and a migration that silently starts cancelling rows on a timer is not
-- something to switch on without the team knowing it happened.

CREATE OR REPLACE FUNCTION public.expire_abandoned_orders(
  p_window interval DEFAULT interval '1 hour'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
-- Pinned so the function cannot be redirected by a caller's search_path.
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public."order" AS o
       SET order_status       = 'cancelled',
           cancelled_at       = now(),
           cancellation_reason =
             'Payment wasn''t completed, so this order was cancelled. Nothing was charged.'
     WHERE o.order_status IN ('awaiting_payment', 'payment_failed')
       AND o.created_at < now() - p_window
       -- A webhook that arrived late leaves an order whose money did change
       -- hands sitting at `awaiting_payment`. Telling a customer who paid
       -- that their order is gone is far worse than an orphan row, so the
       -- transaction decides.
       AND NOT EXISTS (
         SELECT 1
           FROM public.transaction t
          WHERE t.order_id = o.order_id
            AND t.payment_status = 'paid'
       )
    RETURNING o.order_id
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_abandoned_orders(interval) IS
  'Cancels unpaid orders older than the window, skipping any whose transaction is paid. Returns how many were cancelled. Not scheduled by default.';

-- Only the service role runs this. It is SECURITY DEFINER and cancels rows
-- across every customer, so the anon key must not reach it.
REVOKE ALL ON FUNCTION public.expire_abandoned_orders(interval) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_abandoned_orders(interval) TO service_role;

NOTIFY pgrst, 'reload schema';
