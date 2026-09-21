-- ============================================================
-- Migration: bring migrations in line with what the app and the
-- generated types already use, and remove a stale RPC overload.
--
-- Non-destructive and idempotent: every ADD COLUMN uses IF NOT EXISTS
-- (a no-op on a database that already has the column), and the only
-- DROP is a superseded function overload — no table or row data is
-- touched.
-- ============================================================

-- ---- 1. Columns used by code/types but never created by a migration ----
-- Without these, a database built purely from supabase/migrations fails
-- on order placement (order.delivery_address), menu images, and both
-- profile pages.

ALTER TABLE "public"."order"
  ADD COLUMN IF NOT EXISTS "delivery_address" text;

ALTER TABLE "public"."product"
  ADD COLUMN IF NOT EXISTS "image_url" text;

ALTER TABLE "public"."customer"
  ADD COLUMN IF NOT EXISTS "date_of_birth" date;

ALTER TABLE "public"."employee"
  ADD COLUMN IF NOT EXISTS "date_of_birth" date;

ALTER TABLE "public"."employee"
  ADD COLUMN IF NOT EXISTS "phone-num" text;

-- ---- 2. Remove the stale 3-argument submit_order_review overload ----
-- 20260921000000_update_review_constraints.sql used CREATE OR REPLACE
-- with a *different* argument list (added p_product_id), which creates a
-- second overload rather than replacing 000_remote_schema's version.
-- With both present:
--   * PostgREST cannot pick between them when p_product_id is omitted
--     (PGRST203 "Could not choose the best candidate function"), and
--   * the old body still rejects any second review on an order
--     ("You have already reviewed this order."), defeating product-level
--     reviews.
-- The 4-argument version (p_product_id DEFAULT NULL) covers every call
-- the old one served.

DROP FUNCTION IF EXISTS "public"."submit_order_review"(uuid, integer, text);
