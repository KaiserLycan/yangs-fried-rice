# Yang's Fried Rice — Ordering System

A real-time ordering and restaurant management app for Yang's Fried Rice.
Customers order online. Staff run the kitchen. Riders deliver. Managers see the reports.

## What it does

**Customers**
- Browse the menu, add to cart, choose pickup or delivery, and check out.
- Pay with cash, GCash or Maya (GCash and Maya go through PayMongo).
- Track the order live, see the assigned rider, cancel, rate the order and reorder.
- Manage their profile, photo, addresses and password. Forgot-password works by email.

**Staff and Managers** (`/manage`)
- Orders page with status tabs, search by order number, and a detail view.
- Kitchen Display System (KDS) for the cooking queue.
- Menu, categories and add-ons, with archiving instead of deleting.
- Manager only: dashboard, sales reports with PDF export, customer and employee management.

**Riders** (`/deliver`)
- One shared delivery queue, updated live for every rider.
- Accept, hand back, map with route, and proof-of-delivery photo.

### User roles

| Role | Stored as | Can open |
|---|---|---|
| Customer | `customer` table | Shop and account pages |
| Manager | `employee.role = 'MANAGER'` | Everything in `/manage` |
| Staff | `employee.role = 'STAFF'` | Orders, menu, KDS, own profile |
| Rider | `employee.role = 'RIDER'` (+ `rider` table) | `/deliver` only |

Old role values are mapped, not rejected: `SERVER`, `COOK`, `CASHIER` → `STAFF`, and `DELIVERY` → `RIDER` (see `lib/auth/roles.ts`).

---

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN-style UI (`class-variance-authority`, `tailwind-merge`, `tailwindcss-animate`), `lucide-react` icons |
| Backend | Next.js server actions and API routes, Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) |
| Validation | `zod` |
| Employee sessions | `jose` (signed session cookie) |
| Maps | `leaflet`, `react-leaflet`, `leaflet-routing-machine` |
| Charts and PDF | `recharts`, `jspdf`, `jspdf-autotable` |
| Testing | Vitest, React Testing Library, jsdom |
| Formatting | ESLint, Prettier (`prettier-plugin-tailwindcss`) |

## External services

| Service | Used for | Where |
|---|---|---|
| **Supabase** | Database, sign-in, live updates, image storage | `lib/supabase/` |
| **PayMongo** | GCash and Maya payments | `supabase/functions/create-payment-intent`, `supabase/functions/payment-webhook`, `lib/checkout/paymongo.ts` |
| **LocationIQ** | Address lookup and map tiles (when `LOCATIONIQ_API_KEY` is set) | `lib/address/validate-ncr.ts`, `components/deliver/map-content.tsx` |
| **OpenStreetMap Nominatim** | Free address lookup when there is no LocationIQ key | `lib/address/validate-ncr.ts` |
| **ArcGIS World Street Map** | Free map tiles when there is no LocationIQ key | `components/deliver/map-content.tsx` |

---

## Business rules

**Orders**
- Order status flow: `pending` → `received` → `preparing` → `ready` → `out_for_delivery` → `completed`. It can be `cancelled` along the way.
- GCash and Maya orders start as `awaiting_payment`. They only reach the kitchen (`pending`) once PayMongo confirms the money. A refused payment becomes `payment_failed`. The customer can retry or switch to cash on delivery. Unpaid orders are hidden from staff and riders.
- Cash on delivery is only offered for delivery orders, and pay-in-store only for pickup.
- Take-out orders go `ready` → `completed` ("Picked up"). They can never be set to `out_for_delivery`.
- Staff must give a reason when cancelling. The customer sees it on the tracking page.
- The order number is the first 8 characters of the order id, e.g. `#69403b15`. Search matches from the start of it.
- Each order line saves the item's name and price at the time of ordering. Products are archived, not deleted, so old orders never show "Unknown item".
- Order lists show newest first. The KDS is the exception: it stays oldest first so the kitchen cooks in order.
- A customer rates the whole order once: 1–5 stars and an optional comment.

**Delivery**
- Delivery is limited to Metro Manila (NCR), within 15 km of the restaurant.
- Delivery fee: ₱50 base plus ₱10 per km, minimum ₱50. These are placeholders in `lib/eta/engine.ts`.
- The arrival estimate comes from kitchen queue size plus travel distance (`lib/eta/engine.ts`).
- Every rider sees the same queue. A delivery another rider took shows "Taken by …" with no buttons.
- A rider can hold at most **10** active deliveries.
- Only the rider who accepted a delivery can complete it. Cash on delivery can't be completed until "cash collected" is ticked.

