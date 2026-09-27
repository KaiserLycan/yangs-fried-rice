-- Separate food and service ratings, per-dish ratings, "rate all the same"
-- (panel feedback F25). The order-level review row (product_id IS NULL)
-- keeps its `rating` as the food score and gains `service_rating`; each
-- rated dish is its own row with product_id set, which the menu editor
-- already averages into the dish's rating.

ALTER TABLE public.review ADD COLUMN IF NOT EXISTS service_rating smallint;
ALTER TABLE public.review DROP CONSTRAINT IF EXISTS review_service_rating_check;
ALTER TABLE public.review
  ADD CONSTRAINT review_service_rating_check CHECK (service_rating IS NULL OR service_rating BETWEEN 1 AND 5);
COMMENT ON COLUMN public.review.service_rating IS
  'Order-level rows only: how the pickup was handled (1–5). `rating` on that row is the food.';

-- One call, one transaction: the order score and every dish score land
-- together or not at all.
CREATE OR REPLACE FUNCTION public.submit_order_ratings(
  p_order_id uuid,
  p_food integer,
  p_service integer DEFAULT NULL,
  p_comment text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_order   record;
  v_item    jsonb;
  v_product uuid;
  v_rating  integer;
  v_count   integer := 0;
  v_comment text := nullif(btrim(coalesce(p_comment, '')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to rate your order.' USING HINT = 'UNAUTHORIZED';
  END IF;
  IF p_food IS NULL OR p_food NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Rate the food from 1 to 5 stars.' USING HINT = 'INVALID_INPUT';
  END IF;
  IF p_service IS NOT NULL AND p_service NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Rate the service from 1 to 5 stars.' USING HINT = 'INVALID_INPUT';
  END IF;
  IF v_comment IS NOT NULL AND length(v_comment) > 1000 THEN
    RAISE EXCEPTION 'Keep the comment under 1,000 characters.' USING HINT = 'INVALID_INPUT';
  END IF;
  IF jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' OR jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 THEN
    RAISE EXCEPTION 'Invalid dish ratings.' USING HINT = 'INVALID_INPUT';
  END IF;

  SELECT order_id, customer_id, order_status INTO v_order
  FROM public."order" WHERE order_id = p_order_id;

  IF NOT FOUND OR v_order.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Order not found.' USING HINT = 'NOT_FOUND';
  END IF;
  IF v_order.order_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can rate an order once you have picked it up.' USING HINT = 'INVALID_INPUT';
  END IF;
  IF EXISTS (SELECT 1 FROM public.review WHERE order_id = p_order_id AND product_id IS NULL) THEN
    RAISE EXCEPTION 'You have already rated this order.' USING HINT = 'ALREADY_RATED';
  END IF;

  INSERT INTO public.review (customer_id, order_id, product_id, rating, service_rating, comment)
  VALUES (v_uid, p_order_id, NULL, p_food, p_service, v_comment);

  FOR v_item IN SELECT * FROM jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) LOOP
    v_product := (v_item->>'product_id')::uuid;
    v_rating  := (v_item->>'rating')::integer;
    CONTINUE WHEN v_product IS NULL OR v_rating IS NULL;
    IF v_rating NOT BETWEEN 1 AND 5 THEN
      RAISE EXCEPTION 'Rate each dish from 1 to 5 stars.' USING HINT = 'INVALID_INPUT';
    END IF;
    -- Only dishes that were in this order, once each.
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM public.order_item WHERE order_id = p_order_id AND product_id = v_product);
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.review WHERE order_id = p_order_id AND product_id = v_product);
    INSERT INTO public.review (customer_id, order_id, product_id, rating)
    VALUES (v_uid, p_order_id, v_product, v_rating);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('order_id', p_order_id, 'food', p_food, 'service', p_service, 'dishes_rated', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_order_ratings(uuid, integer, integer, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_order_ratings(uuid, integer, integer, text, jsonb) TO authenticated, service_role;
