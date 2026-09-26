# Lacking — compared with current restaurant ordering apps

Research date: September 2026. Compared against Jollibee, McDelivery PH, Mang Inasal, Chowking,
GrabFood and foodpanda (help centers, app store listings and news), plus Philippine laws that apply
to online food ordering.

**Short verdict:** the core flow matches what the big apps do. Menu, cart, add-ons, pickup or delivery,
GCash/Maya, live tracking, rider queue, proof of delivery, KDS, reports and ratings are all in place,
which is more than most school projects have. What's missing is mostly **legal compliance
(Senior/PWD discount)**, **server-side rules for real-world edge cases**, and **marketing extras**
(vouchers, rewards, scheduling).

The gaps that fit in 1.5 days have been **moved to [`limitations.md`](limitations.md)**. Everything below
is too large for that time or needs outside services, accounts or money. List it as a known limitation or future work.

---

## What we already match

| Feature | Big apps | Us |
|---|---|---|
| Pickup only | All | ✅ (Delivery removed) |
| GCash / Maya | All | ✅ (PayMongo) |
| Pay in store | Jollibee, McDo, Chowking | ✅ |
| Live order tracking | All | ✅ (Supabase realtime) |
| Reorder past orders | Jollibee ("re-order must-have bites") | ✅ |
| Sold-out items | GrabFood, foodpanda | ✅ (`is_available`) |
| Ratings | Grab, foodpanda | ✅ |
| Proof of delivery photo | Grab, foodpanda riders | ❌ (Removed) |
| Login rate limiting, signed webhooks, terms consent | Standard | ✅ |

---

## Features still lacking

| Feature | Seen in | Why it's not a 1.5-day job |
|---|---|---|
| **Scheduled / advance orders** | foodpanda (up to 7 days ahead), Jollibee (up to 24 hours ahead) | Touches store hours, the ETA engine, KDS ordering, and payment timing. Around 1–2 days by itself. |
| **Vouchers / promo codes** | Mang Inasal, Chowking, McDo, foodpanda | Needs a promo table, rules (expiry, usage limit, minimum spend, per-user limit), manager screens and abuse checks. |
| **Loyalty points / birthday treats** | Chowking (free Halo-Halo on birthday), Jollibee rewards | Needs a points ledger, earning and redeeming rules, and fraud rules. |
| **Staff tipping** | foodpanda (card/e-wallet) | Changes the PayMongo amount and reports. |
| **In-app chat (customer ↔ support)** | McDelivery live chat, foodpanda help chat | Needs realtime messages, moderation and staff inbox. |
| **Card payments** | McDo, Chowking, Jollibee | PayMongo supports cards, but they need 3-D Secure handling and a separate test flow. |
| **Automatic refunds** | All apps with online payment | When staff cancel a GCash/Maya order that was already paid, nothing returns the money. PayMongo has a Refunds API, but it needs a refund table, partial refunds and reporting. For now, list it as a manual process. |
| **Failed pickup flow** (customer no-show) | Grab, foodpanda | Needs a new status, and rules on charging. |
| **Live rider GPS** | Grab, foodpanda | N/A - pickup only. |
| **Multiple branches / store picker** | Jollibee, McDo, Mang Inasal | Every table needs a `branch_id`. Too large a schema change. |
| **Send to several addresses in one order** | McDelivery | N/A - pickup only. |
| **Inventory / ingredients** | Restaurant back offices | `/manage/inventory` is a placeholder. Needs recipes, stock movements and deductions per order. |
| **Phone number OTP verification** | Jollibee, Grab, foodpanda | SMS costs money (Semaphore, Twilio). Email verification is the free substitute. |
| **Push notifications / installable app (PWA)** | All (native apps) | Needs a service worker, VAPID keys and permission prompts. |
| **Nutrition and allergen info** | McDo | Needs data for every menu item from the restaurant. |
| **Filipino language option** | Some local apps | Every screen's text would need translating. |
| **Promotion types** (buy-one-get-one, buy X get Y, happy-hour prices) | GitHub POS projects, chain apps | Builds on a voucher engine we don't have yet. |
| **Loyalty tiers** (Bronze → Platinum) | GitHub POS projects | Builds on loyalty points we don't have yet. |
| **Dark mode** | GitHub POS projects, most apps | Tailwind is set up for it (`darkMode: ["class"]`), but no component has `dark:` styles, and many use fixed colours like `bg-[#fbf6ec]`. Every screen would need restyling. |
| **Staff global search (Ctrl+K)** across orders, customers, menu | GitHub POS projects | Needs a search endpoint across several tables plus a command-palette UI. |
| **Per-item status on the KDS** (mark each dish done) | GitHub KDS projects | Needs a status column per order line and a new KDS layout. The whole-order status is enough for one kitchen. |
| **Fine-grained permissions** (e.g. staff can edit menu but not prices) | GitHub POS project (48 permissions) | Our three fixed roles are simpler and fine for one store. |
| **Dine-in QR table ordering** | GitHub POS projects | A different business flow (tables, waiters, bill-out). Not needed for a delivery/pickup shop. |
| **BIR official receipts / e-invoicing** | Real stores | Needs BIR registration and an accredited system. Out of scope for a school project. The printable receipt in `limitations.md` should say "not an official receipt". |

