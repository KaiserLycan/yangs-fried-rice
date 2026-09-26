# Limitations — gaps we can close in 1.5 days

These are the gaps from the research ([`lacking.md`](lacking.md)) that are small enough for
1.5 days. P0 and P1 together are about **15 working hours**. Each one was checked against the code, not guessed.
Everything too big for 1.5 days stays in `lacking.md`.

Priority: **P1** = do first (legal, security or a real bug). **P2** = do if time allows.

| # | Gap | Priority | Estimate |
|---|---|---|---|
| 1 | Store hours are only checked in the browser | P1 | 0.5 h |
| 2 | Cart is not re-checked at checkout (sold-out items, price changes) | P1 | 1 h |
| 3 | Unpaid GCash/Maya orders never expire | P1 | 1 h |
| 4 | No Senior Citizen / PWD discount | P1 | 3–4 h |
| 5 | No security headers | P1 | 1 h |
| 6 | No minimum order amount | P1 | 0.5 h |
| 26 | ~~Live database is missing 5 migrations; RLS is off on `employee`~~ | ✅ **Done in #114** | — |
| 27 | Pay-in-store sales never marked paid; payment values in 5 spellings | P1 | 1 h |
| 28 | ~~Disabled accounts stay signed in; senior/PWD ID photos are public~~ | ✅ **Done in #114** | — |
| 29 | Terms promise card payments and refunds that don't exist; map credits hidden | P1 | 1 h |
| 30 | Orders page can't filter by date, customer, payment or type | P2 (high) | 2 h |
| 31 | Customer list has no order totals or order history; loads every customer | P2 | 2 h |
| 32 | Reports have no breakdowns and no CSV | P2 | 2.5 h |
| 33 | No error pages; `received` status is unreachable; real types live in "mock" files | P2 | 1 h |
| 21 | ~~Customers can write orders straight into the database~~ | ✅ **Done in #114** | — |
| 15 | ~~Placing an order is not atomic (double orders, half-saved orders)~~ | ✅ **Done in #114** | — |
| 16 | A customer can delete their account before picking up | P1 | 0.5 h |
| 7 | No "pause store" / busy mode | P2 | 1.5 h |
| 8 | No "change for ₱___" on cash payments | P2 | 1 h |
| 9 | No order status history (who changed what, when) | P2 | 1.5 h |
| 10 | Notifications table exists but nothing writes to it | P2 | 2 h |
| 11 | (Removed - Delivery disabled) | | |
| 12 | No printable receipt | P2 | 1 h |
| 13 | No separate privacy notice or business details | **P1** (raised: the Internet Transactions Act has been enforced since June 2025) | 0.5 h |
| 14 | No "Best seller" labels on the menu | P2 | 1 h |
| 17 | KDS has no late-order warning or new-order sound | P2 | 1 h |
| 18 | Nothing stops repeat pickup no-shows | P2 | 1 h |
| 19 | No end-of-day cash summary at the counter | P2 | 1.5 h |
| 20 | No "Order again" row on the menu | P2 | 1 h |
| 22 | Nothing happens when staff don't accept an order | P2 (do first in P2) | 1 h |
| 23 | Add-ons can't be changed from the cart | P2 | 1.5 h |
| 24 | No way to report a missing or wrong item | P2 | 2 h |
| 25 | No accessibility check has been done | P2 | 1 h |

P0 + P1 total: about 15 h. P2 total: about 26 h. That is more than 1.5 days, so do all of P1, then pick P2 items in order.

**Progress (27 Sep 2026):** issue #114 closed items 15, 21, 26 and 28, and made the shop pickup-only: the `rider` and `delivery` tables are dropped (archived in a private `archive` schema) and there is no rider role. Items still written in delivery terms below should be read as pickup.

