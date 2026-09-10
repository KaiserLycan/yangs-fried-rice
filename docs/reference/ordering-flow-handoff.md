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

### Place order

**Where:** `components/checkout/order-summary-card.tsx`, the
"Place order · ₱545" button on `/checkout` (both breakpoints).

**What the frontend already has when this fires:** the signed-in customer,
their cart lines (`cart_item_id`, `product_id` via the join, `quantity`,
`special_instructions`), the fulfilment type (`"delivery"` or `"pickup"`),
the selected payment method (one of `card`, `wallet`, `cash-on-delivery`,
`pay-in-store`), and the computed total. It does **not** have an order id,
an order status, or a placement timestamp — none of those exist until you
create them.

**What it needs to do:**
1. Create the order from the customer's current cart — header row plus one
   line per `cart_item`, carrying quantity, unit price at time of order, and
   `special_instructions`.
2. Record the fulfilment type on `order.order_type`, which already exists —
   please confirm that column is what it sounds like, and tell us the exact
   two values you expect. The frontend calls them `"delivery"` and
   `"pickup"`; if your column uses different strings, say so and the frontend
   will send yours. No migration needed for this, but see §3 for the gap that
   remains on the *cart* side.
3. Record the payment method on `transaction.payment_method`, which already
   exists. `payment_status` should reflect that nothing has been charged —
   this screen selects a method and takes no money.
4. Empty or close the customer's cart, so the next read doesn't offer the
   same lines again.

**On success, from the customer's point of view:** they should land on the
confirmation screen (`/checkout/confirmation`, not built yet) with the
order's own id, and the cart should read empty afterwards.

**Not in scope for this write:** taking payment. No card details are
collected anywhere on the screen, and no processor is integrated. The
payment method is a stated intention, nothing more.

## 3. What's missing or uncertain

- **The cart cannot store Delivery versus Pickup.** `order.order_type` covers
  it once an order exists, so placing an order is *not* blocked — but neither
  `cart` nor `cart_item` has anywhere to hold the choice while the customer is
  still shopping. The frontend works around this by carrying it in the URL
  between the cart and checkout (`/checkout?fulfilment=pickup`), which is
  fine for browsing but means the choice is lost if a customer closes the tab
  and comes back. Not blocking; worth a column on `cart` if you'd rather it
  survived. Also please confirm what `order.order_type` actually holds and
  which two strings you expect — the frontend uses `"delivery"` and
  `"pickup"`.
- **Nothing computes an arrival estimate.** Both checkout frames print
  "Estimated arrival 35–45 min based on current kitchen queue and delivery
  distance." There is no kitchen queue to read and no distance calculation,
  so that range is the designer's copy rendered as a constant, not a number
  the frontend worked out. If a real estimate is wanted, it needs a source —
  this is worth raising with the PM as well, since the copy currently claims
  an input the system does not have.
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
