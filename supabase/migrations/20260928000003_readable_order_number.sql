-- A readable order number (UI/UX review, docs/user-simulation.md #16).
--
-- Every order was known by the first eight characters of its UUID
-- (`#38206dc0`, issue #106): unique enough, but hard to say across a counter
-- or over the phone. `order.order_number` is a plain number (`#1042`) that
-- the database hands out in order and never reuses. What changes:
--
--   1. The column. Existing orders are numbered in the order they were
--      placed, starting at 1001; new ones continue from the highest. It is
--      GENERATED ALWAYS AS IDENTITY, so nobody — staff, the API, a customer's
--      REST call — can set or change it.
--   2. The status notification prints it ("Your order #1042 is ready for
--      pickup — Counter 1").
--   3. The audit log names orders, and the payments and problem reports that
--      belong to them, by it.
--
-- The UUID stays the primary key and is still what URLs and foreign keys use.
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. order.order_number
-- ---------------------------------------------------------------------------

ALTER TABLE public."order" ADD COLUMN IF NOT EXISTS order_number bigint;

-- Number any order that has none yet, oldest first. Runs as the migration
-- role: the audit trigger records nothing (no employee), the notification
-- trigger does not fire (order_status is not being set).
WITH numbered AS (
  SELECT order_id,
         (SELECT coalesce(max(order_number), 1000) FROM public."order")
           + row_number() OVER (ORDER BY created_at, order_id) AS n
  FROM public."order"
  WHERE order_number IS NULL
)
UPDATE public."order" o
SET order_number = numbered.n
FROM numbered
WHERE o.order_id = numbered.order_id;

-- Every order has one now; an identity column must be NOT NULL first.
ALTER TABLE public."order" ALTER COLUMN order_number SET NOT NULL;

-- From here the database hands out the numbers, and nothing can overwrite one.
DO $$
DECLARE
  v_start bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public."order"'::regclass
      AND attname = 'order_number'
      AND attidentity <> ''
  ) THEN
    SELECT coalesce(max(order_number), 1000) + 1 INTO v_start FROM public."order";
    EXECUTE format(
      'ALTER TABLE public."order" ALTER COLUMN order_number ADD GENERATED ALWAYS AS IDENTITY (START WITH %s)',
      v_start
    );
  END IF;
END $$;


CREATE UNIQUE INDEX IF NOT EXISTS order_order_number_key
  ON public."order" (order_number);

COMMENT ON COLUMN public."order".order_number IS
  'The number people say out loud: #1042. Assigned by the database in order, never reused, never editable. formatOrderNumber (lib/orders/order-number.ts) prints it.';

-- ---------------------------------------------------------------------------
-- 2. Status notifications print the number
--    (20260928000000's function; only v_ref changes)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_customer_of_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- The readable order number (20260928000003), as formatOrderNumber prints it.
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

REVOKE ALL ON FUNCTION public.notify_customer_of_order_status() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. The audit log names orders by number
--    (20260928000002's function; only the label changes)
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

  -- Orders are named by their readable number (20260928000003); rows that
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

REVOKE ALL ON FUNCTION public.audit_employee_write() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
