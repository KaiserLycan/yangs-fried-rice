-- Restore Row Level Security on `employee` and `rider`.
--
-- WHY THIS EXISTS TWICE
--
-- 004_employee_profile_rls.sql already did this and is recorded as applied,
-- but the live database has RLS *off* on both tables and not one of its four
-- policies survives. Something reverted it.
--
-- The likely reason is a bug in those policies, repeated here so nobody
-- reintroduces it: they tested for "is the caller a manager" with
--
--     auth.uid() IN (SELECT employee_id FROM employee WHERE role = 'MANAGER')
--
-- inside a policy *on* `employee`. Evaluating the policy runs the subquery,
-- which evaluates the policy, and Postgres aborts with "infinite recursion
-- detected in policy for relation employee". Employee sign-in and every
-- manage page would have started failing the moment it was applied, and
-- switching RLS off is the fastest way to make that stop.
--
-- `public.current_employee_role()` exists precisely to break that loop: it is
-- STABLE SECURITY DEFINER, so it reads `employee` with the definer's rights
-- and never re-enters the policy. Every check below goes through it.
--
-- WHAT IS AT STAKE
--
-- While RLS is off, the `authenticated` and `anon` roles hold full grants on
-- both tables. The anon key ships in the browser bundle, so anyone who views
-- source can read all 18 staff rows — names, emails, dates of birth, phone
-- numbers, roles — and write to them.

ALTER TABLE public.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider    ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- employee
-- ---------------------------------------------------------------------------

-- Read: your own row, or any row if you are staff of some kind.
--
-- Deliberately not manager-only. Several manage screens read colleagues'
-- rows through the caller's own session, and the exposure being closed here
-- is customers and anonymous visitors reading staff records — not staff
-- reading each other. Tightening to manager-only is a sensible follow-up, but
-- it needs every manage screen walked through first, and a half-broken
-- back office is how this got switched off the last time.
DROP POLICY IF EXISTS employee_select_own_or_staff ON public.employee;
CREATE POLICY employee_select_own_or_staff ON public.employee
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.current_employee_role() IS NOT NULL
  );

-- Write: your own row, or anybody's if you are a manager.
DROP POLICY IF EXISTS employee_update_own_or_manager ON public.employee;
CREATE POLICY employee_update_own_or_manager ON public.employee
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.current_employee_role() = 'MANAGER'
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR public.current_employee_role() = 'MANAGER'
  );

-- ---------------------------------------------------------------------------
-- rider
-- ---------------------------------------------------------------------------

-- `rider` is matched on employee_id, not rider_id: a caller's auth.uid() is
-- their employee_id.
DROP POLICY IF EXISTS rider_select_own_or_staff ON public.rider;
CREATE POLICY rider_select_own_or_staff ON public.rider
  FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.current_employee_role() IS NOT NULL
  );

DROP POLICY IF EXISTS rider_update_own_or_manager ON public.rider;
CREATE POLICY rider_update_own_or_manager ON public.rider
  FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.current_employee_role() = 'MANAGER'
  )
  WITH CHECK (
    employee_id = auth.uid()
    OR public.current_employee_role() = 'MANAGER'
  );

-- ---------------------------------------------------------------------------
-- Known gaps, deliberately left for their own change
-- ---------------------------------------------------------------------------
--
-- 1. An employee can still UPDATE their own row's `role`, so a STAFF account
--    can make itself a MANAGER. RLS cannot restrict columns; the fix is
--    column-level grants, roughly:
--
--      REVOKE UPDATE ON public.employee FROM authenticated;
--      GRANT UPDATE (first_name, last_name, email, "phone-num",
--                    date_of_birth, "profileImage_URL", schedule_shift)
--        ON public.employee TO authenticated;
--
--    Not done here because `lib/actions/employee-profile.ts` also writes
--    `is_account_disabled` on the self-deactivate path, so the grant list has
--    to be settled against that first. Note this is strictly better than
--    today regardless: with RLS off, anyone can rewrite anyone's role.
--
-- 2. No INSERT or DELETE policy, so both are denied to `authenticated`.
--    Employee creation runs through the service role and is unaffected, but
--    the rollback at `lib/actions/admin.ts:252` uses the caller's session and
--    will now silently match zero rows, leaving an orphaned auth user if an
--    employee insert fails partway. Worth switching to the admin client.
--
-- 3. `cart_item_add_on` and `order_item_add_on` still have RLS disabled and
--    no policies at all. Enabling RLS on those without writing policies first
--    would break add-ons everywhere — they need their own change.
