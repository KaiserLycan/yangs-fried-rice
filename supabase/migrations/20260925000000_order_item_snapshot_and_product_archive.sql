-- Issue #106: "Find a way to handle if the manager or staff suddenly change
-- the menu but an existing order is referencing that menu. This order should
-- not look like an unknown item but something that can still be tracked back
-- even as the menu changes over time."
--
-- Two causes, fixed together.
--
-- 1. `order_item` stored only `product_id`, and its foreign key is
--    ON DELETE SET NULL. Deleting a product therefore blanked that column on
--    every historical line, so the join behind KDS, the rider queue and order
--    tracking returned nothing and each view printed its own fallback string
--    ("20x Unknown item" in the reported screenshot). The line's money
--    survived, because `subtotal` is stored on the row — the *name* was the
--    only thing being looked up live.
--
-- 2. Products were hard-deleted, so there was nothing left to look up. A
--    renamed or repriced product was just as bad in a quieter way: last
--    month's order would redisplay at this month's name and price.
--
-- The fix is to write down what was actually bought at the time it was
-- bought, and to stop destroying menu rows that history points at.

-- ---------------------------------------------------------------------------
-- 1. Snapshot columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.order_item
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS unit_price   numeric(10,2);

COMMENT ON COLUMN public.order_item.product_name IS
  'The product name as it was when this line was ordered. Readers prefer this over joining product; the join is only a fallback for rows written before this column existed.';
COMMENT ON COLUMN public.order_item.unit_price IS
  'Price per unit as charged, including this line''s add-ons. subtotal stays the line total; this makes it divisible without guessing.';

-- ---------------------------------------------------------------------------
-- 2. Backfill
-- ---------------------------------------------------------------------------

-- Lines whose product still exists: take today's name, which is the best
-- available guess at what it was called. Anything renamed since is already
-- unrecoverable, and this is no worse than what the screen shows now.
UPDATE public.order_item oi
SET product_name = p.product_name
FROM public.product p
WHERE oi.product_id = p.product_id
  AND oi.product_name IS NULL;

-- Unit price is derived from what was actually charged rather than from
-- today's product_price, which may have moved. Guarded against a zero
-- quantity so the division cannot fail.
UPDATE public.order_item
SET unit_price = CASE
      WHEN quantity > 0 THEN subtotal / quantity
      ELSE subtotal
    END
WHERE unit_price IS NULL;

-- Lines orphaned by an earlier hard delete keep a NULL product_name: there is
-- genuinely nothing left to recover. They are the only rows that should still
-- read as an unknown item, and the app words that honestly.

-- ---------------------------------------------------------------------------
-- 3. Soft delete for products
-- ---------------------------------------------------------------------------

-- `is_available` already exists but means "not being sold right now" — a
-- temporary kitchen state that flips back. Removal from the menu is a
-- different, permanent thing and needs its own column.
ALTER TABLE public.product
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

COMMENT ON COLUMN public.product.archived_at IS
  'When this product was taken off the menu. Non-null rows are hidden from the menu but kept so historical orders still resolve. Prefer this over DELETE.';

CREATE INDEX IF NOT EXISTS product_archived_at_idx
  ON public.product (archived_at);

-- NOTE: order_item_product_id_fkey is deliberately left as ON DELETE SET
-- NULL. Tightening it to RESTRICT would be the belt-and-braces version, but
-- it would also make a genuine DELETE fail rather than merely lose a name,
-- and the seed/cleanse scripts delete products freely. The snapshot above is
-- what actually protects history; archiving is what stops the situation
-- arising. Revisit once nothing hard-deletes products.
