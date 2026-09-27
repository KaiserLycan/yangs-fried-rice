-- Issue #115: one dish is capped at 20 in the cart, everywhere.
--
-- The UI's stepper has stopped at MAX_QUANTITY = 20 (lib/menu/quantity.ts)
-- since ticket 03, but the server accepted up to 99: addCartItemSchema,
-- updateCartItemSchema, and the cart_item_quantity_range constraint that
-- 20260927000003 added at 1–99 ("Issue #115 tightens the cap to the UI's 20;
-- it can narrow this constraint then"). A REST call could store 99 of a dish
-- the app would never let a customer pick.
--
-- Now the column says 1–20, the same as the stepper and the zod schemas.
-- Change all three together.
--
-- Run first — this must return 0, or the ALTER below fails:
--   SELECT count(*) FROM public.cart_item WHERE quantity > 20;
--
-- order_item is deliberately left at `quantity > 0`: past orders are history,
-- and an order placed under the old cap must stay readable.

ALTER TABLE public.cart_item
  DROP CONSTRAINT IF EXISTS cart_item_quantity_range;
ALTER TABLE public.cart_item
  ADD CONSTRAINT cart_item_quantity_range CHECK (quantity BETWEEN 1 AND 20);
