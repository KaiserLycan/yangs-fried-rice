-- Order updates without signing in (FINALE "More things"). Every order gets
-- an unguessable tracking token; /track/<order_id>?t=<token> shows its status
-- to anyone holding the link — the customer on another device, or someone
-- collecting it for them — without an account.
--
-- The token is the whole credential, so the RPC returns only what the
-- tracking screen needs: no name, phone, email, ID number or notes.

ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS tracking_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS order_tracking_token_key ON public."order" (tracking_token);
COMMENT ON COLUMN public."order".tracking_token IS
  'Secret for the public tracking link /track/<order_id>?t=<token>. Anyone with the link can see the order''s status and items, nothing personal.';

CREATE OR REPLACE FUNCTION public.get_public_order_tracking(p_order_id uuid, p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public."order"%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM public."order"
  WHERE order_id = p_order_id AND tracking_token = p_token;

  -- A wrong token and a missing order look the same.
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'order_id',            v_order.order_id,
    'order_number',        v_order.order_number,
    'order_status',        v_order.order_status,
    'order_type',          v_order.order_type,
    'cancelled_at',        v_order.cancelled_at,
    'cancellation_reason', v_order.cancellation_reason,
    'created_at',          v_order.created_at,
    'completed_at',        v_order.completed_at,
    'pending_at',          v_order.pending_at,
    'promised_at',         v_order.promised_at,
    'ready_at',            v_order.ready_at,
    'items', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
               'name', coalesce(oi.product_name, p.product_name, 'Item'),
               'quantity', oi.quantity,
               'subtotal', oi.subtotal) ORDER BY oi.order_item_id)
      FROM public.order_item oi
      LEFT JOIN public.product p ON p.product_id = oi.product_id
      WHERE oi.order_id = v_order.order_id), '[]'::jsonb),
    'status_log', coalesce((
      SELECT jsonb_agg(jsonb_build_object('to_status', l.to_status, 'changed_at', l.changed_at)
                       ORDER BY l.changed_at)
      FROM public.order_status_log l
      WHERE l.order_id = v_order.order_id), '[]'::jsonb),
    'payment', (
      SELECT jsonb_build_object(
               'method', t.payment_method,
               'status', t.payment_status,
               'due', coalesce(t.subtotal, 0) - coalesce(t.discount_amount, 0) + coalesce(t.tip_amount, 0))
      FROM public.transaction t
      WHERE t.order_id = v_order.order_id
      ORDER BY t.transaction_date DESC NULLS LAST
      LIMIT 1)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order_tracking(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order_tracking(uuid, uuid) TO anon, authenticated, service_role;
