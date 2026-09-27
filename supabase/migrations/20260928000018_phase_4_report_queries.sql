-- Phase 4: Report breakdown queries and cash remitted

-- 1. Cash remitted query
CREATE OR REPLACE FUNCTION public.get_cash_remitted(start_date date, end_date date)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.current_employee_role() != 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(SUM(t.total_paid), 0)
    FROM public.transaction t
    JOIN public."order" o ON o.order_id = t.order_id
    WHERE t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash')
      AND t.payment_status = 'paid'
      AND o.order_status = 'completed'
      AND o.created_at >= start_date::timestamp
      AND o.created_at < (end_date + interval '1 day')::timestamp
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_cash_remitted(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cash_remitted(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_cash_remitted(date, date) TO authenticated;

-- 2. Breakdown by payment method
CREATE OR REPLACE FUNCTION public.get_payment_method_breakdown(start_date date, end_date date)
RETURNS TABLE (method text, total_orders bigint, total_revenue numeric)
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
    t.payment_method AS method,
    COUNT(o.order_id) AS total_orders,
    SUM(t.total_paid) AS total_revenue
  FROM public."order" o
  JOIN public.transaction t ON t.order_id = o.order_id
  WHERE o.order_status = 'completed'
    AND o.created_at >= start_date::timestamp
    AND o.created_at < (end_date + interval '1 day')::timestamp
  GROUP BY t.payment_method;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_payment_method_breakdown(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_payment_method_breakdown(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_payment_method_breakdown(date, date) TO authenticated;

-- 3. Breakdown by cancellation reason
CREATE OR REPLACE FUNCTION public.get_cancellation_reason_breakdown(start_date date, end_date date)
RETURNS TABLE (reason text, total_orders bigint)
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
    COALESCE(o.cancellation_reason, 'No reason provided') AS reason,
    COUNT(o.order_id) AS total_orders
  FROM public."order" o
  WHERE o.order_status = 'cancelled'
    AND o.created_at >= start_date::timestamp
    AND o.created_at < (end_date + interval '1 day')::timestamp
  GROUP BY COALESCE(o.cancellation_reason, 'No reason provided')
  ORDER BY total_orders DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_cancellation_reason_breakdown(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_cancellation_reason_breakdown(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_cancellation_reason_breakdown(date, date) TO authenticated;
