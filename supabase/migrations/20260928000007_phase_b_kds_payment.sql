-- Add ready_at to track when an order transitions to 'ready'
ALTER TABLE "public"."order"
  ADD COLUMN IF NOT EXISTS "ready_at" timestamp with time zone;

-- Backfill legacy orders currently stuck in 'ready'
UPDATE "public"."order"
SET ready_at = created_at + interval '15 minutes'
WHERE order_status = 'ready' AND ready_at IS NULL;
