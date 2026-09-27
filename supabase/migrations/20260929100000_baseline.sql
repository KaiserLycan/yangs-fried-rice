-- Baseline schema for Yang's Fried Rice (public schema, extensions, grants,
-- RLS, functions, triggers, realtime publication).
--
-- Dumped from the live project with `supabase db dump --linked` on 2026-09-29
-- after every earlier migration had been applied. It replaces the 57
-- incremental migrations that built it; to read those, check out commit
-- a9af4d1 (supabase/migrations/). Storage, the auth.users trigger and
-- the cron schedule are in 20260929100001_platform_setup.sql.
--
-- The live project also keeps two retention-only schemas that the app never
-- touches and a fresh project does not need: archive (delivery/rider history
-- from before the shop went pickup-only) and backup (a transaction snapshot).


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE OR REPLACE FUNCTION "public"."audit_current_actor"(OUT "actor_id" "uuid", OUT "actor_name" "text", OUT "actor_role" "text") RETURNS "record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT e.employee_id, e.name, upper(trim(e.role))
  FROM public.employee e
  WHERE e.employee_id = auth.uid()
  LIMIT 1;
$$;

ALTER FUNCTION "public"."audit_current_actor"(OUT "actor_id" "uuid", OUT "actor_name" "text", OUT "actor_role" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."audit_employee_write"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_actor     record;
  v_old       jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_new       jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  v_row       jsonb;
  v_pk        text := TG_ARGV[0];
  v_label_col text := nullif(TG_ARGV[1], '');
  v_entity    text := TG_ARGV[2];
  -- Bookkeeping: the sign-in timestamp, and password bookkeeping (a password
  -- change is recorded by the app as session.password_change instead).
  v_ignore    text[] := ARRAY['last_access_log', 'password_last_updated'];
  -- Generated columns only echo others (employee/customer `name`,
  -- customer_address `address_details`); read from the catalog so a real
  -- column that happens to share a name (add_on.name) is still recorded.
  v_generated text[];
  -- Never copied into the log: a Senior Citizen / PWD ID number (issue #116).
  v_redact    text[] := ARRAY['discount_id_number'];
  -- A customer's personal data: that it changed is recorded, never the value,
  -- so an erasure request is not defeated by a log that can't be purged.
  v_personal  text[] := CASE TG_ARGV[2]
    WHEN 'customer' THEN ARRAY['email', 'phone_number', 'date_of_birth', 'first_name',
                               'last_name', 'profileImage_URL']
    WHEN 'review'   THEN ARRAY['comment']
    WHEN 'order'    THEN ARRAY['delivery_address', 'special_instructions']
    -- What the customer wrote and the photo they sent (issue #118).
    WHEN 'order_issue' THEN ARRAY['note', 'photo_path']
    ELSE ARRAY[]::text[]
  END;
  v_changes   jsonb := '{}'::jsonb;
  v_key       text;
  v_from      jsonb;
  v_to        jsonb;
  v_label     text;
  v_noun      text;
  v_action    text;
  v_summary   text;
  v_fields    text;
  v_order_ref text;
BEGIN
  SELECT * INTO v_actor FROM public.audit_current_actor();
  IF v_actor.actor_id IS NULL THEN
    RETURN NULL;  -- not an employee: customers, webhooks, the service role
  END IF;

  SELECT coalesce(array_agg(a.attname::text), ARRAY[]::text[])
  INTO v_generated
  FROM pg_attribute a
  WHERE a.attrelid = TG_RELID
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND a.attgenerated <> '';

  v_row := coalesce(v_new, v_old);

  FOR v_key IN SELECT jsonb_object_keys(v_row) LOOP
    CONTINUE WHEN v_key = ANY (v_ignore) OR v_key = ANY (v_generated);
    v_from := CASE WHEN v_old IS NULL THEN NULL ELSE v_old -> v_key END;
    v_to   := CASE WHEN v_new IS NULL THEN NULL ELSE v_new -> v_key END;

    IF TG_OP = 'UPDATE' AND v_from IS NOT DISTINCT FROM v_to THEN
      CONTINUE;
    END IF;
    IF TG_OP = 'INSERT' AND (v_to IS NULL OR v_to = 'null'::jsonb) THEN
      CONTINUE;
    END IF;
    IF TG_OP = 'DELETE' AND (v_from IS NULL OR v_from = 'null'::jsonb) THEN
      CONTINUE;
    END IF;

    IF v_key = ANY (v_redact) THEN
      v_from := CASE WHEN v_from IS NULL OR v_from = 'null'::jsonb THEN v_from ELSE to_jsonb('[redacted]'::text) END;
      v_to   := CASE WHEN v_to   IS NULL OR v_to   = 'null'::jsonb THEN v_to   ELSE to_jsonb('[redacted]'::text) END;
    ELSIF v_key = ANY (v_personal) THEN
      v_from := CASE WHEN v_from IS NULL OR v_from = 'null'::jsonb THEN v_from ELSE to_jsonb('[personal data]'::text) END;
      v_to   := CASE WHEN v_to   IS NULL OR v_to   = 'null'::jsonb THEN v_to   ELSE to_jsonb('[personal data]'::text) END;
    END IF;

    v_changes := v_changes || jsonb_build_object(
      v_key,
      jsonb_strip_nulls(jsonb_build_object('from', v_from, 'to', v_to))
    );
  END LOOP;

  IF TG_OP = 'UPDATE' AND v_changes = '{}'::jsonb THEN
    RETURN NULL;
  END IF;

  -- Orders are named by their readable number (20260928000007); rows that
  -- belong to an order (payment, problem report) look theirs up.
  IF v_entity IN ('payment', 'order_issue') AND v_row ? 'order_id' THEN
    SELECT o.order_number::text INTO v_order_ref
    FROM public."order" o WHERE o.order_id = (v_row ->> 'order_id')::uuid;
  END IF;

  v_label := CASE
    WHEN v_entity = 'order'   THEN '#' || coalesce(v_row ->> 'order_number', left(btrim(v_row ->> 'order_id'), 8))
    WHEN v_entity = 'customer' THEN '#' || left(btrim(v_row ->> 'customer_id'), 8)
    WHEN v_entity = 'payment' THEN 'for order #' || coalesce(v_order_ref, left(btrim(coalesce(v_row ->> 'order_id', '')), 8))
    WHEN v_entity = 'order_issue' THEN 'for order #' || coalesce(v_order_ref, left(btrim(coalesce(v_row ->> 'order_id', '')), 8))
    WHEN v_label_col IS NOT NULL AND coalesce(v_row ->> v_label_col, '') <> ''
                              THEN '"' || (v_row ->> v_label_col) || '"'
    ELSE left(v_row ->> v_pk, 8)
  END;

  v_noun := CASE v_entity
    WHEN 'add_on' THEN 'Add-on'
    WHEN 'order_issue' THEN 'Problem report'
    ELSE initcap(replace(v_entity, '_', ' '))
  END;

  v_action := v_entity || '.' || CASE TG_OP
    WHEN 'INSERT' THEN 'create'
    WHEN 'UPDATE' THEN 'update'
    ELSE 'delete'
  END;

  IF TG_OP = 'UPDATE' THEN
    IF v_entity = 'order' AND v_changes ? 'order_status' THEN
      v_action := CASE WHEN v_new ->> 'order_status' = 'cancelled'
                       THEN 'order.cancel' ELSE 'order.status_change' END;
    ELSIF v_entity IN ('employee', 'customer') AND v_changes ? 'is_account_disabled' THEN
      v_action := v_entity || CASE WHEN (v_new ->> 'is_account_disabled')::boolean
                                   THEN '.disable' ELSE '.enable' END;
    ELSIF v_entity = 'employee' AND v_changes ? 'role' THEN
      v_action := 'employee.role_change';
    ELSIF v_entity = 'product' AND v_changes ? 'archived_at' THEN
      v_action := CASE WHEN v_new ->> 'archived_at' IS NULL
                       THEN 'product.restore' ELSE 'product.archive' END;
    ELSIF v_entity = 'product' AND v_changes ? 'product_price' THEN
      v_action := 'product.price_change';
    ELSIF v_entity = 'product' AND v_changes ? 'is_available' THEN
      v_action := 'product.availability_change';
    ELSIF v_entity = 'payment' AND v_changes ? 'payment_status' THEN
      v_action := 'payment.status_change';
    ELSIF v_entity = 'order_issue' AND v_changes ? 'resolved_at' AND v_new ->> 'resolved_at' IS NOT NULL THEN
      v_action := 'order_issue.resolve';
    END IF;
  END IF;

  SELECT string_agg(k, ', ' ORDER BY k) INTO v_fields FROM jsonb_object_keys(v_changes) AS k;

  v_summary := CASE v_action
    WHEN 'order.status_change' THEN
      format('Order %s: %s → %s', v_label, coalesce(v_old ->> 'order_status', '—'), v_new ->> 'order_status')
    WHEN 'order.cancel' THEN
      format('Order %s cancelled%s', v_label,
        CASE WHEN coalesce(v_new ->> 'cancellation_reason', '') <> ''
             THEN ': ' || (v_new ->> 'cancellation_reason') ELSE '' END)
    WHEN 'payment.status_change' THEN
      format('Payment %s: %s → %s', v_label, coalesce(v_old ->> 'payment_status', '—'), v_new ->> 'payment_status')
    WHEN 'product.price_change' THEN
      format('Product %s: price ₱%s → ₱%s', v_label, v_old ->> 'product_price', v_new ->> 'product_price')
    WHEN 'product.availability_change' THEN
      format('Product %s marked %s', v_label,
        CASE WHEN (v_new ->> 'is_available')::boolean THEN 'available' ELSE 'unavailable' END)
    WHEN 'order_issue.resolve' THEN
      format('Problem report %s resolved', v_label)
    WHEN 'employee.role_change' THEN
      format('Employee %s: role %s → %s', v_label, coalesce(v_old ->> 'role', '—'), v_new ->> 'role')
    ELSE
      CASE TG_OP
        WHEN 'INSERT' THEN format('%s %s created', v_noun, v_label)
        WHEN 'DELETE' THEN format('%s %s deleted', v_noun, v_label)
        ELSE format('%s %s %s', v_noun, v_label,
          CASE split_part(v_action, '.', 2)
            WHEN 'disable' THEN 'disabled'
            WHEN 'enable'  THEN 'enabled'
            WHEN 'archive' THEN 'archived'
            WHEN 'restore' THEN 'restored'
            ELSE 'updated: ' || coalesce(v_fields, '')
          END)
      END
  END;

  INSERT INTO public.audit_log (
    actor_id, actor_name, actor_role, action, entity_type, entity_id, summary, changes, source
  ) VALUES (
    v_actor.actor_id, v_actor.actor_name, v_actor.actor_role, v_action, v_entity,
    v_row ->> v_pk, left(v_summary, 500), v_changes, 'database'
  );

  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."audit_employee_write"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."audit_log_is_append_only"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: entries cannot be changed or removed.'
    USING ERRCODE = '42501';
END;
$$;

ALTER FUNCTION "public"."audit_log_is_append_only"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."best_sellers"("p_days" integer DEFAULT 30, "p_limit" integer DEFAULT 3) RETURNS TABLE("product_id" "uuid", "units_sold" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select oi.product_id, sum(oi.quantity)::bigint as units_sold
  from public.order_item oi
  join public."order" o on o.order_id = oi.order_id
  join public.product p on p.product_id = oi.product_id
  where o.order_status = 'completed'
    and o.created_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))
    and p.archived_at is null
  group by oi.product_id
  order by units_sold desc, oi.product_id
  limit greatest(1, least(p_limit, 20));
$$;

ALTER FUNCTION "public"."best_sellers"("p_days" integer, "p_limit" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."current_employee_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT upper(trim(e.role))
  FROM public.employee e
  WHERE e.employee_id = auth.uid()
    AND coalesce(e.is_account_disabled, false) = false
  LIMIT 1;
$$;

ALTER FUNCTION "public"."current_employee_role"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."expire_abandoned_orders"("p_window" interval DEFAULT '01:00:00'::interval) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public."order" AS o
       SET order_status       = 'cancelled',
           cancelled_at       = now(),
           cancellation_reason =
             'Payment wasn''t completed, so this order was cancelled. Nothing was charged.'
     WHERE o.order_status IN ('awaiting_payment', 'payment_failed')
       AND o.created_at < now() - p_window
       -- A webhook that arrived late leaves an order whose money did change
       -- hands sitting at `awaiting_payment`. Telling a customer who paid
       -- that their order is gone is far worse than an orphan row, so the
       -- transaction decides.
       AND NOT EXISTS (
         SELECT 1
           FROM public.transaction t
          WHERE t.order_id = o.order_id
            AND t.payment_status = 'paid'
       )
    RETURNING o.order_id
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

ALTER FUNCTION "public"."expire_abandoned_orders"("p_window" interval) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."expire_abandoned_orders"("p_window" interval) IS 'Cancels unpaid orders older than the window, skipping any whose transaction is paid. Returns how many were cancelled. Not scheduled by default.';

CREATE OR REPLACE FUNCTION "public"."expire_unaccepted_orders"("p_window" interval DEFAULT '00:20:00'::interval) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public."order" AS o
       SET order_status        = 'cancelled',
           cancelled_at        = now(),
           cancellation_reason = 'Store didn''t confirm in time'
     WHERE o.order_status = 'pending'
       -- An order from before pending_at existed and never stamped falls
       -- back to created_at, so it cannot wait forever.
       AND coalesce(o.pending_at, o.created_at) < now() - p_window
    RETURNING o.order_id
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$;

ALTER FUNCTION "public"."expire_unaccepted_orders"("p_window" interval) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."expire_unaccepted_orders"("p_window" interval) IS 'Cancels orders pending (not accepted by staff) for longer than the window, reason "Store didn''t confirm in time". Paid wallet orders are flagged for refund by trg_flag_refund_on_cancel. Returns how many were cancelled.';

CREATE OR REPLACE FUNCTION "public"."flag_refund_on_cancel"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.transaction
  SET payment_status = 'refund_pending',
      refund_error   = NULL
  WHERE order_id = NEW.order_id
    AND payment_status = 'paid'
    AND payment_method = 'paymongo'
    AND provider_reference_id IS NOT NULL;
  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."flag_refund_on_cancel"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."freeze_order_promised_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.promised_at IS NOT NULL
     AND NEW.promised_at IS DISTINCT FROM OLD.promised_at THEN
    RAISE EXCEPTION 'promised_at is set when the order is placed and cannot be changed.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."freeze_order_promised_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_cancellation_reason_breakdown"("start_date" "date", "end_date" "date") RETURNS TABLE("reason" "text", "total_orders" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_cancellation_reason_breakdown"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_cash_remitted"("start_date" "date", "end_date" "date") RETURNS numeric
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_cash_remitted"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_cash_remitted_daily"("start_date" "date", "end_date" "date") RETURNS TABLE("day" "date", "total_orders" bigint, "cash_total" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_cash_remitted_daily"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_customer_order_history"("p_customer_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result json;
BEGIN
  -- Security: only allow customers to fetch their own history
  IF auth.uid() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Access denied: you can only view your own order history.';
  END IF;

  SELECT json_agg(order_row ORDER BY order_row.created_at DESC)
  INTO result
  FROM (
    SELECT
      o.order_id,
      o.order_status,
      o.order_type,
      o.created_at,
      o.completed_at,
      o.special_instructions,
      o.delivery_fee,
      -- Itemized receipt: array of items in this order
      (
        SELECT COALESCE(json_agg(json_build_object(
          'order_item_id', oi.order_item_id,
          'product_id', oi.product_id,
          'product_name', p.product_name,
          'product_price', p.product_price,
          'quantity', oi.quantity,
          'subtotal', oi.subtotal,
          'special_instructions', oi.special_instructions
        )), '[]'::json)
        FROM order_item oi
        LEFT JOIN product p ON p.product_id = oi.product_id
        WHERE oi.order_id = o.order_id
      ) AS items,
      -- Payment info
      (
        SELECT COALESCE(json_agg(json_build_object(
          'transaction_id', t.transaction_id,
          'payment_method', t.payment_method,
          'payment_status', t.payment_status,
          'subtotal', t.subtotal,
          'tax_amount', t.tax_amount,
          'discount_amount', t.discount_amount,
          'total_paid', t.total_paid
        )), '[]'::json)
        FROM transaction t
        WHERE t.order_id = o.order_id
      ) AS transactions,
      -- Reviews (since there can be multiple now)
      (
        SELECT COALESCE(json_agg(json_build_object(
          'review_id', r.review_id,
          'rating', r.rating,
          'comment', r.comment,
          'product_id', r.product_id,
          'created_at', r.created_at
        )), '[]'::json)
        FROM review r
        WHERE r.order_id = o.order_id
      ) AS review
    FROM "order" o
    WHERE o.customer_id = p_customer_id
  ) AS order_row;

  -- Return empty array instead of null if no orders
  RETURN COALESCE(result, '[]'::json);
END;
$$;

ALTER FUNCTION "public"."get_customer_order_history"("p_customer_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_customer_stats"("p_search" "text" DEFAULT NULL::"text", "p_from" "date" DEFAULT NULL::"date", "p_to" "date" DEFAULT NULL::"date", "p_min_orders" integer DEFAULT NULL::integer, "p_min_spent" numeric DEFAULT NULL::numeric, "p_joined_from" "date" DEFAULT NULL::"date", "p_joined_to" "date" DEFAULT NULL::"date", "p_activity" "text" DEFAULT 'any'::"text") RETURNS TABLE("customer_id" "uuid", "name" "text", "first_name" "text", "last_name" "text", "email" "text", "phone_number" "text", "profileImage_URL" "text", "created_at" timestamp with time zone, "total_orders" bigint, "total_spent" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
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

ALTER FUNCTION "public"."get_customer_stats"("p_search" "text", "p_from" "date", "p_to" "date", "p_min_orders" integer, "p_min_spent" numeric, "p_joined_from" "date", "p_joined_to" "date", "p_activity" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_payment_method_breakdown"("start_date" "date", "end_date" "date") RETURNS TABLE("method" "text", "total_orders" bigint, "total_revenue" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_payment_method_breakdown"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_sales_by_hour"("start_date" "date", "end_date" "date") RETURNS TABLE("hour" integer, "total_orders" bigint, "total_revenue" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_sales_by_hour"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_sales_by_weekday"("start_date" "date", "end_date" "date") RETURNS TABLE("weekday" integer, "weekday_name" "text", "total_orders" bigint, "total_revenue" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."get_sales_by_weekday"("start_date" "date", "end_date" "date") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_store_status"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_s        public.store_setting%ROWTYPE;
  v_now      time := (now() AT TIME ZONE 'Asia/Manila')::time;
  v_active   integer;
  v_paused   boolean;
BEGIN
  SELECT * INTO v_s FROM public.store_setting WHERE id;

  -- The row should always exist; if someone deleted it, behave as the
  -- defaults did before this table.
  IF NOT FOUND THEN
    v_s.is_paused          := false;
    v_s.paused_until       := NULL;
    v_s.extra_prep_minutes := 0;
    v_s.max_active_orders  := 20;
    v_s.open_time          := time '08:00';
    v_s.close_time         := time '18:00';
    v_s.is_force_open      := false;
  END IF;

  -- "Active" = what the kitchen still has to cook: queue + prep.
  SELECT count(*) INTO v_active
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'preparing');

  v_paused := v_s.is_paused
          AND (v_s.paused_until IS NULL OR v_s.paused_until > now());

  RETURN jsonb_build_object(
    'is_open',            v_s.is_force_open
                          OR (v_now >= v_s.open_time AND v_now < v_s.close_time),
    'is_paused',          v_paused,
    'paused_until',       CASE WHEN v_paused THEN v_s.paused_until END,
    'is_busy',            v_active >= v_s.max_active_orders,
    'active_orders',      v_active,
    'max_active_orders',  v_s.max_active_orders,
    'open_time',          to_char(v_s.open_time,  'HH24:MI'),
    'close_time',         to_char(v_s.close_time, 'HH24:MI'),
    -- Transitional: read by submit_cart_to_order's closed message until the
    -- checkout rebuild after this migration.
    'open_hour',          extract(hour FROM v_s.open_time)::integer,
    'extra_prep_minutes', v_s.extra_prep_minutes,
    'is_force_open',      v_s.is_force_open
  );
END;
$$;

ALTER FUNCTION "public"."get_store_status"() OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_store_status"() IS 'Whether the shop is open, paused or busy right now, with the settings behind it. Read by /api/store/status, the dashboard and submit_cart_to_order.';

CREATE OR REPLACE FUNCTION "public"."guard_customer_notification_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_employee_role() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - 'is_read') IS DISTINCT FROM (to_jsonb(OLD) - 'is_read') THEN
    RAISE EXCEPTION 'Only the read flag of a notification can be changed.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."guard_customer_notification_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."guard_customer_order_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Service role (webhooks, server actions using the admin client) has no
  -- auth.uid(); staff are governed by their own policy. Only a signed-in
  -- non-employee is restricted here.
  IF auth.uid() IS NULL OR public.current_employee_role() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - ARRAY['order_status', 'cancelled_at', 'cancellation_reason'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['order_status', 'cancelled_at', 'cancellation_reason'])
  THEN
    RAISE EXCEPTION 'Customers can only cancel an order, not change it.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."guard_customer_order_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."guard_customer_self_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_employee_role() = 'MANAGER' THEN
    RETURN NEW;
  END IF;

  IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'A customer id cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF coalesce(OLD.is_account_disabled, false) AND NOT coalesce(NEW.is_account_disabled, false) THEN
    RAISE EXCEPTION 'Only the store can re-enable an account.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."guard_customer_self_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."guard_employee_self_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Service role, and managers acting through their session, are trusted.
  IF auth.uid() IS NULL OR public.current_employee_role() = 'MANAGER' THEN
    RETURN NEW;
  END IF;

  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    RAISE EXCEPTION 'An employee id cannot be changed.' USING ERRCODE = '42501';
  END IF;

  IF upper(trim(coalesce(NEW.role, ''))) IS DISTINCT FROM upper(trim(coalesce(OLD.role, ''))) THEN
    RAISE EXCEPTION 'Only a manager can change an employee''s role.' USING ERRCODE = '42501';
  END IF;

  -- Deactivating yourself is allowed (lib/actions/employee-profile.ts);
  -- undoing it is a manager's call.
  IF coalesce(OLD.is_account_disabled, false) AND NOT coalesce(NEW.is_account_disabled, false) THEN
    RAISE EXCEPTION 'Only a manager can re-enable an account.' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."guard_employee_self_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."guard_order_issue_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_ignored text[] := ARRAY['resolved_at', 'resolved_by'];
BEGIN
  -- Clearing who filed it (the customer deleted their account) or the photo
  -- (erased with it) is allowed; setting either to anything else is not.
  IF NEW.customer_id IS NULL THEN
    v_ignored := v_ignored || 'customer_id'::text;
  END IF;
  IF NEW.photo_path IS NULL THEN
    v_ignored := v_ignored || 'photo_path'::text;
  END IF;

  IF (to_jsonb(NEW) - v_ignored) IS DISTINCT FROM (to_jsonb(OLD) - v_ignored) THEN
    RAISE EXCEPTION 'A problem report can only be resolved, not changed.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."guard_order_issue_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."guard_product_price"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."guard_product_price"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."handle_password_timestamp_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    -- Update employee table if this user is an employee
    UPDATE public.employee
    SET password_last_updated = NOW()
    WHERE employee_id = NEW.id;

    -- Update customer table if this user is a customer
    UPDATE public.customer
    SET password_last_updated = NOW()
    WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_password_timestamp_update"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_menu_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.current_employee_role() IN ('MANAGER', 'STAFF');
$$;

ALTER FUNCTION "public"."is_menu_manager"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_order_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_from text := CASE WHEN TG_OP = 'UPDATE' THEN OLD.order_status END;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.order_status IS NOT DISTINCT FROM OLD.order_status THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.order_status_log (order_id, from_status, to_status, changed_by, reason)
  VALUES (
    NEW.order_id,
    v_from,
    NEW.order_status,
    auth.uid(),
    CASE WHEN NEW.order_status = 'cancelled' THEN NEW.cancellation_reason END
  );

  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."log_order_status"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."log_product_price"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

ALTER FUNCTION "public"."log_product_price"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."mark_pay_in_store_paid"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.order_status IS DISTINCT FROM 'completed'
     OR OLD.order_status IS NOT DISTINCT FROM 'completed' THEN
    RETURN NULL;
  END IF;

  UPDATE public.transaction t
  SET payment_status = 'paid',
      total_paid = greatest(0, CASE
        WHEN t.discount_type IS NOT NULL THEN
          coalesce(t.subtotal, 0) - coalesce(t.discount_amount, 0)
        ELSE
            coalesce((SELECT sum(oi.subtotal) FROM public.order_item oi   WHERE oi.order_id = NEW.order_id), 0)
          + coalesce((SELECT sum(oa.price)    FROM public.order_add_on oa WHERE oa.order_id = NEW.order_id), 0)
          + coalesce(NEW.delivery_fee, 0)
          - coalesce(t.discount_amount, 0)
      END)
  WHERE t.order_id = NEW.order_id
    AND t.payment_method = 'pay_in_store'
    AND t.payment_status = 'pending';

  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."mark_pay_in_store_paid"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."notify_customer_of_order_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  -- The readable order number (20260928000007), as formatOrderNumber prints it.
  v_ref     text := '#' || coalesce(NEW.order_number::text, left(NEW.order_id::text, 8));
  v_kind    text;
  v_message text;
  v_reason  text := nullif(btrim(coalesce(NEW.cancellation_reason, '')), '');
BEGIN
  IF NEW.customer_id IS NULL
     OR NEW.order_status IS NOT DISTINCT FROM OLD.order_status THEN
    RETURN NEW;
  END IF;

  CASE NEW.order_status
    WHEN 'pending' THEN
      -- Only the move out of a payment gate is news. `pending` is also where
      -- a pay-in-store order starts, but that is an INSERT, not this trigger.
      IF OLD.order_status IN ('awaiting_payment', 'payment_failed') THEN
        v_kind    := 'payment_received';
        v_message := 'Payment received for order ' || v_ref || '. The kitchen has your order.';
      END IF;
    WHEN 'payment_failed' THEN
      v_kind    := 'payment_failed';
      v_message := 'Payment for order ' || v_ref || ' didn''t go through. Open the order to try again or pay at the counter.';
    WHEN 'preparing' THEN
      v_kind    := 'order_preparing';
      v_message := 'The kitchen accepted order ' || v_ref || ' and is cooking it now.';
    WHEN 'ready' THEN
      v_kind    := 'order_ready';
      v_message := 'Your order ' || v_ref || ' is ready for pickup — Counter 1, say your order number.';
    WHEN 'completed' THEN
      v_kind    := 'order_completed';
      v_message := 'Order ' || v_ref || ' picked up. Enjoy! Something missing or wrong? Report it from the order page within 24 hours.';
    WHEN 'cancelled' THEN
      -- A customer who cancelled their own order does not need telling.
      IF auth.uid() IS DISTINCT FROM NEW.customer_id THEN
        v_kind    := 'order_cancelled';
        v_message := 'Order ' || v_ref || ' was cancelled by the store.'
          || CASE WHEN v_reason IS NOT NULL THEN ' Reason: ' || left(v_reason, 300) ELSE '' END;
      END IF;
    ELSE
      NULL;
  END CASE;

  IF v_message IS NOT NULL THEN
    INSERT INTO public.notification (customer_id, order_id, kind, message)
    VALUES (NEW.customer_id, NEW.order_id, v_kind, v_message);
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."notify_customer_of_order_status"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."record_employee_action"("p_action" "text", "p_entity_type" "text", "p_entity_id" "text", "p_summary" "text", "p_changes" "jsonb" DEFAULT '{}'::"jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_actor     record;
  v_id        bigint;
  v_entity_id text := nullif(btrim(coalesce(p_entity_id, '')), '');
  v_is_self   boolean;
BEGIN
  SELECT * INTO v_actor FROM public.audit_current_actor();
  IF v_actor.actor_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_is_self := v_entity_id IS NULL OR v_entity_id = v_actor.actor_id::text;

  -- Each action, the record it must be about, and who may record it.
  IF p_action IN ('session.sign_in', 'session.sign_out', 'session.password_change') THEN
    IF p_entity_type IS DISTINCT FROM 'session' OR NOT v_is_self THEN
      RAISE EXCEPTION 'A session event can only be about the caller.' USING ERRCODE = '42501';
    END IF;
  ELSIF p_action IN ('employee.photo_change', 'employee.delete') THEN
    -- Self-service (own photo, own account) or a manager acting on someone.
    IF p_entity_type IS DISTINCT FROM 'employee' OR v_entity_id IS NULL
       OR (v_entity_id <> v_actor.actor_id::text AND v_actor.actor_role IS DISTINCT FROM 'MANAGER') THEN
      RAISE EXCEPTION 'Only a manager can record that for another employee.' USING ERRCODE = '42501';
    END IF;
  ELSIF p_action IN ('employee.create', 'employee.update', 'employee.password_reset',
                     'employee.disable', 'employee.enable', 'employee.role_change') THEN
    IF p_entity_type IS DISTINCT FROM 'employee' OR v_entity_id IS NULL
       OR v_actor.actor_role IS DISTINCT FROM 'MANAGER' THEN
      RAISE EXCEPTION 'Only a manager can record employee management.' USING ERRCODE = '42501';
    END IF;
  ELSIF p_action = 'report.export' THEN
    IF p_entity_type IS DISTINCT FROM 'report' OR v_actor.actor_role IS DISTINCT FROM 'MANAGER' THEN
      RAISE EXCEPTION 'Only a manager can export reports.' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unknown audit action: %', coalesce(p_action, 'null')
      USING ERRCODE = '22023';
  END IF;

  IF p_summary IS NULL OR length(btrim(p_summary)) = 0 THEN
    RAISE EXCEPTION 'An audit entry needs a summary.' USING ERRCODE = '22023';
  END IF;

  IF p_changes IS NOT NULL AND jsonb_typeof(p_changes) <> 'object' THEN
    RAISE EXCEPTION 'Audit changes must be a JSON object.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.audit_log (
    actor_id, actor_name, actor_role, action, entity_type, entity_id, summary, changes, source
  ) VALUES (
    v_actor.actor_id, v_actor.actor_name, v_actor.actor_role,
    p_action, p_entity_type, v_entity_id,
    left(btrim(p_summary), 500), coalesce(p_changes, '{}'::jsonb), 'app'
  )
  RETURNING audit_id INTO v_id;

  RETURN v_id;
END;
$$;

ALTER FUNCTION "public"."record_employee_action"("p_action" "text", "p_entity_type" "text", "p_entity_id" "text", "p_summary" "text", "p_changes" "jsonb") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_order_pending_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.order_status = 'pending'
     AND (TG_OP = 'INSERT' OR OLD.order_status IS DISTINCT FROM 'pending')
  THEN
    NEW.pending_at := now();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_order_pending_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_order_ready_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.order_status = 'ready'
     AND (TG_OP = 'INSERT' OR OLD.order_status IS DISTINCT FROM 'ready')
  THEN
    NEW.ready_at := now();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_order_ready_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."submit_cart_to_order"("p_cart_id" "uuid", "p_order_type" "text" DEFAULT 'take_out'::"text", "p_special_instructions" "text" DEFAULT NULL::"text", "p_payment_method" "text" DEFAULT 'pay-in-store'::"text", "p_expected_prices" "jsonb" DEFAULT NULL::"jsonb", "p_discount" "jsonb" DEFAULT NULL::"jsonb", "p_fulfillment_method" "text" DEFAULT 'self_pickup'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_uid           uuid := auth.uid();
  v_cart          public.cart%ROWTYPE;
  v_disabled      boolean;
  v_unavailable   text;
  v_order_id      uuid;
  v_order_status  text;
  v_txn_method    text;
  v_instructions  text := nullif(btrim(coalesce(p_special_instructions, '')), '');
  v_line          record;
  v_order_item_id uuid;
  v_subtotal      numeric(10,2);
  v_now           timestamptz := now();
  -- Issue #115
  v_store         jsonb;
  v_item_count    integer;
  v_price_changes text;
  -- Issue #116
  v_ahead         integer;
  v_promised_at   timestamptz;
  -- Issue #116, ticket 03
  v_discount_type text;
  v_discount_id   text;
  v_name_on_id    text;
  v_photo_path    text;
  v_txn_subtotal  numeric(10,2);
  v_tax           numeric(10,2);
  v_discount      numeric(10,2);
BEGIN
  -- Who is asking ----------------------------------------------------------
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in.' USING HINT = 'UNAUTHORIZED';
  END IF;

  SELECT coalesce(c.is_account_disabled, false)
  INTO v_disabled
  FROM public.customer c
  WHERE c.customer_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'You are not registered as a customer.' USING HINT = 'FORBIDDEN';
  END IF;
  IF v_disabled THEN
    RAISE EXCEPTION 'Your account has been disabled. Please contact the store.'
      USING HINT = 'ACCOUNT_DISABLED';
  END IF;

  -- What they asked for ----------------------------------------------------
  IF p_order_type IS NULL OR p_order_type NOT IN ('take_out', 'dine_in') THEN
    RAISE EXCEPTION 'We only take pickup orders.' USING HINT = 'INVALID_ORDER_TYPE';
  END IF;

  -- #116: the wallet itself (gcash / paymaya) is accepted and recorded.
  IF p_payment_method IS NULL
     OR p_payment_method NOT IN ('gcash', 'paymaya', 'wallet', 'pay-in-store') THEN
    RAISE EXCEPTION 'Choose GCash / Maya or pay in store.' USING HINT = 'INVALID_PAYMENT_METHOD';
  END IF;

  IF p_fulfillment_method IS NULL OR p_fulfillment_method NOT IN ('self_pickup', '3rd_party_courier') THEN
    RAISE EXCEPTION 'Tell us who is picking up the order.' USING HINT = 'INVALID_INPUT';
  END IF;

  IF v_instructions IS NOT NULL AND length(v_instructions) > 500 THEN
    RAISE EXCEPTION 'Special instructions cannot exceed 500 characters.'
      USING HINT = 'INVALID_INPUT';
  END IF;

  IF p_expected_prices IS NOT NULL AND jsonb_typeof(p_expected_prices) <> 'object' THEN
    RAISE EXCEPTION 'Invalid price check.' USING HINT = 'INVALID_INPUT';
  END IF;

  -- Senior Citizen / PWD discount (#116 ticket 03). One ID per order. -----
  IF p_discount IS NOT NULL AND jsonb_typeof(p_discount) <> 'null' THEN
    IF jsonb_typeof(p_discount) <> 'object' THEN
      RAISE EXCEPTION 'Invalid discount.' USING HINT = 'INVALID_DISCOUNT';
    END IF;

    v_discount_type := p_discount->>'type';
    v_discount_id   := nullif(btrim(coalesce(p_discount->>'id_number', '')), '');
    v_name_on_id    := nullif(btrim(coalesce(p_discount->>'name_on_id', '')), '');
    v_photo_path    := p_discount->>'photo_path';

    IF v_discount_type IS NULL OR v_discount_type NOT IN ('senior_citizen', 'pwd') THEN
      RAISE EXCEPTION 'Choose Senior Citizen or PWD.' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    IF v_discount_id IS NULL OR length(v_discount_id) > 40 THEN
      RAISE EXCEPTION 'Enter the ID number (up to 40 characters).' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    IF v_name_on_id IS NULL OR length(v_name_on_id) > 100 THEN
      RAISE EXCEPTION 'Enter the name on the ID (up to 100 characters).' USING HINT = 'INVALID_DISCOUNT';
    END IF;
    -- The photo must be one this customer uploaded, into their own folder
    -- of the private bucket, and not one already used on another order.
    IF v_photo_path IS NULL
       OR v_photo_path !~ ('^' || v_uid::text || '/[^/]+$')
       OR NOT EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = 'senior-pwd-ids' AND o.name = v_photo_path)
       OR EXISTS (
            SELECT 1 FROM public.transaction t
            WHERE t.discount_id_photo_path = v_photo_path) THEN
      RAISE EXCEPTION 'Add a photo of the ID.' USING HINT = 'INVALID_DISCOUNT';
    END IF;
  END IF;

  -- Is the shop taking orders? (issue #115) --------------------------------
  -- Closed is reported before paused, and paused before busy: at 9pm "we
  -- open at 8" is the useful answer, not "very busy".
  v_store := public.get_store_status();

  IF NOT (v_store->>'is_open')::boolean THEN
    RAISE EXCEPTION 'We''re closed right now. We open at %.',
      to_char((v_store->>'open_time')::time, 'FMHH12:MI AM')
      USING HINT = 'STORE_CLOSED';
  END IF;

  IF (v_store->>'is_paused')::boolean THEN
    RAISE EXCEPTION 'We''re very busy right now. Please try again in a few minutes.'
      USING HINT = 'STORE_PAUSED';
  END IF;

  IF (v_store->>'is_busy')::boolean THEN
    RAISE EXCEPTION 'We''re very busy right now. Please try again in a few minutes.'
      USING HINT = 'STORE_BUSY';
  END IF;

  -- Lock the cart for the rest of the transaction --------------------------
  -- A second call for the same cart waits here until this one commits, then
  -- sees is_final = true and stops. That is the double-submit fix.
  SELECT * INTO v_cart
  FROM public.cart
  WHERE cart_id = p_cart_id
  FOR UPDATE;

  -- Someone else's cart reads as not found, so ids cannot be probed.
  IF NOT FOUND OR v_cart.customer_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Cart not found.' USING HINT = 'NOT_FOUND';
  END IF;

  IF v_cart.is_final THEN
    RAISE EXCEPTION 'Cart is already submitted and locked.' USING HINT = 'CART_LOCKED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.cart_item WHERE cart_id = p_cart_id) THEN
    RAISE EXCEPTION 'Cannot submit an empty cart.' USING HINT = 'EMPTY_CART';
  END IF;

  -- Bulk-order cap (issue #115) --------------------------------------------
  SELECT coalesce(sum(ci.quantity), 0)
  INTO v_item_count
  FROM public.cart_item ci
  WHERE ci.cart_id = p_cart_id;

  IF v_item_count > 30 THEN
    RAISE EXCEPTION 'That''s a big order! Please contact us for a bulk order or catering.'
      USING HINT = 'ORDER_TOO_LARGE';
  END IF;

  -- Per-dish limit (issue #115) --------------------------------------------
  SELECT p.product_name
  INTO v_unavailable
  FROM public.cart_item ci
  JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id
  GROUP BY p.product_id, p.product_name
  HAVING sum(ci.quantity) > 20
  LIMIT 1;

  IF v_unavailable IS NOT NULL THEN
    RAISE EXCEPTION 'You can only order up to 20 of each dish (%).', v_unavailable
      USING HINT = 'ITEM_LIMIT_EXCEEDED';
  END IF;

  -- Everything in the cart must still be on sale. A line whose product was
  -- deleted, archived or switched off since it was added is named, so the
  -- customer knows what to remove.
  SELECT string_agg(DISTINCT coalesce(p.product_name, 'An item that was removed from the menu'), ', ')
  INTO v_unavailable
  FROM public.cart_item ci
  LEFT JOIN public.product p ON p.product_id = ci.product_id
  WHERE ci.cart_id = p_cart_id
    AND (p.product_id IS NULL OR p.archived_at IS NOT NULL OR p.is_available IS FALSE);

  IF v_unavailable IS NOT NULL THEN
    RAISE EXCEPTION 'No longer available: %. Remove it from your cart to continue.', v_unavailable
      USING HINT = 'ITEM_UNAVAILABLE';
  END IF;

  -- Prices changed since the customer looked? (issue #115) -----------------
  -- Every line is priced from the menu below regardless; this only stops the
  -- order being placed at a price the customer never saw. Nothing is
  -- written, so they can review the cart and try again.
  IF p_expected_prices IS NOT NULL THEN
    SELECT string_agg(
             format('%s ₱%s → ₱%s',
                    live.product_name,
                    to_char(live.expected, 'FM999,999,990.00'),
                    to_char(live.unit_price, 'FM999,999,990.00')),
             ', ' ORDER BY live.product_name)
    INTO v_price_changes
    FROM (
      SELECT
        p.product_name,
        (p_expected_prices->>ci.cart_item_id::text)::numeric AS expected,
        p.product_price
          + coalesce((
              SELECT sum(a.price)
              FROM public.cart_item_add_on cia
              JOIN public.add_on a ON a.addon_id = cia.addon_id
              WHERE cia.cart_item_id = ci.cart_item_id
            ), 0) AS unit_price
      FROM public.cart_item ci
      JOIN public.product p ON p.product_id = ci.product_id
      WHERE ci.cart_id = p_cart_id
        AND jsonb_typeof(p_expected_prices->ci.cart_item_id::text) = 'number'
    ) AS live
    WHERE abs(live.unit_price - live.expected) >= 0.005;

    IF v_price_changes IS NOT NULL THEN
      RAISE EXCEPTION 'Prices changed: %. Please review your cart.', v_price_changes
        USING HINT = 'PRICE_CHANGED';
    END IF;
  END IF;

  -- A wallet order waits for PayMongo's webhook before the kitchen sees it;
  -- paying at the counter is collected later by design (issue #106).
  v_order_status := CASE WHEN p_payment_method = 'pay-in-store' THEN 'pending' ELSE 'awaiting_payment' END;
  -- #116: record the wallet; `wallet` from an older client stays `paymongo`.
  v_txn_method   := CASE p_payment_method
                      WHEN 'pay-in-store' THEN 'pay_in_store'
                      WHEN 'wallet'       THEN 'paymongo'
                      ELSE p_payment_method
                    END;

  -- #116: the promise. Mirrors ACTIVE_KITCHEN_STATUSES in
  -- lib/orders/kitchen-queue.ts. Worked out here, not passed in, so a
  -- customer cannot promise themselves a time.
  SELECT count(*) INTO v_ahead
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'confirmed', 'preparing');

  v_promised_at := v_now + make_interval(mins => least(60, 15 + 3 * v_ahead) + 5);

  -- Write ------------------------------------------------------------------
  INSERT INTO public."order" (
    customer_id, cart_id, order_status, order_type,
    special_instructions, delivery_fee, created_at,
    promised_at, fulfillment_method
  )
  VALUES (
    v_uid, p_cart_id, v_order_status, p_order_type,
    v_instructions, 0, v_now,
    v_promised_at, p_fulfillment_method
  )
  RETURNING order_id INTO v_order_id;

  -- Lines are priced here, from the menu, never from anything the browser
  -- sent. unit_price includes the line's add-ons; subtotal is unit × qty —
  -- the same figures the cart showed.
  FOR v_line IN
    SELECT
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      ci.special_instructions,
      p.product_name,
      p.product_price
        + coalesce((
            SELECT sum(a.price)
            FROM public.cart_item_add_on cia
            JOIN public.add_on a ON a.addon_id = cia.addon_id
            WHERE cia.cart_item_id = ci.cart_item_id
          ), 0) AS unit_price
    FROM public.cart_item ci
    JOIN public.product p ON p.product_id = ci.product_id
    WHERE ci.cart_id = p_cart_id
  LOOP
    INSERT INTO public.order_item (
      order_id, product_id, quantity, subtotal,
      special_instructions, product_name, unit_price
    )
    VALUES (
      v_order_id, v_line.product_id, v_line.quantity,
      v_line.unit_price * v_line.quantity,
      v_line.special_instructions, v_line.product_name, v_line.unit_price
    )
    RETURNING order_item_id INTO v_order_item_id;

    INSERT INTO public.order_item_add_on (order_item_id, addon_id)
    SELECT v_order_item_id, cia.addon_id
    FROM public.cart_item_add_on cia
    JOIN public.add_on a ON a.addon_id = cia.addon_id
    WHERE cia.cart_item_id = v_line.cart_item_id;
  END LOOP;

  -- Order-level add-ons (rice, drinks …), priced from add_on now.
  INSERT INTO public.order_add_on (order_id, addon_id, price)
  SELECT v_order_id, ca.addon_id, a.price
  FROM public.cart_add_on ca
  JOIN public.add_on a ON a.addon_id = ca.addon_id
  WHERE ca.cart_id = p_cart_id;

  SELECT
    coalesce((SELECT sum(subtotal) FROM public.order_item   WHERE order_id = v_order_id), 0)
  + coalesce((SELECT sum(price)    FROM public.order_add_on WHERE order_id = v_order_id), 0)
  INTO v_subtotal;

  -- The payment row every order needs: `create-payment-intent` reuses it for
  -- a wallet order, and the counter marks it paid for pay-in-store.
  -- Amount due is always subtotal - discount_amount. Same rounding as
  -- vatBreakdown() / seniorPwdBreakdown() in lib/menu/cart-totals.ts.
  IF v_discount_type IS NULL THEN
    -- #116: tax_amount is the 12% VAT already inside the price.
    v_txn_subtotal := v_subtotal;
    v_tax          := round(v_subtotal * 12 / 112, 2);
    v_discount     := 0;
  ELSE
    -- #116 ticket 03: VAT-exempt, then 20% off what is left.
    -- ₱112 → ₱100 VAT-exempt sales, ₱20 discount, ₱80 due.
    v_txn_subtotal := round(v_subtotal * 100 / 112, 2);
    v_tax          := 0;
    v_discount     := round(v_txn_subtotal * 20 / 100, 2);
  END IF;

  INSERT INTO public.transaction (
    order_id, payment_method, payment_status,
    subtotal, tax_amount, discount_amount, total_paid, transaction_date,
    discount_type, discount_id_number, name_on_id, discount_id_photo_path
  )
  VALUES (
    v_order_id, v_txn_method, 'pending',
    v_txn_subtotal, v_tax, v_discount, 0, v_now,
    v_discount_type, v_discount_id, v_name_on_id, v_photo_path
  );

  UPDATE public.cart
  SET is_final     = true,
      status       = 'submitted',
      order_id     = v_order_id,
      submitted_at = v_now,
      updated_at   = v_now
  WHERE cart_id = p_cart_id;

  RETURN jsonb_build_object(
    'order_id',     v_order_id,
    'order_status', v_order_status,
    'cart_id',      p_cart_id,
    'is_final',     true
  );
END;
$_$;

ALTER FUNCTION "public"."submit_cart_to_order"("p_cart_id" "uuid", "p_order_type" "text", "p_special_instructions" "text", "p_payment_method" "text", "p_expected_prices" "jsonb", "p_discount" "jsonb", "p_fulfillment_method" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."submit_direct_product_review"("p_product_id" "uuid", "p_rating" integer, "p_comment" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_product record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  -- 1. Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- 2. Verify product exists
  SELECT product_id INTO v_product
  FROM "product"
  WHERE product_id = p_product_id;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  -- 3. Check for existing direct review
  SELECT review_id INTO v_existing_review_id
  FROM review
  WHERE customer_id = auth.uid() AND product_id = p_product_id AND order_id IS NULL;
  
  IF v_existing_review_id IS NOT NULL THEN
    RAISE EXCEPTION 'You have already submitted a direct review for this product.';
  END IF;

  -- 4. Insert the review
  INSERT INTO review (customer_id, order_id, rating, comment, product_id)
  VALUES (auth.uid(), NULL, p_rating, p_comment, p_product_id)
  RETURNING * INTO v_new_review;

  -- 5. Return the new review as JSON
  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'product_id', v_new_review.product_id,
    'created_at', v_new_review.created_at
  );
END;
$$;

ALTER FUNCTION "public"."submit_direct_product_review"("p_product_id" "uuid", "p_rating" integer, "p_comment" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."submit_order_review"("p_order_id" "uuid", "p_rating" integer, "p_comment" "text" DEFAULT NULL::"text", "p_product_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_order record;
  v_existing_review_id uuid;
  v_new_review review%ROWTYPE;
BEGIN
  -- 1. Validate rating
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- 2. Fetch the order and verify ownership
  SELECT order_id, customer_id, order_status
  INTO v_order
  FROM "order"
  WHERE order_id = p_order_id;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.customer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied: this order does not belong to you.';
  END IF;

  -- 3. Verify the order is completed
  IF v_order.order_status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can only review completed orders. Current status: %.', v_order.order_status;
  END IF;

  -- 4. Check for existing review
  IF p_product_id IS NULL THEN
    SELECT review_id INTO v_existing_review_id
    FROM review
    WHERE order_id = p_order_id AND product_id IS NULL;
    
    IF v_existing_review_id IS NOT NULL THEN
      RAISE EXCEPTION 'You have already submitted an order-level review for this order.';
    END IF;
  ELSE
    SELECT review_id INTO v_existing_review_id
    FROM review
    WHERE order_id = p_order_id AND product_id = p_product_id;
    
    IF v_existing_review_id IS NOT NULL THEN
      RAISE EXCEPTION 'You have already reviewed this product for this order.';
    END IF;
  END IF;

  -- 5. Insert the review
  INSERT INTO review (customer_id, order_id, rating, comment, product_id)
  VALUES (auth.uid(), p_order_id, p_rating, p_comment, p_product_id)
  RETURNING * INTO v_new_review;

  -- 6. Return the new review as JSON
  RETURN json_build_object(
    'review_id', v_new_review.review_id,
    'order_id', v_new_review.order_id,
    'customer_id', v_new_review.customer_id,
    'rating', v_new_review.rating,
    'comment', v_new_review.comment,
    'product_id', v_new_review.product_id,
    'created_at', v_new_review.created_at
  );
END;
$$;

ALTER FUNCTION "public"."submit_order_review"("p_order_id" "uuid", "p_rating" integer, "p_comment" "text", "p_product_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."touch_store_setting"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."touch_store_setting"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_password_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Checks if the new password is different from the old one
  IF NEW.password IS DISTINCT FROM OLD.password THEN
    NEW.password_last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_password_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."add_on" (
    "addon_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL
);

ALTER TABLE "public"."add_on" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "audit_id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid",
    "actor_name" "text",
    "actor_role" "text",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text",
    "summary" "text" NOT NULL,
    "changes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "source" "text" NOT NULL,
    CONSTRAINT "audit_log_action_check" CHECK (("action" ~ '^[a-z_]+\.[a-z_]+$'::"text")),
    CONSTRAINT "audit_log_entity_type_check" CHECK (("entity_type" ~ '^[a-z_]+$'::"text")),
    CONSTRAINT "audit_log_source_check" CHECK (("source" = ANY (ARRAY['database'::"text", 'app'::"text"]))),
    CONSTRAINT "audit_log_summary_check" CHECK ((("length"("summary") >= 1) AND ("length"("summary") <= 500)))
);

ALTER TABLE "public"."audit_log" OWNER TO "postgres";

COMMENT ON TABLE "public"."audit_log" IS 'Append-only record of every employee action. Written by trg_audit_employee_write and record_employee_action(); read by managers only.';

ALTER TABLE "public"."audit_log" ALTER COLUMN "audit_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_log_audit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."cart" (
    "cart_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "order_id" "uuid",
    "is_final" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "submitted_at" timestamp with time zone,
    "fulfillment_method" "text"
);

ALTER TABLE "public"."cart" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."cart_add_on" (
    "cart_add_on_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_id" "uuid",
    "addon_id" "uuid"
);

ALTER TABLE "public"."cart_add_on" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."cart_item" (
    "cart_item_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_id" "uuid",
    "product_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "special_instructions" "text",
    CONSTRAINT "cart_item_quantity_range" CHECK ((("quantity" >= 1) AND ("quantity" <= 20)))
);

ALTER TABLE "public"."cart_item" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."cart_item_add_on" (
    "cart_item_add_on_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_item_id" "uuid",
    "addon_id" "uuid"
);

ALTER TABLE "public"."cart_item_add_on" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_name" "text" NOT NULL,
    CONSTRAINT "categories_category_name_check" CHECK ((("char_length"("btrim"("category_name")) >= 2) AND ("char_length"("btrim"("category_name")) <= 40)))
);

ALTER TABLE "public"."categories" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."customer" (
    "customer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "phone_number" "text",
    "profileImage_URL" "text",
    "password_last_updated" timestamp with time zone DEFAULT "now"(),
    "is_account_disabled" boolean DEFAULT false NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "name" "text" GENERATED ALWAYS AS ("btrim"((("first_name" || ' '::"text") || "last_name"))) STORED,
    CONSTRAINT "customer_email_check" CHECK ((("email" IS NULL) OR ((("char_length"("email") >= 6) AND ("char_length"("email") <= 254)) AND ("email" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::"text")))),
    CONSTRAINT "customer_first_name_check" CHECK (((("char_length"("first_name") >= 2) AND ("char_length"("first_name") <= 50)) AND ("first_name" = "btrim"("first_name")) AND ("first_name" !~ '[0-9]'::"text"))),
    CONSTRAINT "customer_last_name_check" CHECK (((("char_length"("last_name") >= 2) AND ("char_length"("last_name") <= 50)) AND ("last_name" = "btrim"("last_name")) AND ("last_name" !~ '[0-9]'::"text"))),
    CONSTRAINT "customer_phone_number_check" CHECK ((("phone_number" IS NULL) OR ("phone_number" ~ '^\+639[0-9]{9}$'::"text")))
);

ALTER TABLE "public"."customer" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."employee" (
    "employee_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "text",
    "schedule_shift" "text",
    "last_access_log" timestamp with time zone,
    "email" character varying NOT NULL,
    "profileImage_URL" "text",
    "password_last_updated" timestamp with time zone DEFAULT "now"(),
    "is_account_disabled" boolean DEFAULT false NOT NULL,
    "phone_number" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "name" "text" GENERATED ALWAYS AS ("btrim"((("first_name" || ' '::"text") || "last_name"))) STORED,
    CONSTRAINT "employee_email_check" CHECK ((("email" IS NULL) OR ((("char_length"(("email")::"text") >= 6) AND ("char_length"(("email")::"text") <= 254)) AND (("email")::"text" ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'::"text")))),
    CONSTRAINT "employee_first_name_check" CHECK (((("char_length"("first_name") >= 2) AND ("char_length"("first_name") <= 50)) AND ("first_name" = "btrim"("first_name")) AND ("first_name" !~ '[0-9]'::"text"))),
    CONSTRAINT "employee_last_name_check" CHECK (((("char_length"("last_name") >= 2) AND ("char_length"("last_name") <= 50)) AND ("last_name" = "btrim"("last_name")) AND ("last_name" !~ '[0-9]'::"text"))),
    CONSTRAINT "employee_phone_num_check" CHECK ((("phone_number" IS NULL) OR ("phone_number" ~ '^\+639[0-9]{9}$'::"text"))),
    CONSTRAINT "employee_role_check" CHECK ((("role" IS NULL) OR ("role" = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text", 'RIDER'::"text"]))))
);

ALTER TABLE "public"."employee" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."login_attempt" (
    "login_attempt_id" bigint NOT NULL,
    "email_hash" "text" NOT NULL,
    "ip" "text",
    "attempted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."login_attempt" OWNER TO "postgres";

COMMENT ON TABLE "public"."login_attempt" IS 'Failed password sign-ins, counted for rate limiting. Service role only.';

ALTER TABLE "public"."login_attempt" ALTER COLUMN "login_attempt_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."login_attempt_login_attempt_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."notification" (
    "notification_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order_id" "uuid",
    "kind" "text"
);

ALTER TABLE "public"."notification" OWNER TO "postgres";

COMMENT ON COLUMN "public"."notification"."order_id" IS 'The order this message is about, or null for a general message. The bell links to /orders/<order_id>.';

COMMENT ON COLUMN "public"."notification"."kind" IS 'What happened, as a stable key: order_preparing, order_ready, order_completed, order_cancelled, payment_received, payment_failed.';

CREATE TABLE IF NOT EXISTS "public"."order" (
    "order_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "order_type" "text",
    "order_status" "text",
    "delivery_fee" numeric(10,2) DEFAULT 0.00,
    "completed_at" timestamp with time zone,
    "special_instructions" "text",
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cart_id" "uuid",
    "pending_at" timestamp with time zone,
    "promised_at" timestamp with time zone,
    "fulfillment_method" "text",
    "order_number" bigint NOT NULL,
    "ready_at" timestamp with time zone,
    CONSTRAINT "order_fulfillment_method_check" CHECK ((("fulfillment_method" IS NULL) OR ("fulfillment_method" = ANY (ARRAY['self_pickup'::"text", '3rd_party_courier'::"text"]))))
);

ALTER TABLE "public"."order" OWNER TO "postgres";

COMMENT ON COLUMN "public"."order"."cart_id" IS 'The cart this order was placed from. Unique: one cart can produce at most one order.';

COMMENT ON COLUMN "public"."order"."pending_at" IS 'When the order last became pending (entered the kitchen queue). Set by trg_set_order_pending_at. The 20-minute unaccepted timeout counts from here.';

COMMENT ON COLUMN "public"."order"."promised_at" IS 'The ready-by time quoted when the order was placed. Set once by submit_cart_to_order; never changed.';

COMMENT ON COLUMN "public"."order"."order_number" IS 'The number people say out loud: #1042. Assigned by the database in order, never reused, never editable. formatOrderNumber (lib/orders/order-number.ts) prints it.';

CREATE TABLE IF NOT EXISTS "public"."order_add_on" (
    "order_add_on_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "addon_id" "uuid",
    "price" numeric(10,2) NOT NULL
);

ALTER TABLE "public"."order_add_on" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."order_issue" (
    "issue_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "order_item_ids" "uuid"[] NOT NULL,
    "issue_type" "text" NOT NULL,
    "note" "text",
    "photo_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "order_issue_issue_type_check" CHECK (("issue_type" = ANY (ARRAY['missing'::"text", 'wrong'::"text", 'damaged'::"text"]))),
    CONSTRAINT "order_issue_note_check" CHECK ((("note" IS NULL) OR ("length"("note") <= 500))),
    CONSTRAINT "order_issue_order_item_ids_check" CHECK ((("cardinality"("order_item_ids") >= 1) AND ("cardinality"("order_item_ids") <= 50))),
    CONSTRAINT "order_issue_photo_path_check" CHECK ((("photo_path" IS NULL) OR ("photo_path" ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$'::"text")))
);

ALTER TABLE "public"."order_issue" OWNER TO "postgres";

COMMENT ON TABLE "public"."order_issue" IS 'A customer''s missing / wrong / damaged item report on a completed order (limitations #24). Refunds stay manual.';

CREATE TABLE IF NOT EXISTS "public"."order_item" (
    "order_item_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "special_instructions" "text",
    "product_name" "text",
    "unit_price" numeric(10,2),
    CONSTRAINT "order_item_quantity_positive" CHECK (("quantity" > 0))
);

ALTER TABLE "public"."order_item" OWNER TO "postgres";

COMMENT ON COLUMN "public"."order_item"."product_name" IS 'The product name as it was when this line was ordered. Readers prefer this over joining product; the join is only a fallback for rows written before this column existed.';

COMMENT ON COLUMN "public"."order_item"."unit_price" IS 'Price per unit as charged, including this line''s add-ons. subtotal stays the line total; this makes it divisible without guessing.';

CREATE TABLE IF NOT EXISTS "public"."order_item_add_on" (
    "order_item_add_on_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_item_id" "uuid",
    "addon_id" "uuid"
);

ALTER TABLE "public"."order_item_add_on" OWNER TO "postgres";

ALTER TABLE "public"."order" ALTER COLUMN "order_number" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."order_order_number_seq"
    START WITH 1220
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."order_status_log" (
    "log_id" bigint NOT NULL,
    "order_id" "uuid" NOT NULL,
    "from_status" "text",
    "to_status" "text",
    "changed_by" "uuid",
    "reason" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."order_status_log" OWNER TO "postgres";

COMMENT ON TABLE "public"."order_status_log" IS 'One row per order_status change, written by trg_log_order_status. from_status is NULL for the row written when the order is placed.';

COMMENT ON COLUMN "public"."order_status_log"."changed_by" IS 'auth.uid() of whoever made the change. NULL for the service role (PayMongo webhook).';

COMMENT ON COLUMN "public"."order_status_log"."reason" IS 'The cancellation reason. Filled only when to_status is cancelled.';

ALTER TABLE "public"."order_status_log" ALTER COLUMN "log_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."order_status_log_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."product" (
    "product_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "product_name" "text" NOT NULL,
    "product_details" "text",
    "is_available" boolean DEFAULT true,
    "product_price" numeric(10,2) NOT NULL,
    "image_url" "text",
    "archived_at" timestamp with time zone,
    "is_featured" boolean DEFAULT false NOT NULL,
    CONSTRAINT "product_product_details_check" CHECK ((("product_details" IS NULL) OR ("char_length"("product_details") <= 300))),
    CONSTRAINT "product_product_name_check" CHECK ((("char_length"("btrim"("product_name")) >= 2) AND ("char_length"("btrim"("product_name")) <= 80))),
    CONSTRAINT "product_product_price_check" CHECK ((("product_price" > (0)::numeric) AND ("product_price" <= 99999.99)))
);

ALTER TABLE "public"."product" OWNER TO "postgres";

COMMENT ON COLUMN "public"."product"."archived_at" IS 'When this product was taken off the menu. Non-null rows are hidden from the menu but kept so historical orders still resolve. Prefer this over DELETE.';

CREATE TABLE IF NOT EXISTS "public"."product_price_log" (
    "log_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "old_price" numeric(10,2),
    "new_price" numeric(10,2) NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."product_price_log" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."promotion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "product_id" "uuid",
    "category_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."promotion" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."reports" (
    "report_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "generated_by_employee_id" "uuid",
    "report_type" "text",
    "date_range_start" "date",
    "date_range_end" "date",
    "total_gross_sales" numeric(10,2),
    "total_net_sales" numeric(10,2),
    "total_orders_processed" integer,
    "generated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."reports" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."review" (
    "review_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "order_id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "product_id" "uuid",
    CONSTRAINT "review_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE "public"."review" OWNER TO "postgres";

COMMENT ON COLUMN "public"."review"."product_id" IS 'If null, this is an order-level review. If set, it is a product-level review for the specific order.';

CREATE TABLE IF NOT EXISTS "public"."store_setting" (
    "id" boolean DEFAULT true NOT NULL,
    "is_paused" boolean DEFAULT false NOT NULL,
    "paused_until" timestamp with time zone,
    "extra_prep_minutes" integer DEFAULT 0 NOT NULL,
    "max_active_orders" integer DEFAULT 20 NOT NULL,
    "is_force_open" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "open_time" time without time zone DEFAULT '08:00:00'::time without time zone NOT NULL,
    "close_time" time without time zone DEFAULT '18:00:00'::time without time zone NOT NULL,
    CONSTRAINT "store_setting_extra_prep_minutes_check" CHECK ((("extra_prep_minutes" >= 0) AND ("extra_prep_minutes" <= 120))),
    CONSTRAINT "store_setting_hours_order" CHECK (("open_time" < "close_time")),
    CONSTRAINT "store_setting_id_check" CHECK ("id"),
    CONSTRAINT "store_setting_max_active_orders_check" CHECK ((("max_active_orders" >= 1) AND ("max_active_orders" <= 500)))
);

ALTER TABLE "public"."store_setting" OWNER TO "postgres";

COMMENT ON TABLE "public"."store_setting" IS 'One row of shop-wide switches: pause, busy limit, extra prep time and opening hours (Manila). Read through get_store_status().';

COMMENT ON COLUMN "public"."store_setting"."open_time" IS 'Opening time of day, Asia/Manila. Open from this minute.';

COMMENT ON COLUMN "public"."store_setting"."close_time" IS 'Closing time of day, Asia/Manila. Closed from this minute. Later than open_time; 24:00 means end of day.';

CREATE TABLE IF NOT EXISTS "public"."transaction" (
    "transaction_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "transaction_type" "text",
    "payment_method" "text",
    "payment_status" "text",
    "subtotal" numeric(10,2),
    "tax_amount" numeric(10,2),
    "discount_amount" numeric(10,2) DEFAULT 0.00,
    "discount_type" "text",
    "discount_id_number" "text",
    "total_paid" numeric(10,2),
    "transaction_date" timestamp with time zone DEFAULT "now"(),
    "provider_reference_id" character varying,
    "provider_payment_id" "text",
    "provider_refund_id" "text",
    "refund_error" "text",
    "refunded_at" timestamp with time zone,
    "name_on_id" "text",
    "discount_id_photo_path" "text",
    CONSTRAINT "transaction_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['pay_in_store'::"text", 'gcash'::"text", 'paymaya'::"text", 'paymongo'::"text"]))),
    CONSTRAINT "transaction_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"])))
);

ALTER TABLE "public"."transaction" OWNER TO "postgres";

COMMENT ON COLUMN "public"."transaction"."payment_method" IS 'pay_in_store, gcash or paymaya. paymongo = a wallet payment from before the wallet was recorded.';

COMMENT ON COLUMN "public"."transaction"."discount_type" IS 'senior_citizen or pwd. NULL = no discount.';

COMMENT ON COLUMN "public"."transaction"."provider_reference_id" IS '[SENSITIVE]';

COMMENT ON COLUMN "public"."transaction"."provider_payment_id" IS 'PayMongo payment id (pay_…), stored by payment-webhook. The Refunds API needs it; provider_reference_id holds the payment intent (pi_…).';

COMMENT ON COLUMN "public"."transaction"."provider_refund_id" IS 'PayMongo refund id (ref_…), stored by process-refunds.';

COMMENT ON COLUMN "public"."transaction"."refund_error" IS 'Why the last automatic refund attempt failed, shown to managers on the dashboard.';

COMMENT ON COLUMN "public"."transaction"."name_on_id" IS 'Name printed on the Senior Citizen / PWD ID. Kept for the BIR sales record.';

COMMENT ON COLUMN "public"."transaction"."discount_id_photo_path" IS 'Path of the ID photo in the senior-pwd-ids bucket. Cleared when the photo is deleted (order completed or cancelled).';

ALTER TABLE ONLY "public"."add_on"
    ADD CONSTRAINT "add_on_pkey" PRIMARY KEY ("addon_id");

ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_id");

ALTER TABLE ONLY "public"."cart_add_on"
    ADD CONSTRAINT "cart_add_on_pkey" PRIMARY KEY ("cart_add_on_id");

ALTER TABLE ONLY "public"."cart_item_add_on"
    ADD CONSTRAINT "cart_item_add_on_pkey" PRIMARY KEY ("cart_item_add_on_id");

ALTER TABLE ONLY "public"."cart_item"
    ADD CONSTRAINT "cart_item_pkey" PRIMARY KEY ("cart_item_id");

ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_pkey" PRIMARY KEY ("cart_id");

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");

ALTER TABLE ONLY "public"."customer"
    ADD CONSTRAINT "customer_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."customer"
    ADD CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id");

ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_email_key" UNIQUE ("email");

ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_pkey" PRIMARY KEY ("employee_id");

ALTER TABLE ONLY "public"."login_attempt"
    ADD CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("login_attempt_id");

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id");

ALTER TABLE ONLY "public"."order_add_on"
    ADD CONSTRAINT "order_add_on_pkey" PRIMARY KEY ("order_add_on_id");

ALTER TABLE ONLY "public"."order_issue"
    ADD CONSTRAINT "order_issue_order_id_key" UNIQUE ("order_id");

ALTER TABLE ONLY "public"."order_issue"
    ADD CONSTRAINT "order_issue_pkey" PRIMARY KEY ("issue_id");

ALTER TABLE ONLY "public"."order_item_add_on"
    ADD CONSTRAINT "order_item_add_on_pkey" PRIMARY KEY ("order_item_add_on_id");

ALTER TABLE ONLY "public"."order_item"
    ADD CONSTRAINT "order_item_pkey" PRIMARY KEY ("order_item_id");

ALTER TABLE ONLY "public"."order"
    ADD CONSTRAINT "order_pkey" PRIMARY KEY ("order_id");

ALTER TABLE ONLY "public"."order_status_log"
    ADD CONSTRAINT "order_status_log_pkey" PRIMARY KEY ("log_id");

ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("product_id");

ALTER TABLE ONLY "public"."product_price_log"
    ADD CONSTRAINT "product_price_log_pkey" PRIMARY KEY ("log_id");

ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id");

ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_pkey" PRIMARY KEY ("review_id");

ALTER TABLE ONLY "public"."store_setting"
    ADD CONSTRAINT "store_setting_pkey" PRIMARY KEY ("id");

ALTER TABLE "public"."transaction"
    ADD CONSTRAINT "transaction_discount_type_check" CHECK ((("discount_type" IS NULL) OR ("discount_type" = ANY (ARRAY['senior_citizen'::"text", 'pwd'::"text"]))));

ALTER TABLE ONLY "public"."transaction"
    ADD CONSTRAINT "transaction_pkey" PRIMARY KEY ("transaction_id");

CREATE INDEX "audit_log_actor_occurred_at_idx" ON "public"."audit_log" USING "btree" ("actor_id", "occurred_at" DESC);

CREATE INDEX "audit_log_entity_idx" ON "public"."audit_log" USING "btree" ("entity_type", "entity_id");

CREATE INDEX "audit_log_occurred_at_idx" ON "public"."audit_log" USING "btree" ("occurred_at" DESC);

CREATE INDEX "login_attempt_email_time_idx" ON "public"."login_attempt" USING "btree" ("email_hash", "attempted_at");

CREATE INDEX "login_attempt_ip_time_idx" ON "public"."login_attempt" USING "btree" ("ip", "attempted_at");

CREATE INDEX "notification_customer_created_at_idx" ON "public"."notification" USING "btree" ("customer_id", "created_at" DESC);

CREATE INDEX "notification_customer_unread_idx" ON "public"."notification" USING "btree" ("customer_id") WHERE ("is_read" = false);

CREATE INDEX "notification_order_id_idx" ON "public"."notification" USING "btree" ("order_id");

CREATE UNIQUE INDEX "one_active_cart_per_customer" ON "public"."cart" USING "btree" ("customer_id") WHERE ("is_final" = false);

CREATE UNIQUE INDEX "order_cart_id_key" ON "public"."order" USING "btree" ("cart_id");

CREATE INDEX "order_created_at_idx" ON "public"."order" USING "btree" ("created_at" DESC);

CREATE INDEX "order_customer_id_created_at_idx" ON "public"."order" USING "btree" ("customer_id", "created_at" DESC);

CREATE INDEX "order_issue_customer_id_idx" ON "public"."order_issue" USING "btree" ("customer_id");

CREATE INDEX "order_issue_open_idx" ON "public"."order_issue" USING "btree" ("created_at" DESC) WHERE ("resolved_at" IS NULL);

CREATE INDEX "order_item_order_id_idx" ON "public"."order_item" USING "btree" ("order_id");

CREATE UNIQUE INDEX "order_order_number_key" ON "public"."order" USING "btree" ("order_number");

CREATE INDEX "order_order_status_created_at_idx" ON "public"."order" USING "btree" ("order_status", "created_at");

CREATE INDEX "order_pending_at_idx" ON "public"."order" USING "btree" ("pending_at") WHERE ("order_status" = 'pending'::"text");

CREATE INDEX "order_ready_at_idx" ON "public"."order" USING "btree" ("ready_at") WHERE ("order_status" = 'ready'::"text");

CREATE INDEX "order_status_log_order_id_changed_at_idx" ON "public"."order_status_log" USING "btree" ("order_id", "changed_at");

CREATE INDEX "product_archived_at_idx" ON "public"."product" USING "btree" ("archived_at");

CREATE INDEX "product_price_log_product_idx" ON "public"."product_price_log" USING "btree" ("product_id", "changed_at" DESC);

CREATE UNIQUE INDEX "review_customer_product_unique" ON "public"."review" USING "btree" ("customer_id", "product_id") WHERE ("order_id" IS NULL);

CREATE UNIQUE INDEX "review_order_only_unique" ON "public"."review" USING "btree" ("order_id") WHERE ("product_id" IS NULL);

CREATE UNIQUE INDEX "review_order_product_unique" ON "public"."review" USING "btree" ("order_id", "product_id") WHERE ("product_id" IS NOT NULL);

CREATE UNIQUE INDEX "transaction_discount_id_photo_path_key" ON "public"."transaction" USING "btree" ("discount_id_photo_path") WHERE ("discount_id_photo_path" IS NOT NULL);

CREATE INDEX "transaction_order_id_idx" ON "public"."transaction" USING "btree" ("order_id");

CREATE INDEX "transaction_payment_method_idx" ON "public"."transaction" USING "btree" ("payment_method");

CREATE OR REPLACE TRIGGER "set_promotion_updated_at" BEFORE UPDATE ON "public"."promotion" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."add_on" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('addon_id', 'name', 'add_on');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('category_id', 'category_name', 'category');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."customer" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('customer_id', 'name', 'customer');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."employee" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('employee_id', 'name', 'employee');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."notification" FOR EACH ROW WHEN (("pg_trigger_depth"() = 0)) EXECUTE FUNCTION "public"."audit_employee_write"('notification_id', '', 'notification');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('order_id', '', 'order');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."order_issue" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('issue_id', '', 'order_issue');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."product" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('product_id', 'product_name', 'product');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('report_id', 'report_type', 'report');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."review" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('review_id', '', 'review');

CREATE OR REPLACE TRIGGER "trg_audit_employee_write" AFTER INSERT OR DELETE OR UPDATE ON "public"."transaction" FOR EACH ROW EXECUTE FUNCTION "public"."audit_employee_write"('transaction_id', '', 'payment');

CREATE OR REPLACE TRIGGER "trg_audit_log_append_only" BEFORE DELETE OR UPDATE ON "public"."audit_log" FOR EACH ROW EXECUTE FUNCTION "public"."audit_log_is_append_only"();

CREATE OR REPLACE TRIGGER "trg_audit_log_no_truncate" BEFORE TRUNCATE ON "public"."audit_log" FOR EACH STATEMENT EXECUTE FUNCTION "public"."audit_log_is_append_only"();

CREATE OR REPLACE TRIGGER "trg_flag_refund_on_cancel" AFTER UPDATE OF "order_status" ON "public"."order" FOR EACH ROW WHEN ((("new"."order_status" = 'cancelled'::"text") AND ("old"."order_status" IS DISTINCT FROM 'cancelled'::"text"))) EXECUTE FUNCTION "public"."flag_refund_on_cancel"();

CREATE OR REPLACE TRIGGER "trg_freeze_order_promised_at" BEFORE UPDATE OF "promised_at" ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."freeze_order_promised_at"();

CREATE OR REPLACE TRIGGER "trg_guard_customer_notification_update" BEFORE UPDATE ON "public"."notification" FOR EACH ROW EXECUTE FUNCTION "public"."guard_customer_notification_update"();

CREATE OR REPLACE TRIGGER "trg_guard_customer_order_update" BEFORE UPDATE ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."guard_customer_order_update"();

CREATE OR REPLACE TRIGGER "trg_guard_customer_self_update" BEFORE UPDATE ON "public"."customer" FOR EACH ROW EXECUTE FUNCTION "public"."guard_customer_self_update"();

CREATE OR REPLACE TRIGGER "trg_guard_employee_self_update" BEFORE UPDATE ON "public"."employee" FOR EACH ROW EXECUTE FUNCTION "public"."guard_employee_self_update"();

CREATE OR REPLACE TRIGGER "trg_guard_order_issue_update" BEFORE UPDATE ON "public"."order_issue" FOR EACH ROW EXECUTE FUNCTION "public"."guard_order_issue_update"();

CREATE OR REPLACE TRIGGER "trg_guard_product_price" BEFORE INSERT OR UPDATE OF "product_price" ON "public"."product" FOR EACH ROW EXECUTE FUNCTION "public"."guard_product_price"();

CREATE OR REPLACE TRIGGER "trg_log_order_status" AFTER INSERT OR UPDATE OF "order_status" ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."log_order_status"();

CREATE OR REPLACE TRIGGER "trg_log_product_price" AFTER INSERT OR UPDATE OF "product_price" ON "public"."product" FOR EACH ROW EXECUTE FUNCTION "public"."log_product_price"();

CREATE OR REPLACE TRIGGER "trg_mark_pay_in_store_paid" AFTER UPDATE OF "order_status" ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."mark_pay_in_store_paid"();

CREATE OR REPLACE TRIGGER "trg_notify_customer_of_order_status" AFTER UPDATE OF "order_status" ON "public"."order" FOR EACH ROW WHEN (("old"."order_status" IS DISTINCT FROM "new"."order_status")) EXECUTE FUNCTION "public"."notify_customer_of_order_status"();

CREATE OR REPLACE TRIGGER "trg_set_order_pending_at" BEFORE INSERT OR UPDATE OF "order_status" ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_pending_at"();

CREATE OR REPLACE TRIGGER "trg_set_order_ready_at" BEFORE INSERT OR UPDATE OF "order_status" ON "public"."order" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_ready_at"();

CREATE OR REPLACE TRIGGER "trg_touch_store_setting" BEFORE UPDATE ON "public"."store_setting" FOR EACH ROW EXECUTE FUNCTION "public"."touch_store_setting"();

ALTER TABLE ONLY "public"."add_on"
    ADD CONSTRAINT "add_on_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_add_on"
    ADD CONSTRAINT "cart_add_on_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."add_on"("addon_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_add_on"
    ADD CONSTRAINT "cart_add_on_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("cart_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_item_add_on"
    ADD CONSTRAINT "cart_item_add_on_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."add_on"("addon_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_item_add_on"
    ADD CONSTRAINT "cart_item_add_on_cart_item_id_fkey" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_item"("cart_item_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_item"
    ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("cart_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart_item"
    ADD CONSTRAINT "cart_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."customer"
    ADD CONSTRAINT "customer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."employee"
    ADD CONSTRAINT "employee_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_add_on"
    ADD CONSTRAINT "order_add_on_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."add_on"("addon_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order_add_on"
    ADD CONSTRAINT "order_add_on_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order"
    ADD CONSTRAINT "order_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("cart_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order"
    ADD CONSTRAINT "order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order_issue"
    ADD CONSTRAINT "order_issue_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order_issue"
    ADD CONSTRAINT "order_issue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_item_add_on"
    ADD CONSTRAINT "order_item_add_on_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "public"."add_on"("addon_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order_item_add_on"
    ADD CONSTRAINT "order_item_add_on_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("order_item_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_item"
    ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_item"
    ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."order_status_log"
    ADD CONSTRAINT "order_status_log_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."product_price_log"
    ADD CONSTRAINT "product_price_log_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."promotion"
    ADD CONSTRAINT "promotion_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_generated_by_employee_id_fkey" FOREIGN KEY ("generated_by_employee_id") REFERENCES "public"."employee"("employee_id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."review"
    ADD CONSTRAINT "review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id");

ALTER TABLE ONLY "public"."store_setting"
    ADD CONSTRAINT "store_setting_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."transaction"
    ADD CONSTRAINT "transaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE CASCADE;

CREATE POLICY "Anyone can view active promotions within date window" ON "public"."promotion" FOR SELECT USING ((("is_active" = true) AND ("starts_at" <= "now"()) AND ("ends_at" >= "now"())));

CREATE POLICY "Managers can manage all promotions" ON "public"."promotion" USING (("public"."current_employee_role"() = 'MANAGER'::"text")) WITH CHECK (("public"."current_employee_role"() = 'MANAGER'::"text"));

ALTER TABLE "public"."add_on" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_read_add_on" ON "public"."add_on" FOR SELECT USING (true);

CREATE POLICY "anyone_can_read_categories" ON "public"."categories" FOR SELECT USING (true);

CREATE POLICY "anyone_can_read_product" ON "public"."product" FOR SELECT USING (true);

ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cart" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cart_add_on" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cart_item" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."cart_item_add_on" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customer" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_cancel_own_orders" ON "public"."order" FOR UPDATE TO "authenticated" USING ((("customer_id" = "auth"."uid"()) AND ("order_status" = 'pending'::"text"))) WITH CHECK ((("customer_id" = "auth"."uid"()) AND ("order_status" = 'cancelled'::"text")));

CREATE POLICY "customer_delete_own_cart_add_on" ON "public"."cart_add_on" FOR DELETE TO "authenticated" USING (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE (("cart"."customer_id" = "auth"."uid"()) AND ("cart"."is_final" = false)))));

CREATE POLICY "customer_delete_own_cart_item_add_on" ON "public"."cart_item_add_on" FOR DELETE TO "authenticated" USING (("cart_item_id" IN ( SELECT "ci"."cart_item_id"
   FROM ("public"."cart_item" "ci"
     JOIN "public"."cart" "c" ON (("c"."cart_id" = "ci"."cart_id")))
  WHERE (("c"."customer_id" = "auth"."uid"()) AND ("c"."is_final" = false)))));

CREATE POLICY "customer_delete_own_cart_items" ON "public"."cart_item" FOR DELETE TO "authenticated" USING (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE (("cart"."customer_id" = "auth"."uid"()) AND ("cart"."is_final" = false)))));

CREATE POLICY "customer_delete_own_notification" ON "public"."notification" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "customer_id"));

CREATE POLICY "customer_insert_own" ON "public"."customer" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "customer_id"));

CREATE POLICY "customer_insert_own_cart" ON "public"."cart" FOR INSERT TO "authenticated" WITH CHECK (("customer_id" = "auth"."uid"()));

CREATE POLICY "customer_insert_own_cart_add_on" ON "public"."cart_add_on" FOR INSERT TO "authenticated" WITH CHECK (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE (("cart"."customer_id" = "auth"."uid"()) AND ("cart"."is_final" = false)))));

CREATE POLICY "customer_insert_own_cart_item_add_on" ON "public"."cart_item_add_on" FOR INSERT TO "authenticated" WITH CHECK (("cart_item_id" IN ( SELECT "ci"."cart_item_id"
   FROM ("public"."cart_item" "ci"
     JOIN "public"."cart" "c" ON (("c"."cart_id" = "ci"."cart_id")))
  WHERE (("c"."customer_id" = "auth"."uid"()) AND ("c"."is_final" = false)))));

CREATE POLICY "customer_insert_own_cart_items" ON "public"."cart_item" FOR INSERT TO "authenticated" WITH CHECK (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE (("cart"."customer_id" = "auth"."uid"()) AND ("cart"."is_final" = false)))));

CREATE POLICY "customer_insert_own_order_issue" ON "public"."order_issue" FOR INSERT TO "authenticated" WITH CHECK ((("customer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("resolved_at" IS NULL) AND ("resolved_by" IS NULL) AND (("photo_path" IS NULL) OR ("split_part"("photo_path", '/'::"text", 1) = (( SELECT "auth"."uid"() AS "uid"))::"text")) AND (EXISTS ( SELECT 1
   FROM "public"."order" "o"
  WHERE (("o"."order_id" = "order_issue"."order_id") AND ("o"."customer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("o"."order_status" = 'completed'::"text") AND (COALESCE("o"."completed_at", "o"."created_at") > ("now"() - '24:00:00'::interval))))) AND ("order_item_ids" <@ ARRAY( SELECT "oi"."order_item_id"
   FROM "public"."order_item" "oi"
  WHERE ("oi"."order_id" = "order_issue"."order_id")))));

CREATE POLICY "customer_insert_own_review" ON "public"."review" FOR INSERT TO "authenticated" WITH CHECK ((("customer_id" = "auth"."uid"()) AND ("order_id" IN ( SELECT "order"."order_id"
   FROM "public"."order"
  WHERE (("order"."customer_id" = "auth"."uid"()) AND ("order"."order_status" = 'completed'::"text"))))));

CREATE POLICY "customer_read_own_order_status_log" ON "public"."order_status_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."order" "o"
  WHERE (("o"."order_id" = "order_status_log"."order_id") AND ("o"."customer_id" = "auth"."uid"())))));

CREATE POLICY "customer_select_own" ON "public"."customer" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));

CREATE POLICY "customer_select_own_cart" ON "public"."cart" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));

CREATE POLICY "customer_select_own_cart_add_on" ON "public"."cart_add_on" FOR SELECT TO "authenticated" USING (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE ("cart"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_cart_item_add_on" ON "public"."cart_item_add_on" FOR SELECT TO "authenticated" USING (("cart_item_id" IN ( SELECT "ci"."cart_item_id"
   FROM ("public"."cart_item" "ci"
     JOIN "public"."cart" "c" ON (("c"."cart_id" = "ci"."cart_id")))
  WHERE ("c"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_cart_items" ON "public"."cart_item" FOR SELECT TO "authenticated" USING (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE ("cart"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_notification" ON "public"."notification" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "customer_id"));

CREATE POLICY "customer_select_own_order_add_on" ON "public"."order_add_on" FOR SELECT TO "authenticated" USING (("order_id" IN ( SELECT "order"."order_id"
   FROM "public"."order"
  WHERE ("order"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_order_issue" ON "public"."order_issue" FOR SELECT TO "authenticated" USING (("customer_id" = ( SELECT "auth"."uid"() AS "uid")));

CREATE POLICY "customer_select_own_order_item_add_on" ON "public"."order_item_add_on" FOR SELECT TO "authenticated" USING (("order_item_id" IN ( SELECT "oi"."order_item_id"
   FROM ("public"."order_item" "oi"
     JOIN "public"."order" "o" ON (("o"."order_id" = "oi"."order_id")))
  WHERE ("o"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_order_items" ON "public"."order_item" FOR SELECT TO "authenticated" USING (("order_id" IN ( SELECT "order"."order_id"
   FROM "public"."order"
  WHERE ("order"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_select_own_orders" ON "public"."order" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));

CREATE POLICY "customer_select_own_reviews" ON "public"."review" FOR SELECT TO "authenticated" USING (("customer_id" = "auth"."uid"()));

CREATE POLICY "customer_select_own_transactions" ON "public"."transaction" FOR SELECT TO "authenticated" USING (("order_id" IN ( SELECT "order"."order_id"
   FROM "public"."order"
  WHERE ("order"."customer_id" = "auth"."uid"()))));

CREATE POLICY "customer_update_own" ON "public"."customer" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "customer_id")) WITH CHECK (("auth"."uid"() = "customer_id"));

CREATE POLICY "customer_update_own_cart" ON "public"."cart" FOR UPDATE TO "authenticated" USING ((("customer_id" = "auth"."uid"()) AND ("is_final" = false))) WITH CHECK (("customer_id" = "auth"."uid"()));

CREATE POLICY "customer_update_own_cart_items" ON "public"."cart_item" FOR UPDATE TO "authenticated" USING (("cart_id" IN ( SELECT "cart"."cart_id"
   FROM "public"."cart"
  WHERE (("cart"."customer_id" = "auth"."uid"()) AND ("cart"."is_final" = false)))));

CREATE POLICY "customer_update_own_notification" ON "public"."notification" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "customer_id")) WITH CHECK (("auth"."uid"() = "customer_id"));

ALTER TABLE "public"."employee" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_read_order_status_log" ON "public"."order_status_log" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_all_customers" ON "public"."customer" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employee" "e"
  WHERE ("e"."employee_id" = "auth"."uid"()))));

CREATE POLICY "employee_select_all_order_add_on" ON "public"."order_add_on" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_all_order_item_add_on" ON "public"."order_item_add_on" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_all_order_items" ON "public"."order_item" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_all_orders" ON "public"."order" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_all_reviews" ON "public"."review" FOR SELECT TO "authenticated" USING (("auth"."uid"() IN ( SELECT "employee"."employee_id"
   FROM "public"."employee")));

CREATE POLICY "employee_select_all_transactions" ON "public"."transaction" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() IS NOT NULL));

CREATE POLICY "employee_select_own_or_staff" ON "public"."employee" FOR SELECT TO "authenticated" USING ((("employee_id" = "auth"."uid"()) OR ("public"."current_employee_role"() IS NOT NULL)));

CREATE POLICY "employee_update_own_or_manager" ON "public"."employee" FOR UPDATE TO "authenticated" USING ((("employee_id" = "auth"."uid"()) OR ("public"."current_employee_role"() = 'MANAGER'::"text"))) WITH CHECK ((("employee_id" = "auth"."uid"()) OR ("public"."current_employee_role"() = 'MANAGER'::"text")));

ALTER TABLE "public"."login_attempt" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manager_delete_customers" ON "public"."customer" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employee" "e"
  WHERE (("e"."employee_id" = "auth"."uid"()) AND ("upper"(TRIM(BOTH FROM "e"."role")) = 'MANAGER'::"text")))));

CREATE POLICY "manager_manage_reports" ON "public"."reports" TO "authenticated" USING (("public"."current_employee_role"() = 'MANAGER'::"text")) WITH CHECK (("public"."current_employee_role"() = 'MANAGER'::"text"));

CREATE POLICY "manager_read_price_log" ON "public"."product_price_log" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() = 'MANAGER'::"text"));

CREATE POLICY "manager_select_audit_log" ON "public"."audit_log" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() = 'MANAGER'::"text"));

