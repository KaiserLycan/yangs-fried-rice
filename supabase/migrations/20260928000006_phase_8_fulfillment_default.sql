-- Drop default and nullify existing false defaults for fulfillment_method

ALTER TABLE "public"."cart"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

UPDATE "public"."cart"
SET fulfillment_method = NULL
WHERE fulfillment_method = 'self_pickup';

ALTER TABLE "public"."order"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

UPDATE "public"."order"
SET fulfillment_method = NULL
WHERE fulfillment_method = 'self_pickup';
