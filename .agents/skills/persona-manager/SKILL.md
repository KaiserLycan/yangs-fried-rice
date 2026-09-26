---
name: persona-manager
description: Review implementation as Ms. Cruz (newly hired manager). Verify staff management, order workflows, and admin tools.
---

# Persona: Newly Hired Manager — "Ms. Cruz, first week"

Use this skill to review any implementation that touches the **management dashboard, staff workflows, order management, or KDS**.

## Who is Ms. Cruz?

Ms. Cruz is a newly hired manager in her first week. She needs to learn the back office, add staff, handle wrong orders, pull reports, and manage the kitchen during a rush.

## Review Checklist

### Navigation & Onboarding
- [ ] Is the KDS accessible from the sidebar? (not hidden behind a button on Orders)
- [ ] Are placeholder pages (`/manage/staff`, `/manage/inventory`) hidden from production?
- [ ] Does the Employees page show "Not set" for shift instead of a fake default "MWF – 12-3PM"?
- [ ] Is there any onboarding or help for new managers?

### Order Management
- [ ] Can she search orders by customer name or phone? (not just order number)
- [ ] Can she filter orders by date range, payment method, and order type?
- [ ] Is there a manager-only "Payment issues" tab for stuck GCash/Maya orders?
- [ ] Can she see PICKUP vs DELIVERY clearly on each order?
- [ ] Can she see orders that have been pending too long? (flash after 5 min)

### Order Cancellation
- [ ] Is the Cancel button disabled until a reason is given?
- [ ] Are there preset cancel reasons? ("Out of stock", "Store closing", "Customer request", "Duplicate order")
- [ ] Does the `order_status_log` record who cancelled and why?
- [ ] Is the customer notified when an order is cancelled? (notification + email)

### Customer Management
- [ ] Does the customer list load via server-side pagination? (not downloading everyone)
- [ ] Does it show `totalOrders` and `totalSpent` per customer?
- [ ] Can she see a customer's last 10 orders in their detail view?
- [ ] Can she sort customers by spending or order count?

### Staff & Rider Management
- [ ] Can she add and edit employees?
- [ ] Can she reassign a delivery from a rider who went offline?
- [ ] Can she see each rider's active delivery count?
- [ ] Can she disable an account, and does it fully lock the user out?

### Stuck Order Scenarios
- [ ] What happens if a customer says "I paid with GCash but don't see my order"?
  - Can she find it via the Payment issues tab?
  - Can she see the PayMongo reference ID?
- [ ] What happens if no staff accept an order for 20 minutes?
  - Is it auto-cancelled with "Store didn't confirm in time"?

## Key Files to Check
- `app/manage/orders/page.tsx` — order management, cancel dialog
- `app/manage/customers/page.tsx` — customer list
- `app/manage/employee/page.tsx` — employee management
- `app/manage/kds/page.tsx` — KDS
- `lib/actions/orders.ts` — `getDetailedOrders`, filtering
- `components/manage/sidebar.tsx` — sidebar navigation

## Red Flags
- KDS not in the sidebar
- Orders searchable only by order number
- No date filter on orders (server already supports it but page doesn't send it)
- Customer list downloads every customer to the browser
- Cancel button works without a reason
- Disabled employees can still access `/manage`
