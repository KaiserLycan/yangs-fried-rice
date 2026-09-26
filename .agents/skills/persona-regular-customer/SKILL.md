---
name: persona-regular-customer
description: Review implementation as Mark (orders lunch 3x/week). Verify repeat-ordering convenience, loyalty, and payment recovery flows.
---

# Persona: Regular Customer — "Mark, orders lunch to the office 3× a week"

Use this skill to review any implementation that touches **repeat ordering**, **order history**, **payment recovery**, or **notifications**.

## Who is Mark?

Mark orders the same lunch 3 times a week. He wants speed — the same meal, fast checkout, GCash payment. He doesn't want to browse; he wants to reorder.

## Review Checklist

### Reorder Flow
- [ ] Does the menu page show an "Order again" section at the top for signed-in users?
- [ ] Does it show his last 3 completed orders with a one-tap reorder button?
- [ ] Does reorder correctly use `reorderPastOrder` and handle sold-out items gracefully?
- [ ] If a price changed since his last order, does checkout inform him?

### Cart & Checkout Speed
- [ ] Can he type a quantity directly in the stepper (not just tap +/- 14 times)?
- [ ] Can he edit add-ons from the cart without deleting and re-adding the line?
- [ ] Is the delivery fee shown in the cart before checkout?

### Payment Recovery
- [ ] If GCash payment times out, can he retry or switch to COD from the order page?
- [ ] Do stale unpaid wallet orders get auto-cancelled after 30 minutes (pg_cron)?
- [ ] Does his order history correctly show cancelled-by-timeout orders with a clear reason?

### Notifications
- [ ] Does a notification bell in the nav bar show unread alerts?
- [ ] Does he get notified when the order status changes (e.g., "out for delivery")?
- [ ] Are notifications powered by Supabase realtime?

### Order History
- [ ] Can he see more than the last 30 orders? (Load more / pagination)
- [ ] Can he search his history by item name or filter by month?
- [ ] Is there a printable receipt he can expense?

## Key Files to Check
- `components/menu/menu-screen.tsx` — "Order again" section
- `components/orders/past-order-card.tsx` — reorder button
- `components/cart/cart-line-row.tsx` — add-on editing, quantity stepper
- `lib/actions/cart.ts` — `reorderPastOrder`, `submitCart`
- `lib/checkout/paymongo.ts` — payment recovery
- `app/api/customer/notifications/` — notification API
- `components/ui/toast.tsx` — notification display

## Red Flags
- "Order again" only exists on My Orders, not on the menu
- Quantity stepper is a `<span>` between buttons, not a typeable `<input>`
- No notification bell or unread count
- Stale unpaid orders pile up in history without auto-cancel
- Cart add-ons can't be edited without deleting the line
