-- ============================================================
-- Migration: Order History & Reviews Backend (Issue #62)
--
-- Prerequisites: review, order, order_item, transaction, customer,
--                employee tables must already exist.
--
-- This migration adds:
--   1. RLS policies on order, order_item, transaction, review
--   2. UNIQUE constraint on review(order_id) — one review per order
--   3. RPC: get_customer_order_history(uuid) → json
--   4. RPC: submit_order_review(uuid, int, text) → json
-- ============================================================

-- ============================================================
-- 1. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ---- ORDER table ----
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_select_own_orders ON "order"
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY employee_select_all_orders ON "order"
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT employee_id FROM employee));

CREATE POLICY employee_update_all_orders ON "order"
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT employee_id FROM employee));

CREATE POLICY customer_insert_own_orders ON "order"
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- ---- ORDER_ITEM table ----
ALTER TABLE order_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_select_own_order_items ON order_item
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT order_id FROM "order" WHERE customer_id = auth.uid()));

CREATE POLICY employee_select_all_order_items ON order_item
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT employee_id FROM employee));

CREATE POLICY customer_insert_own_order_items ON order_item
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT order_id FROM "order" WHERE customer_id = auth.uid()));

-- ---- TRANSACTION table ----
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_select_own_transactions ON transaction
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT order_id FROM "order" WHERE customer_id = auth.uid()));

CREATE POLICY employee_select_all_transactions ON transaction
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT employee_id FROM employee));

-- ---- REVIEW table ----
ALTER TABLE review ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_select_own_reviews ON review
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY customer_insert_own_review ON review
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND order_id IN (
      SELECT order_id FROM "order"
      WHERE customer_id = auth.uid() AND order_status = 'completed'
    )
  );

CREATE POLICY employee_select_all_reviews ON review
  FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT employee_id FROM employee));


-- ============================================================
-- 2. UNIQUE CONSTRAINT — one review per order
-- ============================================================

ALTER TABLE review
  ADD CONSTRAINT review_order_unique UNIQUE (order_id);


-- ============================================================
-- 3. RPC — get_customer_order_history
-- ============================================================

CREATE OR REPLACE FUNCTION get_customer_order_history(p_customer_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
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
      (
        SELECT COALESCE(json_agg(json_build_object(
          'order_item_id', oi.order_item_id,
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
      (
        SELECT json_build_object(
          'review_id', r.review_id,
          'rating', r.rating,
          'comment', r.comment,
          'created_at', r.created_at
        )
        FROM review r
        WHERE r.order_id = o.order_id
        LIMIT 1
      ) AS review
    FROM "order" o
    WHERE o.customer_id = p_customer_id
  ) AS order_row;

  RETURN COALESCE(result, '[]'::json);
END;
$$;


-- ============================================================
-- 4. RPC — submit_order_review
-- ============================================================

CREATE OR REPLACE FUNCTION submit_order_review(
  p_order_id uuid,
  p_rating int,
  p_comment text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

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

  IF v_order.order_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can only review completed orders. Current status: %.', v_order.order_status;
  END IF;

  SELECT review_id INTO v_existing_review_id
  FROM review
  WHERE order_id = p_order_id;

  IF v_existing_review_id IS NOT NULL THEN
    RAISE EXCEPTION 'You have already reviewed this order.';
  END IF;

  INSERT INTO review (customer_id, order_id, rating, comment)
  VALUES (auth.uid(), p_order_id, p_rating, p_comment)
  RETURNING * INTO v_new_review;

  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'order_id', v_new_review.order_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'created_at', v_new_review.created_at
  );
END;
$$;
