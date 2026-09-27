# Persona review — final build (29 September 2026)

Each checklist in `.agents/skills/persona-*` was walked against the code and the live
database after the final run. This file records the result, what was fixed during the
review, and what is left for the owner.

Legend: ✅ in place · 🔧 fixed during this review · ⚠️ partly · ❌ not done · — not
applicable (the shop is pickup-only, so rider, delivery-fee and COD items no longer apply).

## Fixed during the review

| Persona | Finding | Fix |
|---|---|---|
| New customer, Senior customer | No way to get another confirmation email | Login says "Confirm your email first" and offers **Resend confirmation email** (`resendConfirmationEmail`) |
| Kitchen staff | Marking a dish sold out meant leaving the KDS | **Sold out** dialog on the KDS (`components/manage/kds/sold-out-dialog.tsx`) |
| Security analyst S12 | `/api-docs` and `/openapi.json` served in production | Both 404 in production (`app/api-docs/layout.tsx`, `middleware.ts`) |
| Manager, Owner, System analyst | Order detail did not say who changed or cancelled an order | **History** section on the staff order detail, from `order_status_log` |
| DBA, System analyst, Developer | No CHECK on `order.order_status`; `received` still in the trigger and kitchen counts | Migration `20260929140000`: CHECK added, `received`/`confirmed` retired |
| Manager (9.3) | Reviews not linked to the order or phone; menu editor never loaded reviews | Dashboard "Latest ratings" and menu-editor reviews link to the order and phone |
| Accountant, Owner (9.4) | Failed refund not visible on the order | Refund notice with **Open in PayMongo** on the order; Refunds panel showed a UUID as the order number |
| Regular, New customer (9.1, 9.10) | Checkout did not point at sold-out or re-priced lines | Lines highlighted; **Remove sold-out items** / **Accept new prices** |
| System analyst (4.3) | ETA accuracy could not be measured | **Ready on time** rate on the performance report and PDF |

## Checklists

### Ana — new customer
✅ Browse without signing in · ✅ names, prices, photos · ✅ store hours and closed state · ✅ phone and email in footer and `/store` · ✅ "Sign in to order" returns to the dish · ✅ short sign-up with strength meter and 18+ checkbox · ✅ lands on the menu after confirming · 🔧 resend confirmation · ✅ add-ons and instructions · ✅ sold-out greyed out · ✅ GCash/Maya and pay in store · ✅ server-side store-hours check · ✅ live tracking and notifications · ✅ readable order number · — delivery-area and delivery-fee items

### Mark — regular customer
✅ "Order again" row (last 3) · ✅ reorder restores add-ons and skips unavailable dishes · 🔧 price changes shown at checkout with accept · ✅ type the quantity · ✅ edit add-ons from the cart · ✅ retry or switch to cash · ✅ unpaid wallet orders cancelled after 30 min (`expire-abandoned-orders`) · ✅ notification bell (realtime) · ✅ search and "show older" in My Orders · ✅ printable receipt

### Lolo Ben — senior customer
✅ Senior/PWD option with ID number, name and photo · ✅ 20% off the VAT-exclusive amount · ✅ "Verify ID" badge for staff · ✅ ID photo deleted after completion or cancellation · ✅ ID number and name saved per transaction · ✅ 14px minimum, 44px targets, labelled icons (Lighthouse 100 on the ordering pages) · ✅ "change for ₱___" · ✅ VATable sales / VAT / Total at checkout · ✅ `tel:` link · ✅ forgot password · 🔧 resend confirmation · — rider handover and COD cap

### Jun — kitchen staff
✅ Readable KDS cards · ✅ amber > 15 min, red > 25 min · ✅ chime with "Enable sound" · ✅ special instructions highlighted · ✅ courier / self-pickup badge · ✅ sort, grid/list, cancelled-today tab · ✅ staff land on the KDS · ✅ transitions enforced in the database · ✅ cancel needs a reason, presets offered · 🔧 sold out from the KDS · ✅ sold-out dishes refused at checkout · ✅ search by customer name · ✅ "ready — Counter 1" notification · ✅ prices are manager-only

### Mr. Yang — restaurant owner
✅ Pay-in-store marked paid on pickup (0 completed with ₱0) · ✅ GCash and Maya recorded separately (older rows stay `paymongo`) · ✅ Manila-time reports · ✅ price changes manager-only, logged in `product_price_log` · 🔧 who cancelled, on the order itself · ✅ disabling locks the account out · ✅ cash remitted per day · ✅ sales by hour and weekday, cancellation reasons, CSV · ⚠️ period comparison is "vs previous period" only, not month-on-month or year-on-year · ✅ pause, auto-busy, hours in `store_setting` · ✅ refunds list, with 🔧 PayMongo link