CREATE POLICY "manager_update_customers" ON "public"."customer" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."employee" "e"
  WHERE (("e"."employee_id" = "auth"."uid"()) AND ("upper"(TRIM(BOTH FROM "e"."role")) = 'MANAGER'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."employee" "e"
  WHERE (("e"."employee_id" = "auth"."uid"()) AND ("upper"(TRIM(BOTH FROM "e"."role")) = 'MANAGER'::"text")))));

ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_add_on" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_issue" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_item" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_item_add_on" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_status_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."product_price_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."promotion" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."review" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_and_manager_update_orders" ON "public"."order" FOR UPDATE TO "authenticated" USING (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"]))) WITH CHECK (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"])));

CREATE POLICY "staff_insert_notification" ON "public"."notification" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_menu_manager"());

CREATE POLICY "staff_manager_insert_transactions" ON "public"."transaction" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"])));

CREATE POLICY "staff_manager_update_transactions" ON "public"."transaction" FOR UPDATE TO "authenticated" USING (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"]))) WITH CHECK (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"])));

CREATE POLICY "staff_resolve_order_issue" ON "public"."order_issue" FOR UPDATE TO "authenticated" USING (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"]))) WITH CHECK (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"])));

CREATE POLICY "staff_select_order_issue" ON "public"."order_issue" FOR SELECT TO "authenticated" USING (("public"."current_employee_role"() = ANY (ARRAY['MANAGER'::"text", 'STAFF'::"text"])));

