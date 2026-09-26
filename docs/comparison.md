# Comparison analysis — Yang's Fried Rice vs current ordering systems

**Compared against:** Jollibee, McDelivery PH, Mang Inasal and Chowking (restaurant-owned apps), GrabFood and foodpanda
(delivery platforms), and two open-source systems for the back office, which the chain apps don't show publicly:
[crizt0495/restaurant](https://github.com/crizt0495/restaurant) (Next.js + Supabase, same stack as ours) and
[TSunny007/kitchen-pos-system](https://github.com/TSunny007/kitchen-pos-system).

**How to read the tables**

| Mark | Meaning |
|---|---|
| ✅ | Has it (for competitors: confirmed in their help center, app listing or news; for us: checked in the code) |
| ◐ | Partly |
| ❌ | Doesn't have it (only used for **our** system, where we can check the code) |
| — | Not confirmed in our research. It may exist; we just couldn't verify it |
| **L#** | We can add it in 1.5 days (see [`limitations.md`](limitations.md)) |

Sources for every competitor claim are in [`lacking.md`](lacking.md#sources).

---

## 1. Summary

| Area | Yang's today | After the 1.5-day plan | Compared with the chains |
|---|---|---|---|
| Core ordering (menu, cart, add-ons, pickup/delivery) | ✅ Complete | ✅ | **At par** |
| Payment | ◐ GCash/Maya, COD, pay in store; no cards | ◐ | **Slightly behind** (no cards) |
| Discounts and legal compliance | ❌ No Senior/PWD, no vouchers | ◐ Senior/PWD added (L4) | **Behind → at par on the legal part** |
| Tracking and communication | ◐ Live status, rider card; no contact, no notifications | ◐ Notifications, tap-to-call (L10, L11) | **Behind** (no chat, no live rider GPS) |
| Customer retention (rewards, favourites, scheduling) | ◐ Reorder only | ◐ "Order again" row (L20) | **Behind** |
| Back office (KDS, reports, menu, staff) | ✅ Strong | ✅ Stronger (L7, L9, L17, L19) | **Ahead of most school projects**, at par with open-source basics, behind full POS systems (inventory, audit log) |
| Rider operations | ✅ Queue, map, proof of delivery | ✅ + cash summary (L19) | **At par** for a single store |
| Security | ◐ Good login protection; database rules too loose | ✅ Fixed (L21, L15, L1, L5) | **Behind → at par** |

**One-line verdict:** the system matches the big chains on the core ordering flow and beats a typical school project
on the back office. It falls behind on legal discounts, security rules around order creation, and the marketing
features (vouchers, rewards, scheduling) that big brands use to bring customers back. The 1.5-day plan closes the legal
and security gaps, but not the marketing gap.

---

## 2. Customer ordering

| Feature | Yang's | Jollibee | McDelivery | Mang Inasal | Chowking | GrabFood | foodpanda |
|---|---|---|---|---|---|---|---|
| Browse menu without an account | ✅ | — | — | ✅ (website) | — | — | ✅ |
| Add to cart without an account | ❌ ("You must be signed in") | — | — | — | — | — | — |
| Delivery and pickup | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Add-ons / customisation | ✅ | ✅ | — | — | — | — | — |
| Special instructions per item | ✅ | — | — | — | — | — | — |
| Reorder a past order | ✅ (My Orders only) | ✅ | ✅ ("Favorite Meals") | — | — | — | — |
| Favourites | ❌ | — | ✅ | — | — | — | — |
| Schedule for later | ❌ | ✅ (up to 24 h) | — | — | — | — | ✅ (up to 7 days) |
| Send to several addresses in one order | ❌ | — | ✅ | — | — | — | — |
| Sold-out items blocked | ◐ (at add, not at checkout: **L2**) | — | — | — | — | — | — |
| Delivery area check | ✅ (NCR, 15 km) | — | — | — | — | — | — |
| Store-hours check | ◐ (browser only: **L1**) | — | — | — | — | — | — |
| Best sellers shown | ❌ (**L14**) | — | — | — | — | — | — |

**Analysis:** the ordering flow itself is complete, and special instructions per item plus a real delivery-area check are
more than several chain websites show. The gaps are about **speed for repeat customers** (favourites, scheduling) and
**friction for new ones** (can't add to cart before signing up). Baymard's food-delivery research names both, slow reordering
and hard-to-find popular items, as common problems.

---

## 3. Payment and pricing

| Feature | Yang's | Jollibee | McDelivery | Mang Inasal | Chowking | GrabFood | foodpanda |
|---|---|---|---|---|---|---|---|
| GCash / Maya | ✅ (PayMongo) | — | ✅ | — | ✅ | — | — |
| Credit / debit card | ❌ (commented out) | ✅ | ✅ | — | ✅ | — | ✅ |
| Cash on delivery | ✅ | ✅ | ✅ | — | ✅ | — | — |
| Pay in store (pickup) | ✅ | — | — | — | — | — | — |
| Retry or switch to COD after a failed payment | ✅ | — | — | — | — | — | — |
| Delivery fee | ₱50 + ₱10/km | — | — | **₱49 fixed, no surge** | — | — | — |
| Senior / PWD 20% discount | ❌ (**L4**) | ✅ (ID + photo) | — | ✅ (ID + photo) | — | — | — |
| Vouchers / promo codes | ❌ | — | ✅ | ✅ (app-exclusive) | ✅ | — | ✅ |
| Rider tip | ❌ | — | — | — | — | — | ✅ |
| Minimum order / COD cap | ❌ (**L6**) | — | — | — | — | — | — |
| Automatic refund when a paid order is cancelled | ❌ | — | — | — | — | — | — |

**Analysis:** payments are in good shape for a single store. The failed-payment recovery (retry or switch to COD) is a
thoughtful touch. The clear problem is the **Senior/PWD discount**: it's required by RA 9994 and RA 10754, and the 2022
joint memorandum circular extends it to online orders. Jollibee and Mang Inasal both handle it with an ID number and ID photo
at checkout. The delivery fee is also worth a look: Mang Inasal markets a flat ₱49 as a selling point, while ours goes up
with distance (₱150 at the 10 km mark).

---

## 4. Tracking and communication

| Feature | Yang's | Jollibee | McDelivery | Mang Inasal | Chowking | GrabFood | foodpanda |
|---|---|---|---|---|---|---|---|
| Live order status | ✅ (realtime) | ✅ | ✅ | — | ✅ | — | — |
| Arrival estimate | ✅ (kitchen queue + distance) | — | — | — | — | — | — |
| Assigned rider name, photo, vehicle | ✅ | — | — | — | — | — | — |
| Live rider location on a map | ❌ | — | — | — | — | — | — |
| Chat with rider or support | ❌ | — | ✅ (live chat) | — | — | — | ✅ (help chat) |
| Call the store / rider | ❌ (**L11**; no contact details on site) | — | — | — | — | — | — |
| Notifications | ❌ (table exists, unused: **L10**) | — | — | — | — | — | — |
| Contactless delivery option | ❌ | — | — | — | — | — | ✅ |
| Proof-of-delivery photo | ✅ | — | — | — | — | — | — |

**Analysis:** the arrival estimate based on kitchen queue and distance is a real strength. Many apps show a fixed range, and
our own checkout did too until it was fixed. The weak point is that **a customer can't reach anyone**. There's no phone, email or
chat on the site, and the notification table is never filled. For a small shop, a phone number and tap-to-call (L11, L13)
solve most of this without building chat.

---

## 5. Customer accounts and retention

| Feature | Yang's | Jollibee | McDelivery | Mang Inasal | Chowking | GrabFood | foodpanda |
|---|---|---|---|---|---|---|---|
| Sign-up with email confirmation | ✅ | — | — | — | — | — | — |
| Phone OTP | ❌ | — | — | — | — | — | — |
| Saved addresses, default address | ✅ | — | — | — | — | — | — |
| Order history with receipts | ✅ | — | — | — | — | — | — |
| Rate an order | ✅ | — | — | — | — | ✅ | ✅ |
| Loyalty points / rewards | ❌ | — | — | — | ✅ (birthday treat) | — | — |
| App-exclusive deals | ❌ | — | ✅ | ✅ | ✅ | — | — |
| Installable app / push | ❌ | ✅ (native) | ✅ (native) | ✅ (native) | ✅ (native) | ✅ | ✅ |
| Delete account | ✅ (but allowed mid-delivery: **L16**) | — | — | — | — | — | — |

**Analysis:** account management is complete. What we're missing is everything chains use to **bring customers back**:
native apps, rewards and app-only deals. These are business and marketing features more than technical ones, and none fit in
1.5 days, but the paper should name them as future work.

---

## 6. Back office — compared with open-source systems

Chain apps don't publish their back office, so this section compares us with the two open-source systems.

| Feature | Yang's | crizt0495/restaurant | TSunny007/kitchen-pos |
|---|---|---|---|
| Kitchen display (KDS), live | ✅ | ✅ | ✅ |
| KDS elapsed timer | ✅ | ✅ | — |
| KDS late-order warning | ❌ (**L17**) | ✅ | — |
| Per-item status on KDS | ❌ | ✅ | — |
| Menu, categories, add-ons | ✅ | ✅ (+ variants) | ✅ (+ modifiers) |
| Sold-out toggle | ✅ (manual) | ✅ (automatic from stock) | ✅ (stock counts) |
| Archive instead of delete | ✅ | — | — |
| Sales / performance reports | ✅ (+ PDF) | ✅ (20 report types, CSV/print) | — |
| Dashboard | ✅ (today) | ✅ | — |
| Staff roles | ✅ (3 roles) | ✅ (48 permissions) | ◐ |
| Rider queue, map, proof of delivery | ✅ | ❌ | ❌ |
| Inventory / recipes | ❌ (placeholder page) | ✅ | ◐ |
| Promotions (BOGO, happy hour) | ❌ | ✅ | — |
| Loyalty tiers | ❌ | ✅ | — |
| Refund workflow | ❌ | ✅ | — |
| Cash shift / variance | ❌ (**L19** covers riders) | ✅ | — |
| Audit log | ❌ (**L9** covers orders) | ✅ | — |
| Pause store / busy mode | ❌ (**L7**) | — | — |
| Dark mode, installable (PWA) | ❌ | ✅ | — |

**Analysis:** our back office is **strongest on delivery**. Neither open-source project has a rider workflow, and ours has a
shared queue, map routing, a 10-delivery limit and proof of delivery. We fall behind a full POS on **money and stock control**:
inventory, refunds, shift cash counts and an audit log. These matter to a real owner: our own simulation's owner persona asked
"who changed the price?" and "how much cash should each rider hand over?"

---

## 7. Security

| Measure | Yang's | crizt0495/restaurant | TSunny007/kitchen-pos | Industry guidance (OWASP) |
|---|---|---|---|---|
| Row-level security in the database | ◐ (on, but order inserts too loose: **L21**) | ✅ | ✅ | Required |
| Orders created in one atomic database step | ❌ (**L15**) | ✅ (`create_order_atomic`) | — | Required (prevents race conditions) |
| Prices recalculated on the server | ✅ in the app / ❌ via direct API (**L21**) | ✅ | — | Required |
| Login rate limiting | ✅ (5 per email, 30 per IP) | — | — | Recommended |
| Signed payment webhook | ✅ | — | — | Required |
| Separate staff login, no staff self-sign-up | ✅ | — | ✅ | Recommended |
| Service-role key kept on the server | ✅ | ✅ | ✅ | Required |
| Security headers (CSP, frame blocking) | ❌ (**L5**) | — | — | Recommended |
| Two-factor login for managers | ❌ | — | — | Recommended |
| CAPTCHA on sign-up | ❌ | — | — | Recommended |
| Audit log | ❌ | ✅ | — | Recommended |
| Security test report | ✅ (Phase 4 report) | — | — | Recommended |

**Analysis:** the login side is well protected: rate limiting, signed webhooks, a separate employee session and a security
test report are more than most projects have. The weak spot is **order creation**. The app checks everything, but the database
still lets a signed-in customer skip the app and write orders directly (L21), and the app's own write isn't atomic (L15).
The same-stack open-source project solves both with one database function. After L21, L15, L1 and L5, we would be at par
on the measures that matter most.

---

## 8. Where we stand

**Ahead**
- Arrival estimate from real kitchen queue and distance.
- Rider operations: shared live queue, map routing, delivery limit, proof-of-delivery photo, cash-collected check.
- Failed-payment recovery (retry, or switch to cash on delivery).
- Order lines keep the name and price at order time, and products are archived instead of deleted, so history never breaks.
- Documentation and testing: 79 test files and a security test report.

**At par**
- Menu, cart, add-ons, pickup and delivery, GCash/Maya, cash on delivery, live status, ratings, reorder, saved addresses.

**Behind (fixable in 1.5 days)**
- Senior/PWD discount (L4), direct-database order writes (L21), double orders (L15), server-side store hours (L1),
  security headers (L5), notifications (L10), contact details (L11, L13), pause store (L7).

**Behind (future work)**
- Vouchers and rewards, scheduled orders, card payments, chat, live rider GPS, native app/push, inventory, refunds, audit log.

---

## 9. Recommendation

1. **Fix what could embarrass the demo first:** L21 and L15. Someone who knows Supabase could create a ₱1 order in front of the panel.
2. **Fix what the law requires next:** L4 (Senior/PWD). It's the one gap every chain has already closed.
3. **Then the cheap visible wins:** contact details and tap-to-call (L11, L13), best sellers (L14), "Order again" (L20),
   and the KDS late-order colours (L17). These are the things a panel notices in a live demo.
4. **In the paper,** present vouchers, rewards, scheduling, chat and inventory as future work, and cite the chain apps and
   open-source systems above as the reason they're on the roadmap.
