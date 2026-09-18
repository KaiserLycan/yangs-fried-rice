# Ordering flow: backend handoff

For the backend and database developers (and any AI assistant reading this
repo on their behalf). Written by the frontend developer, last updated
2026-09-16. Read `docs/reference/frontend-integration.md` first if you
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

> **Status 2026-09-16 — shipped and wired.** The backend delivered all of
> these in PR #68 as server actions in `lib/actions/cart.ts` (`addCartItem`,
> `updateCartItem`, `removeCartItem`, `submitCart`), and the frontend now
> calls them from the three components named below (GitHub #7, ticket 14).
> The sections that follow are kept as the record of what was asked for.
> Two things from the ask are **not** in what shipped:
>
> 1. **`submitCart` does not record the payment method.** Its input is
>    `cart_id`, `order_type`, `special_instructions`, `delivery_fee` — no
>    `payment_method`, and no `transaction` row is written. The checkout
>    screen still lets the customer pick one, and that choice is dropped on
>    the floor. Step 3 under "Place order" below is still open; it belongs
>    with GitHub #61 (payment processing).
> 2. **`order_type` vocabulary.** The backend settled on
>    `dine_in | take_out | delivery`. The frontend translates its "pickup" to
>    `take_out` in `lib/checkout/fulfilment-param.ts` — answered, no action.
>
> Also worth knowing: `submitCart` flips `cart.is_final` and the next add
> creates a fresh cart, so any cart read must filter `is_final = false`.
> `lib/cart/read-cart.ts` does now.
>
> 3. **One request for the DB side:** nothing stops a customer having two
>    active carts — `getActiveCart` checks then inserts with no lock, and
>    there is no unique index. Two tabs adding at once would create two.
>    A partial unique index, `cart (customer_id) where is_final = false`,
>    closes it. The frontend reads the newest one in the meantime.

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
  inventing it. `getOrderEtaAction` (PR #69) returns a `distanceKm`, but
  that is store → customer, not rider → customer, so it is not this number.
- **An arrival window — wired (issue #10).** The header now shows
  `arrivalWindow` from `getOrderEtaAction` in `lib/actions/eta.ts`, read on
  page load and re-asked on every Realtime status event. It does **not** read
  `delivery.estimated_time` — that column is a timestamp the action writes as
  a side effect, and the design shows a range. "None" (cancelled or
  completed) and a failed call both render as "Arrival time to be
  confirmed". Note the action writes that column on every tracking page
  load; fine for now, flagging in case it shows up in query logs.
- **Checkout still prints a constant.** "Estimated arrival 35–45 min" on
  `/checkout` and the order-placed screen is still `ARRIVAL_ESTIMATE` in
  `lib/checkout/arrival-estimate.ts`. `getOrderEtaAction` needs an
  `order_id`, and at checkout there is no order yet. To make that estimate
  real, the frontend needs a variant that takes an order type and the
  customer's address (or coordinates) instead of an order — roughly
  `calculateOrderEta` in `lib/eta/engine.ts` with the queue count and
  geocoding done server-side. Not blocking; the copy is honest about being
  an estimate.

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

> **Status 2026-09-17 — shipped and wired.** The backend delivered
> `cancelCustomerOrder` in `lib/actions/cart.ts` (PR #68, via the
> `cancel_customer_order` RPC with a client fallback) and the frontend now
> calls it from `components/orders/cancel-order-control.tsx` (GitHub #7,
> ticket 15). The section below is kept as the record of what was asked
> for. Three things worth knowing:
>
> 1. **The action cancels only `order_status = 'pending'`.** The frontend
>    now offers Cancel order only for exactly that status, not for the whole
>    "Order received" stage — the back office's `received` means staff have
>    accepted, and the button would otherwise show and then fail. The same
>    goes for schema.sql's `pending_confirmation`: if that ever lands in a
>    row, the customer sees no button. `lib/orders/order-stage.ts` holds the
>    rule.
> 2. **It writes `cancellation_reason`, not `cancelled_by`.** The correction
>    at the end of this section went the other way from what shipped: the
>    column exists and the action defaults it. The frontend passes no reason.
>    Nothing sets `cancelled_by`, so a later staff- or rider-side cancel will
>    still need to settle what that column holds.
> 3. **Example orders can't be cancelled.** The tracking fixture's id is
>    whatever the URL says, so `/orders/1042` is not a UUID and the write
>    returns a raw database error. Test on an order placed from `/checkout`.

**Where:** `components/orders/cancel-order-control.tsx`, the "Yes, cancel
order" button inside the confirmation.

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

## 8. Reorder a past order (ticket 11) — build a cart from an old order

**Where:** `components/orders/past-order-card.tsx`, the "Reorder" action on
each card of `/orders`. Pressing it raises the not-implemented toast and
writes nothing.

**What the frontend has when this fires:** the `order_id` of the past order,
and the signed-in customer. Nothing else — there is no quantity editor or
item picker on the card, so the customer is asking for "that order again",
not for a modified version of it.

**What it needs to do:**
1. Read the past order's `order_item` rows.
2. Put the equivalent lines in the customer's current cart, using the same
   write §2's "Add to cart" describes. One call that does the whole order is
   better than the frontend looping — the customer pressed one button and a
   half-built cart after a partial failure is worse than no cart.
3. Carry `order_item.special_instructions` across. It is the customer's own
   note and dropping it silently changes their order.

**Two things only you can decide, and the answer changes the UI:**

- **A product that is no longer available.** `product.is_available` can be
  false, and a product row can be gone entirely — the frontend already renders
  "Item no longer on the menu" for a missing one. Say whether reorder should
  skip those lines and report which, or refuse the whole reorder. The frontend
  needs to tell the customer either way.
- **Price changes.** `order_item.subtotal` is what the customer paid then, not
  what the item costs now. Reorder should price at today's `product_price` —
  please confirm, because the alternative honours a stale price.

**On success, from the customer's point of view:** the cart holds the lines
and they are taken to `/cart` to look at it before committing. Reordering must
not place an order on its own — that would turn one press into a purchase.

**Not in scope here:** reordering a cancelled order is the same operation, and
nothing special needs to happen for it. The frontend offers it, because
nothing about a cancellation makes the food less orderable.

## 9. Rate a past order (ticket 12) — OHF2

> **Status 2026-09-17 — shipped and wired.** The backend delivered
> `submitReview` in `lib/actions/customer-orders.ts` (PR #66, via the
> `submit_order_review` RPC) and the frontend now calls it from
> `components/orders/order-rating.tsx` (GitHub #8). The section below is kept
> as the record of what was asked for. Two things worth knowing:
>
> 1. **The RPC only accepts `order_status = 'completed'`.** The frontend shows
>    the stars whenever `lib/orders/order-stage.ts` resolves the order to
>    `delivered`, which also covers a delivery row marked delivered while the
>    order row still says otherwise. In that case the press fails and the
>    RPC's message shows in a toast. Whichever side writes `completed` on
>    delivery closes the gap; the backend rule is the one that holds.
> 2. **Example orders can't be rated.** The `/orders` fixture uses ids like
>    `example-1039`, which are not UUIDs, so rating one shows a raw database
>    error. See `preview-scenarios.md`.

**Where:** `components/orders/order-rating.tsx`, the row of stars on an
unrated order in `/orders`.

**What the frontend has when this fires:** the `order_id`, the signed-in
customer, and an integer score from 1 to 5. No comment — `review.comment`
exists in the schema and no frame asks for one, so nothing collects it.

**What it needs to do:**
1. Insert a `review` row with `order_id`, `customer_id`, `rating` and
   `created_at`. Every one of those columns already exists — no migration.
2. Leave `comment` null.

**The conditions you must enforce server-side:**

- **One review per order per customer.** The frontend shows the stars only
  while `review.rating` is null for that order and turns the row read-only
  afterwards, but that check is a courtesy; a unique constraint on
  `(order_id, customer_id)` is what actually holds it.
- **Only the customer who placed the order may review it**, and only once the
  order is finished. A rating on an order still in the kitchen is not
  something the screen can produce, but the endpoint should not accept it.

**Good news on the schema, and a correction worth propagating.** `CLAUDE.md`
warns that reviews are attached to an *item* while requirement OHF2 attaches
them to an *order*. That is true of `supabase/schema.sql` and **not** of the
live database: `types/database.types.ts` shows `review` carrying `order_id`,
which is what OHF2 asks for. The requirement and the database already agree —
it is only the checked-in SQL file that is stale. Worth fixing there so nobody
builds against it.

**On success, from the customer's point of view:** the stars fill and stop
being pressable, and the card's action becomes Reorder. No toast, no redirect.

## 10. Online payment (GitHub #9) — PP1, wired 2026-09-18

> **Status — wired for GCash / Maya.** The frontend now calls
> `create-payment-intent` (PR #79) after `submitCart`, attaches a `gcash` or
> `paymaya` payment method in the browser with the public key, and sends the
> customer to the wallet's page. The receipt at `/checkout/confirmation`
> reads `transaction.payment_status` (the existing
> `customer_select_own_transactions` policy allows it) and watches it
> settle. Nothing below blocks that; these are the gaps the frontend can
> see but cannot close.

**Where:** `lib/checkout/paymongo.ts` (the three calls),
`components/checkout/order-summary-card.tsx` (Place order),
`components/checkout/payment-status-card.tsx` (the receipt).

**What the frontend needs from you:**

1. **The PayMongo public key.** `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` in
   `.env.local` and in Vercel. Without it "Place order" on a wallet order
   still creates the order, then toasts "Online payment isn't set up on this
   site yet" and lands on the receipt with a Pay now button.
2. **Realtime on `transaction`.** The receipt subscribes to
   `postgres_changes` on `transaction` filtered by `order_id`. If the table
   is not in the `supabase_realtime` publication the screen still works —
   it re-reads every 4 s while pending and on tab focus — but the paid
   state arrives later than it could.

**Gaps in what shipped, for whoever owns them:**

- **Card is not offered.** Payment Intents need card number, expiry and CVC
  collected in our page, and no frame draws that form. "Credit / debit
  card" is still selectable and toasts that it is not available yet. If a
  hosted page is preferred over a card form, PayMongo Checkout Sessions
  would need a new edge function.
- **Cash on delivery / Pay in store are still not recorded.** `submitCart`
  takes no `payment_method` and writes no `transaction` row, so those
  receipts read "Not recorded". Same ask as §2 "Place order" step 3.
- **`transaction.payment_method` says `paymongo`, not which wallet.** The
  receipt shows "GCash / Maya wallet" for it. Storing `gcash` / `paymaya`
  would let it say which.
- **A paid order's `order_status` does not change.** The webhook flips
  `transaction.payment_status` only. Whether payment should move the order
  into the kitchen queue automatically is a backend decision; today it sits
  wherever `submitCart` left it.
- **A retry after `failed` inserts a second `transaction` row** rather than
  reusing the failed one (`create-payment-intent` only reuses `pending`).
  The frontend folds all rows for the order, so this is cosmetic — but
  anything that reports on `transaction` should expect more than one row per
  order.
- **Two open intents can orphan a payment.** `create-payment-intent`
  overwrites the pending row's `provider_reference_id` with the newest
  intent, and the webhook matches on that id first. A customer who leaves
  the GCash tab open, presses "Pay now" on the receipt (a second intent),
  then pays on the *first* tab has paid against an id no row carries any
  more — money taken, row still `pending`. Two fixes on your side: fall back
  to `metadata.order_id` when the intent id matches nothing, and/or refuse a
  new intent while one is still open at PayMongo. The frontend cannot tell
  an abandoned wallet page from one still open, so it has to offer "Pay now"
  on a pending row.
- **`?pay=` on the receipt is taken on trust.** Because cash orders record
  nothing (previous bullet), a cash order opened with `?pay=gcash` typed
  into the URL is offered "Pay now", and `create-payment-intent` will accept
  it. Recording the method at `submitCart` is what lets both sides refuse.
