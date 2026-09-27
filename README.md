# Yang's Fried Rice — Ordering System

A real-time ordering and restaurant management app for Yang's Fried Rice.
Customers order online and pick up at the counter. Staff run the kitchen. Managers see the reports.

The shop is **pickup-only** (issue #114). There is no delivery or rider role; a customer who wants the food brought to them sends their own courier (Lalamove, Grab) to collect it.

## What it does

**Customers**
- Browse the menu, add to cart, and check out for pickup.
- Pay in store, or with GCash or Maya (through PayMongo).
- Track the order live, cancel while it is still pending, rate the order and reorder.
- Manage their profile, photo, addresses and password. Forgot-password works by email.

**Staff and Managers** (`/manage`)
- Orders page with status tabs, search by order number, and a detail view.
- Kitchen Display System (KDS) for the cooking queue.
- Menu, categories and add-ons, with archiving instead of deleting.
- Manager only: dashboard, sales reports with PDF export, customer and employee management, and the **audit log** (`/manage/audit-log`) — every action staff and managers take, who took it and when, with before/after values.

### User roles

| Role | Stored as | Can open |
|---|---|---|
| Customer | `customer` table | Shop and account pages |
| Manager | `employee.role = 'MANAGER'` | Everything in `/manage` |
| Staff | `employee.role = 'STAFF'` | Orders, menu, KDS, own profile |

Old role values are mapped, not rejected: `SERVER`, `COOK`, `CASHIER` → `STAFF` (see `lib/auth/roles.ts`). `RIDER` / `DELIVERY` are no longer roles: those accounts were disabled when delivery was removed, and a manager can re-enable one as Staff from `/manage/employee`.

A **disabled** account (`is_account_disabled`) is refused by every server guard and by the database's own policies. It is signed out on its next page load, and the login page says why (`lib/auth/account-status.ts`, `middleware.ts`).

---

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN-style UI (`class-variance-authority`, `tailwind-merge`, `tailwindcss-animate`), `lucide-react` icons |
| Backend | Next.js server actions and API routes, Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) |
| Validation | `zod` |
| Employee sessions | `jose` (signed session cookie) |
| Charts and PDF | `recharts`, `jspdf`, `jspdf-autotable` |
| Testing | Vitest, React Testing Library, jsdom |
| Formatting | ESLint, Prettier (`prettier-plugin-tailwindcss`) |

## External services

| Service | Used for | Where |
|---|---|---|
| **Supabase** | Database, sign-in, live updates, image storage | `lib/supabase/` |
| **PayMongo** | GCash and Maya payments | `supabase/functions/create-payment-intent`, `supabase/functions/payment-webhook`, `lib/checkout/paymongo.ts` |
| **LocationIQ** | Address lookup (when `LOCATIONIQ_API_KEY` is set) | `lib/address/validate-ncr.ts` |
| **OpenStreetMap Nominatim** | Free address lookup when there is no LocationIQ key | `lib/address/validate-ncr.ts` |
| **Resend** | "Your order was cancelled" email (when `RESEND_API_KEY` and `EMAIL_FROM` are set) | `lib/email/` |

---

## Business rules

**Orders**
- Order status flow: `pending` → `preparing` → `ready` → `completed` ("Picked up"). It can be `cancelled` along the way. Nothing new can move to `out_for_delivery`; legacy orders already there can still be completed by staff.
- Every order is `take_out` or `dine_in`, with no delivery fee or address. The database refuses anything else.
- Orders are placed only through the `submit_cart_to_order` database function (see below). Customers cannot insert into the order tables directly.
- GCash and Maya orders start as `awaiting_payment`. They only reach the kitchen (`pending`) once PayMongo confirms the money. A refused payment becomes `payment_failed`, and the customer can retry. Unpaid orders are hidden from staff.
- Pay-in-store orders are `pending` straight away.
- A customer can cancel only while the order is `pending`, and the cancel can change nothing but the status and the cancellation fields.
- Staff must give a reason when cancelling. The customer sees it on the tracking page.
- The order number is the first 8 characters of the order id, e.g. `#69403b15`. Search matches from the start of it.
- Each order line saves the item's name and price at the time of ordering. Products are archived, not deleted, so old orders never show "Unknown item".
- Order lists show newest first. The KDS is the exception: it stays oldest first so the kitchen cooks in order.
- A customer rates the whole order once: 1–5 stars and an optional comment.

