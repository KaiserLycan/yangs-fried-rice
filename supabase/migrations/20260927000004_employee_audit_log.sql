-- Employee audit log.
--
-- One append-only table, `audit_log`, recording what every employee does in
-- the system: who, when, what they touched, and exactly which fields changed.
-- Managers read it at /manage/audit-log. Nobody — not a manager, not the app's
-- service role — can edit or delete an entry once written.
--
-- WHY THIS EXISTS
--
-- The owner and manager walkthroughs (docs/user-simulation.md, personas 7 and
-- 13) kept asking "who changed the price?", "who cancelled this?", "who
-- disabled that account?", and the lawyer walkthrough noted an audit trail is
-- what shows electronic records are reliable. Panel item F20 and the
-- comparison table (docs/comparison.md) list it as missing. Until now the only
-- trace was `employee.last_access_log`: when someone last signed in, not what
-- they did.
--
-- HOW ENTRIES ARE WRITTEN — two sources, never both for the same event
--
--   source = 'database'  An AFTER trigger on every table staff and managers
--                        write to (orders, payments, menu, employees,
--                        customers, reports, reviews, notifications). It fires
--                        when the signed-in caller is an employee, so it
--                        catches every write made through an employee's own
--                        session — the app's server actions, the /api routes,
--                        and a direct REST call with a stolen token alike. It
--                        cannot be skipped from the app.
--
--   source = 'app'       `record_employee_action()`, called by the server for
--                        the few things the trigger cannot see: writes made
--                        with the service role after a manager check (creating,
--                        editing and deleting employees, employee photos),
--                        Auth-only changes (passwords), and events that write
--                        no table row (sign-in, sign-out, report exports). The
--                        actor is taken from the caller's session inside the
--                        function, never from a parameter, so an entry cannot
--                        be attributed to someone else.
--
-- A service-role write has no auth.uid(), so the trigger skips it; that is
-- exactly the case the app records itself, so nothing is logged twice.
-- Customer and webhook writes are not employee interactions and are skipped.

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_log (
  audit_id     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  -- Deliberately no foreign key: deleting an employee must not delete, or
  -- blank out, the record of what they did. The name and role are copied at
  -- the time of the action for the same reason.
  actor_id     uuid,
  actor_name   text,
  actor_role   text,
  -- `<entity>.<verb>`, e.g. order.status_change, product.price_change.
  action       text NOT NULL CHECK (action ~ '^[a-z_]+\.[a-z_]+$'),
  entity_type  text NOT NULL CHECK (entity_type ~ '^[a-z_]+$'),
  entity_id    text,
  summary      text NOT NULL CHECK (length(summary) BETWEEN 1 AND 500),
  -- { "<column>": { "from": …, "to": … } } — only the columns that changed.
  changes      jsonb NOT NULL DEFAULT '{}'::jsonb,
  source       text NOT NULL CHECK (source IN ('database', 'app'))
);

COMMENT ON TABLE public.audit_log IS
  'Append-only record of every employee action. Written by trg_audit_employee_write and record_employee_action(); read by managers only.';

