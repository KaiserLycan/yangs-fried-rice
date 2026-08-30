# Yang's Fried Rice — Ordering System

## Current phase: Remote Customer Ordering (R15–R25)

This scaffold covers only the remote customer browse → cart → checkout
flow, per the project doc's phasing:

- R15 Browse menu
- R16 Add to cart
- R17 Specify quantity
- R18 Calculate total
- R19 Special instructions
- R20 Review order before confirming
- R21 Pickup vs. delivery
- R22 Choose payment method (selection only — no processing yet)
- R23 Modify cart before confirmation
- R24 Cancel before confirmation
- R25 Confirmation prompt on cancel

Auth (R8–R11), order tracking (R26–R30), payment processing (R31),
and admin/kitchen/cashier tooling are **not** part of this phase — the
schema is scaffolded for them (see `supabase/schema.sql`) so nothing
has to be migrated later, but no app code depends on them yet.

## Stack

Next.js (App Router) · TypeScript · Tailwind · ShadCN · Supabase
(Postgres + Auth + Storage) · Recharts (later, for admin) ·
Stripe/Paymongo (later, for R31)

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com, then copy
   its URL and anon key.

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. **Apply the schema.** In the Supabase SQL Editor, run
   `supabase/schema.sql`, then `supabase/seed.sql` for dev data.
   (Or via CLI: `npx supabase db push` if you've linked the project.)

5. **Generate real DB types** (replaces the placeholder in
   `types/database.types.ts`):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run supabase:types
   ```

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## Folder structure

```
app/                  # Next.js App Router pages
  layout.tsx
  page.tsx            # menu browsing entry point (R15)
  globals.css
lib/
  supabase/
    client.ts          # browser client — use in Client Components
    server.ts           # server client — use in Server Components/Route Handlers
types/
  database.types.ts     # generated Supabase types (placeholder until linked)
supabase/
  schema.sql             # full ERD from the project doc
  seed.sql                # dev seed data
```

