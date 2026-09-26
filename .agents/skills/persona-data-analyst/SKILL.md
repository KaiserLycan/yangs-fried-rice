---
name: persona-data-analyst
description: Review implementation as Carla (data analyst). Verify CSV exports, correct date boundaries, payment breakdowns, and analytics query support.
---

# Persona: Data Analyst — "Carla, builds the weekly report for the owner"

Use this skill to review any implementation that touches **data exports, analytics, report accuracy, or date handling**.

## Who is Carla?

Carla builds the weekly report for the owner. She needs to pull data into Excel, split it by payment method and time, and answer "what sells, when, and to whom?"

## Review Checklist

### Data Exports
- [ ] Is there a CSV export button next to every PDF button?
- [ ] Can she export a raw "orders with items" flat file for a chosen date range?
- [ ] Is the CSV format clean and importable into Excel / Power BI?

### Payment Method Split
- [ ] Can GCash and Maya be distinguished? (not both saved as `paymongo`)
- [ ] Does the payment breakdown show `cash_on_delivery`, `gcash`, `paymongo`, `pay_in_store` separately?

### Date Boundaries
- [ ] Do reports filter using Manila time (Asia/Manila), not UTC?
- [ ] Does the daily cutoff match the business day (not 00:00 UTC)?
- [ ] Test: does a 9 PM Manila order land on the correct business day?

### Report Dimensions
- [ ] Can she break down by payment method?
- [ ] Can she break down by order type (delivery vs pickup)?
- [ ] Can she break down by hour of day or weekday?
- [ ] Can she see cancellation reasons and their share?
- [ ] Can she see top products for a specific time window (not just overall)?

### Customer Analytics
- [ ] Can she see top customers by spending?
- [ ] Can she see new vs returning customers per month?
- [ ] Is `customer_id` preserved on orders when an account is deleted? (or an anonymous hash)
- [ ] Is demo data distinguishable from real data? (`is_demo` flag or separate project)

### Data Quality
- [ ] Does `order_item_add_on` have a `price` column? (currently missing)
- [ ] Are add-on costs derivable from order data without looking up current prices?
- [ ] Is the `reports` table avoided in favor of live queries from orders?

## Key Files to Check
- `lib/actions/reports.ts` — report queries, date boundaries
- `app/api/reports/` — PDF and CSV endpoints
- `lib/actions/dashboard.ts` — dashboard queries
- `lib/actions/cart.ts` — payment method value (line ~852)
- `components/manage/reports/` — report UI

## Red Flags
- No CSV export (only PDF)
- GCash and Maya indistinguishable (both `paymongo`)
- Report dates use UTC midnight
- No breakdown by payment method, hour, or order type
- Deleted accounts break customer analytics
- `reports` table stores stale cached totals
