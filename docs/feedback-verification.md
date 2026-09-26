# Panel feedback — verified against the code and docs

Each point from the feedback was checked in the code (branch `more-things-to-update-yr`) and in
[`lacking.md`](lacking.md), [`limitations.md`](limitations.md) and [`user-simulation.md`](user-simulation.md).

| Status | Meaning |
|---|---|
| ✅ Done | Already works as asked |
| ◐ Partly | Some of it exists |
| ❌ Missing | Not built |

**Fits 1.5 days?** ⚡ = under 30 min · 🕐 = 1–2 h · 🧱 = too big, list as future work.

---

## Summary

| # | Feedback | Status | Already in our docs? | Fits? |
|---|---|---|---|---|
| F1 | Landing page with ads, seasonal promos, vouchers, senior discount, free delivery, games | ❌ | Vouchers, Senior discount (L4) | 🕐 banner / 🧱 vouchers, games |
| F2 | Group order (as a limitation) | ❌ | Only in persona 5 | 🧱 list as limitation |
| F3 | Guests shouldn't see "Add to cart" | ◐ | Yes (personas 1, 16) | ⚡ |
| F4 | "Find a store" page, even with one branch | ❌ | Contact details (L13) | 🕐 |
| F5 | Minimum purchase total | ❌ | Yes (L6) | ⚡ |
| F6 | Minimum number of items | ❌ | No | ⚡ |
| F7 | Stepper: allow typing the quantity | ❌ | No | ⚡ |
| F8 | How the customer feels when the order is rejected | ◐ | Partly (L10, L24) | 🕐 |
| F9 | Bulk orders: cap by weight/number for a motorcycle, or schedule them | ◐ | No | ⚡ cap / 🧱 scheduling |
| F10 | Bulk orders: separate page, reserve 1–2 days ahead | ❌ | Scheduled orders (lacking) | 🧱 |
| F11 | High demand: pause ordering, auto-reopen in 5 min, smart restriction (**repeated by Ma'am**) | ❌ | Yes (L7, extended) | 🕐 |
| F12 | Unavailable items: grey picture | ◐ | No | ⚡ |
| F13 | Fake accounts: CAPTCHA | ❌ | Yes (lacking) | 🕐 |
| F14 | Food not delivered: rider option, or ban the account | ❌ | Yes (lacking, L18) | 🕐 |
| F15 | All riders busy: allow pickup only | ❌ | No | 🕐 |
| F16 | Sign-up: go to login, password strength, remove birthday | ◐ | Partly (persona 1, lawyer J6) | ⚡ |
| F17 | Checkout: show tax | ❌ | Yes (persona 14) | ⚡ |
| F18 | Delivery time should grow with items; per-item prep time; checkout and tracking consistent | ◐ | Partly (lacking round 3) | 🕐 |
| F19 | Tips with preset amounts | ❌ | Yes (lacking) | 🕐 |
| F20 | Audit log: who created or cancelled an order | ◐ | Yes (L9) | 🕐 |
| F21 | Pickup: KDS should show it; riders shouldn't get pickup orders | ◐ | No | ⚡ |
| F22 | Cancel reason: grey out the button until a reason is typed | ❌ | Partly (persona 9) | ⚡ |
| F23 | Email the customer when an order is cancelled | ❌ | Partly (L10) | 🕐 |
| F24 | KDS: newest/oldest sort, list view, cancelled filter | ❌ | Partly (L17) | 🕐 |
| F25 | Ratings: separate food and delivery; per item; "rate all the same" | ◐ | No | 🕐 |

**Count:** 0 fully done, 10 partly, 15 missing. 9 are ⚡ quick fixes (about 3 hours together).

---

## Details

### F1. Landing page for marketing — ❌
- **Now:** `/` renders the menu directly (`app/(shop)/page.tsx` → `MenuPageBody`). No banner, promo, voucher or seasonal
  content exists anywhere (no `promo`, `banner`, `hero` or `voucher` component).
- **Quick version (🕐 2–3 h):** a `promotion` table (title, image, start date, end date, link to a product or category,
  active) managed by the manager, and a banner carousel at the top of the menu that shows only current promos. Examples:
  "Christmas Bilao Set", "Senior & PWD: 20% off" (once L4 exists), "Free delivery over ₱500" (one rule in `resolveDeliveryFee`).
- **Too big for now:** a voucher engine (lacking), games or spin-the-wheel. Mention them as future marketing features.

### F2. Group order — ❌
- **Now:** one cart per customer (`one_active_cart_per_customer` unique index). No shared carts.
- **Advice:** add to `lacking.md` and the paper's limitations: "Group ordering (several people adding to one cart and splitting
  payment) is out of scope." It needs shared cart links, per-person items and split payments.

