-- Issue #118 follow-up, from the persona review of PR #122.
--
--   1. Account deletion broke for anyone who had filed a problem report
--      (DBA, lawyer). `order_issue.customer_id` is ON DELETE SET NULL, and
--      that cascaded UPDATE runs through `guard_order_issue_update`, which
--      refused any change but `resolved_at` / `resolved_by`. The guard now
--      also lets `customer_id` and `photo_path` be cleared — erasure only
--      ever goes one way, so nobody can use it to rewrite a report.
--      `deleteMyAccount` removes the photos from storage and clears
--      `photo_path` before the customer row goes.
--
--   2. Indexes for the two new foreign keys (performance advisor
--      `unindexed_foreign_keys`): deleting an order cascades to its
--      notifications, and the customer's own-report policy filters on
--      `customer_id`.
--
--   3. The customer `order_issue` policies call `auth.uid()` once per
--      statement instead of once per row (advisor `auth_rls_initplan`).
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Guard: resolve, or erase; never rewrite
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_order_issue_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.guard_order_issue_update() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Foreign-key indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS notification_order_id_idx
  ON public.notification (order_id);

CREATE INDEX IF NOT EXISTS order_issue_customer_id_idx
  ON public.order_issue (customer_id);

-- ---------------------------------------------------------------------------
-- 3. Customer policies: auth.uid() evaluated once
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "customer_select_own_order_issue" ON public.order_issue;
CREATE POLICY "customer_select_own_order_issue" ON public.order_issue
  FOR SELECT TO authenticated
  USING (customer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "customer_insert_own_order_issue" ON public.order_issue;
CREATE POLICY "customer_insert_own_order_issue" ON public.order_issue
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id = (SELECT auth.uid())
    AND resolved_at IS NULL
    AND resolved_by IS NULL
    AND (photo_path IS NULL OR split_part(photo_path, '/', 1) = (SELECT auth.uid())::text)
    AND EXISTS (
      SELECT 1
      FROM public."order" o
      WHERE o.order_id = order_issue.order_id
        AND o.customer_id = (SELECT auth.uid())
        AND o.order_status = 'completed'
        AND coalesce(o.completed_at, o.created_at) > now() - interval '24 hours'
    )
    AND order_item_ids <@ ARRAY(
      SELECT oi.order_item_id FROM public.order_item oi WHERE oi.order_id = order_issue.order_id
    )
  );

NOTIFY pgrst, 'reload schema';