**Accounts**
- Customers must be at least 13. Employees must be at least 18.
- Phone numbers use one format: `+63 9XX XXX XXXX`.
- Photos (profile, employee, proof of delivery) must be under 5MB.
- Sign-in is locked for 15 minutes after 5 wrong passwords on one email, or 30 from one IP address.
- Names and addresses are stored in parts (`first_name`/`last_name`; `building_no`/`street`/`barangay`/`city`/`zip_code`). The database builds `name` and `address_details` from them. Write the parts, never the combined column. Length limits live in `lib/validation/fields.ts`.

**Store hours**
- Open 8:00 AM to 5:59 PM, Manila time (`lib/store-hours.ts`).

---

## Supabase

### Triggers

| Trigger | Runs when | What it does | Defined in |
|---|---|---|---|
| `trg_create_delivery_for_ready_order` | An order is created, or its status or type changes | When a **delivery** order reaches `ready` or `out_for_delivery` and has no `delivery` row, creates one with status `pending`, so it shows in the rider queue | `migrations/20260921000003_qa_fixes_rls_delivery_roles.sql` |
| `on_auth_user_password_update` | A user's password changes | Sets `password_last_updated` on the matching `employee` or `customer` row | `migrations/000_remote_schema.sql` |
| `on_auth_email_confirmed` | A user confirms a new email | Copies the confirmed email into `customer.email` | `supabase/profile-rls-and-triggers.sql` (not a migration — run it by hand) |

The app also creates the delivery row itself (`lib/orders/order-side-effects.ts`). Both checks skip it if the row already exists, so having both is safe.

### Database functions (RPC)
- `get_customer_order_history` — the customer's My Orders list, newest first.
- `submit_order_review` — saves an order's rating.

### Realtime
Screens update live from these tables: `order`, `delivery`, `transaction`, `product`, `categories`.

### Storage buckets
`menu-images`, `avatars` (customers), `emp-pfp` (employees), `proof-of-delivery`.

### Edge functions
- `create-payment-intent` — starts a PayMongo payment.
- `payment-webhook` — receives PayMongo's result and moves the order out of `awaiting_payment`.

These need Supabase Function secrets: `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`.

### Other tables worth knowing
- `login_attempt` — failed sign-ins for rate limiting. Service role only. Emails are stored hashed.

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

   Do **not** run `supabase/schema.sql`. It is the old Phase 1 draft and no longer matches the real tables.

   **Clean up and add demo data** (needs `SUPABASE_SERVICE_ROLE_KEY`):
   ```bash
   npm run db:cleanse                  # dry run: lists rows it would remove or repair
   npm run db:cleanse -- --apply       # does it (add --wipe-orders for an empty order history)
   # then run supabase/validate-constraints.sql in the Supabase SQL editor
   npm run db:seed                     # menu, staff, riders, NCR customers, 30 days of orders
   npm run db:seed -- --reset          # replace the demo data
   ```

   Demo accounts all use the password `YangsDemo2026!` (change it with `SEED_PASSWORD`):

   | Role | Email | Sign in at |
   |---|---|---|
   | Manager | `ramon.tan@yangs.ph` | `/employee/login` |
   | Staff | `grace.lim@yangs.ph` | `/employee/login` |
   | Rider | `jerome.bautista@yangs.ph` | `/employee/login` |
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
  deliver/         # Rider queue and delivery screens
  api/             # API routes (routers in app/api/routers/)
components/        # UI grouped by area (manage, deliver, orders, menu, auth, ui)
lib/
  actions/         # Server actions (orders, cart, delivery, menu, reports, …)
  auth/            # Roles, employee session, login rate limit
  checkout/        # Payment methods, PayMongo, arrival estimate
  eta/             # Delivery fee and arrival time engine
  orders/          # Order status, order number, rider queue rules
  validation/      # zod schemas and field limits
  supabase/        # Browser and server clients
supabase/
  migrations/      # Database changes, applied in filename order
  functions/       # PayMongo edge functions
scripts/           # db-cleanse, db-seed
__tests__/         # Component tests (unit tests sit next to their files in lib/)
docs/              # Audits, handoffs, screenshots
```

## Docs
- [`docs/requirements_audit.md`](docs/requirements_audit.md) — checklist of the original requirements.
- [`docs/unimplemented_issues.md`](docs/unimplemented_issues.md) — what is still open.
- [`docs/issue-106-followups.md`](docs/issue-106-followups.md) — QA follow-ups from issue #106.
- [`docs/phase4-security-testing-report.md`](docs/phase4-security-testing-report.md) — security testing results.
- [`docs/reference/`](docs/reference/) — business case, storage draft, handoffs.
