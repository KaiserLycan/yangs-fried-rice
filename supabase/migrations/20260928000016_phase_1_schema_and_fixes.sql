-- Phase 1 Schema changes and data fixes

-- 1. Add fulfillment_method to cart and order tables
-- No default: a default answered the question for every order before any
-- customer was asked (see 20260928000006 / 20260928000010). IF NOT EXISTS so
-- the file is safe to re-run.
ALTER TABLE "public"."cart"
  ADD COLUMN IF NOT EXISTS "fulfillment_method" text;

ALTER TABLE "public"."order"
  ADD COLUMN IF NOT EXISTS "fulfillment_method" text;

-- 2. Backfill for total_paid on completed pay-in-store orders
UPDATE "public"."transaction" t
SET 
  payment_status = 'paid',
  total_paid = (
    SELECT COALESCE(SUM(oi.subtotal), 0)
    FROM "public"."order_item" oi
    WHERE oi.order_id = t.order_id
  ) + (
    SELECT COALESCE(SUM(oa.price), 0)
    FROM "public"."order_add_on" oa
    WHERE oa.order_id = t.order_id
  ) + COALESCE(o.delivery_fee, 0)
FROM "public"."order" o
WHERE o.order_id = t.order_id
  AND o.order_status = 'completed'
  AND t.total_paid = 0
  AND t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash');

-- 3. Add indexes for new filters to avoid full table scans
CREATE INDEX IF NOT EXISTS order_created_at_idx ON "public"."order" (created_at DESC);
CREATE INDEX IF NOT EXISTS transaction_payment_method_idx ON "public"."transaction" (payment_method);
