---
name: persona-accountant
description: Review implementation as Mrs. Santos (accountant). Verify payment accuracy, VAT, reconciliation, and financial reporting.
---

# Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"

Use this skill to review any implementation that touches **payments, transactions, VAT, discounts, or financial reporting**.

## Who is Mrs. Santos?

Mrs. Santos closes the books every month. She matches sales to cash and PayMongo payouts, computes VAT, lists refunds, and prepares BIR figures.

## Review Checklist

### Payment Accuracy
- [ ] Are pay-in-store transactions marked `paid` with `total_paid` set to the order total? (not ₱0)
- [ ] Are payment method values consistent? Only `cash_on_delivery`, `gcash`, `paymongo`, `pay_in_store`?
- [ ] Are payment status values consistent? Only `pending`, `paid`, `failed`, `refunded`?
- [ ] Do CHECK constraints enforce these values?
- [ ] Does every completed order have exactly one transaction?

### VAT
- [ ] Is VAT (12%) split out on every transaction (`vatable_sales`, `vat_amount`)?
- [ ] Is `tax_amount` saved (not always 0)?
- [ ] Does checkout display "VATeable sales / VAT (12%) / Total"?

### Senior/PWD Discounts
- [ ] Is `discount_amount` recorded per transaction?
- [ ] Is `discount_type` (`senior` or `pwd`) and `discount_id_number` saved?
- [ ] Can she export a Senior/PWD discount list for BIR?

### Reconciliation
- [ ] Do order status and payment status agree? (no `completed` + `failed`, no `cancelled` + `paid` without refund)
- [ ] Is `total_paid` consistent with items + add-ons + delivery fee?
- [ ] Are paid-but-cancelled orders visible as "refunds owed"?
- [ ] Is there a refund table (amount, date, method, reference, reason)?

### Reporting
- [ ] Can she get monthly totals split by payment method?
- [ ] Can she export reports as CSV?
- [ ] Do report date boundaries use Manila time (not UTC)?
- [ ] Are cash-per-rider totals available for daily reconciliation?

## Verification SQL
```sql
-- Pay-in-store with total_paid = 0 (should be none)
SELECT o.order_id, t.total_paid FROM "order" o JOIN "transaction" t USING (order_id)
WHERE t.payment_method = 'pay_in_store' AND o.order_status = 'completed' AND t.total_paid = 0;

-- Inconsistent payment spellings
SELECT payment_method, payment_status, count(*) FROM "transaction" GROUP BY 1, 2 ORDER BY 1, 2;

-- Contradictory statuses
SELECT o.order_status, t.payment_status, count(*)
FROM "order" o JOIN "transaction" t USING (order_id)
WHERE (o.order_status = 'completed' AND t.payment_status IN ('failed', 'pending'))
   OR (o.order_status = 'cancelled' AND t.payment_status = 'paid')
GROUP BY 1, 2;

-- Monthly sales book
SELECT (t.transaction_date AT TIME ZONE 'Asia/Manila')::date AS day, t.payment_method,
       count(*), sum(t.total_paid) AS gross, sum(t.discount_amount) AS discounts
FROM "transaction" t JOIN "order" o USING (order_id)
WHERE t.payment_status = 'paid' AND o.order_status = 'completed'
GROUP BY 1, 2 ORDER BY 1, 2;
```

## Key Files to Check
- `lib/actions/cart.ts` — `submitCart` (total_paid, payment_method)
- `lib/actions/delivery.ts` — cash-on-delivery payment marking
- `lib/actions/reports.ts` — report queries, date filtering
- `lib/validation/transaction.ts` — transaction schema
- `supabase/migrations/` — CHECK constraints

## Red Flags
- `total_paid = 0` on completed pay-in-store orders
- Multiple spellings for the same payment method
- `tax_amount` always 0
- Report dates in UTC instead of Manila time
- No CSV export
- Cancelled orders still marked `paid` with no refund record
