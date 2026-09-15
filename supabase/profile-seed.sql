-- US-11 test seed data.
-- Kept separate from supabase/seed.sql — that file targets the old schema
-- (menu_items, users, orders in singular/legacy shapes) and no longer
-- matches the live database, so appending here rather than risking
-- breaking whatever currently depends on that file.
--
-- IMPORTANT: this only seeds the `customer` row — it does NOT create a
-- matching Supabase Auth user, since that can't be done via SQL alone.
-- For endpoint testing (Postman/cURL), you still need to actually
-- register a test account through /api/auth/register (or the UI) first,
-- then use ITS customer_id here if you want richer seeded data (multiple
-- addresses, etc.) to test against. The row below uses a fixed id purely
-- as a placeholder — replace it with a real customer_id from a test
-- account you've actually registered before running this.

-- Replace this with a real customer_id from an account you've registered:
-- select customer_id from customer order by customer_id limit 1;

insert into customer_address (customer_id, label, address_details, address_note, is_default)
values
  ('00000000-0000-0000-0000-000000000000', 'Home', '123 Test Street, Quezon City', 'Ring the doorbell twice', true),
  ('00000000-0000-0000-0000-000000000000', 'Work', '456 Office Ave, Makati', null, false)
on conflict do nothing;