### F3. Guests shouldn't see "Add to cart" — ◐
- **Now:** guests see the same **Add** button. Tapping it shows "You must be signed in." (`lib/actions/cart.ts:71`) with no
  link, and the choice is lost.
- **Fix (⚡):** when there's no profile, replace **Add** with **"Sign in to order"**, linking to `/login?next=/menu`. The menu
  already receives `profilePromise`. Browsing stays open to guests.

### F4. "Find a store" — ❌
- **Now:** no store page. `lib/site/site-info.ts` deliberately has no address or phone, so nothing is shown.
- **Fix (🕐 1 h):** a `/store` page with the branch name, address, map pin (the same `RESTAURANT_LAT/LNG` the fee uses), hours,
  phone, "we deliver within 15 km in Metro Manila", and a "Get directions" link. Design it as a list of one, so a second branch
  is just another row. This also covers the seller details the Internet Transactions Act requires (L13).

### F5. Minimum purchase total — ❌
- Already planned as **L6** (minimum ₱150 for delivery, COD cap ₱3,000). Enforce it in `submitCart`, and show "Add ₱X more
  for delivery" in the cart.

### F6. Minimum number of items — ❌
- **Fix (⚡):** same place as L6. Our recommendation is a minimum **amount** rather than a minimum item count, because
  one ₱300 meal is a better order than two ₱20 drinks. If the panel wants an item count, it's one line next to the L6 check.

### F7. Stepper: type the quantity — ❌
- **Now:** `components/menu/quantity-stepper.tsx` shows the number as a `<span>` between − and + buttons. For 15 items,
  the customer taps + 14 times.
- **Fix (⚡):** make the number an `<input inputMode="numeric">`, clamp it with the existing `clampQuantity`
  (`lib/menu/quantity.ts`), and keep − and +. Apply the same to the cart line stepper.

### F8. How it feels to have an order rejected — ◐
- **Now:** when staff cancel, they must give a reason (`app/manage/orders/page.tsx`). The tracking page shows it with
  "The restaurant cancelled this order. Sorry about that — you can place a new order from the menu." That message is decent.
- **Missing:**
  - The customer only finds out if the tracking page is open. No notification or email (L10, F23).
  - Nothing says what happens to their **money**. For GCash/Maya there's no refund process (lacking), and the live data has
    cancelled orders still marked `paid` (persona 14).
  - No gesture of goodwill (for example a voucher), which chain apps use.
- **Fix (🕐):** for paid orders, add "Your ₱X payment will be refunded to your GCash/Maya within N days" to the message, send an
  email or notification (F23), and use a friendly list of preset reasons (F22) instead of free text the customer may find harsh.

### F9. Bulk orders: cap by capacity — ◐
- **Now:** the per-item cap is 20 in the UI (99 on the server, L2). There's no cap on the **whole** order, so 20 of each of 10
  dishes (200 items) can go on one motorcycle. Riders can carry up to `MAX_ACTIVE_DELIVERIES` (10) deliveries, but that
  counts orders, not size.
- **Fix (⚡):** a `MAX_ITEMS_PER_DELIVERY` (for example 30 items) checked in `submitCart` for delivery orders. Above it, show
  "That's a big order! Please choose pickup, or contact us for a bulk order." Measuring by **weight** needs a weight on every
  product, so an item count is the practical version.

### F10. Bulk orders page, 1–2 days in advance — ❌
- Needs scheduled orders, which are listed in `lacking.md` as too big (store hours, ETA, KDS ordering and payment timing all
  change). **Advice:** list "Bulk and advance orders (party trays, 1–2 days' notice)" as future work, and in the meantime show the
  store's phone number for bulk orders (F4).

### F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority)
- **Now:** nothing limits demand. The ETA grows with the queue, but orders keep coming. Covered in **L7** (pause store and busy
  mode) and its extension (kitchen capacity limit, from Olo and Flipdish).
