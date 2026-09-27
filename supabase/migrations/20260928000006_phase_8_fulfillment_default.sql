-- Drop default and nullify existing false defaults for fulfillment_method
--
-- The 'self_pickup' values being cleared here came from the column default
-- added in 20260928000003, not from any customer: nothing wrote the column
-- until checkout started asking (20260928000010). Once that migration has
-- run, 'self_pickup' is a real answer, so the clean-up only happens while its
-- CHECK constraint does not exist yet. Re-running this file later (a
-- `db push` after the live SQL was pasted by hand) must not erase choices.

ALTER TABLE "public"."cart"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

ALTER TABLE "public"."order"
  ALTER COLUMN "fulfillment_method" DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_fulfillment_method_check'
  ) THEN
    UPDATE "public"."cart"
    SET fulfillment_method = NULL
    WHERE fulfillment_method = 'self_pickup';

    UPDATE "public"."order"
    SET fulfillment_method = NULL
    WHERE fulfillment_method = 'self_pickup';
  END IF;
END;
$$;
