-- ============================================================================
-- Run AFTER `npm run db:cleanse -- --apply`.
--
-- The atomic-fields migration (20260924000000) adds its CHECK constraints
-- NOT VALID so it can't fail on legacy test data. Once the cleanse has
-- removed or repaired those rows, this checks every existing row as well and
-- creates the one-address-per-customer index. If a statement fails, the
-- error names the constraint and a row that still breaks it — run the
-- cleanse again (without --apply) to see what it would still change.
--
-- Safe to run more than once.
-- ============================================================================
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conrelid::regclass AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'c'
      AND NOT convalidated
      AND conrelid IN (
        'public.customer'::regclass,
        'public.employee'::regclass,
        'public.customer_address'::regclass,
        'public.rider'::regclass,
        'public.product'::regclass,
        'public.categories'::regclass
      )
  LOOP
    EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', c.tbl, c.conname);
    RAISE NOTICE 'validated %.%', c.tbl, c.conname;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS customer_address_unique_per_customer
  ON public.customer_address (customer_id, lower(building_no), lower(street), lower(barangay), lower(city), zip_code);
