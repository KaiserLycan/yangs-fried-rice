-- ============================================================
-- Migration: Kitchen queue RLS (US-04, AC4)
--
-- Replaces migration 001's employee_update_all_orders policy, which
-- allowed ANY employee — including Rider — to update any order row.
-- AC4 requires restricting kitchen-queue mutations (order status
-- changes) to Staff or Administrator only.
--
-- Role mapping: lib/auth/roles.ts defines MANAGER, STAFF, RIDER — there
-- is no role literally named "Administrator." MANAGER is the highest-
-- privilege role, and canAccessManage() (the same function
-- lib/actions/orders.ts's updateOrderStatus already gates on) treats
-- MANAGER and STAFF as the two roles allowed to manage orders. This
-- migration mirrors that exact definition at the DB level rather than
-- inventing a second, possibly-diverging notion of "admin."
--
-- Riders never needed order UPDATE access — their mutations go through
-- the `delivery` table (lib/actions/delivery.ts), not `order` directly
-- — so removing their access here does not affect delivery/US-05
-- functionality.
--
-- This REPLACES a policy from migration 001 (a different author's
-- work) — confirm with them before applying.
-- ============================================================

DROP POLICY IF EXISTS employee_update_all_orders ON "order";

CREATE POLICY staff_and_manager_update_orders ON "order"
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT employee_id FROM employee
      WHERE role IN ('MANAGER', 'STAFF')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT employee_id FROM employee
      WHERE role IN ('MANAGER', 'STAFF')
    )
  );

-- NOTE: the "unauthorized users receive an appropriate error response"
-- half of AC4 is already satisfied by existing app code —
-- lib/actions/orders.ts's requireManageAccess() returns a descriptive
-- error before ever reaching the DB, and app/api/routers/orders.ts's
-- errorToStatus() maps a permission error to HTTP 403. This migration
-- only needed to close the DB-level gap; no app-layer change required.