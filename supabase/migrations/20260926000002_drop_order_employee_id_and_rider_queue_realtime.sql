-- ------------------------------------------------------------
-- P43: drop order.employee_id
-- ------------------------------------------------------------
-- Nothing ever wrote it, so it was NULL on every row, and nothing reads it.
-- Who handled an order is already recorded where it happens: the rider on
-- delivery.rider_id. (delivery.employee_id is a different column and stays.)

ALTER TABLE public."order" DROP CONSTRAINT IF EXISTS order_employee_id_fkey;
ALTER TABLE public."order" DROP COLUMN IF EXISTS employee_id;


-- ------------------------------------------------------------
-- P46: publish delivery for Realtime
-- ------------------------------------------------------------
-- The rider queue re-reads when any delivery changes, so a delivery another
-- rider accepts shows "Taken by …" on every rider's screen without a reload.
-- The customer tracking screen already subscribes to this table too.
-- Guarded, because adding a table that is already published is an error.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'delivery'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery;
  END IF;
END $$;