CREATE INDEX IF NOT EXISTS audit_log_occurred_at_idx
  ON public.audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_occurred_at_idx
  ON public.audit_log (actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx
  ON public.audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 2. Access: managers read, nobody writes directly
-- ---------------------------------------------------------------------------

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.audit_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.audit_log TO authenticated;

DROP POLICY IF EXISTS "manager_select_audit_log" ON public.audit_log;
CREATE POLICY "manager_select_audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.current_employee_role() = 'MANAGER');

-- No INSERT, UPDATE or DELETE policy and no such grant: entries only arrive
-- through the SECURITY DEFINER functions below.

-- ---------------------------------------------------------------------------
-- 3. Append-only, for everyone
-- ---------------------------------------------------------------------------

-- RLS does not bind the service role or the table owner, so the rule that an
-- entry is never changed is enforced by triggers instead, which do. Removing
-- them would take a deliberate migration, which is itself on the record.
CREATE OR REPLACE FUNCTION public.audit_log_is_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: entries cannot be changed or removed.'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.audit_log_is_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_audit_log_append_only ON public.audit_log;
CREATE TRIGGER trg_audit_log_append_only
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_is_append_only();

DROP TRIGGER IF EXISTS trg_audit_log_no_truncate ON public.audit_log;
CREATE TRIGGER trg_audit_log_no_truncate
  BEFORE TRUNCATE ON public.audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.audit_log_is_append_only();

-- ---------------------------------------------------------------------------
-- 4. Who is acting
-- ---------------------------------------------------------------------------

-- The signed-in caller as an employee, or no row for anyone else (customers,
-- the service role, anonymous). Unlike current_employee_role(), a *disabled*
-- employee still counts: the one thing they can still write is their own row
-- (self-deactivation happens in the same statement the trigger sees), and
-- anything a disabled account manages to do is exactly what a manager should
-- be able to find.
CREATE OR REPLACE FUNCTION public.audit_current_actor(
  OUT actor_id   uuid,
  OUT actor_name text,
  OUT actor_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.employee_id, e.name, upper(trim(e.role))
  FROM public.employee e
  WHERE e.employee_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.audit_current_actor() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Database-side capture
-- ---------------------------------------------------------------------------

-- Trigger arguments: (primary key column, label column or '', entity type).
CREATE OR REPLACE FUNCTION public.audit_employee_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor     record;
  v_old       jsonb := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_new       jsonb := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  v_row       jsonb;
  v_pk        text := TG_ARGV[0];
  v_label_col text := nullif(TG_ARGV[1], '');
  v_entity    text := TG_ARGV[2];
  -- Noise: sign-in timestamps, password bookkeeping (recorded by the app as a
  -- password change instead), and generated columns that only echo others.
  v_ignore    text[] := ARRAY['last_access_log', 'password_last_updated', 'name', 'address_details'];
  -- Never copied into the log: a Senior Citizen / PWD ID number (issue #116).
  v_redact    text[] := ARRAY['discount_id_number'];
  v_changes   jsonb := '{}'::jsonb;
  v_key       text;
  v_from      jsonb;
  v_to        jsonb;
  v_label     text;
  v_noun      text;
  v_action    text;
  v_summary   text;
  v_fields    text;
BEGIN
  SELECT * INTO v_actor FROM public.audit_current_actor();
  IF v_actor.actor_id IS NULL THEN
    RETURN NULL;  -- not an employee: customers, webhooks, the service role
  END IF;

  v_row := coalesce(v_new, v_old);

  FOR v_key IN SELECT jsonb_object_keys(v_row) LOOP
    CONTINUE WHEN v_key = ANY (v_ignore);
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
    END IF;

    v_changes := v_changes || jsonb_build_object(
      v_key,
      jsonb_strip_nulls(jsonb_build_object('from', v_from, 'to', v_to))
    );
  END LOOP;

  -- An update that only touched ignored columns (e.g. the sign-in timestamp)
  -- is not an action worth recording.
  IF TG_OP = 'UPDATE' AND v_changes = '{}'::jsonb THEN
    RETURN NULL;
  END IF;

  -- How the row is named in the summary. Orders and payments use the order
  -- number customers and staff see: the first 8 characters of the order id.
  v_label := CASE
    WHEN v_entity = 'order'   THEN '#' || left(btrim(v_row ->> 'order_id'), 8)
    WHEN v_entity = 'payment' THEN 'for order #' || left(btrim(coalesce(v_row ->> 'order_id', '')), 8)
    WHEN v_label_col IS NOT NULL AND coalesce(v_row ->> v_label_col, '') <> ''
                              THEN '"' || (v_row ->> v_label_col) || '"'
    ELSE left(v_row ->> v_pk, 8)
  END;

  v_noun := CASE v_entity
    WHEN 'add_on' THEN 'Add-on'
    ELSE initcap(replace(v_entity, '_', ' '))
  END;

  -- The verb a manager would search for.
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

  RETURN NULL;  -- AFTER trigger: the return value is ignored
END;
$$;

REVOKE ALL ON FUNCTION public.audit_employee_write() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('order',        'order_id',        '',              'order'),
      ('transaction',  'transaction_id',  '',              'payment'),
      ('product',      'product_id',      'product_name',  'product'),
      ('categories',   'category_id',     'category_name', 'category'),
      ('add_on',       'addon_id',        'name',          'add_on'),
      ('employee',     'employee_id',     'name',          'employee'),
      ('customer',     'customer_id',     'name',          'customer'),
      ('reports',      'report_id',       'report_type',   'report'),
      ('review',       'review_id',       '',              'review'),
      ('notification', 'notification_id', '',              'notification')
    ) AS v(tbl, pk, label, entity)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_employee_write ON public.%I', t.tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_employee_write AFTER INSERT OR UPDATE OR DELETE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.audit_employee_write(%L, %L, %L)',
      t.tbl, t.pk, t.label, t.entity
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6. App-side capture
-- ---------------------------------------------------------------------------

-- For what the trigger cannot see (see the header). Returns the new entry's
-- id, or NULL — without raising — when the caller is not an employee,
-- so shared code paths (sign-out is used by customers too) can call it
-- unconditionally. Only the listed actions are accepted: this is a way to
-- record specific events, not a way to write arbitrary history.
CREATE OR REPLACE FUNCTION public.record_employee_action(
  p_action      text,
  p_entity_type text,
  p_entity_id   text,
  p_summary     text,
  p_changes     jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor record;
  v_id    bigint;
BEGIN
  SELECT * INTO v_actor FROM public.audit_current_actor();
  IF v_actor.actor_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_action IS NULL OR p_action NOT IN (
    'session.sign_in',
    'session.sign_out',
    'session.password_change',
    'employee.create',
    'employee.update',
    'employee.delete',
    'employee.password_reset',
    'employee.photo_change',
    'report.export'
  ) THEN
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
    p_action, p_entity_type, nullif(btrim(coalesce(p_entity_id, '')), ''),
    left(btrim(p_summary), 500), coalesce(p_changes, '{}'::jsonb), 'app'
  )
  RETURNING audit_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_employee_action(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_employee_action(text, text, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
