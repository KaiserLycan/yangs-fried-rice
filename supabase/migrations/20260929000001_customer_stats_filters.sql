-- Customers: advanced filters, answered on the server.
--
-- The Customers list could rank by lifetime orders / spend and search by
-- name, email or phone. The questions it is actually asked
-- (docs/user-simulation.md Q3, Q12) need more:
--
--   "Who are my top 10 customers by spending this month?"
--     → totals for a period, not a lifetime (p_from / p_to)
--   "Regulars: 5+ orders", "spent at least ₱2,000"
--     → minimums on those totals (p_min_orders / p_min_spent)
--   "New customers this month", "joined before the promo"
--     → when the account was created (p_joined_from / p_joined_to)
--   "Who ordered this month?" / "who hasn't?" (win-back)
--     → p_activity: any | ordered | not_ordered, within the period
--
-- Orders and spend count COMPLETED orders and PAID transactions, as before.
-- Days are Manila days, like the reports. Everything filters here, so the
-- page count and paging stay right; sorting and paging are still PostgREST's
-- `.order()` / `.range()` on the result.
--
-- Replaces get_customer_stats(text) from 20260928000011. Every new parameter
-- has a default, so a call with only p_search (or nothing) still works.
-- Safe to run more than once.

DROP FUNCTION IF EXISTS public.get_customer_stats(text);
DROP FUNCTION IF EXISTS public.get_customer_stats();

CREATE OR REPLACE FUNCTION public.get_customer_stats(
  p_search      text    DEFAULT NULL,
  p_from        date    DEFAULT NULL,
  p_to          date    DEFAULT NULL,
  p_min_orders  integer DEFAULT NULL,
  p_min_spent   numeric DEFAULT NULL,
  p_joined_from date    DEFAULT NULL,
  p_joined_to   date    DEFAULT NULL,
  p_activity    text    DEFAULT 'any'
)
RETURNS TABLE (
  customer_id uuid,
  name text,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  "profileImage_URL" text,
  date_of_birth date,
  created_at timestamptz,
  total_orders bigint,
  total_spent numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_pattern  text;
  v_activity text := coalesce(nullif(btrim(p_activity), ''), 'any');
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_activity NOT IN ('any', 'ordered', 'not_ordered') THEN
    RAISE EXCEPTION 'Unknown activity filter: %', v_activity USING ERRCODE = '22023';
  END IF;
  IF p_from IS NOT NULL AND p_to IS NOT NULL AND p_to < p_from THEN
    RAISE EXCEPTION 'The period ends before it starts.' USING ERRCODE = '22023';
  END IF;
  IF p_joined_from IS NOT NULL AND p_joined_to IS NOT NULL AND p_joined_to < p_joined_from THEN
    RAISE EXCEPTION 'The joined range ends before it starts.' USING ERRCODE = '22023';
  END IF;

  IF nullif(btrim(coalesce(p_search, '')), '') IS NOT NULL THEN
    v_pattern := '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      c.customer_id AS s_customer_id,
      c.name AS s_name,
      c.first_name AS s_first_name,
      c.last_name AS s_last_name,
      c.email AS s_email,
      c.phone_number AS s_phone_number,
      c."profileImage_URL" AS s_image,
      c.date_of_birth AS s_date_of_birth,
      u.created_at AS s_created_at,
      COUNT(DISTINCT o.order_id) AS s_total_orders,
      COALESCE(SUM(t.total_paid), 0) AS s_total_spent
    FROM public.customer c
    LEFT JOIN auth.users u ON u.id = c.customer_id
    LEFT JOIN public."order" o
      ON o.customer_id = c.customer_id
     AND o.order_status = 'completed'
     AND (p_from IS NULL OR (o.created_at AT TIME ZONE 'Asia/Manila')::date >= p_from)
     AND (p_to   IS NULL OR (o.created_at AT TIME ZONE 'Asia/Manila')::date <= p_to)
    LEFT JOIN public.transaction t
      ON t.order_id = o.order_id
     AND t.payment_status = 'paid'
    WHERE (v_pattern IS NULL
           OR c.name ILIKE v_pattern
           OR c.email ILIKE v_pattern
           OR c.phone_number ILIKE v_pattern)
      AND (p_joined_from IS NULL OR (u.created_at AT TIME ZONE 'Asia/Manila')::date >= p_joined_from)
      AND (p_joined_to   IS NULL OR (u.created_at AT TIME ZONE 'Asia/Manila')::date <= p_joined_to)
    GROUP BY c.customer_id, u.created_at
  )
  SELECT
    s.s_customer_id, s.s_name, s.s_first_name, s.s_last_name, s.s_email,
    s.s_phone_number, s.s_image, s.s_date_of_birth, s.s_created_at,
    s.s_total_orders, s.s_total_spent
  FROM stats s
  WHERE (p_min_orders IS NULL OR s.s_total_orders >= p_min_orders)
    AND (p_min_spent  IS NULL OR s.s_total_spent  >= p_min_spent)
    AND (v_activity = 'any'
         OR (v_activity = 'ordered'     AND s.s_total_orders > 0)
         OR (v_activity = 'not_ordered' AND s.s_total_orders = 0));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text, date, date, integer, numeric, date, date, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text, date, date, integer, numeric, date, date, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats(text, date, date, integer, numeric, date, date, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
