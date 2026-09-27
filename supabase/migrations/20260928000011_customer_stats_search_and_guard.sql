-- get_customer_stats: search inside the function, and a manager check that
-- actually refuses non-employees.
--
-- 1. The guard in 20260928000004 was
--      IF public.current_employee_role() != 'MANAGER' THEN RAISE ...
--    For a signed-in customer the role is NULL, `NULL != 'MANAGER'` is NULL,
--    and the IF does not fire — so any customer could call the function over
--    the REST API and read every customer's name, email and phone number.
--    It is now `coalesce(..., '') <> 'MANAGER'`.
--
-- 2. The Customers page searched by building a PostgREST `.or()` filter out
--    of the search box text. That string is filter syntax, not a value: a
--    comma or bracket typed into the box broke the query, and a crafted one
--    could add conditions of its own. The search is now a parameter, matched
--    here as a plain value (with LIKE wildcards escaped).

DROP FUNCTION IF EXISTS public.get_customer_stats();

CREATE OR REPLACE FUNCTION public.get_customer_stats(p_search text DEFAULT NULL)
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
  v_pattern text;
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF nullif(btrim(coalesce(p_search, '')), '') IS NOT NULL THEN
    v_pattern := '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    c.customer_id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone_number,
    c."profileImage_URL",
    c.date_of_birth,
    u.created_at,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_spent
  FROM public.customer c
  LEFT JOIN auth.users u ON u.id = c.customer_id
  LEFT JOIN public."order" o ON o.customer_id = c.customer_id AND o.order_status = 'completed'
  LEFT JOIN public.transaction t ON t.order_id = o.order_id AND t.payment_status = 'paid'
  WHERE v_pattern IS NULL
     OR c.name ILIKE v_pattern
     OR c.email ILIKE v_pattern
     OR c.phone_number ILIKE v_pattern
  GROUP BY c.customer_id, u.created_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_stats(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
