-- ============================================================
-- Seed: Order History & Reviews test data (Issue #62)
--
-- Populates dummy completed orders, order items, transactions,
-- and reviews so the backend can be tested independently.
--
-- Prerequisites:
--   - At least 1 row in the `customer` table
--   - At least 1 row in the `product` table
--
-- Run in Supabase SQL Editor or via: psql -f seed_orders_reviews.sql
-- ============================================================

DO $$
DECLARE
  v_customer_1 uuid;
  v_customer_2 uuid;
  v_product_1 uuid;
  v_product_2 uuid;
  v_product_3 uuid;
  v_order_1 uuid;  -- completed, reviewed
  v_order_2 uuid;  -- completed, NOT reviewed (for testing submit)
  v_order_3 uuid;  -- completed, belongs to customer 2
  v_order_4 uuid;  -- pending (cannot be reviewed)
  v_order_5 uuid;  -- completed, customer 1, reviewed
BEGIN

  -- ---- Look up existing customers ----
  SELECT customer_id INTO v_customer_1 FROM customer LIMIT 1;
  SELECT customer_id INTO v_customer_2 FROM customer OFFSET 1 LIMIT 1;

  IF v_customer_2 IS NULL THEN
    v_customer_2 := v_customer_1;
  END IF;

  IF v_customer_1 IS NULL THEN
    RAISE EXCEPTION 'No customers found in the customer table. Please create at least one test customer first (sign up via the app).';
  END IF;

  RAISE NOTICE 'Using customer 1: %', v_customer_1;
  RAISE NOTICE 'Using customer 2: %', v_customer_2;

  -- ---- Look up existing products ----
  SELECT product_id INTO v_product_1 FROM product LIMIT 1;
  SELECT product_id INTO v_product_2 FROM product OFFSET 1 LIMIT 1;
  SELECT product_id INTO v_product_3 FROM product OFFSET 2 LIMIT 1;

  IF v_product_1 IS NULL THEN
    RAISE EXCEPTION 'No products found. Please seed menu items first.';
  END IF;
  IF v_product_2 IS NULL THEN v_product_2 := v_product_1; END IF;
  IF v_product_3 IS NULL THEN v_product_3 := v_product_1; END IF;

  -- ---- Generate order UUIDs ----
  v_order_1 := gen_random_uuid();
  v_order_2 := gen_random_uuid();
  v_order_3 := gen_random_uuid();
  v_order_4 := gen_random_uuid();
  v_order_5 := gen_random_uuid();

  -- ---- Insert orders ----

  -- Order 1: Customer 1, completed 3 days ago, WILL have a review
  INSERT INTO "order" (order_id, customer_id, order_status, order_type, created_at, completed_at)
  VALUES (v_order_1, v_customer_1, 'completed', 'delivery', now() - interval '3 days', now() - interval '3 days' + interval '45 minutes');

  -- Order 2: Customer 1, completed yesterday, NO review yet (test submit_order_review here)
  INSERT INTO "order" (order_id, customer_id, order_status, order_type, created_at, completed_at)
  VALUES (v_order_2, v_customer_1, 'completed', 'pickup', now() - interval '1 day', now() - interval '1 day' + interval '30 minutes');

  -- Order 3: Customer 2, completed 2 days ago, will have a review
  INSERT INTO "order" (order_id, customer_id, order_status, order_type, created_at, completed_at)
  VALUES (v_order_3, v_customer_2, 'completed', 'delivery', now() - interval '2 days', now() - interval '2 days' + interval '50 minutes');

  -- Order 4: Customer 1, still PENDING (should NOT be reviewable)
  INSERT INTO "order" (order_id, customer_id, order_status, order_type, created_at)
  VALUES (v_order_4, v_customer_1, 'received', 'delivery', now() - interval '1 hour');

  -- Order 5: Customer 1, completed a week ago, will have a review
  INSERT INTO "order" (order_id, customer_id, order_status, order_type, created_at, completed_at)
  VALUES (v_order_5, v_customer_1, 'completed', 'pickup', now() - interval '7 days', now() - interval '7 days' + interval '25 minutes');

  -- ---- Insert order items ----

  INSERT INTO order_item (order_id, product_id, quantity, subtotal, special_instructions)
  VALUES
    (v_order_1, v_product_1, 2, (SELECT product_price * 2 FROM product WHERE product_id = v_product_1), 'Extra spicy'),
    (v_order_1, v_product_2, 1, (SELECT product_price FROM product WHERE product_id = v_product_2), NULL);

  INSERT INTO order_item (order_id, product_id, quantity, subtotal)
  VALUES
    (v_order_2, v_product_3, 3, (SELECT product_price * 3 FROM product WHERE product_id = v_product_3));

  INSERT INTO order_item (order_id, product_id, quantity, subtotal)
  VALUES
    (v_order_3, v_product_1, 1, (SELECT product_price FROM product WHERE product_id = v_product_1)),
    (v_order_3, v_product_3, 2, (SELECT product_price * 2 FROM product WHERE product_id = v_product_3));

  INSERT INTO order_item (order_id, product_id, quantity, subtotal)
  VALUES
    (v_order_4, v_product_2, 1, (SELECT product_price FROM product WHERE product_id = v_product_2));

  INSERT INTO order_item (order_id, product_id, quantity, subtotal)
  VALUES
    (v_order_5, v_product_1, 1, (SELECT product_price FROM product WHERE product_id = v_product_1));

  -- ---- Insert transactions ----

  INSERT INTO transaction (order_id, payment_method, payment_status, subtotal, total_paid, transaction_date)
  VALUES
    (v_order_1, 'gcash', 'paid',
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_1),
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_1),
      now() - interval '3 days'),
    (v_order_2, 'cash', 'paid',
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_2),
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_2),
      now() - interval '1 day'),
    (v_order_3, 'gcash', 'paid',
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_3),
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_3),
      now() - interval '2 days'),
    (v_order_5, 'cash', 'paid',
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_5),
      (SELECT SUM(subtotal) FROM order_item WHERE order_id = v_order_5),
      now() - interval '7 days');

  -- ---- Insert sample reviews ----

  -- Review for Order 1 (customer 1)
  INSERT INTO review (customer_id, order_id, rating, comment, created_at)
  VALUES (v_customer_1, v_order_1, 5, 'Amazing fried rice! Will order again.', now() - interval '2 days');

  -- Review for Order 3 (customer 2)
  INSERT INTO review (customer_id, order_id, rating, comment, created_at)
  VALUES (v_customer_2, v_order_3, 4, 'Good food, delivery was a bit slow.', now() - interval '1 day');

  -- Review for Order 5 (customer 1)
  INSERT INTO review (customer_id, order_id, rating, comment, created_at)
  VALUES (v_customer_1, v_order_5, 3, 'Decent but not as hot as I expected.', now() - interval '6 days');

  -- NOTE: Order 2 has NO review — use this to test submit_order_review()
  -- NOTE: Order 4 is 'received' — should be rejected if you try to review it

  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Order with NO review (test submit here): %', v_order_2;
  RAISE NOTICE 'Pending order (review should FAIL): %', v_order_4;
END;
$$;
