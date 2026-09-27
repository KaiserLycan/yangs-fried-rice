-- Report breakdowns by hour of day and weekday, and cash remitted per day.
--
-- Every day and hour here is Manila time. A UTC cut-off puts a 7 AM order on
-- the previous day and the dinner rush at 11:00–13:00, which is no use to
-- anyone reading the report at the counter.
--
-- "Cash remitted" is money taken at the counter: completed pay-in-store
-- orders, dated by when they were completed (handed over and paid), falling
-- back to when they were placed for older rows without a completed_at.
--
-- The earlier functions from 20260928000005 are redefined with the same
-- signatures so their day boundaries match: the CSV puts them side by side.

-- ---------------------------------------------------------------------------
-- 1. Cash remitted, one row per day
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_cash_remitted_daily(start_date date, end_date date)
RETURNS TABLE (day date, total_orders bigint, cash_total numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    (coalesce(o.completed_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date AS day,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS cash_total
  FROM public.transaction t
  JOIN public."order" o ON o.order_id = t.order_id
  WHERE t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash')
    AND t.payment_status = 'paid'
    AND o.order_status = 'completed'
    AND (coalesce(o.completed_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date
        BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- The range total, now the sum of the daily rows.
CREATE OR REPLACE FUNCTION public.get_cash_remitted(start_date date, end_date date)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(SUM(d.cash_total), 0)
    FROM public.get_cash_remitted_daily(start_date, end_date) d
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Sales by hour of day (0–23) and by weekday (0 = Sunday … 6 = Saturday)
-- ---------------------------------------------------------------------------
-- Completed orders only, dated by when they were placed: this is about when
-- customers order, i.e. when the kitchen is busy.

CREATE OR REPLACE FUNCTION public.get_sales_by_hour(start_date date, end_date date)
RETURNS TABLE (hour integer, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    h.hour,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM generate_series(0, 23) AS h(hour)
  LEFT JOIN public."order" o
    ON o.order_status = 'completed'
   AND EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'Asia/Manila')::integer = h.hour
   AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  LEFT JOIN public.transaction t ON t.order_id = o.order_id
  GROUP BY h.hour
  ORDER BY h.hour;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_by_weekday(start_date date, end_date date)
RETURNS TABLE (weekday integer, weekday_name text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    w.dow AS weekday,
    (ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])[w.dow + 1] AS weekday_name,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM generate_series(0, 6) AS w(dow)
  LEFT JOIN public."order" o
    ON o.order_status = 'completed'
   AND EXTRACT(DOW FROM o.created_at AT TIME ZONE 'Asia/Manila')::integer = w.dow
   AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  LEFT JOIN public.transaction t ON t.order_id = o.order_id
  GROUP BY w.dow
  ORDER BY w.dow;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Earlier breakdowns, same signatures, Manila days
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_payment_method_breakdown(start_date date, end_date date)
RETURNS TABLE (method text, total_orders bigint, total_revenue numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    -- One label per kind of payment, however the row spelled it.
    CASE
      WHEN t.payment_method IN ('pay_in_store', 'pay-in-store', 'cash') THEN 'Pay in store'
      WHEN t.payment_method IN ('paymongo', 'gcash', 'paymaya') THEN 'GCash / e-wallet'
      ELSE coalesce(t.payment_method, 'Unknown')
    END AS method,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(t.total_paid), 0) AS total_revenue
  FROM public."order" o
  JOIN public.transaction t ON t.order_id = o.order_id
  WHERE o.order_status = 'completed'
    AND (o.created_at AT TIME ZONE 'Asia/Manila')::date BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 3 DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellation_reason_breakdown(start_date date, end_date date)
RETURNS TABLE (reason text, total_orders bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(public.current_employee_role(), '') <> 'MANAGER' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(NULLIF(trim(o.cancellation_reason), ''), 'No reason provided') AS reason,
    COUNT(o.order_id) AS total_orders
  FROM public."order" o
  WHERE o.order_status = 'cancelled'
    AND (coalesce(o.cancelled_at, o.created_at) AT TIME ZONE 'Asia/Manila')::date
        BETWEEN start_date AND end_date
  GROUP BY 1
  ORDER BY 2 DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Grants: signed-in callers only; each function checks for MANAGER itself
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'get_cash_remitted_daily(date, date)',
    'get_cash_remitted(date, date)',
    'get_sales_by_hour(date, date)',
    'get_sales_by_weekday(date, date)',
    'get_payment_method_breakdown(date, date)',
    'get_cancellation_reason_breakdown(date, date)'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
  END LOOP;
END;
$$;