- **Fix (🕐 2 h), matching what was asked:**
  1. **Manual pause** by the manager, with a duration: "Paused for 15 min". Customers see "Ordering reopens at 3:45 PM"
     with a countdown (the "open again in 5 mins" idea).
  2. **Automatic pause** when active orders (`received` + `preparing`) reach a limit, for example 15. Ordering reopens by itself
     once the queue drops below the limit. No admin needed.
  3. **Delivery-only limit** when riders are full (F15), so pickup stays open.
  4. Show the reason: "We're very busy right now" rather than a bare "closed".

### F12. Unavailable items: grey picture — ◐
- **Now:** the mobile list row dims the whole row (`opacity-50`, `product-row.tsx:64`). The desktop **card** shows an
  "Unavailable" label instead of Add, but the photo stays in full colour (`product-card.tsx`).
- **Fix (⚡):** add `grayscale opacity-60` to the card image when `!product.isAvailable`, and use the same style in the list row.

### F13. Fake accounts: CAPTCHA — ❌
- Listed in `lacking.md` (security). Rate limiting on login exists; sign-up has none.
- **Fix (🕐 1–2 h):** Cloudflare Turnstile (free) on sign-up and login. Supabase Auth has built-in support for CAPTCHA tokens,
  so the server side is a setting.

### F14. Food not delivered — ❌
- **Now:** a rider can only complete a delivery (with a photo). No "failed" outcome exists. Customers can be disabled by a
  manager (`is_account_disabled`), but nothing counts failed deliveries.
- **Fix (🕐 2 h):**
  - A rider button **"Couldn't deliver"** with reasons (customer unreachable, wrong address, refused), a required photo, and a
    new order status `delivery_failed`.
  - Count failed cash deliveries per customer. After 2, hide cash on delivery for that account (L18). After 3, the manager is
    prompted to disable it. Don't ban automatically on the first one: the rider could be wrong.

### F15. All riders busy → pickup only — ❌
- **Now:** there's a per-rider cap (`MAX_ACTIVE_DELIVERIES` = 10) but no check at checkout. If every rider is full, delivery orders
  still come in and wait.
- **Fix (🕐 1 h):** at checkout, count active riders (`rider.is_active`) and their open deliveries. If none have space, disable
  Delivery with "All our riders are busy. Pickup is available." Part of F11.

### F16. Sign-up: redirect, password strength, remove birthday — ◐
- **Redirect to login:** ✅ already done when email confirmation is on (`customer-signup-form.tsx:128-134` →
  `/login?registered=1`, which shows "check your email").
- **Password strength:** ◐ a strength meter exists (`lib/profile/password-strength.ts`), but it's only used on the **profile**
  password change (`components/profile/password-card.tsx`), not on sign-up. Reuse it (⚡).
- **Remove birthday:** ◐ it's optional already ("Date of birth (optional, 13+)"). Removing it is a one-line change. **Note:**
  it's also the only age check (13+), and the lawyer review (persona 15, J6) raised minors. If it's removed, replace it with a
  checkbox: "I am at least 18, or have a parent's permission".

### F17. Checkout: tax — ❌
- **Now:** `tax_amount` is always 0 (`lib/actions/cart.ts`), and checkout shows no VAT.
- **Fix (⚡):** menu prices are VAT-inclusive, so don't add tax. Show it: "VATable sales ₱X / VAT (12%) ₱Y / Total ₱Z", and save
  `tax_amount` on the transaction. This is also needed for the Senior/PWD discount (L4), which removes VAT.

### F18. Delivery time should depend on items — ◐
- **Now:** `lib/eta/engine.ts` uses a 15-minute base plus a fixed amount per order **ahead in the queue**, capped at 60, plus travel
  time. It ignores how many items are in **this** order, and products have no prep-time field.
- **Consistency:** ◐ checkout (`lib/checkout/arrival-estimate.ts`) and tracking use the same engine functions, so the formula is
  the same. But the tracking estimate is recalculated on every load and overwrites the saved one (persona 12), so the customer can
  see the time change.
- **Fix (🕐 2 h):** add `prep_minutes` to `product` (default 10), and compute kitchen time as the longest item plus a small amount
  per extra item. Save the checkout estimate as `promised_at` (persona 12), and show it on tracking as "Promised by 3:45 PM".

