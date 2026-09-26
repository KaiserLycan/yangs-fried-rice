---
name: persona-qa-tester
description: Review implementation as Paolo (QA tester). Try to break things — double clicks, direct API calls, odd inputs, two tabs, bad timing.
---

# Persona: QA Tester — "Paolo, tries to break things"

Use this skill to review any implementation for **security holes, race conditions, input validation, and edge cases**.

## Who is Paolo?

Paolo is a QA tester who double-clicks, calls APIs directly, sends odd inputs, opens two tabs, and deliberately times actions badly.

## Review Checklist

### Direct Database Writes (Critical — L21)
- [ ] Can a signed-in customer call the Supabase REST API directly to insert into `order`, `order_item`, `order_add_on`, or `order_item_add_on`?
- [ ] Have the customer insert policies been dropped on those tables?
- [ ] Are orders created only through the server-side `submit_cart_to_order` function?
- [ ] Can the customer cancel rule change anything besides status and cancellation fields?
- [ ] Run this verification query:
```sql
SELECT o.order_id, o.created_at, o.order_status
FROM "order" o LEFT JOIN "transaction" t USING (order_id)
WHERE t.order_id IS NULL;
```

### Double-Submit Race (L15)
- [ ] Does "Place order" disable itself after the first click?
- [ ] Does `submit_cart_to_order` use `SELECT … FOR UPDATE` on the cart and check `is_final`?
- [ ] Is there a unique index on `order.cart_id`?
- [ ] Open two browser tabs — can two orders be created from one cart?

### Input Boundary Testing
- [ ] Server quantity cap matches UI (`MAX_QUANTITY` = 20, not 99)
- [ ] What happens with 0 items? Negative quantities? Non-numeric input in the stepper?
- [ ] What happens with an extremely long special instruction (>1000 chars)?
- [ ] Can a delivery order be placed with an address outside NCR via the API?

### Timing Attacks
- [ ] Can an order be placed at 3 AM via a direct server action call? (L1)
- [ ] If an item is marked sold out while it's in the cart, does checkout catch it? (L2)
- [ ] Can a customer delete their account while an order is out for delivery? (L16)
- [ ] Does changing the device clock affect the store-hours check? (should be server-side only)

### Authentication Bypass
- [ ] Can a disabled account (`is_account_disabled = true`) still use the app if they're already signed in?
- [ ] Is `is_account_disabled` checked in `requireCustomer`, `requireManageAccess`, `requireRole`, `requireEmployee`, and `requireReportAccess`?
- [ ] Does `requireCustomer` use `getUser()` (not `getSession()`)?

### RLS Verification
- [ ] Are all public tables listed with RLS enabled?
```sql
SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
```
- [ ] Can a customer read employee or rider personal data?

## Key Files to Check
- `lib/actions/cart.ts` — `submitCart`, quantity validation
- `lib/validation/cart.ts` — `updateCartItemSchema`, max quantity
- `lib/store-hours.ts` — store hours (should have server enforcement)
- `lib/actions/profile.ts` — `deleteMyAccount`
- `lib/auth/api-guard.ts` — disabled account check
- `supabase/migrations/` — RLS policies, insert rules

## Verification SQL
```sql
-- Orders with no payment record (direct-insert hole)
SELECT o.order_id FROM "order" o
WHERE NOT EXISTS (SELECT 1 FROM "transaction" t WHERE t.order_id = o.order_id);

-- Price tampering check
SELECT oi.order_id, oi.product_name, oi.unit_price, p.product_price
FROM order_item oi JOIN product p USING (product_id)
WHERE oi.unit_price < p.product_price * 0.5;

-- Double submit check
SELECT cart_id, count(*) FROM "order"
GROUP BY cart_id HAVING count(*) > 1;

-- Stored values nobody expected
SELECT order_status, order_type, count(*) FROM "order" GROUP BY 1, 2 ORDER BY 3 DESC;
```

## Red Flags
- Any table with RLS disabled in the public schema
- Customer can insert directly into `order` or `order_item`
- Two orders can be created from one cart
- Server allows quantity 99 while UI shows max 20
- Disabled users can still call server actions
