---
name: persona-restaurant-owner
description: Review implementation as Mr. Yang (restaurant owner). Verify revenue accuracy, staff accountability, and business intelligence.
---

# Persona: Restaurant Owner — "Mr. Yang"

Use this skill to review any implementation that touches **reports, revenue, staff management, pricing, or business decisions**.

## Who is Mr. Yang?

Mr. Yang owns the restaurant. He wants to know: Am I making money? Who is stealing? What should I cook more of? He checks the dashboard daily and reviews reports weekly.

## Review Checklist

### Revenue Accuracy
- [ ] Are pay-in-store sales correctly marked as `paid` with the full `total_paid` amount? (L27)
- [ ] Do reports show correct revenue, not ₱0 for in-store sales?
- [ ] Are GCash and Maya distinguishable in reports? (not both saved as `paymongo`)
- [ ] Are payment method spellings consistent (`cash_on_delivery`, `gcash`, `paymongo`, `pay_in_store`)?
- [ ] Do report date boundaries use Manila time (not UTC)?

### Staff Accountability
- [ ] Are menu price changes restricted to MANAGER role only? (not STAFF)
- [ ] Is there a `product_price_log` that records who changed what price, when?
- [ ] Can he see who cancelled an order? (`order_status_log.changed_by`)
- [ ] Can he disable a staff account, and does it actually lock them out?

### Cash Management
- [ ] Is there a "Cash to remit" table in reports showing each rider's daily cash?
- [ ] Does it show rider name, number of cash orders, and total collected?
- [ ] Can he select a specific day to view?

### Business Intelligence
- [ ] Can he see sales by hour of day and weekday? (staffing decisions)
- [ ] Can he see top products for a specific time window?
- [ ] Is there a cancellation-reason breakdown?
- [ ] Can he compare this month to last month? To the same month last year?
- [ ] Can he export reports as CSV (not just PDF)?

### Store Control
- [ ] Can he pause the store during a rush? (manual pause with duration)
- [ ] Does auto-pause kick in when active orders reach the limit?
- [ ] Can he change store hours without a developer? (store_setting table)
- [ ] Can he see paid-but-cancelled orders? (refunds owed list)

## Key Files to Check
- `app/manage/dashboard/page.tsx` — dashboard
- `app/manage/reports/page.tsx` — reports
- `lib/actions/reports.ts` — report queries, date boundaries
- `lib/actions/dashboard.ts` — dashboard queries
- `components/manage/reports/` — report UI
- `supabase/migrations/` — `product_price_log`, `order_status_log`

## Verification SQL
```sql
-- Cash each rider should hand over today
SELECT e.name, count(*), sum(t.total_paid)
FROM delivery d JOIN rider r USING (rider_id) JOIN employee e USING (employee_id)
JOIN "transaction" t ON t.order_id = d.order_id
WHERE t.payment_method = 'cash_on_delivery' AND d.delivery_status = 'delivered'
  AND (d.completed_at AT TIME ZONE 'Asia/Manila')::date = current_date
GROUP BY e.name;

-- Paid orders that were cancelled (refunds owed)
SELECT o.order_id, o.cancelled_at, t.total_paid, t.payment_method
FROM "order" o JOIN "transaction" t USING (order_id)
WHERE o.order_status = 'cancelled' AND t.payment_status = 'paid';

-- Sales by hour (staffing decisions)
SELECT extract(hour FROM created_at AT TIME ZONE 'Asia/Manila') AS hour, count(*)
FROM "order" WHERE order_status = 'completed'
GROUP BY 1 ORDER BY 1;
```

## Red Flags
- Pay-in-store revenue shows as ₱0
- GCash and Maya both show as "paymongo" in reports
- Staff can change menu prices
- No record of who cancelled an order
- Report dates use UTC instead of Manila time
- No CSV export option