---

## Security measures still lacking

| Measure | Why it's not a 1.5-day job |
|---|---|
| **Two-factor login for managers** | Supabase supports TOTP, but employee login uses its own signed cookie (`jose`), so 2FA would need wiring in two places. |
| **CAPTCHA on sign-up and login** (Cloudflare Turnstile / hCaptcha) | Small (about 1–2 h), but needs a third-party account and keys. Do it next if time is left. The existing rate limit covers the main risk. |
| **Full audit log for manager actions** (price changes, role changes, account disabling) | The order-status log in `limitations.md` covers orders only. Covering every admin action is bigger. |
| **Data retention / automatic deletion** (Data Privacy Act) | Deciding how long to keep orders, addresses and ID photos, then building jobs to purge them. |
| **Penetration test / dependency scanning in CI** | Needs a CI pipeline. The Phase 4 security report covers manual testing. |
| **Concurrency tests for business logic** (OWASP WSTG 4.10: two checkouts at once, negative/huge numbers, skipping steps) | The fix for the double-order race is in `limitations.md`. A proper test suite that fires parallel requests against a real database is extra work. |

---

## Real-world scenarios still not handled

- **Customer paid, then the store cancels.** No automatic refund (see above).
- **Customer no-show.** There is no "failed pickup" outcome. The staff can only complete it.
- **Kitchen is overwhelmed.** No throttling beyond the ETA growing. Busy mode (in `limitations.md`) is the quick fix. Real capacity limits per time slot are bigger.
- **Bad weather / surge.** Mang Inasal advertises a fixed ₱49 fee with no surge pricing, which is what we do, so this is fine as is.
- **Two customers share one address, or one phone number is used on several accounts.** No duplicate checks. Low risk.
- **Customer cancels once the food is prepared.** Already handled: customers can only cancel while the order is `pending`. This protects the store from losing money on food already prepared.

---

## Round 3 — web articles, app reviews and social media

Reddit, Facebook, X and TikTok can't be read directly by the research tools. Social media was covered through news
reports of viral posts (GMA News, Esquire PH, Inquirer, 8List), app-store reviews, and TikTok search pages.

### What customers complain about (and how we compare)

| Complaint | Where it was seen | Yang's today |
|---|---|---|
| Waited up to an hour with no confirmation | Mang Inasal app reviews | ◐ But an unaccepted order still waits forever (**L22**) |
| App said the order was successful but it had failed; card charged twice | Jollibee app reviews (Google Play, 2025) | ✅ **Better.** Wallet orders stay `awaiting_payment` until PayMongo's signed webhook confirms, and failures show a retry or switch-to-cash option |
| Refund not received after a cancelled online payment, or given only as store credit | Mang Inasal reviews, foodpanda complaints | ❌ No refund flow (see Features table above) |
| Missing, wrong or damaged items with nowhere to report them | foodpanda complaints, PissedConsumer, DoorDash/Uber Eats help flows | ❌ No report flow (**L24**) |
| App's ready time didn't match the store's text message | Jollibee app reviews | ◐ The ETA updates live, but the first promise isn't saved (see `user-simulation.md`, persona 12) |
| Fees that only appear at the last step | Consumer Reports, US FTC settlements with Grubhub (2024) and Instacart (2025), UX case studies | ✅ **Good.** The cart shows the delivery fee, calculated from distance, before checkout |
| Fake cash orders (₱1,700–₱15,000) | GMA News, Esquire PH | ◐ Cash cap and no-show guard planned (**L6**, **L18**, first-order cap added to L18) |
| Can't cancel once the restaurant has accepted | foodpanda terms | ✅ **Same rule.** Customers can cancel only while `pending` |

