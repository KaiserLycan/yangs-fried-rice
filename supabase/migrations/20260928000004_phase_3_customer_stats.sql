-- Phase 3: Customer Stats RPC
-- Retrieves customer data enriched with auth.users.created_at and aggregated lifetime stats
-- (total_orders and total_spent) from completed orders and paid transactions.

CREATE OR REPLACE FUNCTION public.get_customer_stats()
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
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.current_employee_role() != 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
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
  GROUP BY c.customer_id, u.created_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_customer_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_customer_stats() TO authenticated;