**Pickup**
- The ready-time estimate comes from the kitchen queue size (`lib/eta/engine.ts`).
- Cart quantities are 1–99 per line, enforced by the forms and by a database CHECK.

**Accounts**
- Customers must be at least 13. Employees must be at least 18.
- New passwords need at least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol. This matches the Supabase Auth password settings; the forms check it first (`newPasswordSchema` in `lib/validation/fields.ts`). Sign-in only checks length, so older passwords still work.
- Phone numbers use one format: `+63 9XX XXX XXXX`.
- Photos (profile, employee, menu) must be under 5MB. Senior Citizen / PWD ID photos must be under 2MB.
- Sign-in is locked for 15 minutes after 5 wrong passwords on one email, or 30 from one IP address.
- Names and addresses are stored in parts (`first_name`/`last_name`; `building_no`/`street`/`barangay`/`city`/`zip_code`). The database builds `name` and `address_details` from them. Write the parts, never the combined column. Length limits live in `lib/validation/fields.ts`.

**Store hours**
- Open 8:00 AM to 5:59 PM, Manila time (`lib/store-hours.ts`).

---

## Supabase

### Triggers

| Trigger | Runs when | What it does | Defined in |
|---|---|---|---|
| `trg_guard_customer_order_update` | An `order` row is updated | For a signed-in non-employee, refuses any change except `order_status`, `cancelled_at`, `cancellation_reason` | `migrations/20260927000001_atomic_checkout_and_order_write_lockdown.sql` |
| `trg_guard_employee_self_update` | An `employee` row is updated | Unless the caller is a manager (or the service role), refuses changing a role or the id, or re-enabling a disabled account | `migrations/20260927000002_security_hardening_indexes_and_storage.sql` |
| `trg_guard_customer_self_update` | A `customer` row is updated | Stops a customer changing their id or re-enabling their own disabled account | `migrations/20260927000002_security_hardening_indexes_and_storage.sql` |
| `trg_audit_employee_write` | An employee inserts, updates or deletes a row in `order`, `transaction`, `product`, `categories`, `add_on`, `employee`, `customer`, `reports`, `review` or `notification` | Writes one `audit_log` entry: who, when, the action (e.g. `order.status_change`, `product.price_change`), a readable summary and only the columns that changed. Skips customers, webhooks and the service role | `migrations/20260927000004_employee_audit_log.sql`, `…0005_audit_log_review_fixes.sql` |
| `trg_audit_log_append_only`, `trg_audit_log_no_truncate` | Anyone tries to change, delete or truncate `audit_log` | Refuses — even the service role | `migrations/20260927000004_employee_audit_log.sql` |
| `on_auth_user_password_update` | A user's password changes | Sets `password_last_updated` on the matching `employee` or `customer` row | `migrations/000_remote_schema.sql` |
| `on_auth_email_confirmed` | A user confirms a new email | Copies the confirmed email into `customer.email` | `supabase/profile-rls-and-triggers.sql` (not a migration — run it by hand) |