### UX findings from articles and case studies

- **Editing a customised item from the cart** is a top abandonment cause in Baymard's testing. We only allow quantity changes (**L23**).
- **Back button emptying the cart** caused abandonments on tested sites. ✅ Our cart is saved on the server, so going back never empties it.
- **"Order again" for returning customers** should be on the home page (**L20**).
- **Pickup instructions and a "ready" alert** matter a lot (**L10** extended).
- **Aggressive "Install our app" banners** annoy mobile users. ✅ We don't have any.
- **Accessibility:** small touch targets, low contrast and unlabeled "+"/"−" buttons are the most common failures.
  ✅ Our quantity buttons are labeled and photos have alt text. ◐ Text size and contrast still need an audit (**L25**).

### Business logic from ordering platforms

- **Order throttling** (Olo, Flipdish, ChowNow, Tillster): cap orders per time window or orders in progress, and show
  customers the real next available time instead of taking every order "as soon as possible". Our ETA grows with the queue,
  but nothing caps it (**L7** extended).
- **Rush-hour settings by day and time**, because staff levels change during the day. Needs the store-settings table from L7 first.
- **Make-time weighting:** a 10-item order takes longer than a 1-item order. Our ETA engine counts orders, not items.
  It's a small change to `lib/eta/engine.ts`, but tuning it needs real kitchen data first.

### Philippine market insights (for the paper)

- **Cash is still king, but shrinking.** A Delivery Hero survey found 51% of Filipinos prefer paying cash, 27% mobile wallets
  and 17% cards. Before the pandemic it was about 80/20 cash. Keeping cash on delivery is right, but it needs the fraud guards
  (L6, L18).
- **The 3–6 PM snack peak.** A 2025 market report says 87% of Filipinos who snack by delivery do it between 3 and 6 PM. Our
  store closes orders at 5:59 PM, so the peak is covered, but **dinner isn't**. That's a business decision worth mentioning, and
  editable store hours (L7) make it easy to change.
- **The Internet Transactions Act (RA 11967)** has been fully enforced by DTI since 20 June 2025. Online merchants must show
  prices, descriptions and the seller's contact details. That's why L13 is now P1.

### Still too big for 1.5 days

