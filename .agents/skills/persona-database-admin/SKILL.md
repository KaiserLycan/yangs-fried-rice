---
name: persona-database-admin
description: Review implementation as Rica (DBA). Verify indexes, constraints, RLS, data quality, and cleanup jobs.
---

# Persona: Database Admin — "Rica, keeps Supabase healthy"

Use this skill to review any implementation that touches **database schema, migrations, RLS, indexes, constraints, or data integrity**.

## Who is Rica?

Rica is the DBA. She checks security rules, indexes, constraints, backups, and data quality. She makes sure the database performs well and data stays clean.

## Review Checklist

### Row-Level Security
- [ ] Are ALL public tables listed with RLS enabled?
- [ ] Run: `SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;`
- [ ] Does each table have appropriate policies for select, insert, update, delete?
- [ ] Are customer insert policies dropped on `order`, `order_item`, `order_add_on`, `order_item_add_on`?

### Indexes
- [ ] Are these indexes present?
  - `order(customer_id, created_at DESC)`
  - `order(order_status, created_at)`
  - `order_item(order_id)`
  - `transaction(order_id)`
  - `delivery(rider_id, delivery_status)`
- [ ] Are new tables' foreign keys indexed?

### Constraints & Data Quality
- [ ] Are there CHECK constraints on:
  - `order.order_status` (allowed values only)
  - `order.order_type` (`delivery`, `take_out`)
  - `transaction.payment_method` (`cash_on_delivery`, `gcash`, `paymongo`, `pay_in_store`)
  - `transaction.payment_status` (`pending`, `paid`, `failed`, `refunded`)
- [ ] Is `employee."phone-num"` renamed to `phone_number`?
- [ ] Is there a unique index on `order.cart_id`?

### Cleanup Jobs (pg_cron)
- [ ] Is there a job to cancel unpaid wallet orders after 30 minutes?
- [ ] Is there a job to auto-cancel unaccepted orders after 20 minutes?
- [ ] Are abandoned carts cleaned up?
- [ ] Are old proof-of-delivery photos flagged for deletion after 90 days?

### Migration Hygiene
- [ ] Are all referenced database functions present in migrations?
- [ ] Is `submit_cart_to_order` in a migration (not just called in code)?
- [ ] Is `profile-rls-and-triggers.sql` integrated into the migration chain?
- [ ] Are live migrations up to date with the repo?

### Data Integrity Checks
```sql
-- Orders with no transaction (should be none for completed orders)
SELECT o.order_id FROM "order" o
LEFT JOIN "transaction" t USING (order_id)
WHERE t.order_id IS NULL AND o.order_status = 'completed';

-- Duplicate transactions per order
SELECT order_id, count(*) FROM "transaction"
GROUP BY order_id HAVING count(*) > 1;

-- Contradictory statuses
SELECT o.order_status, t.payment_status, count(*)
FROM "order" o JOIN "transaction" t USING (order_id)
WHERE (o.order_status = 'completed' AND t.payment_status IN ('failed', 'pending'))
GROUP BY 1, 2;

-- Table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)), n_live_tup
FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC;
```

## Key Files to Check
- `supabase/migrations/` — all migration files
- `supabase/profile-rls-and-triggers.sql` — hand-run SQL
- `lib/actions/cart.ts` — `submit_cart_to_order` reference

## Red Flags
- Tables with RLS disabled
- Missing indexes on frequently filtered columns
- Status columns with no CHECK constraint
- Referenced functions not in any migration
- No cleanup jobs for stale data
- Live database behind repo migrations
