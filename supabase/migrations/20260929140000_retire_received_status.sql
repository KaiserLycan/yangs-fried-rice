-- FINALE 7.2 / 7.3: one order-status vocabulary, enforced.
--
-- `received` (and the Phase 1 `confirmed`) have not been written since issue
-- #118 and no row uses them. They are dropped from the state machine and the
-- kitchen counts, and a CHECK now holds order_status to the vocabulary in
-- lib/validation/orders.ts (ORDER_STATUSES). The trigger guarded updates
-- only; an insert could still write any string.

ALTER TABLE public."order" DROP CONSTRAINT IF EXISTS order_status_check;
ALTER TABLE public."order"
  ADD CONSTRAINT order_status_check CHECK (
    order_status IN (
      'awaiting_payment', 'payment_failed', 'pending', 'preparing',
      'ready', 'out_for_delivery', 'completed', 'cancelled'
    )
  );

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

  -- Mirrors VALID_TRANSITIONS in lib/validation/orders.ts.
  IF (v_from, v_to) IN (
       ('awaiting_payment', 'pending'), ('awaiting_payment', 'payment_failed'), ('awaiting_payment', 'cancelled'),
       ('payment_failed', 'pending'), ('payment_failed', 'awaiting_payment'), ('payment_failed', 'cancelled'),
       ('pending', 'preparing'), ('pending', 'cancelled'),
       ('preparing', 'ready'), ('preparing', 'cancelled'),
       ('ready', 'completed'), ('ready', 'cancelled'),
       ('out_for_delivery', 'completed'), ('out_for_delivery', 'cancelled')
     ) THEN
    RETURN NEW;
  END IF;

  -- Undo a mis-tapped "Picked up": back to ready, within 10 minutes (9.9).
  IF v_from = 'completed' AND v_to = 'ready'
     AND OLD.completed_at IS NOT NULL AND OLD.completed_at > now() - interval '10 minutes' THEN
    NEW.completed_at := NULL;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'An order can''t go from % to %.', v_from, v_to
    USING HINT = 'INVALID_TRANSITION', ERRCODE = '23514';
END;
$$;

-- The kitchen-queue counts in get_store_status and submit_cart_to_order
-- listed the retired statuses too. Each is rewritten from its current
-- definition with only that list changed; the replacement must match, or the
-- migration stops rather than silently leaving them in.
DO $$
DECLARE
  v_def text;
  v_new text;
BEGIN
  v_def := pg_get_functiondef('public.get_store_status()'::regprocedure);
  v_new := replace(v_def,
    $s$order_status IN ('pending', 'received', 'preparing')$s$,
    $s$order_status IN ('pending', 'preparing')$s$);
  IF v_new = v_def THEN
    RAISE EXCEPTION 'get_store_status: kitchen count not found';
  END IF;
  EXECUTE v_new;

  SELECT pg_get_functiondef(p.oid) INTO v_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'submit_cart_to_order';
  v_new := replace(v_def,
    $s$order_status IN ('pending', 'received', 'confirmed', 'preparing')$s$,
    $s$order_status IN ('pending', 'preparing')$s$);
  IF v_new = v_def THEN
    RAISE EXCEPTION 'submit_cart_to_order: kitchen count not found';
  END IF;
  EXECUTE v_new;
END;
$$;
