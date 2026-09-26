---
name: persona-developer
description: Review implementation as Kai (new developer joining the team). Verify DX, setup, code consistency, and type safety.
---

# Persona: Developer — "Kai, joins the team next sprint"

Use this skill to review any implementation for **developer experience, code consistency, type safety, and maintainability**.

## Who is Kai?

Kai is a new developer joining the team. He clones the repo, sets up the environment, tries to understand the codebase, changes something, and ships.

## Review Checklist

### Setup & Onboarding
- [ ] Does `npm install && npm run dev` work after cloning?
- [ ] Is `supabase/profile-rls-and-triggers.sql` mentioned in the README or auto-applied?
- [ ] Does `npm run db:reset` apply all migrations including hand-run SQL files?
- [ ] Are environment variables documented with examples?

### Type Safety
- [ ] Is `types/database.types.ts` up to date with the current schema?
- [ ] Has `order.employee_id` been removed from the types (it was dropped in migrations)?
- [ ] Are there any uses of the dropped column that compile but fail at runtime?
- [ ] Run: `npx supabase gen types typescript --local > types/database.types.ts && git diff`

### Code Consistency
- [ ] Are real types (`OrderData`, `DeliveryLocation`, `MenuItem`) in `types/` (not in mock files)?
- [ ] How many files import from `lib/mock-orders.ts`, `lib/mock-deliveries.ts`, or `components/manage/menu/mock-menu.ts`?
- [ ] Is the restaurant location consistent? (`RESTAURANT_LAT/LNG` in `lib/eta/engine.ts` vs `RESTAURANT_LOCATION` in `lib/mock-deliveries.ts`)
- [ ] Are status values consistent? (No mix of `take_out`/`pickup`/`dine_in`/`drive_thru`)
- [ ] Are there CHECK constraints on status columns in the database?

### Security Rules Audit
- [ ] Can he answer "can a customer insert into order?" without reading 6+ files?
- [ ] Are RLS policies consolidated or clearly documented?
- [ ] Is the `submit_cart_to_order` function in a migration (not just referenced in code)?

### Two Entry Points Problem
- [ ] Are REST routers (`app/api/routers/`) and server actions (`lib/actions/`) kept in sync?
- [ ] If a fix is applied to one path, is the other also updated?
- [ ] Is there a single source of truth for each business rule?

### Testing
- [ ] Do unit tests cover the changed files?
- [ ] Are there any tests that run against a real database (RLS testing)?
- [ ] Is there a seed script with edge-case data (sold-out item, unpaid wallet order, etc.)?

## Key Files to Check
- `types/database.types.ts` — generated types
- `lib/mock-orders.ts`, `lib/mock-deliveries.ts` — should types be here?
- `lib/eta/engine.ts` — restaurant location constants
- `lib/validation/orders.ts` — `VALID_TRANSITIONS`, status values
- `supabase/migrations/` — are all referenced functions present?
- `app/api/routers/` — REST API entry points

## Red Flags
- Types file doesn't match the live schema
- Real production types live in files named "mock"
- A database function is called in code but not in any migration
- Two implementations of order creation (RPC path + fallback)
- No database-level CHECK constraints on status columns
