# Frontend ↔ Backend integration notes

For the backend developer (and any AI assistant reading this repo on their
behalf). Written by the frontend developer, last updated 2026-08-31.

The PM's plan is **frontend first, backend connects it afterwards**. This file
describes the seams the frontend has left for you, the decisions already made
that constrain your side, and what the frontend is waiting on.

---

## 1. What exists right now

A complete route scaffold and nothing else. Every page renders a
`RoutePlaceholder` — a title, a description, and the requirement IDs it will
satisfy. **No data fetching, no state, no auth, no forms.** The build passes
and the URLs are final; the behaviour is not written yet.

Read any page file to see what that route is meant to do. They are three lines
each and they name their requirements.

### Route map

| URL | Who | Purpose |
|---|---|---|
| `/menu`, `/menu/:itemId` | public | Browse and view items |
| `/login`, `/register` | public | **Customer** auth |
| `/employee/login` | public | **Employee** auth — Staff, Business Owner, Rider |
| `/cart`, `/checkout`, `/checkout/confirmation` | Customer | Ordering flow |
| `/orders`, `/orders/:orderId`, `/profile` | Customer | History and account |
| `/manage/*` | Staff + Business Owner | Back office |
| `/deliver`, `/deliver/:deliveryId` | Rider | Delivery jobs |

### Folder → URL

Folders in parentheses — `(shop)`, `(account)`, `(auth)` — are Next.js **route
groups**. They exist to give an area its own layout and they contribute
**nothing** to the URL. So `app/(account)/cart/page.tsx` serves `/cart`, not
`/account/cart`. `manage/` and `deliver/` and `employee/` are ordinary folders
and *do* appear in the URL.

---

## 2. Decisions already made that affect your work

These are settled. If you need to change one, raise it — don't work around it.

**A customer must be logged in before adding to the cart.** The cart is
server-side and keyed by `customer_id`, matching the ERD. There is no guest
cart and no guest checkout. The menu itself stays public — the login wall is
on the "Add to cart" action, not on the menu pages.

**There are two separate login pages.** Customers use `/login`. Staff,
Business Owner and Rider all share `/employee/login`. This mirrors the
identity split in the data model: `Customer` is its own table, while the
employee roles are values of `Employee.role`.

**There is no employee registration page,** deliberately. Employee accounts
are created by the Business Owner from `/manage/staff` (`SAS1`). Please don't
build a self-serve employee signup endpoint.

**`/employee/login` sign-in needs a role-based redirect.** One page, three
roles, two destinations: Staff and Business Owner → `/manage`, Rider →
`/deliver`. The frontend will implement the redirect, but it needs the role on
the session to do it — see §4.

**Access checks live in layouts, not in URLs.** Route groups add no URL
segment, so `middleware.ts` cannot guard `/cart` and friends with a single
wildcard. The primary gate is `app/(account)/layout.tsx`; middleware is
defence in depth. Same pattern for `app/manage/layout.tsx` and
`app/deliver/layout.tsx`.

---

## 3. Conventions to follow

**Supabase clients already exist — use them, don't create new ones.**

- `lib/supabase/client.ts` → `createClient()` for Client Components
- `lib/supabase/server.ts` → `createClient()` for Server Components, Route
  Handlers, and Server Actions. Call it fresh per request; `cookies()` is
  request-scoped.

`lib/supabase/server.ts` has a note where session refresh needs to hook into
`middleware.ts` once auth lands. That hook is not written yet.

**`types/database.types.ts` is a 16-line stub, not real types.** It exists so
the app compiles. Once the Supabase project is live, `npm run supabase:types`
regenerates it from the actual schema. Run it after any schema change lands.

**Search the codebase for `TODO(auth)`.** Every seam where authentication
needs to plug in is marked with that exact string. There is nothing hidden.

---

## 4. What the frontend is blocked on

In rough priority order:

1. **A Supabase project.** There is `.env.local.example` but no `.env.local`,
   and nothing is linked. The frontend needs `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, plus the project ref so
   `npm run supabase:types` works. This blocks everything real.
2. **The role on the session.** The employee redirect and every layout gate
   need to know whether the signed-in user is a Customer or an Employee, and
   which `Employee.role` they hold. Tell us how to read that — a custom claim
   on the JWT, a profile row we query, or something else. This shapes whether
   gating happens in a Server Component or requires a round trip.
3. **Cart endpoints or tables.** Confirm the frontend should write to
   `Cart` / `Cart_Item` / `Cart_Item_Modifier` directly via Supabase, or
   whether you're putting an API in front of them.
4. **Price validation at checkout.** Wherever cart totals get computed, the
   server must recompute them at order submission rather than trusting a
   number sent from the browser. Flagging it early so it isn't retrofitted.

---

## 5. Open questions — not settled, don't build on either answer yet

**Role names.** Three documents disagree. `CLAUDE.md` says Customer /
Business Owner / Staff / Rider; `docs/reference/yangs_fried_rice_context.md`
says Customer / Staff / Delivery Rider / Administrator-Manager; the Prisma
draft says `Admin, Manager, Staff, Rider`. The PM and DB developer need to
settle this. Good news: the route tree does not depend on it — URLs are named
for areas, not roles — so the only place it bites is the post-login redirect.

**Which schema is authoritative.** There is a `supabase/schema.sql` and a
21-model Prisma draft at `docs/reference/storage_draft.md`, and they disagree
on delivery, riders, modifiers, inventory, and what reviews attach to. Please
confirm which one you're building against before the frontend generates types
from it.

**Requirement IDs.** The real ones are `Cust*`, `Menu*`, `Browsing*`,
`Order*`, `PP*`, `SAS*`, `SFR*`, `OHF*`, `TPI1`, from
`yangs_fried_rice_context.md`. Any `R`-number you see quoted anywhere in this
repo — including in `README.md` and `supabase/schema.sql` — is fabricated and
matches nothing. Note `Browsing7` does not exist; the spec skips from 6 to 8.

---

## 5a. Screen-specific handoffs

This file stays high-level on purpose. A screen built to the "frontend reads
real data, stubs every write with a toast" rule gets its own handoff document
once it's done, naming exactly which controls are stubbed and what they need
— see `docs/reference/profile-page-handoff.md` for the first one (the
customer profile screen).

---

## 6. Working together

Feature branches off `development`, PRs into `development`, no direct pushes.

```bash
git switch development && git pull
git switch -c feat/whatever
git push -u origin feat/whatever
```

If you change the database schema, say so in the PR — the frontend has to
re-run `npm run supabase:types` and may need to update components that read
the changed columns.

If something in this file is wrong or out of date, edit it. It's checked in
so both sides can keep it honest.