### F19. Tips with presets — ❌
- In `lacking.md` (foodpanda has it). **Fix (🕐 2 h):** preset buttons (₱0, ₱20, ₱50, ₱100, custom) at checkout, a `tip_amount`
  column, and the tip added to the PayMongo amount or collected with cash. Show both peso amounts, not percentages (Baymard).
  All of the tip goes to the rider; show it on the rider's cash summary (L19).

### F20. Audit log — ◐
- **Now:** `order` has `cancellation_reason` and `cancelled_at`, but not **who** cancelled. `order.employee_id` was dropped.
  No other history exists.
- **Covered by L9** (`order_status_log`: from, to, changed_by, reason, time, filled by a trigger). **Extend** it to record the
  creator (customer), and add a small `audit_log` for manager actions (price changes, role changes, account disabling).
  🕐 2 h together.

### F21. Pickup orders: KDS and riders — ◐
- **Riders never get pickup orders:** ✅ the database trigger only creates a delivery row when `order_type` is `delivery`
  (`20260921000003_qa_fixes_rls_delivery_roles.sql:97`), and staff can't set `out_for_delivery` on a take-out order (P52).
  Pickup orders already go `ready → completed` with a "Picked up" action.
- **KDS doesn't show the type:** ◐ `map-staff-order.ts:130` computes `type`, but `kds-order-card.tsx` and `order-card.tsx` never
  display it. The cook can't tell pickup from delivery.
- **Fix (⚡):** a clear badge on each KDS and order card: **PICKUP** or **DELIVERY**.

### F22. Grey out cancel until a reason is typed — ❌
- **Now:** the Confirm button in the cancel dialog is only disabled while saving (`disabled={isProcessing}`). With no reason it
  can still be clicked, and then shows "Please provide a reason for cancellation."
- **Fix (⚡):** `disabled={isProcessing || !cancelReason.trim()}`. Better still, add preset reasons (Out of stock, Store closing,
  Customer request, Duplicate order) plus "Other".

### F23. Email when an order is cancelled — ❌
- **Now:** the only emails are Supabase Auth's (confirmation, password reset). No email provider is set up, and the notification
  table is never written (L10).
- **Fix (🕐 1.5 h):** Resend's free tier or Supabase's SMTP, called from `updateOrderStatus` when the status becomes `cancelled`.
  Include the reason and, for paid orders, the refund note (F8). Add the in-app notification at the same time (L10).

### F24. KDS: sort, list view, cancelled filter — ❌
- **Now:** the KDS shows active orders only, as a card grid (`app/manage/kds/page.tsx:141`), sorted by stage then oldest first.
  Oldest first is on purpose ("so the kitchen cooks in order", README).
- **Fix (🕐 1.5 h):** a toggle for **Oldest first / Newest first** (keep oldest as default), a **Grid / List** toggle (list = one
  row per order, more on screen), and a **Cancelled (today)** tab, so cooks can stop cooking an order that was just cancelled.
  Add the late-order colours from L17 at the same time.

### F25. Ratings: food vs delivery, per item — ◐
- **Now:** one 1–5 star rating per **order** with an optional comment (`components/orders/order-rating.tsx`, P36). The `review`
  table already supports **per-product** reviews (`product_id` column, unique `(order_id, product_id)` index), and a
  `submit_direct_product_review` function exists, so the database is ready.
- **Fix (🕐 2 h):** in the rating dialog, show **Food** and **Delivery** (delivery only for delivery orders) as separate star
  rows, then each item with its own stars and a **"Rate all items the same"** switch. Store delivery ratings on `delivery` (or a
  `review.kind` column) so rider performance can use them (persona 7).

---

## Recommended plan for the panel's points

**Do first (⚡, about 3 h in total):** F3, F7, F12, F16, F17, F21, F22, plus F5/F6/F9 (one check in `submitCart`).
These are visible in a demo and directly answer the feedback.

**Next (🕐, pick by priority):** F11 with F15 (repeated by Ma'am), then F14, F24, F25, F23, F4, F18, F1 (banner only), F13, F19, F20.

**List as future work in the paper (🧱):** F2 group orders, F10 bulk and advance orders, F1 vouchers and games.
