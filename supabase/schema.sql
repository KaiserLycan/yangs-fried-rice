-- Yang's Fried Rice — initial schema
-- Mirrors the ERD in the project doc exactly, so later phases
-- (auth, kitchen display, admin) don't require re-migrating tables
-- this phase already depends on.
--
-- PHASE 1 (today, R15–R25 — remote customer ordering): categories,
-- menu_items, cart, orders, order_items, payments.
-- PHASE 2 (later): users, address, reviews — wired in once R8–R11
-- (registration/auth) and R40–R42 (history/reviews) are built.

create extension if not exists "pgcrypto";

-- ============================================================
-- PHASE 1 — needed for the remote customer ordering site
-- ============================================================

create table if not exists categories (
  category_id uuid primary key default gen_random_uuid(),
  category_name text not null,
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table if not exists menu_items (
  item_id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(category_id) on delete set null,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  availability boolean not null default true,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

-- R16, R17: cart holds items + quantities per customer session/user.
-- user_id is nullable for now since R8–R11 (auth) isn't built yet —
-- point this at a session/guest id until real accounts exist, then
-- add the FK to users(user_id) in phase 2.
create table if not exists cart (
  cart_id uuid primary key default gen_random_uuid(),
  user_id uuid, -- FK to users(user_id) added in phase 2
  item_id uuid not null references menu_items(item_id) on delete cascade,
  quantity int not null check (quantity > 0),
  special_instructions text, -- R19
  created_at timestamptz not null default now()
);

-- R20–R25: order placed after checkout review.
create table if not exists orders (
  order_id uuid primary key default gen_random_uuid(),
  user_id uuid, -- FK to users(user_id) added in phase 2
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')), -- R21
  payment_mode text not null check (payment_mode in ('card', 'digital_wallet', 'cash_on_delivery', 'in_store')), -- R22
  order_status text not null default 'pending_confirmation'
    check (order_status in ('pending_confirmation', 'confirmed', 'cancelled')), -- R24, R25
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  order_item_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(order_id) on delete cascade,
  item_id uuid not null references menu_items(item_id),
  quantity int not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0), -- snapshot of item price at order time
  special_instructions text
);

create table if not exists payments (
  payment_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(order_id) on delete cascade,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  transaction_ref text
);

-- ============================================================
-- PHASE 2 — scaffolded now (matches ERD) so schema stays stable,
-- not wired into the app until auth/reviews are built
-- ============================================================

create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text, -- placeholder only — real auth should use Supabase Auth, not a plaintext column
  role text not null default 'remote_customer'
    check (role in ('remote_customer', 'server', 'kitchen_staff', 'cashier', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists address (
  address_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) on delete cascade,
  city text,
  pincode text,
  full_address text
);

create table if not exists reviews (
  review_id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) on delete cascade,
  item_id uuid references menu_items(item_id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text
);

-- ============================================================
-- Indexes for the lookups Phase 1 pages will actually run
-- ============================================================
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_cart_user on cart(user_id);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_orders_status on orders(order_status);