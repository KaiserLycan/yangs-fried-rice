-- Issue #118: order notifications, missing/wrong item reports, and the
-- realtime publication the customer screens were already subscribing to.
--
--   1. `notification` gets `order_id` and `kind`, so the bell can link to the
--      order a message is about.
--   2. A trigger on `order` writes a notification whenever the status moves
--      (limitations #10). Until now nothing ever inserted a row.
--   3. `notification` and `order` join the `supabase_realtime` publication.
--      The tracking screen, the payment card and the new bell all subscribe
--      to `postgres_changes`, but the live publication had no tables in it,
--      so none of those subscriptions ever fired.
--   4. `order_issue`: a customer's "Report a problem" on a completed order,
--      within 24 hours (limitations #24).
--   5. `order-issue-photos`: a private bucket for the optional photo.
--   6. `received` is retired from the order vocabulary (limitations #33).
--      Nothing ever moved an order into it — `VALID_TRANSITIONS` had no way
--      in — and no live row holds it. `pending → preparing` is the
--      "staff accepted" step. There is no CHECK constraint on
--      `order.order_status` to change; the app's list is the vocabulary.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. notification.order_id, notification.kind
-- ---------------------------------------------------------------------------

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS order_id uuid
  REFERENCES public."order"(order_id) ON DELETE CASCADE;

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS kind text;

COMMENT ON COLUMN public.notification.order_id IS
  'The order this message is about, or null for a general message. The bell links to /orders/<order_id>.';
COMMENT ON COLUMN public.notification.kind IS
  'What happened, as a stable key: order_preparing, order_ready, order_completed, order_cancelled, payment_received, payment_failed.';

-- Existing rows were written with no default; the bell counts `is_read = false`.
UPDATE public.notification SET is_read = false WHERE is_read IS NULL;
ALTER TABLE public.notification ALTER COLUMN is_read SET DEFAULT false;
ALTER TABLE public.notification ALTER COLUMN is_read SET NOT NULL;
ALTER TABLE public.notification ALTER COLUMN created_at SET DEFAULT now();
UPDATE public.notification SET created_at = now() WHERE created_at IS NULL;
ALTER TABLE public.notification ALTER COLUMN created_at SET NOT NULL;

-- The bell reads "my newest" and counts "my unread".
CREATE INDEX IF NOT EXISTS notification_customer_created_at_idx
  ON public.notification (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_customer_unread_idx
  ON public.notification (customer_id)
  WHERE is_read = false;

-- A customer may mark their own message read, and nothing else: the policy
-- `customer_update_own_notification` allows any column, so without this a
-- REST call could rewrite the message text or point it at another order.
CREATE OR REPLACE FUNCTION public.guard_customer_notification_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.guard_customer_notification_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_customer_notification_update ON public.notification;
CREATE TRIGGER trg_guard_customer_notification_update
  BEFORE UPDATE ON public.notification
  FOR EACH ROW EXECUTE FUNCTION public.guard_customer_notification_update();

-- ---------------------------------------------------------------------------
-- 2. Order status → notification
-- ---------------------------------------------------------------------------

-- The order reference is the first eight characters of the id, exactly as
-- `formatOrderNumber` (lib/orders/order-number.ts) prints it everywhere else.
-- The pickup point is "Counter 1", matching PICKUP_COUNTER in
-- lib/site/site-info.ts; change both together.
--
-- SECURITY DEFINER because the writer is whoever moved the order: staff, the
-- PayMongo webhook (service role) or the customer cancelling. Only managers
-- may insert notifications directly (`staff_insert_notification`), and that
-- stays true — this function is the one other way a row is written, and it
-- only ever writes to the order's own customer.
CREATE OR REPLACE FUNCTION public.notify_customer_of_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref     text := '#' || left(NEW.order_id::text, 8);
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

DROP TRIGGER IF EXISTS trg_notify_customer_of_order_status ON public."order";
CREATE TRIGGER trg_notify_customer_of_order_status
  AFTER UPDATE OF order_status ON public."order"
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION public.notify_customer_of_order_status();

-- ---------------------------------------------------------------------------
-- 3. Realtime
-- ---------------------------------------------------------------------------

-- Realtime applies each subscriber's RLS to `postgres_changes`, so a customer
-- receives only their own notifications and orders, exactly as a SELECT
-- would return them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notification'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public."order";
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. order_issue
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_issue (
  issue_id       uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       uuid        NOT NULL REFERENCES public."order"(order_id) ON DELETE CASCADE,
  customer_id    uuid        REFERENCES public.customer(customer_id) ON DELETE SET NULL,
  -- The affected lines. An array rather than a join table: a report is
  -- written once and never edited, and the RLS check below needs the whole
  -- set in one expression.
  order_item_ids uuid[]      NOT NULL CHECK (cardinality(order_item_ids) BETWEEN 1 AND 50),
  issue_type     text        NOT NULL CHECK (issue_type IN ('missing', 'wrong', 'damaged')),
  note           text        CHECK (note IS NULL OR length(note) <= 500),
  -- A path in the private `order-issue-photos` bucket, `<customer uuid>/<file>`.
  -- Never a URL: staff see the photo through a short-lived signed link, the
  -- same rule as lib/storage/senior-pwd-ids.ts.
  photo_path     text        CHECK (photo_path IS NULL OR photo_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+$'),
  created_at     timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  resolved_by    uuid,
  -- One report per order. A second problem goes in the same conversation at
  -- the counter, not a second ticket.
  CONSTRAINT order_issue_order_id_key UNIQUE (order_id)
);

COMMENT ON TABLE public.order_issue IS
  'A customer''s missing / wrong / damaged item report on a completed order (limitations #24). Refunds stay manual.';

CREATE INDEX IF NOT EXISTS order_issue_open_idx
  ON public.order_issue (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.order_issue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.order_issue FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.order_issue TO authenticated;

DROP POLICY IF EXISTS "customer_select_own_order_issue" ON public.order_issue;
CREATE POLICY "customer_select_own_order_issue" ON public.order_issue
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- The whole rule for a report, in the database rather than only in the app:
-- your own order, completed, within 24 hours of completion, the ticked lines
-- all belong to it, the photo is in your own folder, and it arrives open.
DROP POLICY IF EXISTS "customer_insert_own_order_issue" ON public.order_issue;
CREATE POLICY "customer_insert_own_order_issue" ON public.order_issue
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = auth.uid()
    AND resolved_at IS NULL
    AND resolved_by IS NULL
    AND (photo_path IS NULL OR split_part(photo_path, '/', 1) = auth.uid()::text)
    AND EXISTS (
      SELECT 1
      FROM public."order" o
      WHERE o.order_id = order_issue.order_id
        AND o.customer_id = auth.uid()
        AND o.order_status = 'completed'
        AND coalesce(o.completed_at, o.created_at) > now() - interval '24 hours'
    )
    AND order_item_ids <@ ARRAY(
      SELECT oi.order_item_id FROM public.order_item oi WHERE oi.order_id = order_issue.order_id
    )
  );

DROP POLICY IF EXISTS "staff_select_order_issue" ON public.order_issue;
CREATE POLICY "staff_select_order_issue" ON public.order_issue
  FOR SELECT TO authenticated
  USING (public.current_employee_role() IN ('MANAGER', 'STAFF'));

DROP POLICY IF EXISTS "staff_resolve_order_issue" ON public.order_issue;
CREATE POLICY "staff_resolve_order_issue" ON public.order_issue
  FOR UPDATE TO authenticated
  USING (public.current_employee_role() IN ('MANAGER', 'STAFF'))
  WITH CHECK (public.current_employee_role() IN ('MANAGER', 'STAFF'));

-- Staff close a report; they do not rewrite what the customer said.
CREATE OR REPLACE FUNCTION public.guard_order_issue_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['resolved_at', 'resolved_by'])
     IS DISTINCT FROM
     (to_jsonb(OLD) - ARRAY['resolved_at', 'resolved_by'])
  THEN
    RAISE EXCEPTION 'A problem report can only be resolved, not changed.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_order_issue_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_order_issue_update ON public.order_issue;
CREATE TRIGGER trg_guard_order_issue_update
  BEFORE UPDATE ON public.order_issue
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_issue_update();

-- ---------------------------------------------------------------------------
-- 5. order-issue-photos: private, 2 MB, images only
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-issue-photos',
  'order-issue-photos',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public             = false,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "order_issue_photos_customer_insert_own" ON storage.objects;
CREATE POLICY "order_issue_photos_customer_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-issue-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "order_issue_photos_customer_select_own" ON storage.objects;
CREATE POLICY "order_issue_photos_customer_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-issue-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- So the app can take back a photo whose report then failed to save.
DROP POLICY IF EXISTS "order_issue_photos_customer_delete_own" ON storage.objects;
CREATE POLICY "order_issue_photos_customer_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'order-issue-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "order_issue_photos_staff_select" ON storage.objects;
CREATE POLICY "order_issue_photos_staff_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-issue-photos'
    AND public.current_employee_role() IN ('MANAGER', 'STAFF')
  );

NOTIFY pgrst, 'reload schema';
