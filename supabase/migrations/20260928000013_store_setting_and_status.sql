-- `store_setting` and `get_store_status()`, as they exist on the live project.
--
-- 20260928000004 and 20260928000005 rebuild `submit_cart_to_order` on top of
-- issue #115's version, which calls `get_store_status()`. That function and
-- the one-row `store_setting` table it reads were created in Supabase for
-- #115 before any migration reached the repo, so a database built from the
-- migrations (`supabase db reset`, a new environment) would have neither,
-- and every checkout would fail with "function get_store_status() does not
-- exist". Found in the review of PR #123.
--
-- Copied from the live definitions on 2026-09-27. Everything is guarded, so
-- on the live project this changes nothing. When #115 lands its own
-- migration, it can replace these freely (CREATE OR REPLACE / IF NOT EXISTS).
--
-- (plpgsql resolves names when a function first runs, not when it is
-- created, which is why 20260928000004/5 applied cleanly before this one.)

-- ---------------------------------------------------------------------------
-- store_setting: one row of shop-wide settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.store_setting (
  id                 boolean     NOT NULL DEFAULT true PRIMARY KEY CHECK (id),
  is_paused          boolean     NOT NULL DEFAULT false,
  paused_until       timestamptz,
  extra_prep_minutes integer     NOT NULL DEFAULT 0
                     CHECK (extra_prep_minutes >= 0 AND extra_prep_minutes <= 120),
  max_active_orders  integer     NOT NULL DEFAULT 20
                     CHECK (max_active_orders >= 1 AND max_active_orders <= 500),
  open_hour          smallint    NOT NULL DEFAULT 8
                     CHECK (open_hour >= 0 AND open_hour <= 23),
  close_hour         smallint    NOT NULL DEFAULT 18
                     CHECK (close_hour >= 1 AND close_hour <= 24),
  is_force_open      boolean     NOT NULL DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  CHECK (open_hour < close_hour)
);

INSERT INTO public.store_setting (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_setting ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_setting_read" ON public.store_setting;
CREATE POLICY "store_setting_read" ON public.store_setting
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_setting_manager_update" ON public.store_setting;
CREATE POLICY "store_setting_manager_update" ON public.store_setting
  FOR UPDATE
  USING (public.current_employee_role() = 'MANAGER')
  WITH CHECK (public.current_employee_role() = 'MANAGER');

GRANT SELECT ON public.store_setting TO anon, authenticated;
GRANT UPDATE ON public.store_setting TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_store_setting()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_touch_store_setting ON public.store_setting;
CREATE TRIGGER trg_touch_store_setting
  BEFORE UPDATE ON public.store_setting
  FOR EACH ROW EXECUTE FUNCTION public.touch_store_setting();

-- ---------------------------------------------------------------------------
-- get_store_status(): open / paused / busy, for checkout and the menu
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_store_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$;

-- The menu asks whether the shop is open before anyone signs in.
GRANT EXECUTE ON FUNCTION public.get_store_status() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
