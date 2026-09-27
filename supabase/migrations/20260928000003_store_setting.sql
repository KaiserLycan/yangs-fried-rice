-- Issue #115: store pause / busy mode, and store hours a manager can edit.
--
-- One row holds the switches the whole shop runs on:
--   * is_paused / paused_until — a manager's "stop taking orders" button,
--     optionally timed ("Paused for 15 min"). A pause whose paused_until has
--     passed is over; nothing has to clear it.
--   * max_active_orders — when this many orders are pending, received or
--     preparing, the shop reads as busy and checkout is refused (auto-pause).
--   * extra_prep_minutes — added to the kitchen estimate customers are quoted.
--   * open_hour / close_hour — Manila time, open at open_hour:00, closed from
--     close_hour:00. Used to be hardcoded 8–18 in lib/store-hours.ts.
--   * is_force_open — ignore the hours (demos, special days).
--
-- get_store_status() is the one place these are turned into an answer. The
-- API route, the dashboard and submit_cart_to_order all read it, so the
-- banner a customer sees and the rule checkout enforces cannot disagree.

-- ---------------------------------------------------------------------------
-- 1. The table (one row)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.store_setting (
  -- The one-row trick: the key can only be `true`, so a second row is
  -- impossible.
  id                 boolean     PRIMARY KEY DEFAULT true CHECK (id),
  is_paused          boolean     NOT NULL DEFAULT false,
  paused_until       timestamptz,
  extra_prep_minutes integer     NOT NULL DEFAULT 0
                     CHECK (extra_prep_minutes BETWEEN 0 AND 120),
  max_active_orders  integer     NOT NULL DEFAULT 20
                     CHECK (max_active_orders BETWEEN 1 AND 500),
  open_hour          smallint    NOT NULL DEFAULT 8
                     CHECK (open_hour BETWEEN 0 AND 23),
  close_hour         smallint    NOT NULL DEFAULT 18
                     CHECK (close_hour BETWEEN 1 AND 24),
  is_force_open      boolean     NOT NULL DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT store_setting_hours_order CHECK (open_hour < close_hour)
);

COMMENT ON TABLE public.store_setting IS
  'One row of shop-wide switches: pause, busy limit, extra prep time and opening hours (Manila). Read through get_store_status().';

INSERT INTO public.store_setting (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Stamp who changed it and when, so the value can't be forged by the client.
CREATE OR REPLACE FUNCTION public.touch_store_setting()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_store_setting ON public.store_setting;
CREATE TRIGGER trg_touch_store_setting
  BEFORE UPDATE ON public.store_setting
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_setting();

-- ---------------------------------------------------------------------------
-- 2. Who may read and write it
-- ---------------------------------------------------------------------------

-- Everyone may read (the menu shows the "closed" / "very busy" banner to
-- visitors who are not signed in). Only a manager may change it, and there
-- is no INSERT or DELETE policy: the single row is permanent.
ALTER TABLE public.store_setting ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_setting_read ON public.store_setting;
CREATE POLICY store_setting_read ON public.store_setting
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS store_setting_manager_update ON public.store_setting;
CREATE POLICY store_setting_manager_update ON public.store_setting
  FOR UPDATE TO authenticated
  USING (public.current_employee_role() = 'MANAGER')
  WITH CHECK (public.current_employee_role() = 'MANAGER');

REVOKE ALL ON public.store_setting FROM anon, authenticated;
GRANT SELECT ON public.store_setting TO anon, authenticated;
GRANT UPDATE ON public.store_setting TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. get_store_status(): the one answer to "can we take an order now?"
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER because of active_orders: a customer can only see their
-- own orders under RLS, so a count run as them would always be ~0 and the
-- busy limit would never trip. Only the count leaves this function, never a
-- row.
CREATE OR REPLACE FUNCTION public.get_store_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_s            public.store_setting%ROWTYPE;
  v_manila_hour  integer := extract(hour FROM (now() AT TIME ZONE 'Asia/Manila'))::integer;
  v_active       integer;
  v_paused       boolean;
BEGIN
  SELECT * INTO v_s FROM public.store_setting WHERE id;

  -- The row should always exist; if someone deleted it, behave as the
  -- defaults did before this table.
  IF NOT FOUND THEN
    v_s.is_paused          := false;
    v_s.paused_until       := NULL;
    v_s.extra_prep_minutes := 0;
    v_s.max_active_orders  := 20;
    v_s.open_hour          := 8;
    v_s.close_hour         := 18;
    v_s.is_force_open      := false;
  END IF;

  SELECT count(*) INTO v_active
  FROM public."order"
  WHERE order_status IN ('pending', 'received', 'preparing');

  v_paused := v_s.is_paused
          AND (v_s.paused_until IS NULL OR v_s.paused_until > now());

  RETURN jsonb_build_object(
    'is_open',            v_s.is_force_open
                          OR (v_manila_hour >= v_s.open_hour AND v_manila_hour < v_s.close_hour),
    'is_paused',          v_paused,
    'paused_until',       CASE WHEN v_paused THEN v_s.paused_until END,
    'is_busy',            v_active >= v_s.max_active_orders,
    'active_orders',      v_active,
    'max_active_orders',  v_s.max_active_orders,
    'open_hour',          v_s.open_hour,
    'close_hour',         v_s.close_hour,
    'extra_prep_minutes', v_s.extra_prep_minutes,
    'is_force_open',      v_s.is_force_open
  );
END;
$$;

COMMENT ON FUNCTION public.get_store_status() IS
  'Whether the shop is open, paused or busy right now, with the settings behind it. Read by /api/store/status, the dashboard and submit_cart_to_order.';

REVOKE ALL ON FUNCTION public.get_store_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_status() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