### Accountant
✅ Payment method and status CHECK constraints · ✅ VAT split shown and `tax_amount` saved · ✅ discount type, ID number and amount per transaction · ⚠️ no dedicated Senior/PWD CSV for BIR (the data is in `transaction`) · ✅ refunds tracked in `transaction` (`refund_pending` / `refund_failed` / `refunded`) · ✅ CSV export, Manila time · ⚠️ live data has contradictions (7 completed + failed, 24 cancelled + paid, 7 duplicate transactions, 5 completed orders with no transaction) — cleared by the database clean-up

### Data analyst
✅ CSV beside every PDF · ✅ payment, hour, weekday, cancellation breakdowns · ✅ Manila business day · ✅ top customers by spend · ⚠️ `order_item_add_on` has no price column; `order_item.unit_price` holds the line price including add-ons, which covers revenue but not per-add-on analysis · ❌ new vs returning customers per month · ❌ no `is_demo` flag (seed data is removed instead)

### Rica — database admin
✅ RLS on every public table · ✅ indexes on `order(customer_id, created_at)`, `order(order_status, created_at)`, `order_item(order_id)`, `transaction(order_id)` · 🔧 CHECK on `order_status` · ✅ unique `order.cart_id` · ✅ cron: abandoned and unaccepted orders, refunds, nightly retention purge · ✅ live migrations match the repo · ⚠️ no CHECK on `order.order_type` yet (live rows still hold `delivery`/`pickup`/NULL) — added with the clean-up

### Developer
✅ `types/` holds the real types; no mock files remain · ✅ one order-creation path (`submit_cart_to_order`) · ✅ CHECK constraints on status columns · ✅ `.env.local.example` · ⚠️ REST routers in `app/api/routers/` still exist beside server actions · ✅ seed script with edge cases (`scripts/db-seed.mjs`)

### Atty. Reyes — lawyer
✅ J1 RLS on `employee` · ✅ J2 discount and ID flow · ✅ J3 terms current (no card claim, refunds explained, report-a-problem, governing law, DTI hotline) · ⚠️ J4 business name, address, phone and email shown; **no DTI/SEC registration number** — the owner has to supply it · ✅ J5 `/privacy` with processors, retention and rights · ✅ J6 18+ checkbox · ✅ J7 private buckets, signed URLs, retention job · ✅ J8 "not an official receipt" · — J9 maps removed · ✅ J10 status log and `promised_at`

### QA tester
✅ No customer insert on order tables · ✅ Place order disables itself; `FOR UPDATE` + unique `cart_id` · ✅ quantity cap 20, 30 items per order · ✅ store hours checked in the database · 🔧 sold-out and price changes caught and explained at checkout · ✅ account deletion blocked while an order is open · ✅ `is_account_disabled` checked in every guard; `getUser()` not `getSession()`

### Security analyst
✅ S1–S3 · ✅ S4 disabled accounts · ✅ S5 `getUser()` · ✅ S6 private buckets for IDs and issue photos · ✅ S7 every report RPC checks the caller's role inside; `best_sellers` is public by design · ⚠️ S8 **leaked-password protection is off** — a Supabase Auth dashboard setting for the owner · ✅ S9 security headers · ✅ S10 signature + 5-minute replay window · ✅ S11 no service-role fallback in production · 🔧 S12 API docs hidden in production

### Paolo — system analyst
✅ `VALID_TRANSITIONS` mirrored by the database trigger · 🔧 `received` removed · ✅ store hours, quantity cap and order creation each have one source · ✅ best sellers and "Order again" · ⚠️ `order_type` still mixed on live until the clean-up

### Ms. Cruz — manager
✅ KDS in the sidebar · ✅ placeholder pages 404 in production · ✅ search by name or phone, filters by date, payment and type · ✅ payment-issues tab · ✅ pending-too-long flash · ✅ cancel reasons, logged, customer notified by notification and email · ✅ server-side customer list with totals and last 10 orders · ✅ disabling locks out · ✅ unaccepted orders auto-cancel after 20 min · — rider items

### Mika — UI designer
✅ Colours on tokens (no hex values left in markup; the 6 matches are in comments) · ✅ 8-step type scale and radius set enforced by `__tests__/design-scale.test.ts` · ✅ shared `<Button>` (the only raw `<button>`s are inside `Button` and `Switch` themselves) · ✅ glossary terms · ✅ loading, empty, error and not-found states · ✅ bottom tab bar with "Account" · ✅ `next/font` for DM Sans and Anton · ✅ no dead `dark:` classes

## Left for the owner

1. **Leaked-password protection** — Supabase dashboard → Authentication → Password security.
2. **DTI/SEC registration number** for the footer and `/store` (Internet Transactions Act).
3. **CAPTCHA (F13)** — needs Cloudflare Turnstile keys; not started by request.
