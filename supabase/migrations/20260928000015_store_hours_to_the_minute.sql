-- Issue #115 follow-up: store hours to the minute (6:30 AM, 7:31 PM), not
-- whole hours.
--
-- open_hour / close_hour (smallint, 20260928000003) become open_time /
-- close_time (time of day, Manila). Existing hours carry over: 8 → 08:00,
-- 18 → 18:00, and a close of 24 becomes 24:00 (Postgres `time` allows it,
-- meaning end of day).
--
-- get_store_status() now compares the Manila time of day against them and
-- returns them as "HH:MM". It still returns open_hour too, the whole hour of
-- open_time, because submit_cart_to_order (20260928000006) builds its "We
-- open at 8:00 AM" message from it; the checkout rebuild that follows this
-- migration switches that message to open_time and this key can then go.
--
-- The store must still close later the same day it opens (open < close):
-- overnight hours (6 PM to 2 AM) are not supported.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.store_setting
  ADD COLUMN IF NOT EXISTS open_time  time,
  ADD COLUMN IF NOT EXISTS close_time time;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.store_setting'::regclass
      AND attname = 'open_hour'
      AND NOT attisdropped
  ) THEN
    EXECUTE 'UPDATE public.store_setting
             SET open_time  = coalesce(open_time,  make_interval(hours => open_hour)::time),
                 close_time = coalesce(close_time, CASE WHEN close_hour = 24 THEN time ''24:00''
                                                        ELSE make_interval(hours => close_hour)::time END)';
  ELSE
    UPDATE public.store_setting
    SET open_time = coalesce(open_time, time '08:00'),
        close_time = coalesce(close_time, time '18:00');
  END IF;
END $$;

ALTER TABLE public.store_setting
  ALTER COLUMN open_time  SET DEFAULT time '08:00',
  ALTER COLUMN open_time  SET NOT NULL,
  ALTER COLUMN close_time SET DEFAULT time '18:00',
  ALTER COLUMN close_time SET NOT NULL;

ALTER TABLE public.store_setting
  DROP CONSTRAINT IF EXISTS store_setting_hours_order;
ALTER TABLE public.store_setting
  ADD CONSTRAINT store_setting_hours_order CHECK (open_time < close_time);

ALTER TABLE public.store_setting
  DROP COLUMN IF EXISTS open_hour,
  DROP COLUMN IF EXISTS close_hour;

COMMENT ON COLUMN public.store_setting.open_time IS
  'Opening time of day, Asia/Manila. Open from this minute.';
COMMENT ON COLUMN public.store_setting.close_time IS
  'Closing time of day, Asia/Manila. Closed from this minute. Later than open_time; 24:00 means end of day.';

-- ---------------------------------------------------------------------------
-- 2. get_store_status()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_store_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
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

REVOKE ALL ON FUNCTION public.get_store_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_status() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