| Feature | Seen in | Why not now |
|---|---|---|
| Order throttling with **time slots** ("next available: 4:15 PM") | Olo, Flipdish, ChowNow | Needs scheduled orders first (see Features table). L7's capacity limit is the quick version |
| Refund choice: money back, store credit or redelivery | DoorDash, Uber Eats | Needs a refund system and store credit balances |
| Make-time weighting in the ETA | Olo | Needs real prep times (L9) to tune |
| SMS updates | Curbside pickup guides, chain apps | SMS costs money per message |
| **Group orders** (several people add to one cart, split the bill) | Panel feedback F2 | One cart per customer is enforced by a unique index. Needs shared carts, per-person items and split payments |
| **Bulk and advance orders** (party trays, 1–2 days' notice, separate page) | Panel feedback F10 | Needs scheduled orders first. Until then, show the store phone for bulk orders |
| **Vouchers, games, spin-the-wheel promos** | Panel feedback F1 | Needs a voucher engine and abuse rules. A simple promo banner is in `limitations.md` |

## Sources

- Mang Inasal — [Senior Citizen Discounts](https://help.manginasal.ph/hc/en-us/articles/10996962294031-Senior-Citizen-Discounts), [PWD Discounts](https://help.manginasal.ph/hc/en-us/articles/10997022063759-PWD-Discounts), [revamped app, ₱49 fixed fee](https://tribune.net.ph/2026/02/10/mang-inasal-rolls-out-revamped-delivery-app-with-lower-fees-exclusive-deals)
- Jollibee — [Senior Citizen discounts](https://help.jollibee.com.ph/hc/en-us/articles/12480515197071-Do-you-honor-Senior-Citizen-discounts), [PWD discounts](https://help.jollibee.com.ph/hc/en-us/articles/12480498095631-Do-you-honor-PWD-discounts), [How to order](https://help.jollibee.com.ph/hc/en-us/articles/12480164488207-How-do-I-place-an-order-on-the-Jollibee-app-or-website), [App Store listing](https://apps.apple.com/ph/app/jollibee-food-delivery-app/id6498993119)
- McDonald's PH — [McDelivery PH app](https://apps.apple.com/ph/app/mcdelivery-ph/id908862359), [App FAQ](https://www.mcdonalds.com.ph/app-faq)
- Chowking — [Chowking PH app (Google Play)](https://play.google.com/store/apps/details?id=ph.chowking.order), [chowkingdelivery.com](https://www.chowkingdelivery.com/)
- GrabFood — [Pause or unpause your store](https://help.grab.com/merchant/en-ph/360043870331-How-to-pause-or-unpause-my-restaurantstore), [Busy and temporary pause](https://help.grab.com/merchant/en-sg/900006072746-Activate-Busy-or-Temporary-Pause-for-my-restaurant)
- foodpanda — [Rider tipping](https://globalnation.inquirer.net/201970/say-thank-you-through-tips-foodpanda-now-has-rider-tipping-feature), [Contactless delivery](https://www.foodpanda.com/newsroom/foodpanda-philippines-launches-contactless-delivery/), [foodpanda guide (scheduling)](https://jontotheworld.com/foodpanda-complete-guide/)
- GitHub — [crizt0495/restaurant (Next.js + Supabase restaurant system)](https://github.com/crizt0495/restaurant), [TSunny007/kitchen-pos-system](https://github.com/TSunny007/kitchen-pos-system), [sancoders/OrdenesRestGercio](https://github.com/sancoders/OrdenesRestGercio), [TastyIgniter](https://github.com/tastyigniter/TastyIgniter), [food-ordering-system topic](https://github.com/topics/food-ordering-system)
- UX research — [Baymard: Food Delivery & Takeout UX](https://baymard.com/research/online-food-delivery), [Baymard 2025 review and 2026 roadmap](https://baymard.com/blog/year-in-review-2025-and-2026-roadmap)
- Security — [OWASP Business Logic Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html), [Price manipulation, negative quantity and coupon abuse](https://dev.to/roxdavirox/business-logic-in-e-commerce-apis-price-manipulation-negative-quantity-and-coupon-abuse-19pi)
- Philippine news — [Grab PH scheme vs no-show customers](https://newsinfo.inquirer.net/1297553/grab-ph-eyes-new-scheme-to-protect-food-couriers-vs-no-show-customers/amp), [Senate bill vs fake orders](https://newsinfo.inquirer.net/1399314/senate-panel-to-fast-track-bill-protecting-delivery-riders-from-fraud-orders/amp), [House bill vs unreasonable cancellations](https://newsinfo.inquirer.net/1287890)
- Reddit could not be searched: it blocks the research tool's crawler.
- Round 3, UX — [Baymard: 3 takeaways from 1,100+ hours of food delivery testing](https://baymard.com/blog/food-delivery-takeout-launch), [UX case study: food delivery app](https://medium.com/@janetadesujo/redefining-food-delivery-ux-a-case-study-on-improving-mobile-app-experience-by-team-hexa-9363b3a4db4d), [Deliveroo missing-item journey redesign](https://medium.com/@harjit_/fixing-the-frustration-redesigning-deliveroos-missing-item-journey-6052b9ce768b), [DoorDash: missing or incorrect item](https://help.doordash.com/en-us/consumers/article/my-order-was-missing-an-item-incorrect-order), [Uber Eats: my order is wrong](https://help.uber.com/ubereats/restaurants/article/my-order-is-wrong?nodeId=93fe8ec6-1f78-4279-a574-177d122fda26), [Bluedot: curbside pickup](https://bluedot.io/how-does-curbside-pickup-work/), [AudioEye: cart and checkout accessibility](https://www.audioeye.com/post/cart-checkout-accessibility/), [BOIA: accessible restaurant menus](https://www.boia.org/blog/make-your-restaurants-online-menus-accessible-5-tips)
- Round 3, business logic — [Olo: throttling strategies](https://olosupport.zendesk.com/hc/en-us/articles/115002752386-Order-Throttling-Strategies-Overview), [Olo: orders-in-progress limits](https://olosupport.zendesk.com/hc/en-us/articles/13294124769179-Throttling-Strategy-Orders-in-Progress-Limits), [Flipdish: order throttling](https://www.flipdish.com/us/resources/blog/product-update-manage-online-orders-during-peak-hours-with-order-throttling), [ChowNow: throttling settings](https://get.chownow.com/restaurant-support/how-do-i-manage-order-volume-with-order-throttling-settings/), [Consumer Reports: fee transparency](https://innovation.consumerreports.org/consumer-reports-investigates-fee-transparency-with-food-delivery-apps/), [ArentFox Schiff: FTC and delivery fees](https://www.afslaw.com/perspectives/alerts/whats-really-the-menu-ftc-examines-fee-transparency-online-food-delivery), [foodpanda PH terms](https://www.foodpanda.ph/contents/terms-and-conditions.htm)
- Round 3, reviews and social media — [Jollibee app reviews (App Store PH)](https://apps.apple.com/ph/app/jollibee-food-delivery-app/id6498993119?see-all=reviews), [Mang Inasal app (Google Play)](https://play.google.com/store/apps/details?id=ph.manginasal.order&hl=en), [Mang Inasal: delayed order assistance](https://help.manginasal.ph/hc/en-us/articles/11340853415055-Delayed-Order-Assistance), [foodpanda PH complaints (PissedConsumer)](https://foodpanda-philippines.pissedconsumer.com/reviews/RT-P.html), [GMA: riders and owners lament fake bookings](https://www.gmanetwork.com/news/lifestyle/content/740303/delivery-riders-restaurant-owners-lament-fake-booking-prank-orders/story/), [Esquire PH: viral ₱15,000 fake order](https://www.esquiremag.ph/culture/lifestyle/viral-post-pranksters-a2501-20210407), [Coconuts: 16 riders hit by fake orders](https://coconuts.co/manila/news/how-cruel-16-delivery-men-receive-fake-food-orders-in-manila/), [8List: prank orders hurt riders](https://8list.ph/prank-delivery-orders/), [TikTok: why foodpanda orders get cancelled](https://www.tiktok.com/discover/why-is-foodpanda-order-always-canceled)
- Round 3, Philippine market and law — [Manila Bulletin: consumers split between cash and cashless](https://mb.com.ph/2023/9/25/consumers-split-between-cashless-and-cash-payments), [Restroworks: Philippine restaurant statistics 2026](https://www.restroworks.com/blog/philippine-restaurant-industry-statistics/), [BusinessMirror: DTI enforces the Internet Transactions Act](https://businessmirror.com.ph/2025/06/23/new-rules-for-online-shopping-dti-enforces-internet-transactions-act-to-protect-consumers/), [RA 11967 full text](https://www.lawphil.net/statutes/repacts/ra2023/ra_11967_2023.html)
- Laws — [DSWD: online discount guidelines for seniors and PWDs](https://dswd.gov.ph/guidelines-on-discount-for-online-purchases-of-seniors-persons-with-disabilities-signed-dswd/), [DTI: 20% discount on online purchases](https://www.sunstar.com.ph/pampanga/local-news/dti-seniors-pwds-entitled-to-20-discounts-on-online-purchases), [Data Privacy Act website requirements](https://www.qx137.com/blog/philippines-data-privacy-act-websites)
