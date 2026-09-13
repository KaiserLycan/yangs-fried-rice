# Ordering flow: backend handoff

For the backend and database developers (and any AI assistant reading this
repo on their behalf). Written by the frontend developer, last updated
2026-09-06. Read `docs/reference/frontend-integration.md` first if you
haven't — this file assumes its conventions and doesn't repeat them.

**This document is started early, on purpose, and grows as more of the
ordering flow ships.** The full plan (`.scratch/ordering-flow/issues/
08-backend-handoff.md`) originally waited until checkout and cancellation
were built too, but the two writes below are ready now and there's no reason
to sit on them — Yuan can't implement server-side work himself, so this
exists so the two of you know exactly what to build without waiting on the
rest of the flow. Checkout and cancel-order sections will be appended once
those tickets land.

**Which of you this is for:** GitHub issue **#5 (US-03: Menu Browsing &
Checkout)** is assigned to **LleytonFlores** and covers exactly this ground —
adding/removing cart items, delivery fee calculation, delivery/pickup
selection. Both writes below belong there. Issue **#7 (US-06: Advanced Cart
Modifications)** is Yuan's own issue (paired with yncyng on QA), tracking the
*frontend* side of cart modification and order cancellation — its
acceptance criteria close as the corresponding frontend tickets ship, not as
a backend task.

---

## 1. What already works — don't rebuild it

- **The menu's search and category filtering** (`GET /api/menu/products`,
  `GET /api/menu/categories`) — already built server-side, already wired to
  the real screen. Nothing needed here.
- **Every screen reads live data.** Products, categories, and the
  customer's real cart rows (`lib/cart/read-cart.ts`) all come from the
  database. The cart reads empty for every customer today, and that's
  correct — see §2.

## 2. The two writes that unlock the cart

Both are stubbed with a toast reading roughly "isn't available yet. We're
still building it." and write nothing today.

### Add to cart

**Where:** `components/menu/item-detail-modal.tsx`, the "Add to cart"
button (desktop and mobile).

**What the frontend already has when this fires:** a `product_id` (the row
the modal was opened from), a `quantity` between 1 and 20 inclusive
(clamped client-side — see §4), and a `special_instructions` string that may
be empty.

**What it needs to do:**
1. Find the signed-in customer's `cart` row, or create one if none exists —
   `cart` is keyed by `customer_id`, one per customer, and nothing creates
   this row today. `lib/cart/read-cart.ts` already assumes a customer has at
   most one cart; please keep that invariant rather than allowing more than
   one per customer.
2. Insert a `cart_item` row: `cart_id`, `product_id`, `quantity`,
   `special_instructions`. All four columns already exist — no migration
   needed for this one.
3. If the customer already has this exact `product_id` in their cart, your
   call whether that merges quantities into the existing row or adds a
   second line — the frontend has no opinion and doesn't currently guard
   against duplicates.

**On success, from the customer's point of view:** the modal is already
closing (that part's wired). The cart rail (desktop) or the `/cart` page
(mobile) should show the new line the next time either reads — see §5 for
what "next time" currently means.

### Adjust quantity / remove a line

**Where:** `components/cart/cart-line-row.tsx`, the −/+ buttons and the
Remove control on each cart line.

**What it needs to do:**
- `−` / `+`: `UPDATE cart_item.quantity` for that `cart_item_id`. The
  frontend's own stepper never goes below 1 — decreasing to 0 is not a path
  the UI offers, Remove is the separate, explicit control for deleting a
  line. Please enforce the same 1–20 range server-side (see §4) rather than
  trusting the client.
- **Remove**: `DELETE` the `cart_item` row for that `cart_item_id`.

**On success:** the line updates or disappears from the cart the next time
it's read — again, see §5.

## 3. What's missing or uncertain

- **Where the delivery fee comes from.** The frontend computes it from a
  flat ₱95 constant (`lib/menu/cart-totals.ts`). Nothing says whether that's
  fixed, per-branch, or distance-derived. Not blocking — just don't be
  surprised the frontend isn't asking you for a fee value anywhere yet.
- **No live subscription on `cart` or `cart_item` from the frontend side
  today.** The menu screen subscribes to `product` and `categories` changes
  (Realtime) so edits appear without a refresh; the cart does not have the
  same treatment yet. That means once either write above is live, a
  customer won't see their cart update until the page next reads it (a
  navigation, or a manual refresh) — this is a frontend gap to close, not
  something either of your writes needs to account for, but worth knowing
  so a demo doesn't look broken when the cart doesn't update instantly.

## 4. Decisions already made that constrain your side

