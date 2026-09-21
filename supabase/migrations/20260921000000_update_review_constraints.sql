-- Drop the original unique constraint that prevents multiple reviews per order
ALTER TABLE "public"."review" DROP CONSTRAINT IF EXISTS "review_order_unique";

-- Create partial unique indexes to enforce rules:
-- 1. One order-level review per order (product_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "review_order_only_unique" ON "public"."review" ("order_id") WHERE "product_id" IS NULL;

-- 2. One product-level review per product per order (product_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS "review_order_product_unique" ON "public"."review" ("order_id", "product_id") WHERE "product_id" IS NOT NULL;

-- Update the RPC to handle product_id
CREATE OR REPLACE FUNCTION public.submit_order_review (
  p_order_id uuid,
  p_rating   integer,
  p_comment  text    DEFAULT NULL::text,
  p_product_id uuid  DEFAULT NULL::uuid
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  v_order record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  -- 1. Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- 2. Fetch the order and verify ownership
  SELECT order_id, customer_id, order_status
  INTO v_order
  FROM "order"
  WHERE order_id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.customer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: this order does not belong to you.';
  END IF;

  -- 3. Verify the order is completed
  IF v_order.order_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can only review completed orders. Current status: %.', v_order.order_status;
  END IF;

  -- 4. Check for existing review
  IF p_product_id IS NULL THEN
    SELECT review_id INTO v_existing_review_id
    FROM review
    WHERE order_id = p_order_id AND product_id IS NULL;
    
    IF v_existing_review_id IS NOT NULL THEN
      RAISE EXCEPTION 'You have already submitted an order-level review for this order.';
    END IF;
  ELSE
    SELECT review_id INTO v_existing_review_id
    FROM review
    WHERE order_id = p_order_id AND product_id = p_product_id;
    
    IF v_existing_review_id IS NOT NULL THEN
      RAISE EXCEPTION 'You have already reviewed this product for this order.';
    END IF;
  END IF;

  -- 5. Insert the review
  INSERT INTO review (customer_id, order_id, rating, comment, product_id)
  VALUES (auth.uid(), p_order_id, p_rating, p_comment, p_product_id)
  RETURNING * INTO v_new_review;

  -- 6. Return the new review as JSON
  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'order_id', v_new_review.order_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'product_id', v_new_review.product_id,
    'created_at', v_new_review.created_at
  );
END;
$function$;

-- Update the get_customer_order_history RPC to include product_id in reviews
CREATE OR REPLACE FUNCTION public.get_customer_order_history (
  p_customer_id uuid
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  result json;
BEGIN
  -- Security: only allow customers to fetch their own history
  IF auth.uid() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Access denied: you can only view your own order history.';
  END IF;

  SELECT json_agg(order_row ORDER BY order_row.created_at DESC)
  INTO result
  FROM (
    SELECT
      o.order_id,
      o.order_status,
      o.order_type,
      o.created_at,
      o.completed_at,
      o.special_instructions,
      o.delivery_fee,
      -- Itemized receipt: array of items in this order
      (
        SELECT COALESCE(json_agg(json_build_object(
          'order_item_id', oi.order_item_id,
          'product_id', oi.product_id,
          'product_name', p.product_name,
          'product_price', p.product_price,
          'quantity', oi.quantity,
          'subtotal', oi.subtotal,
          'special_instructions', oi.special_instructions
        )), '[]'::json)
        FROM order_item oi
        LEFT JOIN product p ON p.product_id = oi.product_id
        WHERE oi.order_id = o.order_id
      ) AS items,
      -- Payment info
      (
        SELECT COALESCE(json_agg(json_build_object(
          'transaction_id', t.transaction_id,
          'payment_method', t.payment_method,
          'payment_status', t.payment_status,
          'subtotal', t.subtotal,
          'tax_amount', t.tax_amount,
          'discount_amount', t.discount_amount,
          'total_paid', t.total_paid
        )), '[]'::json)
        FROM transaction t
        WHERE t.order_id = o.order_id
      ) AS transactions,
      -- Reviews (since there can be multiple now)
      (
        SELECT COALESCE(json_agg(json_build_object(
          'review_id', r.review_id,
          'rating', r.rating,
          'comment', r.comment,
          'product_id', r.product_id,
          'created_at', r.created_at
        )), '[]'::json)
        FROM review r
        WHERE r.order_id = o.order_id
      ) AS review
    FROM "order" o
    WHERE o.customer_id = p_customer_id
  ) AS order_row;

  -- Return empty array instead of null if no orders
  RETURN COALESCE(result, '[]'::json);
END;
$function$;
