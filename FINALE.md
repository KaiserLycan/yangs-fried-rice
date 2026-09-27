# FINALE — Unimplemented Features for One Final Run

> **Purpose:** Every gap found across the docs (`feedback-verification.md`, `lacking.md`, `limitations.md`, `user-simulation.md`), the persona skills review, and the current codebase.
>
> **Note:** PR #129 (Issue #117) has now been merged into `development`, which resolved all manager/staff workflows (KDS tabs, report CSVs, payment-issues, customer server-side pagination, cancel reasons, etc.) and laid the database foundations for many items below.
> 
> Each item below is verified against the code as of 28 Sep 2026.

---

## Final status (29 Sep 2026)

Every item below, checked against the code and the live database at the end of the final run.
The sections that follow are the original brief, kept as written.

| # | Item | Status |
|---|---|---|
| 1.1 | Store hours on the server | ✅ `store_setting` + `submit_cart_to_order`; last-orders cut-off |
| 1.2 | Senior Citizen / PWD discount | ✅ ID number, name, photo; 20% off VAT-exclusive; photo deleted after the order |
| 1.3 | Minimum order, cash cap | ✅ ₱150 minimum, ₱2,000 cash cap, ₱1,000 first cash order |
| 1.4 | VAT at checkout | ✅ VATable sales / VAT / Total; `tax_amount` saved |
| 1.5 | Deleting an account before pickup | ✅ refused while an order is open |
| 1.6 | Privacy notice, business details | ✅ `/privacy`, `/store`, footer — DTI/SEC number still to be supplied by the owner |
| 1.7 | Terms accurate | ✅ |
| 1.8 | Pay-in-store marked paid | ✅ `mark_pay_in_store_paid` on pickup |
| 2.1 | Pause, auto-reopen, busy mode | ✅ dashboard store controls |
| 2.2 | No-show status and strikes | ✅ reasons, strikes, cash block, manager prompt |
| 2.3 | Food / service / per-dish ratings | ✅ rating dialog, `submit_order_ratings`, service rating in reports |
| 2.4 | "Find a store" page | ✅ `/store` |
| 2.5 | Prep time in the ETA; keep the promise | ✅ `prep_minutes`, `promised_at` frozen |
| 2.6 | Promo banner managed by the manager | ✅ `/manage/promotions` and the landing carousel |
| 2.7 | CAPTCHA | ❌ not started, by the owner's decision — needs Cloudflare Turnstile keys |
| 2.8 | Tips | ✅ preset amounts at checkout |
| 3.1 | Unpaid wallet orders expire | ✅ `expire-abandoned-orders`, every 5 min |
| 3.2 | "Change for ₱___" | ✅ |
| 3.3 | Order status history | ✅ `order_status_log`; tracking timeline and staff "History" |
| 3.4 | Best-seller labels | ✅ |
| 3.5 | Repeat no-shows | ✅ see 2.2 |
| 3.6 | Unaccepted orders | ✅ staff flash at 5 min, auto-cancel (`expire-unaccepted-orders`) |
| 4.1 | GCash vs Maya | ✅ recorded separately (older rows stay `paymongo`) |
| 4.2 | Manila-time reports | ✅ |
| 4.3 | ETA accuracy | ✅ "Ready on time" rate on the performance report and PDF |
| 4.4 | Webhook replay window | ✅ 5 minutes |
| 4.5 | Session secret fallback | ✅ none in production |
| 5.1–5.3 | Colours, type scale, radii, `<Button>` | ✅ enforced by `__tests__/design-scale.test.ts` |
| 5.4 | Copy glossary | ✅ `docs/copy-glossary.md` |
| 5.5 | Readable order number | ✅ `order_number` |
| 6.1 | Minors | ✅ 18+ / parent's permission checkbox |
| 6.2 | Data retention | ✅ `purge-expired-personal-data`, nightly |
| 6.3 | Account deletion erases free text | ✅ |
| 7.1 | Payment CHECK constraints | ✅ method and status |
| 7.2 | Order status CHECK | ✅ `order_status_check` (migration `20260929140000`) + transition trigger |
| 7.3 | `received` status | ✅ removed from the database and the app |
| 9.1 | Out-of-stock trap | ✅ checkout highlights the sold-out line; "Remove sold-out items" |
| 9.2 | Ghost wallet | ✅ receipt watches the payment settle; store phone on `/store` and the footer |
| 9.3 | Review follow-up | ✅ ratings link to the order and the customer's phone (dashboard, menu editor) |
| 9.4 | Refund maze | ✅ automatic refunds; a failed one shows on the order with "Open in PayMongo" |
| 9.5 | Top customers | ✅ sortable customer list with totals (#117) |
| 9.6 | Disappearing ticket | ✅ KDS cancelled tab (#117) |
| 9.7 | Who cancelled | ✅ audit search by order, and "History" on the order |
| 9.8 | Lost favourite | ✅ My Orders search and "show older" |
| 9.9 | Irreversible click | ✅ undo "Picked up" within 10 minutes |
| 9.10 | Silent price hike | ✅ old → new price on the line; "Accept new prices" |
| 9.11 | Disabled dead end | ✅ told at password reset and login |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical / Legal — must do |
| 🟠 | High — should do |
| 🟡 | Medium — do if time allows |
| ✅ | Already done (confirmed in code) |

---

## Section 1 — P1 Items Still Open

### 1.1 🔴 Store hours only checked in the browser (L1)
- **Status:** Partially done. `store_setting` table and `lib/store/store-status.ts` exist. `submitCart` now checks store status.
- **Still missing:** The closing cut-off (e.g. no new orders after 5:30 PM so the kitchen can finish). The `FORCE_STORE_OPEN` env flag for demos.
- **Files:** [`lib/store-hours.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/store-hours.ts), [`lib/actions/cart.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/cart.ts), [`lib/store/store-status.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/store/store-status.ts)

### 1.2 🔴 No Senior Citizen / PWD discount (L4)
- **Status:** Partially done. Migration `20260928000011_senior_pwd_discount.sql` exists. `SeniorPwdDiscountPicker` component exists. The `senior-pwd-ids` private bucket and `lib/storage/senior-pwd-ids.ts` are in place.
- **Still missing:** Verify the complete end-to-end flow works: discount calculation at checkout, the "Verify ID" badge on the staff order view, staff verification workflow, auto-deletion of ID photos after order completion, the discount appearing correctly in reports and receipts. The test file `senior-pwd-discount.test.tsx` exists but needs to cover the full lifecycle.
- **Files:** [`components/checkout/senior-pwd-discount-picker.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/checkout/senior-pwd-discount-picker.tsx), [`supabase/migrations/20260928000011_senior_pwd_discount.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000011_senior_pwd_discount.sql)

### 1.3 🔴 No minimum order amount or cash cap (L6)
- **Status:** Partially done. Migration `20260928000006_checkout_business_rules.sql` exists. `20260928000014_submit_cart_to_order_limits.sql` adds limits.
- **Still missing:** Verify the minimum ₱150 for pickup and the COD cap are enforced in the current `submit_cart_to_order`. Verify the UI shows "Add ₱X more" in the cart before checkout.
- **Files:** [`supabase/migrations/20260928000006_checkout_business_rules.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000006_checkout_business_rules.sql), [`supabase/migrations/20260928000014_submit_cart_to_order_limits.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000014_submit_cart_to_order_limits.sql)

### 1.4 🔴 Checkout: show VAT (F17)
- **Status:** Not done. `tax_amount` is always 0. Checkout shows no VAT breakdown.
- **What's needed:** Menu prices are VAT-inclusive, so show: "VATable sales ₱X / VAT (12%) ₱Y / Total ₱Z". Save `tax_amount` on the transaction. Essential for the Senior/PWD discount which removes VAT.
- **Files:** [`lib/menu/cart-totals.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/menu/cart-totals.ts), [`components/checkout/order-summary-card.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/checkout/order-summary-card.tsx)

### 1.5 🔴 Customer can delete account before picking up (L16)
- **Status:** Not done. `deleteMyAccount` in `lib/actions/profile.ts` does not check for active orders.
- **What's needed:** Refuse deletion while any order is not `completed` or `cancelled`.
- **Files:** [`lib/actions/profile.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/profile.ts)

### 1.6 🔴 No separate privacy notice or business details (L13)
- **Status:** Partially done. An `app/privacy` route exists.
- **Still missing:** Verify the privacy page covers all Data Privacy Act requirements: personal information controller, purpose and legal basis for each data type, who receives the data (Supabase, PayMongo, LocationIQ), cross-border transfers, retention periods, customer rights (access, correction, erasure, objection, portability, NPC complaint). Verify business details (name, address, contact) are shown in the footer. Verify `lib/site/site-info.ts` has the contact details filled in.
- **Files:** [`app/privacy/page.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/app/privacy/page.tsx), [`lib/site/site-info.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/site/site-info.ts)

### 1.7 🔴 Terms promise things that don't exist (L29)
- **Status:** Not verified. The terms page may still reference credit/debit cards (commented out in code), automatic refunds (no refund process exists), or miss a "last updated" date, governing law, and complaints contact.
- **What's needed:** Rewrite Terms to match what the system actually does. Add what happens when the store cancels a paid order. Add a last-updated date, governing law, and complaints contact.
- **Files:** [`app/terms/page.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/app/terms/page.tsx)

### 1.8 🟠 Pay-in-store sales never marked paid (L27)
- **Status:** Partially done. A `mark_pay_in_store_paid()` trigger function exists in migrations `20260928000005` and `20260928000011`.
- **Still missing:** Verify this trigger actually fires when a pickup order is completed. Verify payment spelling cleanup (CHECK constraints on `payment_method` and `payment_status`). Clean up the 5 different spellings in existing data.
- **Files:** [`supabase/migrations/20260928000005_payments_and_order_tracking.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000005_payments_and_order_tracking.sql)

---

## Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)

### 2.1 🟠 High demand: pause store, auto-reopen, smart restriction (F11, F15)
- **Status:** Partially done. `store_setting` table and `store-control-panel.tsx` exist. Migrations for store settings exist.
- **Still missing:** Verify manual pause with duration works. Verify auto-pause when `max_active_orders` is reached. Verify customers see "Ordering reopens at 3:45 PM" with a countdown. Verify the "We're very busy right now" banner on the menu.
- **Files:** [`components/manage/dashboard/store-control-panel.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/manage/dashboard/store-control-panel.tsx), [`lib/store/store-status.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/store/store-status.ts), [`supabase/migrations/20260928000003_store_setting.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000003_store_setting.sql)

### 2.2 🟠 Customer no-show status and strikes (F14)
- **Status:** Not done. No `delivery_failed` or `pickup_no_show` status exists. No strike counting for cash orders.
- **What's needed:** A staff button "Customer didn't pick up" with reasons (unreachable, wrong info, refused). Count per-customer. After 2 strikes, hide pay-in-store for that account. After 3, prompt manager to disable.
- **Files:** [`lib/validation/orders.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/validation/orders.ts), [`lib/orders/order-stage.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/orders/order-stage.ts)

### 2.3 🟡 Separate food/service ratings; per-item; "rate all the same" (F25)
- **Status:** Not done. Currently one 1–5 star rating per order. The `review` table already has `product_id` and a `(order_id, product_id)` unique index, and `submit_direct_product_review` exists, so the database is ready.
- **What's needed:** Rating dialog with separate Food and Service (for pickup/delivery), per-item stars, and a "Rate all items the same" toggle. Store delivery/service ratings so staff performance can be measured.
- **Files:** [`components/orders/order-rating.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/orders/order-rating.tsx)

### 2.4 🟡 "Find a store" page (F4)
- **Status:** Not done. No `/store` page. `lib/site/site-info.ts` has no address or phone.
- **What's needed:** A `/store` page with branch name, address, map pin, hours, phone, "we deliver within 15 km in Metro Manila", and a "Get directions" link. Also covers the Internet Transactions Act seller-details requirement (L13).
- **Files:** [`lib/site/site-info.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/site/site-info.ts)

### 2.5 🟡 Per-item prep time in the ETA; keep the promised time (F18)
- **Status:** Not done. ETA engine counts orders, not items. No `prep_minutes` on `product`. The checkout estimate is recalculated on every tracking page load and overwrites the saved one.
- **What's needed:** Add `prep_minutes` to `product` (default 10). Compute kitchen time as longest item plus a small amount per extra item. Save checkout estimate as `promised_at` (never overwritten). Show "Promised by 3:45 PM" on tracking.
- **Files:** [`lib/eta/engine.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/eta/engine.ts), [`lib/checkout/arrival-estimate.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/checkout/arrival-estimate.ts)

### 2.6 🟡 Promo banner managed by the manager (F1)
- **Status:** Partially done. Migration `20260927110303_issue_120_promotions.sql` exists for a promotions table.
- **Still missing:** Verify the banner carousel at the top of the menu shows only current promos. Verify the manager can create/edit/deactivate promotions.
- **Files:** [`supabase/migrations/20260927110303_issue_120_promotions.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260927110303_issue_120_promotions.sql)

### 2.7 🟡 CAPTCHA on sign-up and login (F13)
- **Status:** Not done. Rate limiting exists on login, but nothing on sign-up.
- **What's needed:** Cloudflare Turnstile (free) on sign-up and login. Supabase Auth has built-in CAPTCHA token support.
- **Files:** [`components/auth/customer-login-form.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/auth/customer-login-form.tsx), [`components/auth/customer-signup-form.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/auth/customer-signup-form.tsx)

### 2.8 🟡 Staff tips with preset amounts (F19)
- **Status:** Not done. No `tip_amount` column. No tip UI at checkout.
- **What's needed:** Preset buttons (₱0, ₱20, ₱50, ₱100, custom) at checkout. `tip_amount` column on transaction. Tip added to the PayMongo amount or collected with cash. Show peso amounts, not percentages.
- **Files:** [`components/checkout/checkout-screen.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/checkout/checkout-screen.tsx)

---

## Section 3 — Limitations Still Open (from `limitations.md`)

### 3.1 🟠 Unpaid GCash/Maya orders never expire (L3)
- **Status:** Partially done. Migration `20260928000010_schedule_cron_jobs.sql` exists.
- **Still missing:** Verify the `pg_cron` job actually runs every 5 minutes and cancels wallet orders still unpaid after 30 minutes. Verify it writes `ABANDONED_PAYMENT_REASON`.
- **Files:** [`supabase/migrations/20260928000010_schedule_cron_jobs.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000010_schedule_cron_jobs.sql), [`lib/orders/order-stage.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/orders/order-stage.ts)

### 3.2 🟡 No "change for ₱___" on cash payments (L8)
- **Status:** Not done. No change field at checkout for cash orders.
- **What's needed:** Optional amount field when cash is selected (must be ≥ total). Store on the order/transaction. Show "Bring ₱X change" to the staff.
- **Files:** [`components/checkout/checkout-screen.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/checkout/checkout-screen.tsx)

### 3.3 🟡 No order status history (L9)
- **Status:** Partially done. Migration `20260928000005_payments_and_order_tracking.sql` includes `order_status_log` and the order timeline component has been updated.
- **Still missing:** Verify the trigger fires on every status change and records `from`, `to`, `changed_by`, `reason`, `at`. Verify the customer timeline shows real timestamps (not just current time). Verify prep-time reports are possible.
- **Files:** [`supabase/migrations/20260928000005_payments_and_order_tracking.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000005_payments_and_order_tracking.sql), [`components/orders/order-timeline.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/orders/order-timeline.tsx)

### 3.4 🟡 No "Best seller" labels on the menu (L14)
- **Status:** Not done. No best-seller count or label anywhere in the menu components.
- **What's needed:** Count `order_item` over the last 30 days, tag the top 3 with a "Best Seller" badge on menu cards.
- **Files:** [`components/menu/product-card.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/menu/product-card.tsx), [`components/menu/product-row.tsx`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/components/menu/product-row.tsx)

### 3.5 🟡 Nothing stops repeat pickup no-shows (L18)
- **Status:** Not done (same as F14 above). No counting of no-show cash orders per customer.
- **What's needed:** Count cancelled cash orders per customer. After 2, hide pay-in-store. After 3, prompt manager. Also cap a new account's first cash order at ₱1,000.
- **Files:** [`lib/actions/cart.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/cart.ts)

### 3.6 🟡 Nothing happens when staff don't accept an order (L22)
- **Status:** Partially done. Migration `20260928000009_expire_unaccepted_orders.sql` and cron scheduling exist.
- **Still missing:** Verify the pg_cron job auto-cancels orders still `pending` after 20 minutes. Verify the Orders page and KDS flash orders pending > 5 minutes. Verify the tracking page shows "The store hasn't confirmed yet. You can cancel for free." after 10 minutes.
- **Files:** [`supabase/migrations/20260928000009_expire_unaccepted_orders.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000009_expire_unaccepted_orders.sql)

---

## Section 4 — User Simulation Findings Still Open

### 4.1 🟡 GCash and Maya both saved as `paymongo` (Finding 13)
- **Status:** Not done. Both wallets are saved as `payment_method = 'paymongo'`. Reports can't tell them apart.
- **What's needed:** Save as `gcash` or `maya` (PayMongo's webhook payload says which one was used). Update the edge function and report queries.
- **Files:** [`supabase/functions/payment-webhook/index.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/functions/payment-webhook/index.ts), [`lib/actions/cart.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/cart.ts)

### 4.2 🟡 Report dates use UTC instead of Manila time (Finding 14)
- **Status:** Not done. Reports filter with UTC midnight. Dashboard uses the server's UTC clock. It only works because the store opens at 8 AM Manila (= 00:00 UTC).
- **What's needed:** Use `AT TIME ZONE 'Asia/Manila'` in all report and dashboard queries.
- **Files:** [`lib/actions/reports.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/reports.ts), [`lib/actions/dashboard.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/dashboard.ts)

### 4.3 🟡 ETA accuracy can't be measured (Finding 11)
- **Status:** Partially done. Migration `20260928000008_checkout_wallet_vat_promise.sql` may include `promised_at`.
- **Still missing:** Verify `promised_at` is saved at checkout and never overwritten. Verify `estimated_time` stays as the live value. Verify pickup orders also get a `promised_at`.
- **Files:** [`lib/checkout/arrival-estimate.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/checkout/arrival-estimate.ts), [`lib/actions/eta.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/eta.ts)

### 4.4 🟡 Payment webhook has no replay window (Finding S10)
- **Status:** Not done. The PayMongo webhook signature timestamp `t` isn't checked for age.
- **What's needed:** Reject webhooks with a timestamp older than 5 minutes.
- **Files:** [`supabase/functions/payment-webhook/index.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/functions/payment-webhook/index.ts)

### 4.5 🟡 Employee session secret can fall back to service-role key (Finding S11)
- **Status:** Not done. If `EMPLOYEE_SESSION_SECRET` is not set, it falls back to `SUPABASE_SERVICE_ROLE_KEY`.
- **What's needed:** Fail loudly if `EMPLOYEE_SESSION_SECRET` is not set in production. Remove the fallback.
- **Files:** [`lib/auth/session.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/auth/session.ts)

---

## Section 5 — Design & UX Gaps (from Persona Reviews)

### 5.1 🟡 697 hard-coded colours instead of tokens (Persona 16 — Mika, UI designer)
- **Status:** Not done. Brand colours are typed by hand 125+ times.
- **What's needed:** Replace hard-coded hex values with CSS variable references from `globals.css`.
- **Scope:** Find-and-replace effort. ~2 hours.

### 5.2 🟡 35 font sizes, 14 corner radii (Persona 16)
- **Status:** Not done. Inconsistent visual language.
- **What's needed:** A type scale of 6–8 steps, a radius scale of 3–4.

### 5.3 🟡 113 raw `<button>` vs 44 `<Button>` uses (Persona 16)
- **Status:** Not done. Focus rings, disabled states, and loading states look different across the app.
- **What's needed:** Migrate raw buttons to the shared `<Button>` component.

### 5.4 🟡 Copy glossary — inconsistent terminology (Persona 16)
- **Status:** Partially done. `docs/copy-glossary.md` exists.
- **Still missing:** Verify it's actually applied in the UI. "Pickup" vs "Pick Up" vs `take_out`. "Cancelled" vs "Canceled". The "Delivering" tab containing ready pickup orders.
- **Files:** [`docs/copy-glossary.md`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/docs/copy-glossary.md)

### 5.5 🟡 Readable order number (Persona 6 — Lolo Ben)
- **Status:** Partially done. Migration `20260928000012_readable_order_number.sql` exists.
- **Still missing:** Verify the readable number (e.g. `YFR-0425`) is used in the UI, receipts, and KDS instead of the 8-hex format.
- **Files:** [`supabase/migrations/20260928000012_readable_order_number.sql`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/supabase/migrations/20260928000012_readable_order_number.sql)

---

## Section 6 — Legal & Compliance Gaps (from Persona 15 — Atty. Reyes)

### 6.1 🟡 Minors: age minimum and parental consent (J6)
- **Status:** Partially done. Migration `20260928000008_remove_address_and_birthday.sql` may have changed the age flow.
- **Still missing:** Verify whether sign-up uses a checkbox ("I am at least 18, or have a parent's permission") instead of birthday. If birthday was removed, the 13+ age check is gone.
- **Files:** [`lib/validation/signup.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/validation/signup.ts)

### 6.2 🟡 Data retention / automatic deletion (from lacking.md security)
- **Status:** Not done. No retention rules for orders, addresses, or ID photos.
- **What's needed:** Decide how long to keep orders, addresses, and Senior/PWD ID photos. Build pg_cron jobs to purge them.

### 6.3 🟡 Account deletion doesn't erase all personal data (J5)
- **Status:** Partially done. `deleteMyAccount` deletes profile, addresses, cart, notifications, avatar. But past orders keep the delivery address as text, review comments stay, and photos may remain in storage.
- **What's needed:** Anonymize remaining personal data on orders. Delete photos. The privacy notice should say that order records are kept for tax purposes.
- **Files:** [`lib/actions/profile.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/actions/profile.ts)

---

## Section 7 — Database & Infrastructure (from Persona 10 — Rica, DBA)

### 7.1 🟡 Payment method CHECK constraints
- **Status:** Not done in code (may exist in migrations). `payment_method` and `payment_status` are free-text with multiple spellings.
- **What's needed:** Clean up old spellings, then add CHECK constraints.

### 7.2 🟡 Order status CHECK constraints in the database
- **Status:** Partially done. `VALID_TRANSITIONS` exists in app code but the database has no CHECK constraint or trigger enforcing the state machine.
- **What's needed:** Database-level enforcement so direct writes can't skip steps.
- **Files:** [`lib/validation/orders.ts`](file:///c:/Users/Joseph%20Rey/Downloads/Projects/Yangs-fried-rice/lib/validation/orders.ts)

### 7.3 🟡 `received` is a dead status
- **Status:** Partially done. Some migrations may have addressed this.
- **What's needed:** Either remove `received` from `VALID_TRANSITIONS` entirely, or make it the "staff accepted" step for L22. The README's flow and the staff "Queue" tab both reference it.

---

## Section 8 — Future Work (Document as Limitations Only)

These are explicitly **too large** for the remaining time. List them in the paper's limitations chapter:

| Feature | Source | Why not now |
|---------|--------|-------------|
| Group orders (shared cart, split payment) | F2, lacking | Needs shared cart links, per-person items, split payments |
| Bulk and advance orders (party trays, 1–2 days' notice) | F10, lacking | Needs scheduled orders |
| Vouchers, promo codes, loyalty points | F1, lacking | Needs a promo engine, rules, abuse checks |
| Card payments | lacking | Needs 3-D Secure handling |
| Automatic refunds | lacking | Needs PayMongo Refunds API, refund table, partial refunds |
| In-app chat (customer ↔ support) | lacking | Needs realtime messages, moderation |
| Multiple branches / store picker | lacking | Every table needs `branch_id` |
| Inventory / ingredients | lacking | `/manage/inventory` is a placeholder |
| Phone number OTP | lacking | SMS costs money |
| Push notifications / PWA | lacking | Needs service worker, VAPID keys |
| Dark mode | lacking | Every screen needs `dark:` styles |
| Staff global search (Ctrl+K) | lacking | Cross-table search endpoint |
| Dine-in QR table ordering | lacking | Different business flow |
| BIR official receipts / e-invoicing | lacking | Needs BIR registration |

---

## Summary Counts

| Priority | Items | Estimated Hours |
|----------|-------|-----------------|
| 🔴 P1 (Critical/Legal) | 8 | ~8 h |
| 🟠 High | 4 | ~8 h |
| 🟡 Medium | 18 | ~20 h |
| Future work (document only) | 14 | N/A |

> [!IMPORTANT]
> **Recommended order for the final run:**
> 1. Verify and complete P1 items (1.1–1.8) — these are legal or security gaps
> 2. Complete the panel-feedback high items (2.1, 2.2)
> 3. Pick the highest-impact medium items: F17 VAT, best sellers, design tokens
> 4. Document everything else as known limitations in the paper

---

## Cross-Reference: Issue #117 (MERGED via PR #129)

For reference, these items were assigned to issue #117 and are **now fully merged** into `development`:

- Order page: date-range filter, customer name/phone search, payment-method filter, order-type filter (L30)
- Manager-only "Payment issues" tab for `awaiting_payment`/`payment_failed` orders
- Customer list: server-side pagination, lifetime `totalOrders`/`totalSpent`, sortable, last 10 orders in detail (L31)
- Reports: payment-method breakdown, hour-of-day/weekday breakdown, cancellation-reason breakdown, CSV download (L32)
- "Cash remitted" table on reports page
- Menu price changes restricted to MANAGER role; `product_price_log` table
- KDS: amber past 15 min, red past 25 min; new-order chime; "Enable sound" button; highlight special instructions
- KDS sort toggle (Oldest/Newest), Grid/List view toggle, "Cancelled (today)" tab
- 3RD PARTY COURIER / SELF PICKUP badge on KDS and order cards (F21)
- Cancel "Confirm" disabled until reason typed; preset cancel reasons (F22)
- KDS link in the management sidebar

---

## Section 9 — Simulated Frustration Scenarios & Persona Reviews

To ensure we understand *why* these features matter, we simulated the most frustrating scenarios customers and staff would encounter with the current build. The personas reviewed them:

### 9.1 The "Out of Stock Trap" (Customer Frustration: False Hope)
- **Scenario:** A customer spends 5 minutes customizing 8 meals for a family dinner. They hit "Place Order". The database rejects it because the *Spicy Garlic Chicken* ran out of stock 2 minutes ago. The generic error says "We couldn't place your order." or the cart simply locks. The customer doesn't know *which* item is out of stock. They have to blindly guess or give up entirely.
- **Persona Review (Mark — Regular Customer):** *"If I spend time ordering for my office and the app just says 'failed', I'll just order from McDo instead of playing a guessing game on what's sold out. It wastes my time."*
- **Ties to:** L2 (Cart is not re-checked at checkout properly in the UI to highlight specific missing items).

### 9.2 The "Ghost Wallet" Delay (Customer Frustration: Anxiety)
- **Scenario:** A customer pays via GCash. The money is deducted from their wallet. The network drops before the redirect back to the app. They reopen Yang's, and the order says `awaiting_payment` because the PayMongo webhook is delayed by 2 minutes. 
- **Persona Review (Ana — New Customer):** *"I would panic if GCash deducted my money but the app says awaiting payment, and there's no chat or phone number to call immediately. I'd think I got scammed and complain on Facebook."*
- **Ties to:** S10 (Payment webhook replay window) and lack of store contact details (L13, F4).

### 9.3 The "Missing Context" Review Follow-up (Manager Frustration: Multiple Clicks)
- **Scenario:** Manager Ms. Cruz sees a 1-star review on the dashboard: *"Food was cold and missing my extra rice."* She wants to call the customer to apologize and offer a refund. However, the review on the report doesn't link directly to the order. She has to copy the order ID, switch to the Orders tab, search it, open the modal, and find the phone number. That's 5+ clicks and 2 context switches.
- **Persona Review (Ms. Cruz — Manager):** *"I don't have time to play detective during a lunch rush just to apologize to a customer. Reviews should link directly to the order and the customer's phone number."*
- **Ties to:** Issue #117 (Report breakdowns and linking).

### 9.4 The "Refund Maze" (Staff Frustration: Disconnected Systems)
- **Scenario:** An order is cancelled because the kitchen ran out of ingredients. The order was paid via PayMongo. The staff clicks "Cancel" on the Yang's UI. The customer calls asking for their refund. The staff realizes cancelling in Yang's doesn't trigger a refund in PayMongo. They have to open PayMongo in a separate tab, log in, search for the transaction, and manually refund it.
- **Persona Review (Mr. Yang — Owner):** *"My staff forgets to do the second step in PayMongo. Then angry customers call me. Cancelling a paid order should at least warn the staff 'Don't forget to process the refund in PayMongo!' or show a direct link."*
- **Ties to:** Future work (Automatic refunds / Refund owed list).

### 9.5 The "Invisible High-Spender" (Manager Frustration: No Advance Queries)
- **Scenario:** It's the holidays and Mr. Yang wants to reward his top 5 customers with a free meal. The Manager goes to the `Customers` tab. It lists all 1,500 customers. There is no `totalSpent` column filled, no way to sort by orders, and no export. The manager literally cannot answer "Who are our best customers?" without writing a custom SQL query.
- **Persona Review (Paolo — System Analyst):** *"The UI has the data in the database but traps it. A basic 'sort by total spent' is a standard CRM feature. Without it, the data is useless to the business."*
- **Ties to:** L31 (Customer list has no order totals or history).

### 9.6 The "Disappearing Ticket" (Kitchen Frustration: Abrupt Workflow Changes)
- **Scenario:** A customer orders a large meal and staff accepts it, moving it to `preparing`. The kitchen starts cooking. Then the customer calls and asks to cancel it. The manager clicks Cancel. On the Kitchen Display System (KDS), the ticket instantly vanishes without a sound, flash, or warning. 
- **Persona Review (Jun — Kitchen Staff):** *"When a ticket just vanishes without a warning, I get confused if the system glitched or if it was really cancelled. We end up finishing the dish, wasting food nobody will pay for."*
- **Ties to:** Issue #117 (KDS "Cancelled" tab, amber/red timers, and new-order chimes).

### 9.7 The "Audit Log Haystack" (Owner Frustration: Poor Searchability)
- **Scenario:** A massive ₱3,500 order gets cancelled. Mr. Yang opens the order details, but it only says *when* it was cancelled, not *who* cancelled it (staff vs customer). He goes to the Audit Log to find out. However, the Audit Log only filters by Category or Actor Name, and has no search bar for `order_id`. He has to manually click through 15 pages of pagination to find the exact cancellation event.
- **Persona Review (Mr. Yang — Owner):** *"When a big order gets cancelled, I need to know instantly who clicked the button. I shouldn't have to scroll through pages of daily logs just to find the needle in the haystack."*
- **Ties to:** L9 (No order status history shown on the order detail modal itself) and Issue #117.

### 9.8 The "Lost Favorite" (Customer Frustration: Arbitrary Limits)
- **Scenario:** Mark orders lunch 3 times a week. He wants to use "Order Again" for a highly customized meal (no onions, extra sauce) he bought 3 months ago. He goes to "My Orders" but can't find it. Because he orders so often, that meal was pushed past the `HISTORY_LIMIT = 30` hard cap. There is no search bar, and no way to load older orders.
- **Persona Review (Mark — Regular Customer):** *"I order here all the time. Why can't I search my own past orders for the 'Chopsuey' I liked? Limiting it to 30 means my older custom favorites are just wiped out."*
- **Ties to:** User Simulation Q9 (My Orders hard limit and lack of search).

### 9.9 The "Irreversible Click" (Staff Frustration: One-Way Operations)
- **Scenario:** The kitchen gets busy and a staff member's hand slips on the KDS tablet. They accidentally tap "Mark Completed" on a large order that just started cooking. The order jumps from `preparing` to `completed` and instantly vanishes from the active queue. There is NO "Undo" button, and the database rigidly blocks moving a `completed` order backward. The kitchen stops cooking because there's no ticket, and the customer arrives 20 minutes later for food that isn't ready.
- **Persona Review (Jun — Kitchen Staff):** *"Tablets get greasy and mistakes happen. If I accidentally bump the screen and complete an order, I can't put it back. I have to shout to everyone to remember the order in their heads. It's a disaster."*
- **Ties to:** L9 (No status history) and rigid state machine enforcement without a grace period or undo buffer.

### 9.10 The "Silent Price Hike" (Customer Frustration: Confusion & Repetition)
- **Scenario:** A customer builds a cart over a few hours while working. The manager updates the price of a menu item in the meantime. When the customer clicks checkout, the database rejects it because the `expected_prices` no longer match. The generic error says "Prices have changed," but doesn't clearly highlight the specific item or automatically offer to update the cart to the new total. 
- **Persona Review (Ana — New Customer):** *"If the app fails my order because a price changed, but doesn't tell me what changed or give me a button to just accept the new price, I'll think the app is broken."*
- **Ties to:** L2 (Cart is not re-checked at checkout properly in the UI).

### 9.11 The "Disabled Dead End" (Customer Frustration: Infinite Loop)
- **Scenario:** A customer's account gets disabled by the manager after 3 unpaid no-shows. A month later, the customer requests a password reset. Supabase Auth happily sends the reset email, and they successfully set a new password. But when they try to log in, `is_account_disabled` silently kicks them out without a specific "Your account is banned" message. They get stuck in a frustrating reset loop.
- **Persona Review (Mark — Regular Customer):** *"If you let me reset my password but won't let me log in, just tell me my account is banned! Don't let me go through the whole email reset process for nothing."*
- **Ties to:** L18 (Nothing stops repeat no-shows gracefully) and generic Auth error handling.


# More things:
- Easy statistics analysis for the manager. On menu management and ordermanagemnt a quicks stats overview like total order completed, cancelled, failed, etc. 
- Add advance searching, filtering and sorting on customers, order managemnt, menu managemnt, employee management, and and audit logs.
- if the user is not logged in, the should still be able to receive updates about their order status.