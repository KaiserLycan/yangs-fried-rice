import os
import re

def rewrite_limitations():
    path = "docs/limitations.md"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Table replacements
    content = content.replace("No minimum order or COD cap", "No minimum order amount")
    content = content.replace("RLS is off on `employee` and `rider`", "RLS is off on `employee`")
    content = content.replace("proof-of-delivery photos are public", "senior/PWD ID photos are public")
    content = content.replace("A customer can delete their account mid-delivery", "A customer can delete their account before picking up")
    content = content.replace("No \"change for ₱___\" on cash on delivery", "No \"change for ₱___\" on cash payments")
    content = content.replace("| 11 | No tap-to-call between rider and customer | P2 | 0.5 h |", "| 11 | (Removed - Delivery disabled) | | |")
    content = content.replace("Nothing stops repeat cash-on-delivery no-shows", "Nothing stops repeat pickup no-shows")
    content = content.replace("No end-of-day cash summary per rider", "No end-of-day cash summary at the counter")
    
    # Section replacements
    content = content.replace("The rider sees \"Check senior/PWD ID on handover\".", "Staff check the ID on handover to the customer or their 3rd party courier (Lalamove).")
    content = content.replace("refuse delivery orders under ₱150 and cash-on-delivery orders over ₱3,000", "refuse orders under ₱150")
    content = content.replace("a ₱15 delivery order is allowed, and so is a ₱20,000 cash-on-delivery order. The second is\n  a common prank or fraud pattern: a rider carries food nobody pays for.", "a ₱15 order is allowed, and so is a ₱20,000 cash order. The second is\n  a common prank or fraud pattern: staff cook food nobody pays for.")
    content = content.replace("with a ₱0 delivery\n  fee, an address outside NCR, and ₱1 item prices", "with ₱1 item prices")
    content = content.replace("A rider can be on the way to a customer who no longer exists,\n  with no name or phone to call.", "A customer might delete their account while their food is being prepared, leaving an uncollectable order.")
    
    content = content.replace("### 8. No \"change for ₱___\" on cash on delivery\n- Riders need to know how much change to bring. Without it, the rider either carries a lot of cash or the customer waits while they find change.\n- **Fix:** an optional amount field when cash on delivery is picked (it must be at least the total).\n  Store it on the order or transaction and show \"Bring ₱X change\" on the rider's delivery screen.", "### 8. No \"change for ₱___\" on cash payments\n- Staff need to know how much change to prepare. Without it, the customer waits while they find change.\n- **Fix:** an optional amount field when cash payment is picked (it must be at least the total).\n  Store it on the order or transaction and show \"Prepare ₱X change\" on the KDS or receipt.")
    
    content = content.replace("### 11. No tap-to-call between rider and customer\n- Riders can already see the customer's phone. Make it a `tel:` link. \"Call rider\" still waits on the\n  missing `employee.phone_number` column (see `docs/unimplemented_issues.md`). Add the column in the same change.", "### 11. (Removed)")

    content = content.replace("### 18. Nothing stops repeat cash-on-delivery no-shows\n- **Why:** fake and no-show cash orders are a known problem in the Philippines. Grab PH has looked at ways to protect\n  riders from no-show customers, and a Senate bill targets fake orders and unjust cancellations.\n- **Fix:** count a customer's cash-on-delivery orders that were cancelled after cooking started. After 2, hide\n  cash on delivery for that account and show \"Please pay with GCash or Maya for your next order.\"\n  A manager can reset it on the customer page.\n- **Also cap the first order.** Viral Philippine cases show fake COD orders worth ₱1,700–₱15,000 sent to strangers' addresses.\n  A brand-new account's first cash-on-delivery order should have a lower cap (for example ₱1,000). Larger first orders pay by GCash or Maya.", "### 18. Nothing stops repeat pickup no-shows\n- **Why:** fake and no-show cash orders are a known problem.\n- **Fix:** count a customer's cash orders that were not picked up. After 2, hide\n  cash payment for that account and show \"Please pay with GCash or Maya for your next order.\"\n  A manager can reset it on the customer page.\n- **Also cap the first order.** To prevent massive waste, a brand-new account's first cash order should have a lower cap (for example ₱1,000). Larger first orders pay by GCash or Maya.")
    
    content = content.replace("### 19. No end-of-day cash summary per rider\n- **Now:** riders tick \"cash collected\", but nobody can see how much cash each rider should hand over at the end of the day.\n- **Fix:** a \"Cash to remit\" table on the reports page: rider, number of cash orders, total collected, for a chosen day.\n  It is a simple sum over completed cash-on-delivery orders.\n- **Seen in:** the GitHub POS projects close each cashier shift with expected-versus-actual cash.", "### 19. No end-of-day cash summary\n- **Now:** nobody can see how much cash the counter should have at the end of the day.\n- **Fix:** a \"Cash remitted\" table on the reports page: number of cash orders, total collected, for a chosen day.\n  It is a simple sum over completed cash orders.\n- **Seen in:** the GitHub POS projects close each cashier shift with expected-versus-actual cash.")
    
    content = content.replace("`proof-of-delivery`", "`senior-pwd-ids`")
    content = content.replace("`create_delivery_for_ready_order()` and ", "")
    content = content.replace("`cash`, `cash_on_delivery`, `gcash`, `GCash` and `paymongo`", "`cash`, `pay_in_store`, `gcash`, `GCash` and `paymongo`")
    content = content.replace("All four storage buckets are public", "Storage buckets are public")
    content = content.replace("Make `proof-of-delivery` private and show photos with\n  `createSignedUrl` (valid for a few minutes). Keep the Senior/PWD ID photos from L4 in a private bucket from the start.", "Make `senior-pwd-ids` private and show photos with `createSignedUrl` (valid for a few minutes).")

    content = content.replace("The rider map hides the OpenStreetMap credit (`attributionControl={false}` in `components/deliver/map-content.tsx:167`)\n  and shows the LocationIQ credit even when ArcGIS tiles are loaded.", "The system still has unused map components that can be removed.")
    content = content.replace("Turn attribution back on\n  and show the right credit for each tile source.", "Remove the map components entirely.")

    content = content.replace("| F14 | \"Couldn't deliver\" status for riders; strikes lead to COD block, then manager review | P2 | 2 h |", "| F14 | \"Customer no-show\" status; strikes lead to cash block, then manager review | P2 | 2 h |")
    content = content.replace("| F15 | All riders busy: allow pickup only | ❌ | No | 🕐 |", "| F15 | (Removed - Pickup only) | | | |")
    content = content.replace("| F18 | Delivery time should grow with items; per-item prep time; checkout and tracking consistent | ◐ | Partly (lacking round 3) | 🕐 |", "| F18 | Prep time should grow with items; per-item prep time; checkout and tracking consistent | ◐ | Partly (lacking round 3) | 🕐 |")
    content = content.replace("| F19 | Rider tips with preset amounts (moved from `lacking.md`) | P2 | 2 h |", "| F19 | Staff tips with preset amounts (moved from `lacking.md`) | P2 | 2 h |")
    content = content.replace("| F21 | PICKUP / DELIVERY badge on KDS and order cards | **P1 (panel)** | 0.25 h |", "| F21 | 3RD PARTY COURIER / SELF PICKUP badge on KDS and order cards | **P1 (panel)** | 0.25 h |")
    content = content.replace("| F25 | Separate food and delivery ratings; per-item ratings with \"rate all the same\" | P2 | 2 h |", "| F25 | Separate food and service ratings; per-item ratings with \"rate all the same\" | P2 | 2 h |")
    
    content = content.replace("### F9. Bulk orders: cap by capacity — ◐\n- **Now:** the per-item cap is 20 in the UI (99 on the server, L2). There's no cap on the **whole** order, so 20 of each of 10\n  dishes (200 items) can go on one motorcycle. Riders can carry up to `MAX_ACTIVE_DELIVERIES` (10) deliveries, but that\n  counts orders, not size.\n- **Fix (⚡):** a `MAX_ITEMS_PER_DELIVERY` (for example 30 items) checked in `submitCart` for delivery orders. Above it, show\n  \"That's a big order! Please choose pickup, or contact us for a bulk order.\" Measuring by **weight** needs a weight on every\n  product, so an item count is the practical version.", "### F9. Bulk orders: cap by capacity — ◐\n- **Now:** the per-item cap is 20 in the UI (99 on the server, L2). There's no cap on the **whole** order.\n- **Fix (⚡):** a `MAX_ITEMS_PER_ORDER` (for example 30 items) checked in `submitCart`. Above it, show\n  \"That's a big order! Please contact us for a bulk order or catering.\"")

    content = content.replace("### F14. Food not delivered — ❌\n- **Now:** a rider can only complete a delivery (with a photo). No \"failed\" outcome exists. Customers can be disabled by a\n  manager (`is_account_disabled`), but nothing counts failed deliveries.\n- **Fix (🕐 2 h):**\n  - A rider button **\"Couldn't deliver\"** with reasons (customer unreachable, wrong address, refused), a required photo, and a\n    new order status `delivery_failed`.\n  - Count failed cash deliveries per customer. After 2, hide cash on delivery for that account (L18). After 3, the manager is\n    prompted to disable it. Don't ban automatically on the first one: the rider could be wrong.", "### F14. Customer no-show — ❌\n- **Now:** customers can be disabled by a manager (`is_account_disabled`), but nothing counts no-shows automatically.\n- **Fix (🕐 2 h):**\n  - A staff button **\"Customer no-show\"** with reasons, and a new order status `pickup_failed`.\n  - Count failed cash orders per customer. After 2, hide cash payment for that account (L18). After 3, the manager is prompted to disable it.")
    
    content = content.replace("### F15. All riders busy → pickup only — ❌\n- **Now:** there's a per-rider cap (`MAX_ACTIVE_DELIVERIES` = 10) but no check at checkout. If every rider is full, delivery orders\n  still come in and wait.\n- **Fix (🕐 1 h):** at checkout, count active riders (`rider.is_active`) and their open deliveries. If none have space, disable\n  Delivery with \"All our riders are busy. Pickup is available.\" Part of F11.", "### F15. (Removed)\n- Not applicable, pickup only.")
    
    content = content.replace("### F18. Delivery time should depend on items — ◐", "### F18. Prep time should depend on items — ◐")

    content = content.replace("### F19. Tips with presets — ❌\n- In `lacking.md` (foodpanda has it). **Fix (🕐 2 h):** preset buttons (₱0, ₱20, ₱50, ₱100, custom) at checkout, a `tip_amount`\n  column, and the tip added to the PayMongo amount or collected with cash. Show both peso amounts, not percentages (Baymard).\n  All of the tip goes to the rider; show it on the rider's cash summary (L19).", "### F19. Tips with presets — ❌\n- In `lacking.md`. **Fix (🕐 2 h):** preset buttons (₱0, ₱20, ₱50, ₱100, custom) at checkout, a `tip_amount`\n  column. Show both peso amounts, not percentages (Baymard).\n  All of the tip goes to the staff.")

    content = content.replace("### F21. Pickup orders: KDS and riders — ◐\n- **Riders never get pickup orders:** ✅ the database trigger only creates a delivery row when `order_type` is `delivery`\n  (`20260921000003_qa_fixes_rls_delivery_roles.sql:97`), and staff can't set `out_for_delivery` on a take-out order (P52).\n  Pickup orders already go `ready → completed` with a \"Picked up\" action.\n- **KDS doesn't show the type:** ◐ `map-staff-order.ts:130` computes `type`, but `kds-order-card.tsx` and `order-card.tsx` never\n  display it. The cook can't tell pickup from delivery.\n- **Fix (⚡):** a clear badge on each KDS and order card: **PICKUP** or **DELIVERY**.", "### F21. 3RD PARTY COURIER or SELF PICKUP — ◐\n- **Fix (⚡):** a clear badge on each KDS and order card: **3RD PARTY COURIER** or **SELF PICKUP** so staff know who is picking up the order.")

    content = content.replace("### F25. Ratings: food vs delivery, per item — ◐\n- **Now:** one 1–5 star rating per **order** with an optional comment (`components/orders/order-rating.tsx`, P36). The `review`\n  table already supports **per-product** reviews (`product_id` column, unique `(order_id, product_id)` index), and a\n  `submit_direct_product_review` function exists, so the database is ready.\n- **Fix (🕐 2 h):** in the rating dialog, show **Food** and **Delivery** (delivery only for delivery orders) as separate star\n  rows, then each item with its own stars and a **\"Rate all items the same\"** switch. Store delivery ratings on `delivery` (or a\n  `review.kind` column) so rider performance can use them (persona 7).", "### F25. Ratings: food vs service, per item — ◐\n- **Now:** one 1–5 star rating per **order** with an optional comment (`components/orders/order-rating.tsx`, P36). The `review`\n  table already supports **per-product** reviews (`product_id` column, unique `(order_id, product_id)` index), and a\n  `submit_direct_product_review` function exists, so the database is ready.\n- **Fix (🕐 2 h):** in the rating dialog, show **Food** and **Service** as separate star rows, then each item with its own stars and a **\"Rate all items the same\"** switch.")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def rewrite_lacking():
    path = "docs/lacking.md"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("| Delivery and pickup | All | ✅ |", "| Pickup only | All | ✅ (Delivery removed) |")
    content = content.replace("| Cash on delivery | Jollibee, McDo, Chowking | ✅ |", "| Pay in store | Jollibee, McDo, Chowking | ✅ |")
    content = content.replace("| Proof of delivery photo | Grab, foodpanda riders | ✅ |", "| Proof of delivery photo | Grab, foodpanda riders | ❌ (Removed) |")
    content = content.replace("Touches store hours, the ETA engine, KDS ordering, the rider queue and payment timing.", "Touches store hours, the ETA engine, KDS ordering, and payment timing.")
    content = content.replace("| **Rider tipping** | foodpanda (card/e-wallet, 100% to rider) | Changes the PayMongo amount, rider payouts and reports. |", "| **Staff tipping** | foodpanda (card/e-wallet) | Changes the PayMongo amount and reports. |")
    content = content.replace("| **In-app chat (customer ↔ rider / support)** | McDelivery live chat, foodpanda help chat | Needs realtime messages, moderation and staff inbox. Tap-to-call (in `limitations.md`) covers most of the need. |", "| **In-app chat (customer ↔ support)** | McDelivery live chat, foodpanda help chat | Needs realtime messages, moderation and staff inbox. |")
    content = content.replace("| **Failed delivery flow** (customer not home, wrong address, refuses order) | Grab, foodpanda | Needs a new status, return-to-store handling, and rules on charging. |", "| **Failed pickup flow** (customer no-show) | Grab, foodpanda | Needs a new status, and rules on charging. |")
    content = content.replace("| **Live rider GPS on the customer map** | Grab, foodpanda | Needs the rider's browser to share location in the background, which phones limit. Battery and privacy concerns. |", "| **Live rider GPS** | Grab, foodpanda | N/A - pickup only. |")
    content = content.replace("| **Send to several addresses in one order** | McDelivery | Rare need. Splits one order into several deliveries. |", "| **Send to several addresses in one order** | McDelivery | N/A - pickup only. |")
    
    content = content.replace("- **Customer not home or unreachable.** There is no \"failed delivery\" outcome. The rider can only complete it.\n- **Rider has an accident or their phone dies mid-delivery.** Riders can hand a delivery back themselves, but check whether a manager can take it off an unreachable rider. If not, the order is stuck with that rider.", "- **Customer no-show.** There is no \"failed pickup\" outcome. The staff can only complete it.")
    content = content.replace("- **Customer cancels once the food is with the rider.** Already handled: customers can only cancel while the order is\n  `pending`. This matches the House and Senate bills against unjust cancellations, which protect riders from losing money\n  on food already picked up. Worth saying in the paper.", "- **Customer cancels once the food is prepared.** Already handled: customers can only cancel while the order is `pending`. This protects the store from losing money on food already prepared.")
    
    content = content.replace("| Waited up to an hour with no confirmation, then cancelled because the address was \"outside coverage\" | Mang Inasal app reviews | ✅ **Better.** The address is checked for NCR and 15 km **before** payment. ◐ But an unaccepted order still waits forever (**L22**) |", "| Waited up to an hour with no confirmation | Mang Inasal app reviews | ◐ But an unaccepted order still waits forever (**L22**) |")
    content = content.replace("| Fake cash-on-delivery orders (₱1,700–₱15,000) left riders paying out of pocket | GMA News, Esquire PH, Coconuts, 8List; Senate and House bills | ◐ COD cap and no-show guard planned (**L6**, **L18**, first-order cap added to L18) |", "| Fake cash orders (₱1,700–₱15,000) | GMA News, Esquire PH | ◐ Cash cap and no-show guard planned (**L6**, **L18**, first-order cap added to L18) |")
    content = content.replace("- **Pickup instructions and a \"ready\" alert** matter as much as delivery tracking (**L10** extended).", "- **Pickup instructions and a \"ready\" alert** matter a lot (**L10** extended).")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def rewrite_feedback():
    path = "docs/feedback-verification.md"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("| F9 | Bulk orders: cap by weight/number for a motorcycle, or schedule them | ◐ | No | ⚡ cap / 🧱 scheduling |", "| F9 | Bulk orders: cap by number, or schedule them | ◐ | No | ⚡ cap / 🧱 scheduling |")
    content = content.replace("| F11 | High demand: pause ordering, auto-reopen in 5 min, smart restriction (**repeated by Ma'am**) | ❌ | Yes (L7, extended) | 🕐 |", "| F11 | High demand: pause ordering, auto-reopen in 5 min, smart restriction (**repeated by Ma'am**) | ❌ | Yes (L7, extended) | 🕐 |")
    content = content.replace("| F14 | Food not delivered: rider option, or ban the account | ❌ | Yes (lacking, L18) | 🕐 |", "| F14 | Customer no-show: staff option, or ban the account | ❌ | Yes (lacking, L18) | 🕐 |")
    content = content.replace("| F15 | All riders busy: allow pickup only | ❌ | No | 🕐 |", "| F15 | (Removed) | | | |")
    content = content.replace("| F18 | Delivery time should grow with items; per-item prep time; checkout and tracking consistent | ◐ | Partly (lacking round 3) | 🕐 |", "| F18 | Prep time should grow with items; per-item prep time; checkout and tracking consistent | ◐ | Partly (lacking round 3) | 🕐 |")
    content = content.replace("| F19 | Tips with preset amounts | ❌ | Yes (lacking) | 🕐 |", "| F19 | Staff tips with preset amounts | ❌ | Yes (lacking) | 🕐 |")
    content = content.replace("| F21 | Pickup: KDS should show it; riders shouldn't get pickup orders | ◐ | No | ⚡ |", "| F21 | 3rd party courier vs self pickup indicator on KDS | ◐ | No | ⚡ |")
    content = content.replace("| F25 | Ratings: separate food and delivery; per item; \"rate all the same\" | ◐ | No | 🕐 |", "| F25 | Ratings: separate food and service; per item; \"rate all the same\" | ◐ | No | 🕐 |")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def rewrite_simulation():
    path = "docs/user-simulation.md"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content = content.replace("RLS is off on `employee` and `rider`", "RLS is off on `employee`")
    content = content.replace("every employee's and rider's", "every employee's")
    content = content.replace("delivery fee", "order fee")
    content = content.replace("delivery_fee", "order_fee")
    content = content.replace("Delivery addresses have no saved coordinates, so demand can't be mapped without geocoding every address again", "(Removed)")
    content = content.replace("She can't see the delivery fee until checkout, because it depends on her address. \"₱50 + ₱10/km\" isn't shown on the menu.", "She has to specify if she uses a 3rd party courier.")
    content = content.replace("There's no phone number or email to ask \"Do you deliver to Pasig?\"", "There's no phone number or email to contact the store.")
    content = content.replace("\"Delivery from ₱50\" shown on the menu, plus a \"Check if we deliver to you\" address box.", "")
    content = content.replace("No tap-to-call between rider and customer", "No tap-to-call between staff and customer")
    content = content.replace("wait on the rider", "wait on the food")
    content = content.replace("delivery(rider_id)", "")
    content = content.replace("delivery(rider_id, delivery_status)", "")
    content = content.replace("He can't see how much cash each rider collected today (L19).", "He can't see how much cash the counter collected today (L19).")
    content = content.replace("rider cash-to-remit report", "counter cash-to-remit report")
    content = content.replace("She can't reassign a delivery from a rider who went offline (lacking, \"real-world scenarios\").", "(Removed)")
    content = content.replace("Riders and their active load", "(Removed rider tracking queries)")
    content = content.replace("SELECT e.name, count(d.delivery_id) FILTER (WHERE d.delivery_status IN ('pending', 'delivering')) AS active\nFROM rider r JOIN employee e USING (employee_id)\nLEFT JOIN delivery d ON d.rider_id = r.rider_id\nWHERE r.is_active GROUP BY e.name ORDER BY active DESC;", "")
    content = content.replace("delivery_address", "")
    content = content.replace("rider's", "staff's")
    content = content.replace("rider", "customer/courier")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

rewrite_limitations()
rewrite_lacking()
rewrite_feedback()
rewrite_simulation()
print("Done")
