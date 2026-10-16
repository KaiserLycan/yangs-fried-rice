-- Fix flag_refund_on_cancel() to match named wallet methods ('gcash', 'paymaya')
-- introduced in issue #116 in addition to legacy 'paymongo'. Also backfill any
-- already-cancelled paid wallet orders that missed being flagged for refund.

CREATE OR REPLACE FUNCTION public.flag_refund_on_cancel() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.transaction
  SET payment_status = 'refund_pending',
      refund_error   = NULL
  WHERE order_id = NEW.order_id
    AND payment_status = 'paid'
    AND payment_method IN ('paymongo', 'gcash', 'paymaya')
    AND provider_reference_id IS NOT NULL;
  RETURN NULL;
END;
$$;

UPDATE public.transaction AS t
SET payment_status = 'refund_pending',
    refund_error   = NULL
FROM public."order" AS o
WHERE t.order_id = o.order_id
  AND o.order_status = 'cancelled'
  AND t.payment_status = 'paid'
  AND t.payment_method IN ('paymongo', 'gcash', 'paymaya')
  AND t.provider_reference_id IS NOT NULL;
