-- Issue #114, follow-up from the persona review (DBA and QA).
--
-- `submit_cart_to_order` prices every line from the menu, but the quantity
-- comes from `cart_item`, which customers write directly (their own cart,
-- while it is not final). Nothing stopped a REST call storing
-- `quantity = -3`, which the function would then turn into an order with a
-- negative total. The bound belongs on the column, so no path can store it.
--
-- 1–99 matches the server's current `addCartItemSchema` / `updateCartItemSchema`.
-- Issue #115 tightens the cap to the UI's 20; it can narrow this constraint then.
-- Live data was checked first: every quantity is between 1 and 14.

ALTER TABLE public.cart_item
  DROP CONSTRAINT IF EXISTS cart_item_quantity_range;
ALTER TABLE public.cart_item
  ADD CONSTRAINT cart_item_quantity_range CHECK (quantity BETWEEN 1 AND 99);

ALTER TABLE public.order_item
  DROP CONSTRAINT IF EXISTS order_item_quantity_positive;
ALTER TABLE public.order_item
  ADD CONSTRAINT order_item_quantity_positive CHECK (quantity > 0);

-- The advisor's last `function_search_path_mutable` finding. Not SECURITY
-- DEFINER (so outside #114's letter), but it costs one line.
ALTER FUNCTION public.update_password_timestamp() SET search_path = public;
