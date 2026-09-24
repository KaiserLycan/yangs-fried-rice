-- ============================================================================
-- Atomic names and addresses, plus length/shape constraints on typed fields.
--
-- 1. customer.name / employee.name  ->  first_name + last_name
-- 2. customer_address.address_details  ->  building_no, street, barangay,
--    city, zip_code
-- 3. CHECK constraints mirroring lib/validation/fields.ts, so the database
--    refuses what the forms refuse even when a write bypasses the app.
--
-- The old composite columns are NOT gone: `name` and `address_details` come
-- back as GENERATED columns built from the atomic parts. Every existing read
-- (`select name`, `customer(name)`, `select address_details`) keeps working,
-- while every write is forced onto the atomic columns — writing to a
-- generated column is an error, so no code path can quietly go on storing a
-- single free-text string.
--
-- Existing rows are split best-effort. Rows the split can't make valid are
-- left in place; the constraints are added NOT VALID so this migration never
-- fails on old test data. Run `npm run db:cleanse` afterwards to remove or
-- repair those rows, then `supabase/validate-constraints.sql` to validate the
-- constraints against every row.
--
-- Idempotent: safe to run twice.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers: split "Juan Dela Cruz" into ("Juan Dela", "Cruz").
-- The LAST word is the last name — the only rule that is right for both
-- "Maria Clara Santos" and a one-word name, which leaves last_name empty for
-- the cleanse script to flag.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.first_part(full_name text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN position(' ' IN regexp_replace(btrim(coalesce(full_name, '')), '\s+', ' ', 'g')) > 0
      THEN regexp_replace(regexp_replace(btrim(full_name), '\s+', ' ', 'g'), ' \S+$', '')
    ELSE btrim(coalesce(full_name, ''))
  END
$$;

CREATE OR REPLACE FUNCTION pg_temp.last_part(full_name text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN position(' ' IN regexp_replace(btrim(coalesce(full_name, '')), '\s+', ' ', 'g')) > 0
      THEN substring(regexp_replace(btrim(full_name), '\s+', ' ', 'g') FROM '(\S+)$')
    ELSE ''
  END
$$;

-- ===========================================================================
-- 1a. customer: first_name / last_name
-- ===========================================================================
ALTER TABLE public.customer
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

UPDATE public.customer
SET first_name = pg_temp.first_part(name),
    last_name  = pg_temp.last_part(name)
WHERE first_name IS NULL OR last_name IS NULL;

ALTER TABLE public.customer
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer'
      AND column_name = 'name' AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE public.customer DROP COLUMN name;
    ALTER TABLE public.customer
      ADD COLUMN name text GENERATED ALWAYS AS (btrim(first_name || ' ' || last_name)) STORED;
  END IF;
END $$;

-- ===========================================================================
-- 1b. employee: first_name / last_name
-- ===========================================================================
ALTER TABLE public.employee
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;

UPDATE public.employee
SET first_name = pg_temp.first_part(name),
    last_name  = pg_temp.last_part(name)
WHERE first_name IS NULL OR last_name IS NULL;

ALTER TABLE public.employee
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name  SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee'
      AND column_name = 'name' AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE public.employee DROP COLUMN name;
    ALTER TABLE public.employee
      ADD COLUMN name text GENERATED ALWAYS AS (btrim(first_name || ' ' || last_name)) STORED;
  END IF;
END $$;

-- ===========================================================================
-- 2. customer_address: building_no / street / barangay / city / zip_code
--
-- Stored text was written by the app as
--   "{buildingNo} {street}, {barangay}, {city} {zip}"
-- so that is the shape parsed back. Anything else lands whole in `street`
-- with the other parts empty, for the cleanse script to deal with.
-- ===========================================================================
ALTER TABLE public.customer_address
  ADD COLUMN IF NOT EXISTS building_no text,
  ADD COLUMN IF NOT EXISTS street      text,
  ADD COLUMN IF NOT EXISTS barangay    text,
  ADD COLUMN IF NOT EXISTS city        text,
  ADD COLUMN IF NOT EXISTS zip_code    text;

DO $$
BEGIN
  -- Only while address_details is still the original stored column.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_address'
      AND column_name = 'address_details' AND is_generated = 'NEVER'
  ) THEN
    WITH split AS (
      SELECT
        address_id,
        btrim(address_details) AS raw,
        array(
          SELECT btrim(part)
          FROM unnest(string_to_array(address_details, ',')) AS part
          WHERE btrim(part) <> ''
        ) AS parts
      FROM public.customer_address
      WHERE street IS NULL
    ),
    shaped AS (
      SELECT
        address_id,
        raw,
        parts,
        cardinality(parts) AS n,
        parts[1] AS first_part,
        split_part(parts[1], ' ', 1) AS first_token
      FROM split
    )
    UPDATE public.customer_address a
    SET
      building_no = CASE
        WHEN s.n >= 2 AND s.first_token ~ '\d' AND position(' ' IN s.first_part) > 0
          THEN s.first_token
        ELSE ''
      END,
      street = CASE
        WHEN s.n >= 2 AND s.first_token ~ '\d' AND position(' ' IN s.first_part) > 0
          THEN btrim(substr(s.first_part, length(s.first_token) + 1))
        WHEN s.n >= 2 THEN s.first_part
        ELSE coalesce(s.raw, '')
      END,
      barangay = CASE
        WHEN s.n >= 3 THEN array_to_string(s.parts[2:s.n - 1], ', ')
        ELSE ''
      END,
      city = CASE
        WHEN s.n >= 2 THEN btrim(regexp_replace(s.parts[s.n], '\s*\d{4}\s*$', ''))
        ELSE ''
      END,
      zip_code = CASE
        WHEN s.n >= 2 THEN coalesce(substring(s.parts[s.n] FROM '(\d{4})\s*$'), '')
        ELSE ''
      END
    FROM shaped s
    WHERE a.address_id = s.address_id;
  END IF;
END $$;

UPDATE public.customer_address
SET building_no = coalesce(building_no, ''),
    street      = coalesce(street, ''),
    barangay    = coalesce(barangay, ''),
    city        = coalesce(city, ''),
    zip_code    = coalesce(zip_code, '')
WHERE building_no IS NULL OR street IS NULL OR barangay IS NULL
   OR city IS NULL OR zip_code IS NULL;

ALTER TABLE public.customer_address
  ALTER COLUMN building_no SET NOT NULL,
  ALTER COLUMN street      SET NOT NULL,
  ALTER COLUMN barangay    SET NOT NULL,
  ALTER COLUMN city        SET NOT NULL,
  ALTER COLUMN zip_code    SET NOT NULL;

-- Mirrors lib/address/format.ts formatAddress():
--   "{building_no} {street}, {barangay}, {city} {zip_code}", empty parts skipped.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customer_address'
      AND column_name = 'address_details' AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE public.customer_address DROP COLUMN address_details;
    ALTER TABLE public.customer_address
      ADD COLUMN address_details text GENERATED ALWAYS AS (
        regexp_replace(
          regexp_replace(
            btrim(building_no || ' ' || street) || ', ' || btrim(barangay) || ', ' || btrim(city || ' ' || zip_code),
            '(, )+', ', ', 'g'
          ),
          '^, |, $', '', 'g'
        )
      ) STORED;
  END IF;
END $$;

-- ===========================================================================
-- 3. Constraints. NOT VALID: enforced on every insert and update from now on,
--    but not checked against existing rows until validate-constraints.sql.
--    Names follow <table>_<column>_check so lib/validation/field-errors.ts
--    can tell which field a rejection is about.
-- ===========================================================================
DO $$
DECLARE
  name_rule text := 'char_length(%1$I) BETWEEN 2 AND 50 AND %1$I = btrim(%1$I) AND %1$I !~ ''[0-9]''';
  email_rule text := '%1$I IS NULL OR (char_length(%1$I) BETWEEN 6 AND 254 AND %1$I ~* ''^[A-Z0-9._%%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'')';
  phone_rule text := '%1$I IS NULL OR %1$I ~ ''^\+639[0-9]{9}$''';
  c record;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('customer',         'customer_first_name_check',    format(name_rule, 'first_name')),
      ('customer',         'customer_last_name_check',     format(name_rule, 'last_name')),
      ('customer',         'customer_email_check',         format(email_rule, 'email')),
      ('customer',         'customer_phone_number_check',  format(phone_rule, 'phone_number')),
      ('employee',         'employee_first_name_check',    format(name_rule, 'first_name')),
      ('employee',         'employee_last_name_check',     format(name_rule, 'last_name')),
      ('employee',         'employee_email_check',         format(email_rule, 'email')),
      ('employee',         'employee_phone_num_check',     format(phone_rule, 'phone-num')),
      ('customer_address', 'customer_address_building_no_check', 'char_length(btrim(building_no)) BETWEEN 1 AND 50'),
      ('customer_address', 'customer_address_street_check',      'char_length(btrim(street)) BETWEEN 3 AND 100'),
      ('customer_address', 'customer_address_barangay_check',    'char_length(btrim(barangay)) BETWEEN 2 AND 100'),
      ('customer_address', 'customer_address_city_check',        'char_length(btrim(city)) BETWEEN 3 AND 50'),
      ('customer_address', 'customer_address_zip_code_check',    'zip_code ~ ''^[0-9]{4}$'''),
      ('customer_address', 'customer_address_label_check',       'label IS NULL OR char_length(label) <= 30'),
      ('customer_address', 'customer_address_address_note_check', 'address_note IS NULL OR char_length(address_note) <= 200'),
      ('rider', 'rider_vehicle_plate_number_check',
         'vehicle_plate_number IS NULL OR vehicle_plate_number ~* ''^[A-Z0-9]+( [A-Z0-9]+)?$'' AND char_length(vehicle_plate_number) BETWEEN 5 AND 10'),
      ('rider', 'rider_driver_license_number_check',
         'driver_license_number IS NULL OR driver_license_number ~* ''^[A-Z][0-9]{2}-[0-9]{2}-[0-9]{6}$'''),
      ('rider', 'rider_vehicle_make_model_check',
         'vehicle_make_model IS NULL OR char_length(btrim(vehicle_make_model)) BETWEEN 2 AND 50'),
      ('product',    'product_product_name_check',    'char_length(btrim(product_name)) BETWEEN 2 AND 80'),
      ('product',    'product_product_details_check', 'product_details IS NULL OR char_length(product_details) <= 300'),
      ('product',    'product_product_price_check',   'product_price > 0 AND product_price <= 99999.99'),
      ('categories', 'categories_category_name_check', 'char_length(btrim(category_name)) BETWEEN 2 AND 40')
    ) AS t(tbl, conname, expr)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = c.conname AND conrelid = format('public.%I', c.tbl)::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
        c.tbl, c.conname, c.expr
      );
    END IF;
  END LOOP;
END $$;

-- One copy of an address per customer. Skipped (with a notice) while
-- duplicates exist — the cleanse script removes them, and
-- validate-constraints.sql creates the index afterwards.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.customer_address
    GROUP BY customer_id, lower(building_no), lower(street), lower(barangay), lower(city), zip_code
    HAVING count(*) > 1
  ) THEN
    RAISE NOTICE 'customer_address_unique_per_customer skipped: duplicate addresses exist. Run npm run db:cleanse, then supabase/validate-constraints.sql.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS customer_address_unique_per_customer
      ON public.customer_address (customer_id, lower(building_no), lower(street), lower(barangay), lower(city), zip_code);
  END IF;
END $$;

-- PostgREST caches the schema; tell it about the new columns now.
NOTIFY pgrst, 'reload schema';