- **The money math is entirely client-side and already correct.**
  `lib/menu/cart-totals.ts` computes subtotal, delivery fee and total from
  the raw cart lines (`product_price × quantity`, summed in integer
  centavos so it can't drift) every time it renders. Neither write above
  needs to return or store a computed total — the frontend never reads one
  from the database.
- **Quantity is clamped to 1–20 client-side** (`lib/menu/quantity.ts`) — a
  number picked by the frontend, not derived from any requirement. Please
  enforce the same bound server-side; a client is not a trust boundary, and
  nothing stops a request skipping the UI entirely.
- **A cart is one row per customer.** See §2's "Add to cart" — the frontend
  reads assuming this, so a design that allows more than one active cart per
  customer would need the read side updated too, not just the write.

## 5. Columns already there — no migration needed for either write

Both writes in §2 use only columns that already exist:
`cart.customer_id`, `cart_item.cart_id`, `cart_item.product_id`,
`cart_item.quantity`, `cart_item.special_instructions`. This section is
short on purpose — unlike the profile handoff, nothing here is waiting on a
schema change.

## 6. Order tracking (ticket 06) — what the screen needs from you

The tracking screen at `/orders/[orderId]` is built and reads real data:
`order`, `delivery`, `rider`, `employee` and `customer_address`, plus a
Realtime subscription on the `order` and `delivery` rows. It takes no writes
of its own — cancelling is ticket 07 and is stubbed there.

It resolves the four stages through one module,
`lib/orders/order-stage.ts`, and nothing else on the screen reads a raw
status string. If any of the notes below change, that file is the only one
that needs editing.

### 6a. The status vocabulary — please confirm or correct

Four vocabularies are written down and none agree. The adapter accepts all
of them, but it should not have to:

| Source | Values |
| --- | --- |
| `lib/validation/orders.ts` (what the back office writes today) | `received`, `preparing`, `out_for_delivery`, `completed`, `cancelled` |
| `supabase/schema.sql` | `pending_confirmation`, `confirmed`, `cancelled` |
| `docs/reference/storage_draft.md` | `Pending`, `Confirmed`, `Preparing`, `Completed` |
| the live database | nullable free text, no constraint |

**The frontend's proposal is the first row** — it is the only one any code
actually writes. Taking it as the real vocabulary and constraining the
column would make the other three moot. Proposing it is fair; writing the
migration is yours.

**One value we could not confirm:** which `delivery.delivery_status` string
means "on its way". `lib/actions/delivery.ts` writes `delivered` on
completion, and nothing writes an in-flight value anywhere. The adapter
accepts `out_for_delivery`, `in_transit`, `picked_up` and `on_the_way`; if
it is none of those, the screen will sit on "Preparing in kitchen" until the
delivery completes.

### 6b. Columns the screen wants and cannot find

- **`order.order_number`** — a short, human-facing reference. `order_id` is
  a UUID and the design draws "#1042", a four-digit sequence a UUID cannot
  produce. The screen currently shows the last four characters of the id,
  which is stable and unique but is not what a customer reads out on the
  phone.
- **An address on the order itself.** `order` has no address column, so the
  destination is read from the customer's *current* default address. That is
  wrong the moment they change it: a delivered order would retroactively
  claim it went somewhere it did not.
- **The rider's distance from the customer.** The desktop frame captions the
  map "Rider Ariel S. · 2.4 km away". The name is real — it comes from the
  delivery's rider, via `rider.employee_id` → `employee.name` — but no
  distance is stored anywhere, so the screen omits that half rather than
  inventing it. This is tied up with issue #10 (US-07, real-time ETA) and is
  not needed for ticket 06 to be correct.
- **An arrival window.** `delivery.estimated_time` is a single value and the
  design shows a range ("35–45 min"). The screen renders whatever the column
  holds, and says "Arrival time to be confirmed" when it is NULL.

**Per-stage timestamps are NOT needed** — worth stating because it looks
like they would be. The frames draw the literal words "Done", "Now" and an
em dash under each stage, not clock values, so the screen needs no
`preparing_at` or `out_for_delivery_at` column. If the PM later wants real
times there, those columns would have to be added.

### 6c. Realtime must be enabled on both tables

The screen subscribes to `order` and to `delivery`, filtered to the one
order. Stages 1–2 come from `order` and 3–4 from `delivery`, so **both**
tables need Realtime turned on in Supabase — with only one enabled the
screen visibly sticks halfway through the journey.

This split is not incidental: `lib/actions/delivery.ts` says marking a
delivery delivered "deliberately does NOT touch order.order_status — that
field is shared." The screen takes whichever of the two rows is further
along, so that behaviour is fine and needs no change.

## 7. Cancel an order (ticket 07) — the one write on the tracking screen

**Where:** `components/orders/cancel-order-control.tsx`, the "Yes, cancel
order" button inside the confirmation. Pressing it closes the confirmation
and raises the not-implemented toast; it writes nothing.

**What the frontend has when this fires:** the `order_id` from the URL
(`/orders/[orderId]`), and the fact that the screen considered the order
cancellable at that moment. Nothing else — there is no reason field in the
design, so the customer gives no reason.

**What it needs to do:**
1. Set `order.order_status` to whatever your vocabulary's cancelled value is
   — see §6a, which is still open. The screen already treats a status
   containing "cancel" as cancelled, so any spelling of it works today.
2. Set `order.cancelled_at` to now.
3. Set `order.cancelled_by` to the customer who did it. The column is a
   `String?` in `storage_draft.md`, so please say whether it holds a customer
   id, an employee id, or a role word — the frontend does not write it and
   does not read it, but a rider- or staff-initiated cancellation later will
   need the same column to mean something consistent.

**The condition you must enforce server-side.** Cancel only if the kitchen
has not confirmed the order. The frontend hides the control once the order
reaches Preparing, but that check is a courtesy: the customer can have the
confirmation open at the exact moment the kitchen confirms, and only the
server can settle that race. **Reject the cancellation if `order_status` has
moved past the received stage**, and treat a rejection as an ordinary
outcome, not an error — a message the screen can show is enough.

**On success, from the customer's point of view:** nothing else is needed.
The tracking screen is subscribed to the `order` row (§6c), so the status
change arrives on its own — the timeline empties, the headline changes, and
the Cancel order control is replaced by the note. No redirect, no refetch,
no success screen.

**One correction to the ticket.** `.scratch/ordering-flow/issues/07-cancel-order.md`
names a `cancellation_reason` column. There is no such column in
`storage_draft.md` — it has `cancelled_at` and `cancelled_by` — and the design
never asks the customer for a reason, so nothing needs adding.

**Not in scope here:** cancelling on the staff or rider side, refunds, and
notifying the kitchen. Those belong to their own tickets and none of them
have a customer-facing frame yet.
