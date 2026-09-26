---
name: persona-system-analyst
description: Review implementation as Paolo (system analyst). Verify order lifecycle, business rules consistency, requirements traceability, and documentation.
---

# Persona: System Analyst — "Paolo, documents the system for the final paper"

Use this skill to review any implementation for **architecture consistency, order lifecycle correctness, business rule duplication, and requirements traceability**.

## Who is Paolo?

Paolo documents the system for the final paper. He maps actors, verifies the order lifecycle, checks that business rules live in one place, and ensures requirements are traceable.

## Review Checklist

### Order Lifecycle
- [ ] Does the state machine in `VALID_TRANSITIONS` match the documented flow?
- [ ] Is the `received` status either removed or given a meaning? (currently a dead state — nothing transitions INTO it)
- [ ] Are status transitions enforced in the database (CHECK constraint or trigger), not just in app code?
- [ ] Can `out_for_delivery → cancelled` happen? If so, does it require a manager and a reason?
- [ ] Does `preparing → out_for_delivery` skip `ready`? Is that intentional and documented?

### Business Rules — Single Source of Truth
- [ ] Store hours: checked on the server (not just browser)?
- [ ] Restaurant location: is `RESTAURANT_LAT/LNG` the single source? (not a separate `RESTAURANT_LOCATION` in mock files)
- [ ] Max quantity: one constant used by both UI and server? (not 20 in UI and 99 in server)
- [ ] Order creation: one implementation? (not an RPC path + fallback path)
- [ ] Status transitions: enforced in the database, not just in `VALID_TRANSITIONS` in app code?

### Two Entry Points Sync
- [ ] Are REST routers (`app/api/routers/`) and server actions (`lib/actions/`) kept in sync?
- [ ] If a business rule is added or changed, is it applied in both paths?
- [ ] How many files call `/api` directly? (should be migrating away from this)

### Requirements Traceability
- [ ] Does each requirement in `docs/requirements_audit.md` map to a real feature?
- [ ] Is Browsing7 present? (it's missing from the audit)
- [ ] Is there a "Recommendations" feature for SFR? (best sellers, "Order again")
- [ ] Are non-functional requirements documented? (performance, security, availability)

### Types & Naming
- [ ] Are real types in `types/` (not in mock files like `lib/mock-orders.ts`)?
- [ ] Are allowed status values documented and enforced by CHECK constraints?
- [ ] Is `order_type` consistently `delivery` or `take_out`? (not `pickup`, `dine_in`, `drive_thru`)

### Documentation Accuracy
- [ ] Does the README's order flow match `VALID_TRANSITIONS`?
- [ ] Is the README's tech stack section up to date?
- [ ] Are environment variables documented?

## Verification SQL
```sql
-- Statuses actually in use
SELECT order_status, count(*) FROM "order" GROUP BY 1 ORDER BY 2 DESC;

-- Has any order ever been in 'received'? (dead-state check)
SELECT count(*) FROM "order" WHERE order_status = 'received';

-- Orders that couldn't have followed the documented path
SELECT o.order_id, o.order_status, t.payment_method, t.payment_status
FROM "order" o JOIN "transaction" t USING (order_id)
WHERE t.payment_method = 'paymongo' AND t.payment_status <> 'paid'
  AND o.order_status IN ('preparing', 'ready', 'out_for_delivery', 'completed');

-- Order type values in use
SELECT order_type, count(*) FROM "order" GROUP BY 1;
```

## Key Files to Check
- `lib/validation/orders.ts` — `VALID_TRANSITIONS`, `ORDER_STATUSES`
- `lib/eta/engine.ts` — restaurant location, constants
- `lib/store-hours.ts` — store hours (should be server-checked)
- `lib/menu/quantity.ts` — `MAX_QUANTITY`
- `lib/validation/cart.ts` — server-side quantity limit
- `lib/mock-orders.ts`, `lib/mock-deliveries.ts` — types that should be in `types/`
- `docs/requirements_audit.md` — requirements mapping

## Red Flags
- `received` status referenced in code but unreachable
- Business rules duplicated in multiple places with different values
- REST routers and server actions out of sync
- Requirements audit marks items as "done" that aren't fully implemented
- No non-functional requirements documented
- Real types living in "mock" files
