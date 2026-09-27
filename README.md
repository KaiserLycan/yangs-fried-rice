# Yang's Fried Rice — Ordering System

A real-time ordering and restaurant management app for Yang's Fried Rice.
Customers order online and pick up at the counter. Staff run the kitchen. Managers see the reports.

The shop is **pickup-only** (issue #114). There is no delivery or rider role; a customer who wants the food brought to them sends their own courier (Lalamove, Grab) to collect it.

## What it does

**Customers**
- Browse the menu, add to cart, and check out for pickup.
- Pay in store, or with GCash or Maya (through PayMongo).
- Track the order live (also from a share link, without signing in), cancel while it is still pending, report a missing or wrong item, rate the food, the service and each dish, and reorder.
- Senior Citizen / PWD discount with an ID photo, a tip for the staff, and "I'll pay with ₱___" for cash.
- If a dish sells out or a price changes before the order goes through, checkout points at the line and offers to remove it or accept the new price.
- Manage their profile, photo and password. Forgot-password and "Resend confirmation email" work by email.

**Staff and Managers** (`/manage`)
- Orders page with status tabs, search by number, name or phone, filters, and a detail view with the order's status history and its refund.
- Kitchen Display System (KDS) for the cooking queue: late-order colours, new-order chime, sort and view toggles, a cancelled tab, and a **Sold out** switch.
- Menu, categories and add-ons, with archiving instead of deleting; each dish's reviews link to the order and the customer's phone.
- Manager only: dashboard (store pause/busy controls, refunds, latest ratings), reports with PDF and CSV (payment, hour, weekday and cancellation breakdowns, food/service ratings, ready-on-time rate), customer and employee management, promotions, and the **audit log** (`/manage/audit-log`).

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
- Order status flow: `pending` → `preparing` → `ready` → `completed` ("Picked up"). It can be `cancelled` along the way, and "Picked up" can be undone within 10 minutes. The database enforces this with a CHECK on `order_status` and the `guard_order_status` trigger, which mirror `VALID_TRANSITIONS` in `lib/validation/orders.ts`. `out_for_delivery` is kept only so legacy orders can be finished.
- New orders are `take_out`, with no delivery fee or address. `delivery` survives on orders from before issue #114; a CHECK refuses anything else.
- Orders are placed only through the `submit_cart_to_order` database function (see below). Customers cannot insert into the order tables directly.
- GCash and Maya orders start as `awaiting_payment`. They only reach the kitchen (`pending`) once PayMongo confirms the money. A refused payment becomes `payment_failed`, and the customer can retry. Unpaid orders are hidden from staff.
- Pay-in-store orders are `pending` straight away.
- A customer can cancel only while the order is `pending`, and the cancel can change nothing but the status and the cancellation fields.
- Staff must give a reason when cancelling. The customer sees it on the tracking page.
- Orders have a readable number (`order.order_number`, e.g. `#1042`). Search takes the number, or the start of the order id for old links.
- Each order line saves the item's name and price at the time of ordering. Products are archived, not deleted, so old orders never show "Unknown item".
- Order lists show newest first. The KDS is the exception: it stays oldest first so the kitchen cooks in order.
- A customer rates an order once: food (required) and service (optional), 1–5 stars, an optional comment, and optionally each dish ("Rate all the same" copies the food score). Written by `submit_order_ratings`.
- Minimum order ₱150. Pay in store is capped at ₱2,000, at ₱1,000 for a first cash order, and blocked after 2 no-shows (`lib/checkout/order-rules.ts`; the database checks again).

**Pickup**
- The ready-time estimate comes from the kitchen queue size (`lib/eta/engine.ts`).
- The ready-by time promised at checkout is saved as `promised_at` and never changed; reports compare it with `ready_at`.
- Up to 20 of one dish per line and 30 items per order, enforced by the forms and by the database.

**Accounts**
- Sign-up asks customers to confirm they are at least 18 or have a parent's permission.
- New passwords need at least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol. This matches the Supabase Auth password settings; the forms check it first (`newPasswordSchema` in `lib/validation/fields.ts`). Sign-in only checks length, so older passwords still work.
- Phone numbers use one format: `+63 9XX XXX XXXX`.
- Photos (profile, employee, menu) must be under 5MB. Senior Citizen / PWD ID photos must be under 2MB.
- Sign-in is locked for 15 minutes after 5 wrong passwords on one email, or 30 from one IP address.
- Names are stored in parts (`first_name`/`last_name`); the database builds `name` from them. Write the parts, never `name`. Length limits live in `lib/validation/fields.ts`.

**Store hours**
- Opening hours, the last-orders cut-off, pause and busy limits live in `store_setting` and are changed from the dashboard (defaults 08:00–18:00, Manila time; `lib/store-hours.ts`). `submit_cart_to_order` checks them, so the browser cannot order outside hours.

---

## Supabase

### Triggers

| Trigger | Runs when | What it does | Defined in |
|---|---|---|---|
| `trg_guard_customer_order_update` | An `order` row is updated | For a signed-in non-employee, refuses any change except `order_status`, `cancelled_at`, `cancellation_reason` | `migrations/20260929100000_baseline.sql` |
| `trg_guard_employee_self_update` | An `employee` row is updated | Unless the caller is a manager (or the service role), refuses changing a role or the id, or re-enabling a disabled account | `migrations/20260929100000_baseline.sql` |
| `trg_guard_customer_self_update` | A `customer` row is updated | Stops a customer changing their id or re-enabling their own disabled account | `migrations/20260929100000_baseline.sql` |
| `trg_audit_employee_write` | An employee inserts, updates or deletes a row in `order`, `transaction`, `product`, `categories`, `add_on`, `employee`, `customer`, `reports`, `review` or `notification` | Writes one `audit_log` entry: who, when, the action (e.g. `order.status_change`, `product.price_change`), a readable summary and only the columns that changed. Skips customers, webhooks and the service role | `migrations/20260929100000_baseline.sql` |
| `trg_audit_log_append_only`, `trg_audit_log_no_truncate` | Anyone tries to change, delete or truncate `audit_log` | Refuses — even the service role | `migrations/20260929100000_baseline.sql` |
| `on_auth_user_password_update` | A user's password changes | Sets `password_last_updated` on the matching `employee` or `customer` row | `migrations/20260929100001_platform_setup.sql` |
| `on_auth_email_confirmed` | A user confirms a new email | Copies the confirmed email into `customer.email` | `migrations/20260929100001_platform_setup.sql` |

### Database functions (RPC)
- `submit_cart_to_order` — the only way to place an order. In one transaction it locks the cart (`SELECT … FOR UPDATE`), stops if the cart is already final, refuses unavailable items, prices every line from `product` / `add_on`, writes the order, lines, add-ons and payment row, and marks the cart final. A unique index on `order.cart_id` means one cart can never make two orders. Errors carry a code in `hint` (`CART_LOCKED`, `ITEM_UNAVAILABLE`, `ACCOUNT_DISABLED`, …) that `submitCart` passes to the UI. Signed-in users only.
- `current_employee_role` — the caller's role, or null for a customer or a **disabled** employee. Staff policies go through it.
- `get_customer_order_history` — the customer's My Orders list, newest first.
- `submit_order_ratings` — saves an order's food and service scores, comment and per-dish ratings (`submit_order_review` is the older single-score version, still used by the REST route).
- `get_store_status` — open/closed, paused, busy, and the hours, for the menu and checkout.
- `get_public_order_tracking` — the tracking page behind a share link (`/track/<id>?t=<token>`), for someone not signed in.
- Report functions (`get_payment_method_breakdown`, `get_sales_by_hour`, `get_sales_by_weekday`, `get_cancellation_reason_breakdown`, `get_cash_remitted_daily`, `get_customer_stats`) — each refuses anyone but a manager.
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
Screens update live from the tables in the `supabase_realtime` publication: `order`, `order_status_log` and `notification` (tracking, the KDS, the orders page and the notification bell).

### Storage buckets
| Bucket | Public? | Holds |
|---|---|---|
| `menu-images` | Yes | Menu photos |
| `avatars` | Yes | Customer profile photos |
| `emp-pfp` | Yes | Employee profile photos |
| `senior-pwd-ids` | **No** | Senior Citizen / PWD ID photos, under `<customer id>/…`. A customer sees only their own folder; staff can read and delete. Show a photo with a signed URL (5 minutes at most) from `lib/storage/senior-pwd-ids.ts`, and store the path, never a URL. |
| `order-issue-photos` | **No** | Photos attached to "Report a problem", under `<customer id>/…`. Staff read them through signed URLs. |
| `promotion-images` | Yes | Landing-page promo banners |

### Edge functions
- `create-payment-intent` — starts a PayMongo payment.
- `payment-webhook` — receives PayMongo's result (signature and 5-minute replay window checked) and moves the order out of `awaiting_payment`.
- `process-refunds` — every 5 minutes, refunds cancelled paid wallet orders through PayMongo. One PayMongo refuses becomes `refund_failed`; the order and the dashboard link straight to the payment in PayMongo so a manager can refund it by hand.

These need Supabase Function secrets: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`.

### Scheduled jobs (pg_cron)
- `expire-abandoned-orders` — cancels unpaid wallet orders after 30 minutes.
- `expire-unaccepted-orders` — cancels orders staff never accepted.
- `process-refunds` — calls the edge function above.
- `purge-expired-personal-data` — nightly retention clean-up (Data Privacy Act).

### Other tables worth knowing
- `login_attempt` — failed sign-ins for rate limiting. Service role only. Emails are stored hashed.
- `order_status_log` — every status change, who made it and why. Feeds the tracking timeline and the staff "History".
- `product_price_log` — every menu price change and who made it.
- `order_issue` — "Report a problem" submissions.

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

   `supabase/migrations/` starts with `20260929100000_baseline.sql` (the whole public schema, dumped from the live project) and `20260929100001_platform_setup.sql` (storage buckets and policies, `auth.users` triggers, the pg_cron schedule); the files after them are the final run's changes. Apply them with `npx supabase db push`, or `npx supabase db reset` locally (which also runs `supabase/seed.sql`). The 57 incremental migrations the baseline replaces are in git history at commit `a9af4d1`. The `process-refunds` cron job reads two Vault secrets, `project_url` and `refund_cron_secret`; create them on a new project.

   Prefer `db push` to pasting SQL into the dashboard or applying it through an MCP tool. Those record the migration under a new timestamp, and the next `db push` then reports that the history does not match. If that happens, run `npx supabase migration repair`: mark the timestamp versions `reverted` and the real file versions `applied`, but only for migrations that really ran.

   Add new changes as new migration files (`npx supabase migration new <name>`); never edit the baseline.

   **Clean up and add demo data** (needs `SUPABASE_SERVICE_ROLE_KEY`):
   ```bash
   npm run db:cleanse                  # dry run: lists test accounts and broken rows it would fix
   npm run db:cleanse -- --apply       # does it
   npm run db:seed                     # menu, staff, customers, 30 days of pickup orders
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
scripts/           # db-cleanse, db-seed, simulate-paymongo-webhook
__tests__/         # Component and security tests (unit tests sit next to their files in lib/)
docs/              # Audits, handoffs, screenshots
```

## Docs
- [`docs/requirements_audit.md`](docs/requirements_audit.md) — checklist of the original requirements.
- [`docs/unimplemented_issues.md`](docs/unimplemented_issues.md) — what is still open.
- [`docs/issue-106-followups.md`](docs/issue-106-followups.md) — QA follow-ups from issue #106.
- [`docs/phase4-security-testing-report.md`](docs/phase4-security-testing-report.md) — security testing results.
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — what the final run did and what is left. Start here.
- [`docs/persona-review-final.md`](docs/persona-review-final.md) — the 15 persona checklists walked against the final build.
- [`docs/limitations.md`](docs/limitations.md) — the gaps found during development and their status.
- [`docs/validation-testing-plan.md`](docs/validation-testing-plan.md) — manual test steps by role.
- [`docs/lacking.md`](docs/lacking.md) — features too large for the development window. Compared against Jollibee, McDelivery PH, Mang Inasal, Chowking, GrabFood, foodpanda and Philippine law.
- [`docs/feedback-verification.md`](docs/feedback-verification.md) — panel feedback points verified against the code. 25 points checked.
- [`docs/user-simulation.md`](docs/user-simulation.md) — 17 persona walkthroughs plus 12 hard UI questions. The personas used to verify changes live in `.agents/skills/`.
- [`docs/copy-glossary.md`](docs/copy-glossary.md) — one name per status, one spelling, one order-type word.
- [`docs/comparison.md`](docs/comparison.md) — feature comparison with similar ordering systems.
- [`FINALE.md`](FINALE.md) — the final run's task list, with each item's status.
