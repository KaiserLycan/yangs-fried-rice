-- Employee profile test seed (US-11-Employee, AC5).
-- Same caveat as supabase/profile-seed.sql: Supabase Auth users can't be
-- created via SQL. Register real test accounts through
-- /api/auth/employee-login's signup path (or however employee accounts
-- are provisioned — check lib/actions/admin.ts's createEmployee), THEN
-- replace the placeholder ids below with those real employee_ids before
-- running this, if you want the extra role variety seeded.

-- Replace with real employee_ids from accounts you've actually created:
-- select employee_id, role from employee order by role;

-- Example rider row for a seeded RIDER-role employee — only meaningful
-- once the employee_id below matches a real employee whose role is
-- 'RIDER'.
insert into rider (employee_id, vehicle_make_model, vehicle_plate_number, driver_license_number, license_expiry_date)
values
  ('00000000-0000-0000-0000-000000000001', 'Honda XRM125', 'ABC-1234', 'N01-23-456789', '2027-06-30')
on conflict (employee_id) do nothing;