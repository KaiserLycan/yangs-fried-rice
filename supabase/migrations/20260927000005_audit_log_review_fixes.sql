-- Employee audit log: fixes from the persona review of 20260927000004.
--
-- 1. Add-on renames were not logged (DBA, QA). The trigger ignored any column
--    called `name`, meant for the generated full-name columns on `employee`
--    and `customer` — but on `add_on`, `name` is a real column, so renaming an
--    add-on wrote no entry and creating one left its name out. The trigger
--    now skips a column only when the catalog says it is generated
--    (pg_attribute.attgenerated), whatever it is called.
--
-- 2. `record_employee_action()` could be called straight over the API by any
--    employee with any allowlisted action (security analyst). The entry was
--    attributed to them, but a staff account could still record, say, an
--    `employee.delete` that never happened. The function now checks the
--    caller against the action:
--      * manager-only events (creating, updating, deleting or resetting the
--        password of another employee; report exports) need MANAGER;
--      * self-service events (sign-in/out, own password, own photo, deleting
--        one's own account) must name the caller themselves.
--    Summaries stay free text, but an entry can now only describe something
--    its author was allowed to do.
--
-- 3. Customers' personal data was copied into a log that can never be
--    purged (lawyer). Deleting a customer stored their email, phone, birth
--    date and name in `changes` for good — at odds with a Data Privacy Act
--    erasure request. Customer personal columns, review comments and the
--    customer's own order notes are now recorded as *changed* but never with
--    their values ("[personal data]"), and a customer is named by id prefix
--    (`Customer #d6f3cc2c`), not by name. Employee records are the
--    employer's own HR data and are kept as they are.
--
-- 4. The app now records `employee.disable`, `employee.enable` and
--    `employee.role_change` itself (manager), so a change made from the
--    Employees page carries the same action as one caught by the trigger.

-- ---------------------------------------------------------------------------
-- 1. Trigger: skip generated columns by catalog, not by name
-- ---------------------------------------------------------------------------

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

  v_label := CASE
    WHEN v_entity = 'order'   THEN '#' || left(btrim(v_row ->> 'order_id'), 8)
    WHEN v_entity = 'customer' THEN '#' || left(btrim(v_row ->> 'customer_id'), 8)
    WHEN v_entity = 'payment' THEN 'for order #' || left(btrim(coalesce(v_row ->> 'order_id', '')), 8)
    WHEN v_label_col IS NOT NULL AND coalesce(v_row ->> v_label_col, '') <> ''
                              THEN '"' || (v_row ->> v_label_col) || '"'
    ELSE left(v_row ->> v_pk, 8)
  END;

  v_noun := CASE v_entity
    WHEN 'add_on' THEN 'Add-on'
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

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_employee_write() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. App-side entries: only what the caller was allowed to do
-- ---------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public.record_employee_action(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_employee_action(text, text, text, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
