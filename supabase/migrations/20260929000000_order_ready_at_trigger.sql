-- order.ready_at: stamped by the database, whichever app marks an order ready.
--
-- The KDS "For Pick-up" tab lists orders made ready in the last 90 minutes
-- and "Failed Pick-up" the ones older than that, both from ready_at. Only
-- this branch's server action wrote it; the other apps on the same database
-- (main, development) set order_status = 'ready' and nothing else, so their
-- orders had no ready time: they never reached For Pick-up, and the only
-- ready orders the KDS showed were old ones backfilled by 20260928000007.
--
-- 1. A trigger sets ready_at whenever the status becomes 'ready' — the same
--    pattern as development's trg_set_order_pending_at.
-- 2. Orders already at 'ready' without a time get the moment their status
--    log says they became ready, when that log exists (development's
--    20260928000005), and otherwise when they were placed.
--
-- Safe to run more than once.

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS ready_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_order_ready_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_status = 'ready'
     AND (TG_OP = 'INSERT' OR OLD.order_status IS DISTINCT FROM 'ready')
  THEN
    NEW.ready_at := now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_order_ready_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_set_order_ready_at ON public."order";
CREATE TRIGGER trg_set_order_ready_at
  BEFORE INSERT OR UPDATE OF order_status ON public."order"
  FOR EACH ROW EXECUTE FUNCTION public.set_order_ready_at();

-- The KDS pick-up tabs filter ready orders by ready_at.
CREATE INDEX IF NOT EXISTS order_ready_at_idx
  ON public."order" (ready_at)
  WHERE order_status = 'ready';

-- Backfill ------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.order_status_log') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE public."order" o
      SET ready_at = l.changed_at
      FROM (
        SELECT order_id, max(changed_at) AS changed_at
        FROM public.order_status_log
        WHERE to_status = 'ready'
        GROUP BY order_id
      ) l
      WHERE l.order_id = o.order_id
        AND o.order_status = 'ready'
        AND o.ready_at IS NULL
    $sql$;
  END IF;
END;
$$;

UPDATE public."order"
SET ready_at = created_at
WHERE order_status = 'ready'
  AND ready_at IS NULL;

NOTIFY pgrst, 'reload schema';
