-- 1. get_customer_stats(filters) — the overload the Customers page calls —
--    still selected customer.date_of_birth, dropped in
--    20260929000002_remove_address_and_birthday. Every call failed at run
--    time. Recreated without it (the return type changes, so drop first).
--    The zero-argument overload has no caller left and goes too.
-- 2. The customer-facing RPCs that need a signed-in caller (order history,
--    reviews) are no longer callable by guests at all; each also checks
--    ownership itself.
-- 3. set_updated_at gets a fixed search_path (advisor 0011).

DROP FUNCTION IF EXISTS public.get_customer_stats();
DROP FUNCTION IF EXISTS public.get_customer_stats(text, date, date, integer, numeric, date, date, text);

CREATE FUNCTION public.get_customer_stats(
  p_search text DEFAULT NULL, p_from date DEFAULT NULL, p_to date DEFAULT NULL,
  p_min_orders integer DEFAULT NULL, p_min_spent numeric DEFAULT NULL,
  p_joined_from date DEFAULT NULL, p_joined_to date DEFAULT NULL, p_activity text DEFAULT 'any')
RETURNS TABLE(customer_id uuid, name text, first_name text, last_name text, email text,
              phone_number text, "profileImage_URL" text, created_at timestamptz,
              total_orders bigint, total_spent numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
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
    s.s_phone_number, s.s_image, s.s_created_at,
    s.s_total_orders, s.s_total_spent
  FROM stats s
  WHERE (p_min_orders IS NULL OR s.s_total_orders >= p_min_orders)
    AND (p_min_spent  IS NULL OR s.s_total_spent  >= p_min_spent)
    AND (v_activity = 'any'
         OR (v_activity = 'ordered'     AND s.s_total_orders > 0)
         OR (v_activity = 'not_ordered' AND s.s_total_orders = 0));
END;
$$;

REVOKE ALL ON FUNCTION public.get_customer_stats(text, date, date, integer, numeric, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats(text, date, date, integer, numeric, date, date, text) TO authenticated, service_role;

-- current_employee_role() and is_menu_manager() stay callable by anon: RLS
-- policies that guests hit (the menu, promotions) evaluate them.
REVOKE ALL ON FUNCTION public.get_customer_order_history(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_direct_product_review(uuid, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_order_review(uuid, integer, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_customer_order_history(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_direct_product_review(uuid, integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_order_review(uuid, integer, text, uuid) TO authenticated, service_role;

ALTER FUNCTION public.set_updated_at() SET search_path = public;
