---
name: persona-kitchen-staff
description: Review implementation as Jun (kitchen/counter staff). Verify KDS usability, order visibility, sold-out workflow, and speed.
---

# Persona: Kitchen Staff — "Jun, kitchen and counter"

Use this skill to review any implementation that touches the **KDS, order preparation flow, sold-out items, or counter pickup**.

## Who is Jun?

Jun works in the kitchen and at the counter. He watches the KDS, moves orders through preparation stages, marks items sold out, and handles walk-in pickup customers.

## Review Checklist

### KDS Display
- [ ] Does the KDS show order cards with readable text? (not 11-12px)
- [ ] Are late orders color-coded? (amber >15 min, red >25 min)
- [ ] Is there a chime/sound for new orders? (with an "Enable sound" button)
- [ ] Are special instructions highlighted prominently? (not a small "Note:" line)
- [ ] Does each card show a **PICKUP** or **DELIVERY** badge? (F21)

### KDS Controls
- [ ] Can he toggle sort order? (Oldest first / Newest first, oldest as default)
- [ ] Can he toggle view? (Grid / List)
- [ ] Is there a "Cancelled (today)" tab so he stops cooking cancelled orders? (F24)
- [ ] Does he land on the KDS after login? (not on Orders)

### Order Workflow
- [ ] Can he move orders through stages: pending → preparing → ready → completed?
- [ ] Are the transitions enforced? (can't skip steps)
- [ ] Does the cancel dialog require a reason before confirming?
- [ ] Are there preset cancel reasons? ("Out of stock", etc.)

### Sold-Out Items
- [ ] Can he mark an item sold out?
- [ ] Is there a quick way to do this from the KDS? (not just the Menu page)
- [ ] Does marking an item sold out prevent it from being ordered?
- [ ] Are sold-out items greyed out on the customer menu?

### Counter Pickup
- [ ] Can he search for a pickup order by customer name? (not just order number)
- [ ] Is there a "Ready for pickup" view?
- [ ] Does the customer get notified when the order is ready? ("Your order is ready — Counter 1")

### Price Protection
- [ ] Can Jun (STAFF role) change menu prices? (should be MANAGER only)

## Key Files to Check
- `app/manage/kds/page.tsx` — KDS layout, filtering
- `components/manage/kds/kds-order-card.tsx` — card display, timer
- `app/manage/orders/page.tsx` — order management, cancel dialog
- `lib/validation/orders.ts` — `VALID_TRANSITIONS`
- `components/manage/menu/` — sold-out toggle

## Red Flags
- KDS not in the sidebar; accessed only through Orders page
- No color coding for late orders (same color at 2 min and 40 min)
- No sound for new orders
- Special instructions in the same color/size as regular items
- Staff can change menu prices
- No search by customer name for pickup orders
