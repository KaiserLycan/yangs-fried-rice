-- Add product_id to the review table to support per-product reviews

ALTER TABLE "public"."review"
ADD COLUMN "product_id" UUID REFERENCES "public"."product"("product_id");

-- Add a comment
COMMENT ON COLUMN "public"."review"."product_id" IS 'If null, this is an order-level review. If set, it is a product-level review for the specific order.';
