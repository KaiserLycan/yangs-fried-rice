-- US-11: Customer Profile Management
-- Run this in Supabase SQL Editor (Studio), same workflow as the rest of
-- this project's schema changes. Safe to re-run — every statement below
-- is idempotent (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS first).

-- =============================================================
-- 1. Row Level Security — AC4
-- A customer can only read/write their own row. No self-service DELETE
-- policy on `customer` is defined here on purpose: account deletion goes
-- through the service-role client in lib/actions/profile.ts, which
-- bypasses RLS entirely, matching how deleteCustomerAccount and
-- lib/actions/admin.ts's deleteCustomer already work.
-- =============================================================

alter table customer enable row level security;
alter table customer_address enable row level security;

drop policy if exists "customer_select_own" on customer;
create policy "customer_select_own"
  on customer for select
  using (auth.uid() = customer_id);

drop policy if exists "customer_update_own" on customer;
create policy "customer_update_own"
  on customer for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- Allows registerCustomer's insert (app/(auth)/actions.ts) to succeed once
-- the new user has a session. NOTE: if "Confirm email" is enabled in
-- Supabase Auth settings, signUp() may not establish a full session before
-- confirmation, in which case this insert could run as the anon role and
-- fail under this policy. Worth testing directly against current Auth
-- settings rather than assuming — flag to the team if registration starts
-- failing after this policy goes live.
drop policy if exists "customer_insert_own" on customer;
create policy "customer_insert_own"
  on customer for insert
  with check (auth.uid() = customer_id);

drop policy if exists "customer_address_select_own" on customer_address;
create policy "customer_address_select_own"
  on customer_address for select
  using (auth.uid() = customer_id);

drop policy if exists "customer_address_insert_own" on customer_address;
create policy "customer_address_insert_own"
  on customer_address for insert
  with check (auth.uid() = customer_id);

drop policy if exists "customer_address_update_own" on customer_address;
create policy "customer_address_update_own"
  on customer_address for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

drop policy if exists "customer_address_delete_own" on customer_address;
create policy "customer_address_delete_own"
  on customer_address for delete
  using (auth.uid() = customer_id);

-- =============================================================
-- 2. Exactly one default address per customer, or none
-- Requested in docs/reference/profile-page-handoff.md §3. A partial
-- unique index is the standard Postgres idiom for this — cheaper and
-- more reliable than enforcing it purely in application code.
-- =============================================================

create unique index if not exists one_default_address_per_customer
  on customer_address (customer_id)
  where is_default = true;

-- =============================================================
-- 3. Email sync trigger — AC1 ("maintain synchronization with the
-- underlying auth system")
--
-- Resolves the two-system email write the frontend handoff doc (§2.1)
-- flagged and left as "your call": rather than the app writing
-- customer.email directly (risking disagreement with the still-pending
-- Auth confirmation), this trigger updates customer.email only once
-- auth.users.email_confirmed_at actually changes — i.e. only after the
-- customer clicks the confirmation link Supabase Auth already sends.
--
-- Deliberately does NOT auto-create the customer row on signup (a
-- tempting extra use of the same mechanism) — that would risk a
-- duplicate-key conflict with registerCustomer's existing, already-
-- tested manual insert in app/(auth)/actions.ts. Left alone rather than
-- risk destabilizing a working, tested flow for this issue's scope.
-- =============================================================

create or replace function sync_customer_email_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at
     and new.email_confirmed_at is not null then
    update public.customer
    set email = new.email
    where customer_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_email_confirmed on auth.users;
create trigger on_auth_email_confirmed
  after update on auth.users
  for each row
  execute function sync_customer_email_on_confirm();