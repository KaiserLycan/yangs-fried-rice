-- Issue #115: cancel orders the store never accepted.
--
-- An order sitting at `pending` for 20 minutes means nobody at the counter
-- saw it, or nobody is coming to cook it. Leaving it there is the worst of
-- both: the customer waits for food that isn't being made, and can still
-- turn up to collect it. So it is cancelled, with a reason that says what
-- happened, and — through trg_flag_refund_on_cancel (20260928000002) — a
-- paid wallet order is marked for refund in the same statement.
--
-- Counted from pending_at, when the order reached the kitchen queue, not
-- created_at: a GCash / Maya order reaches `pending` only when paid.
--
-- APPLYING THIS CHANGES NOTHING ON ITS OWN. It creates a function; the
-- pg_cron job in 20260928000006 calls it every 5 minutes.
--
-- The tracking page offers "cancel for free" after 10 minutes and the Orders
-- page / KDS flash an order pending for 5 (lib/orders/order-stage.ts,
-- PENDING_*_MINUTES) — change those alongside the 20 here.

CREATE OR REPLACE FUNCTION public.expire_unaccepted_orders(
  p_window interval DEFAULT interval '20 minutes'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public."order" AS o
       SET order_status        = 'cancelled',
           cancelled_at        = now(),
           cancellation_reason = 'Store didn''t confirm in time'
     WHERE o.order_status = 'pending'
       -- An order from before pending_at existed and never stamped falls
       -- back to created_at, so it cannot wait forever.
       AND coalesce(o.pending_at, o.created_at) < now() - p_window
    RETURNING o.order_id
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.expire_unaccepted_orders(interval) IS
  'Cancels orders pending (not accepted by staff) for longer than the window, reason "Store didn''t confirm in time". Paid wallet orders are flagged for refund by trg_flag_refund_on_cancel. Returns how many were cancelled.';

-- Service role (and pg_cron, which runs as postgres) only. It cancels rows
-- across every customer, so the anon key must not reach it.
REVOKE ALL ON FUNCTION public.expire_unaccepted_orders(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unaccepted_orders(interval) TO service_role;

NOTIFY pgrst, 'reload schema';