Items 15–20 came from the second round of research (GitHub projects, Baymard UX research, OWASP, Philippine news).
Item 21 came from the persona walkthroughs in [`user-simulation.md`](user-simulation.md). Items 22–25, and the additions
to 7, 10, 13 and 18, came from the third round (UX case studies, ordering-platform help centers, app-store reviews,
Philippine news and social media reports); see [`lacking.md`](lacking.md#round-3--web-articles-app-reviews-and-social-media).

---

## P1 — do first

### 1. Store hours are only checked in the browser
- **Now:** `isRestaurantOpen()` (`lib/store-hours.ts`) is only called by `menu-screen.tsx`
  and `cart-totals-summary.tsx`. `submitCart` in `lib/actions/cart.ts` never checks it,
  so anyone can call the server action directly and place an order at 3 AM.
- **Fix:** call `isRestaurantOpen()` at the top of `submitCart` and return
  `"We're closed right now. We open at 8:00 AM."`. Also add a closing cut-off
  (for example, no new orders after 5:30 PM) so the kitchen isn't handed an order it can't finish.
- **Also:** the check always returns `true` in development. Add an env flag
  (`FORCE_STORE_OPEN`) instead, so the closed state can be demoed.

### 2. Cart is not re-checked at checkout
- **Now:** `addCartItem` refuses sold-out items, but the fallback path in `submitCart`
  does not check `is_available` again. If staff mark an item sold out after it was added,
  the order still goes through. The same goes for a price change while the item sits in the cart.
- **Fix:** in `submitCart`, re-read each line's `is_available` and price. If anything changed,
  stop and tell the customer: "Garlic Rice is sold out and was removed. Beef price changed to ₱129."
- **Real-world case:** Jollibee, GrabFood and foodpanda all refuse or warn at checkout when an item runs out mid-session.
- **Also:** the stepper stops at 20 (`MAX_QUANTITY` in `lib/menu/quantity.ts`), but the server allows 99
  (`lib/validation/cart.ts`). Make the server use `MAX_QUANTITY` so a direct API call can't order 99.

### 3. Unpaid GCash/Maya orders never expire
- **Now:** orders sit in `awaiting_payment` or `payment_failed` forever. Nothing cleans them up.
- **Fix:** `pg_cron` is already installed (`000_remote_schema.sql`). Add a job that runs every
  5 minutes and cancels wallet orders still unpaid after 30 minutes, with the reason
  "Payment not completed in time". Add a migration for it.

### 4. No Senior Citizen / PWD discount
- **Why it matters:** this is required by law, not an extra. RA 9994 (seniors) and RA 10754 (PWD)
  give a 20% discount plus VAT exemption on food, and the 2022 DTI/DSWD/DOH joint memorandum circular
  extends it to online orders. Mang Inasal and Jollibee both ask for the ID number and an ID photo at checkout.
- **Now:** `transaction` already has `discount_amount`, `discount_type` and `discount_id_number`
  (`lib/validation/transaction.ts`), but `submitCart` always writes `discount_amount: 0`
  and no screen asks for them.
- **Fix:**
  1. Checkout: a "Senior Citizen / PWD" option with ID number, name on the ID and an ID photo
     (reuse the proof-of-delivery upload, 2MB limit).
  2. Server computes it. Take the item total, remove the 12% VAT (divide by 1.12), then take 20% off.
     For simplicity, apply it to one person's share: the item total divided by party size, or the single most expensive meal.
  3. Staff see a "Verify ID" badge on the order. Staff check the ID on handover to the customer or their 3rd party courier (Lalamove).
  4. Delete the ID photo after the order is done, like Jollibee does (Data Privacy Act).

### 5. No security headers
- **Now:** `next.config.mjs` sets no headers. The site can be put in an iframe (clickjacking) and has no CSP.
- **Fix:** add `async headers()` in `next.config.mjs` with `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(self), geolocation=(self)`, `Strict-Transport-Security`, and a
  basic `Content-Security-Policy` that allows Supabase, PayMongo, LocationIQ and the map tile hosts.
  Check the map, image uploads and PayMongo redirect still work afterwards.

### 6. No minimum order or cash-on-delivery cap
- **Now:** a ₱15 order is allowed, and so is a ₱20,000 cash order. The second is
  a common prank or fraud pattern: staff cook food nobody pays for.
- **Fix:** in `submitCart`, refuse orders under ₱150
  (placeholders next to the fee constants in `lib/eta/engine.ts`). Show the rule in the cart before the customer reaches checkout.

### 15. Placing an order is not atomic
- **Now:** `submitCart` first tries the `submit_cart_to_order` database function, but that function
  isn't in any migration, so every order goes through the fallback path. That path checks
  `cart.is_final`, inserts the order, inserts the items, and only **then** marks the cart final.
  Clicking "Place order" twice fast, or placing it from two tabs, makes two orders from one cart.
  If one of the item inserts fails halfway, an order is left with no items.
- **Fix:** write `submit_cart_to_order` as a migration. It should run in one transaction and lock the
  cart first (`SELECT … FOR UPDATE`, stop if `is_final`), then check availability and prices, insert
  everything, and mark the cart final. Also add a unique index on `order.cart_id` as a backstop.
- **✅ Done in #114:** `supabase/migrations/20260927000001_atomic_checkout_and_order_write_lockdown.sql`. The function
  refuses unavailable items and prices every line from the menu; `submitCart` calls it with no fallback. Price-change
  and sold-out *messages* in the cart UI are still #115 (item 2).
- **Why:** OWASP's business-logic guidance lists this "check, then act" race as a classic checkout bug.
  The Next.js + Supabase restaurant project on GitHub (crizt0495/restaurant) uses a single
  `create_order_atomic` database function for the same reason.

### 21. Customers can write orders straight into the database
- **Now:** the database rule `customer_insert_own_orders` on `"order"` (`000_remote_schema.sql:520`) only checks
  `customer_id = auth.uid()`. `customer_insert_own_order_items` on `order_item` only checks that the order is theirs.
  The Supabase URL and anon key are public by design, and the customer's login token is in their browser. So a customer
  can skip the app and call the Supabase REST API directly to create an order that is already `preparing`, with ₱1 item prices. The kitchen queue would show it, because it only hides
  `awaiting_payment` and `payment_failed`. `order_add_on` and `order_item_add_on` have the same kind of insert rule.
- **Found by:** the QA and DBA walkthroughs in [`user-simulation.md`](user-simulation.md). Not yet tried against the live
  database. Confirm it with one request from a test customer before and after the fix.
- **Fix:** drop the customer insert rules on `order`, `order_item`, `order_add_on` and `order_item_add_on`, and create
  orders only through the server (the atomic `submit_cart_to_order` function from #15, or the service-role client).
  Also tighten `customer_cancel_own_orders` so the update can't change anything except the status and cancellation fields.
- **✅ Done in #114:** the four customer INSERT policies are dropped (confirmed live), and trigger
  `trg_guard_customer_order_update` refuses any customer change outside `order_status`, `cancelled_at`,
  `cancellation_reason`. `cart_item.quantity` is also bounded to 1–99 so a direct write can't produce a negative order.

### 16. A customer can delete their account before picking up
- **Now:** `deleteMyAccount` (`lib/actions/profile.ts`) detaches the customer from their orders and deletes
  the account without looking at order status. A customer might delete their account while their food is being prepared, leaving an uncollectable order.
- **Fix:** refuse deletion while any order is not `completed` or `cancelled`:
  "You have an order in progress. You can delete your account once it's done."

---

## P2 — if time allows

### 7. No "pause store" / busy mode
- GrabFood merchants can pause the store or switch to busy mode during rush hour or emergencies.
- **Fix:** a one-row `store_setting` table (`is_paused`, `paused_until`, `extra_prep_minutes`),
  a toggle on `/manage/dashboard`, a check in `submitCart`, and a banner on the menu.
  Feed `extra_prep_minutes` into `lib/eta/engine.ts`.
- **Add a kitchen capacity limit** (from Olo, Flipdish and ChowNow): a `max_active_orders` setting. When the kitchen already has
  that many orders in `received` or `preparing`, switch to busy mode automatically and show the longer wait before payment,
  instead of taking orders the kitchen can't finish on time.
- **Move store hours into the same table.** Hours are hardcoded in `lib/store-hours.ts`, so a manager can't change them for
  a holiday or a longer day without a developer.

### 8. No "change for ₱___" on cash payments
- Riders need to know how much change to bring. Without it, the rider either carries a lot of cash or the customer waits while they find change.
- **Fix:** an optional amount field when cash on delivery is picked (it must be at least the total).
  Store it on the order or transaction and show "Bring ₱X change" on the rider's delivery screen.

### 9. No order status history
- **Now:** only the current `status` is stored, so nobody can tell who cancelled an order or how long it sat in `preparing`.
- **Fix:** an `order_status_log` table (order_id, from, to, changed_by, reason, at) filled by a trigger.
  Show the real times on the customer timeline (`components/orders/order-timeline.tsx`).
  It also makes prep-time reports possible.

### 10. Notifications table exists but nothing writes to it
- **Now:** `/api/customer/notifications` can list, mark read and delete, but no code ever inserts a row.
- **Fix:** a trigger on `order` status change that inserts a message ("Your order #69403b15 is out for delivery"),
  plus a bell with an unread count in the nav bar (Supabase realtime is already set up).
- **Pickup orders need this most.** A pickup customer only learns the order is ready if the tracking page is open. Send
  "Your order is ready for pickup" and show where to go ("Counter 1, say your order number"), as pickup-ordering guides recommend.

### 11. (Removed)

### 12. No printable receipt
- Add a "Print / Save as PDF" button on the order details page with a print stylesheet listing items, add-ons, fee,
  discount, payment method and order number. Label it "This is not an official receipt".

### 13. No separate privacy notice or business details
- The Data Privacy Act (RA 10173) and the Internet Transactions Act (RA 11967) expect a clear privacy notice and the
  seller's business name, address and contact details on the site.
- **Fix:** a `/privacy` page (what we collect, why, how long we keep it, how to ask for deletion) and the business details
  in `site-footer.tsx` from `lib/site/site-info.ts`.
- **Now P1:** DTI began full enforcement of the Internet Transactions Act on 20 June 2025. Online merchants must show prices,
  descriptions **and the seller's contact details**. Today the footer hides contact details because none are set.

### 14. No "Best seller" labels on the menu
- Every chain app shows best sellers. Count `order_item` over the last 30 days and tag the top 3 on the menu cards.

### 17. KDS has no late-order warning or new-order sound
- **Now:** the KDS card shows a timer, but it looks the same at 2 minutes and at 40. A new order arrives silently.
- **Fix:** turn the card amber past 15 minutes and red past 25 (thresholds next to the ETA constants).
  Play a short chime when a new order lands. Browsers block sound until the page is clicked once,
  so add an "Enable sound" button.
- **Seen in:** the GitHub KDS projects all have an elapsed timer with late-order warnings.

### 18. Nothing stops repeat pickup no-shows
- **Why:** fake and no-show cash orders are a known problem in the Philippines. Grab PH has looked at ways to protect
  riders from no-show customers, and a Senate bill targets fake orders and unjust cancellations.
- **Fix:** count a customer's cash-on-delivery orders that were cancelled after cooking started. After 2, hide
  cash on delivery for that account and show "Please pay with GCash or Maya for your next order."
  A manager can reset it on the customer page.
- **Also cap the first order.** Viral Philippine cases show fake COD orders worth ₱1,700–₱15,000 sent to strangers' addresses.
  A brand-new account's first cash-on-delivery order should have a lower cap (for example ₱1,000). Larger first orders pay by GCash or Maya.

### 19. No end-of-day cash summary at the counter
- **Now:** riders tick "cash collected", but nobody can see how much cash each rider should hand over at the end of the day.
- **Fix:** a "Cash to remit" table on the reports page: rider, number of cash orders, total collected, for a chosen day.
  It is a simple sum over completed cash-on-delivery orders.
- **Seen in:** the GitHub POS projects close each cashier shift with expected-versus-actual cash.

### 20. No "Order again" row on the menu
- **Why:** Baymard's food-delivery research found that sites made recent orders and popular items hard to find,
  which slows down repeat customers.
- **Now:** reorder only exists on the My Orders page.
- **Fix:** for signed-in customers, show their last 3 orders at the top of `/menu` with a one-tap "Order again"
  that reuses `reorderPastOrder`.

### 22. Nothing happens when staff don't accept an order
- **Why:** a recurring complaint in Mang Inasal app reviews is waiting almost an hour with no confirmation, then being
  cancelled. foodpanda lets customers cancel for free until the restaurant accepts.
- **Now:** a `pending` order waits forever. No alert for staff, no message for the customer, no timeout.
  No `pg_cron` job exists yet.
- **Fix:** on the Orders page and KDS, flash any order still `pending` after 5 minutes. On the tracking page, after 10 minutes
  show "The store hasn't confirmed yet. You can cancel for free." After 20 minutes, cancel it automatically with the
  reason "Store didn't confirm in time" (one `pg_cron` job, alongside the one in #3).

### 23. Add-ons can't be changed from the cart
- **Why:** Baymard's food-delivery testing found users abandon orders when they have to remove an item and customise it
  again just to change one option.
- **Now:** the cart shows add-ons as a list (`components/cart/cart-line-row.tsx:115`), and `updateCartItemSchema`
  (`lib/validation/cart.ts`) only accepts quantity and special instructions. To change an add-on, the customer deletes the line
  and starts over.
- **Fix:** an "Edit" link on each cart line that opens the existing item dialog pre-filled. Allow `add_on_ids` in
  `updateCartItemSchema` and replace the line's `cart_item_add_on` rows.

### 24. No way to report a missing or wrong item
- **Why:** missing and wrong items are the top food-delivery complaint. DoorDash, Uber Eats and foodpanda all have a
  "Report a problem" flow: pick the items, add a photo, choose a remedy. Philippine reviews complain most when there's no
  one to report to.
- **Now:** after an order is completed, the only thing a customer can do is rate it.
- **Fix:** a "Report a problem" button on completed orders for 24 hours. The customer ticks the affected items, picks
  "Missing", "Wrong" or "Damaged", and adds an optional photo (reuse the proof-of-delivery upload). Save it to an
  `order_issue` table and show open issues on the manager's Orders page. Refunds stay manual for now (see `lacking.md`).

### 25. No accessibility check has been done
- **Why:** food and beverage is the second most-sued industry for website accessibility in the US. The Philippines has no
  equivalent lawsuits, but the same failures lock out older and disabled customers, who are also the Senior/PWD customers in #4.
- **Already fine:** product photos have alt text (`alt={product.name}`) and the quantity buttons have labels.
- **Fix:** run Lighthouse's accessibility audit on the menu, cart, checkout and tracking pages, and fix what it flags. Common
  failures are light-grey text on white, touch targets under 44px, and errors not read out by screen readers. Also raise
  the 9–12px text found in [`user-simulation.md`](user-simulation.md) to at least 14px.

---

## Found by the security and finance walkthroughs (26 Sep 2026)

These were confirmed with **read-only** checks on the live Supabase project (`mnrrfhhqcmutiuljmalu`): the security advisor
and `SELECT` queries. Nothing was changed. Details and SQL are in [`user-simulation.md`](user-simulation.md), personas 13 and 14.

### 26. Live database is missing 5 migrations — RLS is off on `employee` (P0)
- **Now:** `supabase_migrations.schema_migrations` on the live project stops at `20260924000000`. The advisor reports
  **RLS disabled** on `employee` and `rider` (level ERROR), with 0 policies, and signed-in users have INSERT and UPDATE rights.
  A customer can insert an `employee` row for themselves with `role = 'MANAGER'` and open `/manage`, or change any employee's role.
  They can also **read and delete** every employee's and rider's email, birth date, phone and licence number, which is a
  Data Privacy Act security issue (persona 15, J1).
- **Fix:** run `npx supabase db push` (or apply the 5 files in `supabase/migrations/` from `20260925000000` onward in the SQL
  editor), then run the advisor again. `20260925000001_restore_employee_rider_rls.sql` is the one that closes this.
  Check for misuse with the "managers" query in persona 13 afterwards.
- **✅ Done in #114:** all migrations through `20260927000003` are applied and recorded under their file versions; RLS is on
  for `employee`, and the advisor reports no ERROR. `EXECUTE` on `handle_password_timestamp_update()` is revoked and every
  SECURITY DEFINER function pins `search_path`. Staff can no longer change their own role (trigger
  `trg_guard_employee_self_update`). Leaked-password protection could not be enabled: it needs the Supabase Pro plan.
- **Also, while there:** turn on leaked-password protection (Auth settings), and revoke `EXECUTE` on
  `handle_password_timestamp_update()` from `anon` and `authenticated`.

### 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1)
- **Now:** every transaction starts with `total_paid = 0` (`lib/actions/cart.ts:866`). Cash on delivery and wallet payments
  are updated later, but pay-in-store never is, so reports count those sales as ₱0. The live data also has `cash`,
  `cash_on_delivery`, `gcash`, `GCash` and `paymongo` as methods, and `paid`, `Paid`, `completed` as statuses.
- **Fix:** when staff complete a `take_out` order paid in store, set `payment_status = 'paid'` and `total_paid` to the order
  total (same pattern as `lib/actions/delivery.ts:616`). Clean up the spellings, then add CHECK constraints
  (queries in persona 14).

### 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1)
- **Now:** `is_account_disabled` is checked at login and in `lib/auth/api-guard.ts`, but not in the server-action guards or
  middleware, so a disabled user who is already signed in keeps working. `requireCustomer` also uses `getSession()`, which
  Supabase says not to trust on the server. Storage buckets are public, including `senior-pwd-ids`, which holds
  photos of customers' homes.
- **Fix:** check `is_account_disabled` in `requireCustomer`, `requireManageAccess`, `requireRole`, `requireEmployee` and
  `requireReportAccess`, and switch `requireCustomer` to `getUser()`. Make `senior-pwd-ids` private and show photos with
  `createSignedUrl` (valid for a few minutes). Keep the Senior/PWD ID photos from L4 in a private bucket from the start.
- **✅ Done in #114:** every guard (`requireCustomer`, `requireManageAccess`, `requireRole`, `requireEmployee`,
  `requireReportAccess`) checks `is_account_disabled`, and `requireCustomer` uses `getUser()`. `current_employee_role()`
  ignores disabled accounts, so the database refuses them too. Middleware signs a disabled user out and the login page
  says why. `senior-pwd-ids` is a private 2 MB image bucket with per-customer folders; `lib/storage/senior-pwd-ids.ts`
  signs URLs for at most 5 minutes. `proof-of-delivery` is now private. The upload UI and deleting photos after the
  order are part of #116 (item 4).

### 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1)
- **Found by:** the lawyer walkthrough (persona 15, J3 and J9).
- **Now:** `app/terms/page.tsx` says the shop accepts credit/debit cards (they're commented out) and that refunds follow the
  payment gateway's timelines (there's no refund process). It has no "last updated" date, governing law or complaints contact.
  The system still has unused map components that can be removed.
- **Fix:** rewrite the Terms to match what the system does: payment methods, who can cancel and when, what happens when the
  store cancels a paid order, how to report missing items, a complaints contact, and the date. Remove the map components entirely.

---

## Found by the "hard questions through the UI" walkthrough

Details, click-by-click steps and the SQL behind each fix are in [`user-simulation.md`](user-simulation.md), Part 2.

### 30. Orders page can't filter by date, customer, payment or type (P2, high)
- **Now:** the page offers status tabs and order-number search only. `getDetailedOrders` in `lib/actions/orders.ts` **already
  accepts `date_from` and `date_to`**, but the page never sends them. Orders in `awaiting_payment` / `payment_failed` are hidden
  from every staff screen, so staff can't help a customer whose GCash payment is stuck.
- **Fix:** add a date range, search by customer name or phone, and payment-method and order-type filters, all server-side like the
  existing ones. Add a manager-only "Payment issues" tab for unpaid and failed wallet orders.

### 31. Customer list has no order totals or history, and loads every customer (P2)
- **Now:** `CustomerData` has `totalOrders` and `totalSpent`, but nothing fills them. Sorting is by name only. `getAllCustomers()`
  downloads every customer to the browser and filters there.
- **Fix:** compute orders and total spent per customer on the server, make them sortable, show the last 10 orders in the customer
  detail view, and page the list on the server.

### 32. Reports have no breakdowns and no CSV (P2)
- **Now:** reports split by day only. There's no breakdown by payment method, order type, hour or cancellation reason, and
  the only download is PDF.
- **Fix:** add those four breakdowns to the Sales report, an hour-range option for top products, and a CSV button next to the PDF one.

---

## Found by the designer and system analyst walkthroughs

Details are in [`user-simulation.md`](user-simulation.md), Part 3 (personas 16 and 17).

### 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2)
- **No error pages:** there's no `error.tsx` anywhere in `app/`. A server error shows Next.js's default screen. Add
  `app/error.tsx` and `app/manage/error.tsx` with a friendly message and a retry button. Worth doing before the demo.
- **Dead status:** `VALID_TRANSITIONS` (`lib/validation/orders.ts:75`) has no way into `received`, but the README's flow and the
  staff "Queue" tab still use it. Remove it, or make it the "staff accepted" step (useful for L22).
- **Types in mock files:** `OrderData`, `DeliveryLocation` and `MenuItem` come from `lib/mock-orders.ts`, `lib/mock-deliveries.ts`
  and `components/manage/menu/mock-menu.ts` (14 importers). Move them to `types/`. While there, make the customer's live map use
  the same restaurant location as the ETA engine (`RESTAURANT_LAT/LNG`) instead of the hard-coded `RESTAURANT_LOCATION`.
- **Bigger design clean-up** (tokens instead of 697 hard-coded colours, a type scale for 35 font sizes, `<Button>` everywhere)
  is worth doing, but it's a refactor. Keep it for after the defense unless there's time left.

---

## Panel feedback (verified in [`feedback-verification.md`](feedback-verification.md))

The panel's 25 points were checked against the code. The ones not already covered above:

| Ref | Point | Priority | Estimate |
|---|---|---|---|
| F3 | Guests see "Sign in to order" instead of "Add" | **P1 (panel)** | 0.5 h |
| F7 | Type the quantity in the stepper | **P1 (panel)** | 0.5 h |
| F12 | Grey out photos of unavailable items | **P1 (panel)** | 0.25 h |
| F16 | Password strength on sign-up; remove birthday (add an age checkbox) | **P1 (panel)** | 0.5 h |
| F17 | Show VAT at checkout and save `tax_amount` | **P1 (panel)** | 0.5 h |
| F21 | 3RD PARTY COURIER / SELF PICKUP badge on KDS and order cards | **P1 (panel)** | 0.25 h |
| F22 | Cancel button disabled until a reason is given; preset reasons | **P1 (panel)** | 0.25 h |
| F6, F9 | Minimum item count and max items per delivery (with L6) | **P1 (panel)** | 0.25 h |
| F11, F15 | Timed pause with countdown, automatic busy mode, pickup-only when riders are full (extends L7) | **P1 (repeated by Ma'am)** | 3 h |
| F14 | "Customer no-show" status; strikes lead to cash block, then manager review | P2 | 2 h |
| F24 | KDS sort toggle, list view, cancelled tab | P2 | 1.5 h |
| F25 | Separate food and service ratings; per-item ratings with "rate all the same" | P2 | 2 h |
| F23 | Email on cancellation (with refund note for paid orders) | P2 | 1.5 h |
| F4 | "Find a store" page | P2 | 1 h |
| F18 | Per-item prep time in the ETA; keep the promised time | P2 | 2 h |
| F1 | Promo banner managed by the manager | P2 | 2.5 h |
| F13 | CAPTCHA on sign-up and login (moved from `lacking.md`) | P2 | 1.5 h |
| F19 | Staff tips with preset amounts (moved from `lacking.md`) | P2 | 2 h |
| F20 | Record who created and cancelled each order (extends L9) | P2 | 0.5 h on top of L9 |

Panel P1 items add about 6 hours. Future work for the paper: group orders (F2), bulk and advance orders (F10), vouchers and games (F1).
