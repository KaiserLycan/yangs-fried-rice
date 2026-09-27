-- Menu prices: manager-only, with a price history.
--
-- 1. `product_price_log` records every price a product has had: the starting
--    price when it is created, then one row per change, with who made it.
-- 2. Only a MANAGER may set or change `product_price`. Staff keep write access
--    to the rest of the menu (availability, names, photos) through the
--    existing `staff_write_product` policy; RLS cannot compare old and new
--    column values, so the price rule is a trigger.
--
-- Writes from outside a signed-in session (service role: seeds, migrations,
-- the SQL editor) have no auth.uid() and are not blocked.

-- ---------------------------------------------------------------------------
-- 1. Price history table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_price_log (
  log_id      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid          NOT NULL REFERENCES public.product (product_id) ON DELETE CASCADE,
  old_price   numeric(10,2),                      -- NULL for the starting price
  new_price   numeric(10,2) NOT NULL,
  changed_by  uuid,                               -- auth.uid(); NULL for service-role writes
  changed_at  timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_price_log_product_idx
  ON public.product_price_log (product_id, changed_at DESC);

ALTER TABLE public.product_price_log ENABLE ROW LEVEL SECURITY;

-- Managers read the history. Nobody writes it directly: only the trigger
-- below (SECURITY DEFINER) inserts, and rows are never edited or removed.
DROP POLICY IF EXISTS "manager_read_price_log" ON public.product_price_log;
CREATE POLICY "manager_read_price_log" ON public.product_price_log
  FOR SELECT TO authenticated
  USING (public.current_employee_role() = 'MANAGER');

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.product_price_log FROM anon, authenticated;
GRANT SELECT ON public.product_price_log TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Only managers set prices
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_product_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;  -- service role
  END IF;

  IF (TG_OP = 'INSERT' OR NEW.product_price IS DISTINCT FROM OLD.product_price)
     AND coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Only a manager can set or change menu prices.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_product_price ON public.product;
CREATE TRIGGER trg_guard_product_price
  BEFORE INSERT OR UPDATE OF product_price ON public.product
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_price();

-- ---------------------------------------------------------------------------
-- 3. Log every price
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_product_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by)
    VALUES (NEW.product_id, NULL, NEW.product_price, auth.uid());
  ELSIF NEW.product_price IS DISTINCT FROM OLD.product_price THEN
    INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by)
    VALUES (NEW.product_id, OLD.product_price, NEW.product_price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_product_price ON public.product;
CREATE TRIGGER trg_log_product_price
  AFTER INSERT OR UPDATE OF product_price ON public.product
  FOR EACH ROW EXECUTE FUNCTION public.log_product_price();

REVOKE EXECUTE ON FUNCTION public.guard_product_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_product_price()   FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Seed the history with today's prices, so every product has a start
-- ---------------------------------------------------------------------------

INSERT INTO public.product_price_log (product_id, old_price, new_price, changed_by, changed_at)
SELECT p.product_id, NULL, p.product_price, NULL, now()
FROM public.product p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_price_log l WHERE l.product_id = p.product_id
);