CREATE POLICY "staff_write_add_on" ON "public"."add_on" TO "authenticated" USING ("public"."is_menu_manager"()) WITH CHECK ("public"."is_menu_manager"());

CREATE POLICY "staff_write_categories" ON "public"."categories" TO "authenticated" USING ("public"."is_menu_manager"()) WITH CHECK ("public"."is_menu_manager"());

CREATE POLICY "staff_write_product" ON "public"."product" TO "authenticated" USING ("public"."is_menu_manager"()) WITH CHECK ("public"."is_menu_manager"());

ALTER TABLE "public"."store_setting" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_setting_manager_update" ON "public"."store_setting" FOR UPDATE USING (("public"."current_employee_role"() = 'MANAGER'::"text")) WITH CHECK (("public"."current_employee_role"() = 'MANAGER'::"text"));

CREATE POLICY "store_setting_read" ON "public"."store_setting" FOR SELECT USING (true);

ALTER TABLE "public"."transaction" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notification";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."order";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."order_status_log";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

REVOKE ALL ON FUNCTION "public"."audit_current_actor"(OUT "actor_id" "uuid", OUT "actor_name" "text", OUT "actor_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_current_actor"(OUT "actor_id" "uuid", OUT "actor_name" "text", OUT "actor_role" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."audit_employee_write"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_employee_write"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."audit_log_is_append_only"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."audit_log_is_append_only"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."best_sellers"("p_days" integer, "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."best_sellers"("p_days" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."best_sellers"("p_days" integer, "p_limit" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."best_sellers"("p_days" integer, "p_limit" integer) TO "anon";

GRANT ALL ON FUNCTION "public"."current_employee_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_employee_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_employee_role"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."expire_abandoned_orders"("p_window" interval) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_abandoned_orders"("p_window" interval) TO "service_role";

REVOKE ALL ON FUNCTION "public"."expire_unaccepted_orders"("p_window" interval) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_unaccepted_orders"("p_window" interval) TO "service_role";

REVOKE ALL ON FUNCTION "public"."flag_refund_on_cancel"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."flag_refund_on_cancel"() TO "service_role";

GRANT ALL ON FUNCTION "public"."freeze_order_promised_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."freeze_order_promised_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."freeze_order_promised_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_cancellation_reason_breakdown"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_cancellation_reason_breakdown"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cancellation_reason_breakdown"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_cash_remitted"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_cash_remitted"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cash_remitted"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_cash_remitted_daily"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_cash_remitted_daily"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cash_remitted_daily"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_customer_order_history"("p_customer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_customer_order_history"("p_customer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer_order_history"("p_customer_id" "uuid") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_customer_stats"("p_search" "text", "p_from" "date", "p_to" "date", "p_min_orders" integer, "p_min_spent" numeric, "p_joined_from" "date", "p_joined_to" "date", "p_activity" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_customer_stats"("p_search" "text", "p_from" "date", "p_to" "date", "p_min_orders" integer, "p_min_spent" numeric, "p_joined_from" "date", "p_joined_to" "date", "p_activity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_customer_stats"("p_search" "text", "p_from" "date", "p_to" "date", "p_min_orders" integer, "p_min_spent" numeric, "p_joined_from" "date", "p_joined_to" "date", "p_activity" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_payment_method_breakdown"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_payment_method_breakdown"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_method_breakdown"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_sales_by_hour"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_sales_by_hour"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_by_hour"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_sales_by_weekday"("start_date" "date", "end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_sales_by_weekday"("start_date" "date", "end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_by_weekday"("start_date" "date", "end_date" "date") TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_store_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_store_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_status"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_customer_notification_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_customer_notification_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_customer_order_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_customer_order_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_customer_self_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_customer_self_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_employee_self_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_employee_self_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_order_issue_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_order_issue_update"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."guard_product_price"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_product_price"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."handle_password_timestamp_update"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_password_timestamp_update"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_menu_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_menu_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_menu_manager"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."log_order_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_order_status"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."log_product_price"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_product_price"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."mark_pay_in_store_paid"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_pay_in_store_paid"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."notify_customer_of_order_status"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_customer_of_order_status"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."record_employee_action"("p_action" "text", "p_entity_type" "text", "p_entity_id" "text", "p_summary" "text", "p_changes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_employee_action"("p_action" "text", "p_entity_type" "text", "p_entity_id" "text", "p_summary" "text", "p_changes" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_employee_action"("p_action" "text", "p_entity_type" "text", "p_entity_id" "text", "p_summary" "text", "p_changes" "jsonb") TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_order_pending_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_order_pending_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."set_order_ready_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_order_ready_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."submit_cart_to_order"("p_cart_id" "uuid", "p_order_type" "text", "p_special_instructions" "text", "p_payment_method" "text", "p_expected_prices" "jsonb", "p_discount" "jsonb", "p_fulfillment_method" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_cart_to_order"("p_cart_id" "uuid", "p_order_type" "text", "p_special_instructions" "text", "p_payment_method" "text", "p_expected_prices" "jsonb", "p_discount" "jsonb", "p_fulfillment_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_cart_to_order"("p_cart_id" "uuid", "p_order_type" "text", "p_special_instructions" "text", "p_payment_method" "text", "p_expected_prices" "jsonb", "p_discount" "jsonb", "p_fulfillment_method" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."submit_direct_product_review"("p_product_id" "uuid", "p_rating" integer, "p_comment" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_direct_product_review"("p_product_id" "uuid", "p_rating" integer, "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_direct_product_review"("p_product_id" "uuid", "p_rating" integer, "p_comment" "text") TO "service_role";

REVOKE ALL ON FUNCTION "public"."submit_order_review"("p_order_id" "uuid", "p_rating" integer, "p_comment" "text", "p_product_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."submit_order_review"("p_order_id" "uuid", "p_rating" integer, "p_comment" "text", "p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_order_review"("p_order_id" "uuid", "p_rating" integer, "p_comment" "text", "p_product_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."touch_store_setting"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_store_setting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_store_setting"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_password_timestamp"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_password_timestamp"() TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."add_on" TO "anon";
GRANT ALL ON TABLE "public"."add_on" TO "authenticated";
GRANT ALL ON TABLE "public"."add_on" TO "service_role";

GRANT ALL ON TABLE "public"."audit_log" TO "service_role";
GRANT SELECT ON TABLE "public"."audit_log" TO "authenticated";

GRANT ALL ON SEQUENCE "public"."audit_log_audit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_audit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_audit_id_seq" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."cart" TO "anon";
GRANT ALL ON TABLE "public"."cart" TO "authenticated";
GRANT ALL ON TABLE "public"."cart" TO "service_role";

GRANT ALL ON TABLE "public"."cart_add_on" TO "anon";
GRANT ALL ON TABLE "public"."cart_add_on" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_add_on" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."cart_item" TO "anon";
GRANT ALL ON TABLE "public"."cart_item" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_item" TO "service_role";

GRANT ALL ON TABLE "public"."cart_item_add_on" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_item_add_on" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";

GRANT REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."customer" TO "anon";
GRANT ALL ON TABLE "public"."customer" TO "authenticated";
GRANT ALL ON TABLE "public"."customer" TO "service_role";

GRANT REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."employee" TO "anon";
GRANT ALL ON TABLE "public"."employee" TO "authenticated";
GRANT ALL ON TABLE "public"."employee" TO "service_role";

GRANT ALL ON TABLE "public"."login_attempt" TO "service_role";

GRANT ALL ON SEQUENCE "public"."login_attempt_login_attempt_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."login_attempt_login_attempt_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."login_attempt_login_attempt_id_seq" TO "service_role";

GRANT REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."order" TO "anon";
GRANT ALL ON TABLE "public"."order" TO "authenticated";
GRANT ALL ON TABLE "public"."order" TO "service_role";

GRANT ALL ON TABLE "public"."order_add_on" TO "anon";
GRANT ALL ON TABLE "public"."order_add_on" TO "authenticated";
GRANT ALL ON TABLE "public"."order_add_on" TO "service_role";

GRANT ALL ON TABLE "public"."order_issue" TO "authenticated";
GRANT ALL ON TABLE "public"."order_issue" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."order_item" TO "anon";
GRANT ALL ON TABLE "public"."order_item" TO "authenticated";
GRANT ALL ON TABLE "public"."order_item" TO "service_role";

GRANT ALL ON TABLE "public"."order_item_add_on" TO "authenticated";
GRANT ALL ON TABLE "public"."order_item_add_on" TO "service_role";

GRANT ALL ON SEQUENCE "public"."order_order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_order_number_seq" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."order_status_log" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_log" TO "service_role";

GRANT ALL ON SEQUENCE "public"."order_status_log_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_status_log_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_status_log_log_id_seq" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."product" TO "anon";
GRANT ALL ON TABLE "public"."product" TO "authenticated";
GRANT ALL ON TABLE "public"."product" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."product_price_log" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."product_price_log" TO "authenticated";
GRANT ALL ON TABLE "public"."product_price_log" TO "service_role";

GRANT ALL ON TABLE "public"."promotion" TO "anon";
GRANT ALL ON TABLE "public"."promotion" TO "authenticated";
GRANT ALL ON TABLE "public"."promotion" TO "service_role";

GRANT REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."review" TO "anon";
GRANT ALL ON TABLE "public"."review" TO "authenticated";
GRANT ALL ON TABLE "public"."review" TO "service_role";

GRANT ALL ON TABLE "public"."store_setting" TO "service_role";
GRANT SELECT ON TABLE "public"."store_setting" TO "anon";
GRANT SELECT,UPDATE ON TABLE "public"."store_setting" TO "authenticated";

GRANT SELECT,REFERENCES,TRIGGER,MAINTAIN ON TABLE "public"."transaction" TO "anon";
GRANT ALL ON TABLE "public"."transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



-- ---------------------------------------------------------------------------
-- Privileges. The live project revokes more than a fresh project's defaults
-- grant (anon has no EXECUTE on internal functions, table access is exactly
-- what RLS expects). `supabase db diff` against the live project produced
-- these; without them a replay would be more permissive than production.
-- ---------------------------------------------------------------------------

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";
REVOKE ALL ON FUNCTION "public"."audit_current_actor"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."audit_current_actor"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."audit_employee_write"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."audit_employee_write"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."audit_log_is_append_only"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."audit_log_is_append_only"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."expire_abandoned_orders"(interval) FROM "anon";
REVOKE ALL ON FUNCTION "public"."expire_abandoned_orders"(interval) FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."expire_unaccepted_orders"(interval) FROM "anon";
REVOKE ALL ON FUNCTION "public"."expire_unaccepted_orders"(interval) FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."flag_refund_on_cancel"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."flag_refund_on_cancel"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."get_cancellation_reason_breakdown"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_cash_remitted"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_cash_remitted_daily"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_customer_order_history"(uuid) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_customer_stats"(text, date, date, integer, numeric, date, date, text) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_payment_method_breakdown"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_sales_by_hour"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."get_sales_by_weekday"(date, date) FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_customer_notification_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_customer_notification_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."guard_customer_order_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_customer_order_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."guard_customer_self_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_customer_self_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."guard_employee_self_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_employee_self_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."guard_order_issue_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_order_issue_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."guard_product_price"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."guard_product_price"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."handle_password_timestamp_update"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."handle_password_timestamp_update"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."log_order_status"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."log_order_status"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."log_product_price"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."log_product_price"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."mark_pay_in_store_paid"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."mark_pay_in_store_paid"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."notify_customer_of_order_status"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."notify_customer_of_order_status"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."record_employee_action"(text, text, text, text, jsonb) FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_order_pending_at"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_order_pending_at"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."set_order_ready_at"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."set_order_ready_at"() FROM "authenticated";
REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."submit_cart_to_order"(uuid, text, text, text, jsonb, jsonb, text) FROM "anon";
REVOKE ALL ON FUNCTION "public"."submit_direct_product_review"(uuid, integer, text) FROM "anon";
REVOKE ALL ON FUNCTION "public"."submit_order_review"(uuid, integer, text, uuid) FROM "anon";
REVOKE ALL ON FUNCTION "public"."update_password_timestamp"() FROM "anon";
REVOKE ALL ON FUNCTION "public"."update_password_timestamp"() FROM "authenticated";
REVOKE ALL ON TABLE "public"."audit_log" FROM "anon";
REVOKE ALL ON TABLE "public"."cart_item_add_on" FROM "anon";
REVOKE ALL ON TABLE "public"."login_attempt" FROM "anon";
REVOKE ALL ON TABLE "public"."login_attempt" FROM "authenticated";
REVOKE ALL ON TABLE "public"."order_issue" FROM "anon";
REVOKE ALL ON TABLE "public"."order_item_add_on" FROM "anon";
REVOKE ALL ON TABLE "public"."order_status_log" FROM "anon";
REVOKE ALL ON TABLE "public"."add_on" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."add_on" TO "anon";
REVOKE ALL ON TABLE "public"."audit_log" FROM "authenticated";
GRANT SELECT ON TABLE "public"."audit_log" TO "authenticated";
REVOKE ALL ON TABLE "public"."cart" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."cart" TO "anon";
REVOKE ALL ON TABLE "public"."cart_item" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."cart_item" TO "anon";
REVOKE ALL ON TABLE "public"."categories" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."categories" TO "anon";
REVOKE ALL ON TABLE "public"."customer" FROM "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER ON TABLE "public"."customer" TO "anon";
REVOKE ALL ON TABLE "public"."employee" FROM "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER ON TABLE "public"."employee" TO "anon";
REVOKE ALL ON TABLE "public"."notification" FROM "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER ON TABLE "public"."notification" TO "anon";
REVOKE ALL ON TABLE "public"."order" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."order" TO "anon";
REVOKE ALL ON TABLE "public"."order_item" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."order_item" TO "anon";
REVOKE ALL ON TABLE "public"."order_status_log" FROM "authenticated";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."order_status_log" TO "authenticated";
REVOKE ALL ON TABLE "public"."product" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."product" TO "anon";
REVOKE ALL ON TABLE "public"."product_price_log" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."product_price_log" TO "anon";
REVOKE ALL ON TABLE "public"."product_price_log" FROM "authenticated";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."product_price_log" TO "authenticated";
REVOKE ALL ON TABLE "public"."reports" FROM "anon";
GRANT MAINTAIN, REFERENCES, TRIGGER ON TABLE "public"."reports" TO "anon";
REVOKE ALL ON TABLE "public"."review" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."review" TO "anon";
REVOKE ALL ON TABLE "public"."store_setting" FROM "anon";
GRANT SELECT ON TABLE "public"."store_setting" TO "anon";
REVOKE ALL ON TABLE "public"."store_setting" FROM "authenticated";
GRANT SELECT, UPDATE ON TABLE "public"."store_setting" TO "authenticated";
REVOKE ALL ON TABLE "public"."transaction" FROM "anon";
GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER ON TABLE "public"."transaction" TO "anon";