### Database functions (RPC)
- `submit_cart_to_order` — the only way to place an order. In one transaction it locks the cart (`SELECT … FOR UPDATE`), stops if the cart is already final, refuses unavailable items, prices every line from `product` / `add_on`, writes the order, lines, add-ons and payment row, and marks the cart final. A unique index on `order.cart_id` means one cart can never make two orders. Errors carry a code in `hint` (`CART_LOCKED`, `ITEM_UNAVAILABLE`, `ACCOUNT_DISABLED`, …) that `submitCart` passes to the UI. Signed-in users only.
- `current_employee_role` — the caller's role, or null for a customer or a **disabled** employee. Staff policies go through it.
- `get_customer_order_history` — the customer's My Orders list, newest first.
- `submit_order_review` — saves an order's rating.
- `record_employee_action` — adds an `audit_log` entry for what the trigger can't see: service-role writes (creating, editing, deleting employees; photos), password changes and resets (never the password), sign-in and sign-out, and report exports. The actor comes from the session, never a parameter; each action is checked (employee management and exports need a manager; session events, own photo and own account deletion must be about the caller). A customer calling it gets nothing written. Call it through `lib/audit/record-employee-action.ts`, which never throws.

Every `SECURITY DEFINER` function has `search_path = public` pinned.

### Audit log
`audit_log` records every employee interaction — see the trigger and `record_employee_action` above. Rules worth knowing:
- **Append-only.** Entries can't be updated, deleted or truncated by anyone, including the service role. Removing that takes a migration.
- **Managers only** can read it (RLS), at `/manage/audit-log` or `GET /api/audit-log`. Staff see nothing.
- **What's stored:** actor id, name and role (copied, so history survives deleting an employee), the action, the record, a summary, and `{ column: { from, to } }` for changed columns only.
- **What isn't:** passwords; Senior/PWD ID numbers (`[redacted]`); a customer's personal data, review comments and order notes (recorded as changed, value `[personal data]`, so an erasure request is not defeated by a log that can't be purged). Customers are named `Customer #<id prefix>`.
- **Adding a new employee action:** if it writes through the employee's session to one of the audited tables, it's captured automatically. If it uses the service role, Auth, or writes nothing, call `recordEmployeeAction` and add the action to `APP_AUDIT_ACTIONS` **and** to `record_employee_action`'s checks in a migration — a test fails if the two drift apart.
- **Not decided yet:** a retention period (the log only grows), and alerting when an app-side entry fails (it's logged to the server console and never blocks the action).

### Row Level Security
Every public table has RLS on. An `employee` row is readable by that employee and by staff, and writable by that employee or a manager. Creating and deleting employees goes through the service role after a manager check (`lib/actions/admin.ts`).

### Realtime
Screens update live from these tables: `order`, `transaction`, `product`, `categories`.

### Storage buckets
| Bucket | Public? | Holds |
|---|---|---|
| `menu-images` | Yes | Menu photos |
| `avatars` | Yes | Customer profile photos |
| `emp-pfp` | Yes | Employee profile photos |
| `senior-pwd-ids` | **No** | Senior Citizen / PWD ID photos, under `<customer id>/…`. A customer sees only their own folder; staff can read and delete. Show a photo with a signed URL (5 minutes at most) from `lib/storage/senior-pwd-ids.ts`, and store the path, never a URL. |
| `proof-of-delivery` | **No** | Old rider photos from before pickup-only. Nothing writes to it. |

### Edge functions
- `create-payment-intent` — starts a PayMongo payment.
- `payment-webhook` — receives PayMongo's result and moves the order out of `awaiting_payment`.

These need Supabase Function secrets: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`.

### Other tables worth knowing
- `login_attempt` — failed sign-ins for rate limiting. Service role only. Emails are stored hashed.
- `archive.rider`, `archive.delivery` — copies of the dropped rider and delivery tables, kept in case of disputes. The `archive` schema is not exposed through the API.

---

## Local development setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   | Variable | Needed for |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything |
   | `SUPABASE_SERVICE_ROLE_KEY` | Admin actions, rate limiting, seed scripts |
   | `EMPLOYEE_SESSION_SECRET` | Employee sign-in (set a long random string in production) |
   | `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | GCash / Maya checkout |
   | `LOCATIONIQ_API_KEY` | Optional. Better address lookup and map tiles |
   | `RESTAURANT_LAT`, `RESTAURANT_LNG` | Optional. Restaurant location (defaults to Manila) |

3. **Database**

   Apply the files in `supabase/migrations/` in filename order (`npx supabase db push`, or `npx supabase db reset` locally, which also runs `supabase/seed.sql`). Then run `supabase/profile-rls-and-triggers.sql` in the SQL editor.

   Prefer `db push` to pasting SQL into the dashboard or applying it through an MCP tool. Those record the migration under a new timestamp, and the next `db push` then reports that the history does not match. If that happens, run `npx supabase migration repair`: mark the timestamp versions `reverted` and the real file versions `applied`, but only for migrations that really ran.

   Do **not** run `supabase/schema.sql`. It is the old Phase 1 draft and no longer matches the real tables.

   **Clean up and add demo data** (needs `SUPABASE_SERVICE_ROLE_KEY`):
   ```bash
   npm run db:cleanse                  # dry run: lists rows it would remove or repair
   npm run db:cleanse -- --apply       # does it (add --wipe-orders for an empty order history)
   # then run supabase/validate-constraints.sql in the Supabase SQL editor
   npm run db:seed                     # menu, staff, NCR customers, 30 days of pickup orders
   npm run db:seed -- --reset          # replace the demo data
   ```

   Demo accounts all use the password `YangsDemo2026!` (change it with `SEED_PASSWORD`):

   | Role | Email | Sign in at |
   |---|---|---|
   | Manager | `ramon.tan@yangs.ph` | `/employee/login` |
   | Staff | `grace.lim@yangs.ph` | `/employee/login` |
   | Customer | `liza.reyes@yangs-demo.ph` | `/login` |

4. **Generate database types** (after any schema change)
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run supabase:types
   ```

5. **Run the app**
   ```bash
   npm run dev          # http://localhost:3000
   ```

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build and serve |
| `npm run lint` | Lint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run test` / `npm run test:watch` | Vitest |
| `npm run supabase:types` | Regenerate `types/database.types.ts` |
| `npm run db:cleanse` / `npm run db:seed` | Clean up and seed demo data |

---

## Folder structure

```
app/
  (shop)/          # Landing page and menu — public
  (account)/       # Cart, checkout, my orders, tracking, profile — signed-in customer
  (auth)/          # Customer login, register, forgot / reset password
  employee/login/  # Employee sign-in
  manage/          # Staff and manager back office, KDS
  api/             # API routes (routers in app/api/routers/)
components/        # UI grouped by area (manage, orders, menu, auth, ui)
lib/
  actions/         # Server actions (orders, cart, menu, reports, …)
  audit/           # Audit log vocabulary and the app-side recorder
  auth/            # Roles, employee session, account status, login rate limit
  checkout/        # Payment methods, PayMongo, arrival estimate
  eta/             # Ready-time estimate engine
  orders/          # Order status, order number, staff actions
  storage/         # Stored images and private Senior/PWD ID photos
  validation/      # zod schemas and field limits
  supabase/        # Browser and server clients
supabase/
  migrations/      # Database changes, applied in filename order
  functions/       # PayMongo edge functions
scripts/           # db-cleanse, db-seed
__tests__/         # Component and security tests (unit tests sit next to their files in lib/)
docs/              # Audits, handoffs, screenshots
```

## Docs
- [`docs/requirements_audit.md`](docs/requirements_audit.md) — checklist of the original requirements.
- [`docs/unimplemented_issues.md`](docs/unimplemented_issues.md) — what is still open.
- [`docs/issue-106-followups.md`](docs/issue-106-followups.md) — QA follow-ups from issue #106.
- [`docs/phase4-security-testing-report.md`](docs/phase4-security-testing-report.md) — security testing results.
- [`docs/limitations.md`](docs/limitations.md) — known gaps and their status. Issue #114 closed items 15, 21, 26 and 28.
- [`docs/user-simulation.md`](docs/user-simulation.md) — persona walkthroughs. The personas used to verify changes live in `.agents/skills/`.
- [`docs/reference/`](docs/reference/) — business case, storage draft, handoffs.
