-- ============================================================
-- Migration: Employee/Rider profile RLS (US-11-Employee, AC4)
--
-- SECURITY NOTE: `employee` and `rider` currently have NO RLS enabled —
-- neither table appears in migration 001 or any later migration. With
-- RLS off, the default Postgres/Supabase behavior is that the anon/
-- authenticated key can read and write ANY row in these tables,
-- including a customer session reading or modifying employee data.
-- This migration closes a real, currently-open gap — not just a
-- paper requirement.
--
-- Verified this does not break migration 003's order-update policy,
-- which subqueries `SELECT employee_id FROM employee WHERE role IN
-- (...)` to check the caller's own eligibility: under the new
-- employee_select_own_or_manager policy below, every employee can
-- always see their OWN row, which is all that subquery ever actually
-- needs to confirm about the calling user.
-- ============================================================

ALTER TABLE employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider ENABLE ROW LEVEL SECURITY;

-- ---- EMPLOYEE table ----
-- An employee reads/updates their own row. A Manager (this ticket's
-- "Administrator" — see lib/auth/roles.ts, there is no role literally
-- named Administrator) can read/update any employee's row. No policy
-- exists for the anon or plain customer case, so — now that RLS is
-- enabled — they are denied by default.

DROP POLICY IF EXISTS employee_select_own_or_manager ON employee;
CREATE POLICY employee_select_own_or_manager ON employee
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  );

DROP POLICY IF EXISTS employee_update_own_or_manager ON employee;
CREATE POLICY employee_update_own_or_manager ON employee
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  );

-- ---- RIDER table ----
-- Same shape: a rider reads/updates their own rider row (matched via
-- employee_id, not rider_id — the caller's auth.uid() IS their
-- employee_id), Manager can read/update any.

DROP POLICY IF EXISTS rider_select_own_or_manager ON rider;
CREATE POLICY rider_select_own_or_manager ON rider
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  );

DROP POLICY IF EXISTS rider_update_own_or_manager ON rider;
CREATE POLICY rider_update_own_or_manager ON rider
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
  );