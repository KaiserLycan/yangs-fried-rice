# Staff workflow — acceptance criteria & live validation test plan

**Scope:** the "advanced data fetching + admin dashboard" issue — Orders filters and Payment Issues tab, customer list stats, report breakdowns + CSV, daily cash remitted, manager-only prices with a price log, KDS timers / chime / sort / view / cancelled tab, courier-vs-pickup badge, cancel reasons, KDS sidebar link.
**Branch:** `manager/staff-workflow`
**Database script:** [`staff-workflow-live-setup.sql`](staff-workflow-live-setup.sql) (same folder)

How to use this document: do **Part A** once, then work through **Part C** in order. Every test has a checkbox. Anything that fails: write what you saw in the notes line and keep going — the tests are independent unless they say otherwise.

---

## Contents

- [Part A — Set up the live environment](#part-a--set-up-the-live-environment)
- [Part B — Test data helpers (SQL, test only)](#part-b--test-data-helpers-sql-test-only)
- [Part C — Acceptance criteria and test cases](#part-c--acceptance-criteria-and-test-cases)
  - [AC-01 Orders filtering](#ac-01--orders-filtering-date-customer-payment-type)
  - [AC-02 Payment Issues tab](#ac-02--manager-only-payment-issues-tab)
  - [AC-03 Customer list](#ac-03--customer-list-server-pagination-lifetime-totals-last-10-orders)
  - [AC-04 Report breakdowns + CSV](#ac-04--report-breakdowns--csv-download)
  - [AC-05 Cash remitted](#ac-05--cash-remitted-table)
  - [AC-06 Manager-only prices + price log](#ac-06--manager-only-price-changes--product_price_log)
  - [AC-07 KDS timers, chime, instructions](#ac-07--kds-amber--red-timers-new-order-chime-highlighted-instructions)
  - [AC-08 KDS sort, view, cancelled tab](#ac-08--kds-sort-gridlist-cancelled-today)
  - [AC-09 Courier / self pickup badge](#ac-09--3rd-party-courier--self-pickup-badge)
  - [AC-10 Cancel reasons](#ac-10--cancel-reasons-and-greyed-out-confirm)
  - [AC-11 KDS link in sidebar](#ac-11--kds-link-in-the-management-sidebar)
- [Part D — Real-time validation (two screens)](#part-d--real-time-validation-two-screens)
- [Part E — Database security checks (SQL)](#part-e--database-security-checks-sql)
- [Part F — Regression smoke test](#part-f--regression-smoke-test)
- [Part G — Clean-up](#part-g--clean-up)
- [Sign-off](#sign-off)

---

## Part A — Set up the live environment

### A1. Apply the database script (Supabase) — required

The app code on this branch **will not work** against the current live database: checkout sends a new `p_fulfillment_method` argument, and the Customers page, reports and price log call functions that don't exist yet.

1. Supabase dashboard → your project → **SQL Editor** → **New query**.
2. Open `docs/live-setup/staff-workflow-live-setup.sql`, copy **all** of it, paste, click **Run**.
3. The result grid lists 15 checks. **Every row must say `PASS`.**

- [ ] All 15 rows PASS

Notes:
- The script is **one transaction**. If it errors, nothing was changed. If the error starts with `Preflight failed`, the message lists what the database is missing (an earlier migration was never applied).
- It is **safe to run again**. A second run changes nothing that matters (tested: real pickup choices, the price log and the realtime setup all survive a re-run).
- Row 15 tells you how many existing orders have "not specified" as their pickup type. All orders placed before this release should be "not specified"; that is expected.

### A2. Deploy the app

Deploy branch `manager/staff-workflow` to the live server **after** A1. (Running the SQL first is safe for the old app: the old checkout call and the old Customers page still work against the new functions. Deploying the app first is not: checkout would fail until the SQL runs.)

- [ ] Deployed. Quick check: signed in as a customer with something in the cart, `/checkout` shows a **WHO'S PICKING UP?** section. If it doesn't, the old build is still live.

### A3. Accounts and devices

| Name used below | What | Notes |
|---|---|---|
| **M** | Manager account | `employee.role` = Manager |
| **S** | Staff account | `employee.role` = Staff |
| **C1** | Customer account | Give it a distinctive name and phone, e.g. "Tester Alpha", `+63 917 000 1111` |
| **C2** | Second customer | Different name and phone, e.g. "Tester Bravo", `+63 918 000 2222` |

| Device | Used for |
|---|---|
| **Screen 1** (laptop, speakers on) | M or S on the KDS / Orders / Reports |
| **Screen 2** (another browser, incognito window, or phone) | C1 / C2 placing orders |

You will need the UUIDs of M, S, C1 for Part E. Get them with:

```sql
SELECT 'employee' AS kind, employee_id AS id, role AS detail FROM public.employee
UNION ALL
SELECT 'customer', customer_id, coalesce(name, '') || ' <' || coalesce(email, '') || '>' FROM public.customer
ORDER BY kind, detail;
```

### A4. Baseline test orders

Create these as C1 and C2 before Part C (normal checkout, **Pay in store** unless stated). Write each order number down — it is the 8 characters after `#` on the confirmation screen and on every staff card.

| Ref | Customer | Pickup choice | Payment | Item note | Order # |
|---|---|---|---|---|---|
| O1 | C1 | I'll pick it up | Pay in store | — | |
| O2 | C1 | A courier will pick it up | Pay in store | "No onions, extra chili" | |
| O3 | C2 | I'll pick it up | Pay in store | — | |
| O4 | C2 | A courier will pick it up | Pay in store | — | |

(An item note is typed in the dish's detail sheet on the menu, before adding it to the cart.)

---

## Part B — Test data helpers (SQL, test only)

Some behaviour depends on time passing (15 / 25 / 90 minutes) or on an online payment getting stuck. Instead of waiting, run these in the SQL Editor **on your own test orders only**. Replace `ORDERNUM` with the 8-character order number (lowercase, as printed).

**B1 — List recent orders**
```sql
SELECT left(o.order_id::text, 8) AS order_no, o.order_status, o.order_type, o.fulfillment_method,
       t.payment_method, o.created_at, o.ready_at, c.name AS customer
FROM public."order" o
LEFT JOIN public.transaction t ON t.order_id = o.order_id
LEFT JOIN public.customer c ON c.customer_id = o.customer_id
ORDER BY o.created_at DESC
LIMIT 20;
```

**B2 — Make an active order look older (KDS amber / red)**
```sql
-- 16 minutes → amber. Use 26 minutes for red.
UPDATE public."order" SET created_at = now() - interval '16 minutes'
WHERE order_id::text LIKE 'ORDERNUM%' AND order_status IN ('pending', 'preparing');
```

**B3 — Turn a fresh test order into a stuck GCash payment (Payment Issues)**
```sql
-- Only on a brand-new PENDING test order. No customer notification is sent.
UPDATE public.transaction SET payment_method = 'paymongo'
WHERE order_id = (SELECT order_id FROM public."order" WHERE order_id::text LIKE 'ORDERNUM%');
UPDATE public."order" SET order_status = 'awaiting_payment', created_at = now() - interval '6 minutes'
WHERE order_id::text LIKE 'ORDERNUM%' AND order_status = 'pending';
```

**B3b — Same, but a refused payment**
```sql
-- The customer gets a "payment didn't go through" notification — fine on a test account.
UPDATE public.transaction SET payment_method = 'paymongo'
WHERE order_id = (SELECT order_id FROM public."order" WHERE order_id::text LIKE 'ORDERNUM%');
UPDATE public."order" SET order_status = 'payment_failed', created_at = now() - interval '6 minutes'
WHERE order_id::text LIKE 'ORDERNUM%' AND order_status = 'pending';
```

**B4 — Make a ready take-out order overdue for pick-up (Failed Pick-up)**
```sql
-- Order must already be READY (marked Ready on the KDS) and paid in store.
UPDATE public."order" SET ready_at = now() - interval '91 minutes'
WHERE order_id::text LIKE 'ORDERNUM%' AND order_status = 'ready';
```

**B5 — Move a completed order's time (reports: hour / weekday / day)**
```sql
-- Manila 19:30 on 2026-09-26 (a Saturday). Adjust as needed.
UPDATE public."order"
SET created_at = '2026-09-26 19:30:00+08', completed_at = '2026-09-26 19:50:00+08'
WHERE order_id::text LIKE 'ORDERNUM%' AND order_status = 'completed';
```

**B6 — Read the price log**
```sql
SELECT l.changed_at AT TIME ZONE 'Asia/Manila' AS changed_at_manila, p.product_name,
       l.old_price, l.new_price, e.role AS changed_by_role, l.changed_by
FROM public.product_price_log l
JOIN public.product p ON p.product_id = l.product_id
LEFT JOIN public.employee e ON e.employee_id = l.changed_by
ORDER BY l.changed_at DESC
LIMIT 20;
```

---

## Part C — Acceptance criteria and test cases

Conventions: **M** = manager, **S** = staff, **C1/C2** = customers. "Card" = an order card on the Orders page or the KDS. All times are Manila time unless stated.

---

### AC-01 — Orders filtering (date, customer, payment, type)

> **Issue:** Implement API support and frontend UI for filtering the Orders page by date range, customer name/phone, and payment method.

**Acceptance criteria**
- AC-01.1 A **Filter** button sits next to "Search order #" on `/manage/orders`.
- AC-01.2 The filter panel offers: **From** / **To** dates, **Customer name**, **Customer phone**, **Payment** (Any / Pay in store / GCash / e-wallet), **Type** (Any / Take out / Dine in).
- AC-01.3 Filters are applied by the server: the page count and every page reflect the filter, not just the page currently shown.
- AC-01.4 Filters combine with each other, with the order-number search and with the status tab.
- AC-01.5 The Filter button shows how many filters are active; **Clear** removes all of them.
- AC-01.6 An end date before the start date cannot be applied.
- AC-01.7 A phone number matches however it is typed (`0917…`, `917…`, `+63 917…`, with or without spaces/dashes).
- AC-01.8 When nothing matches, the page says "No orders match these filters."

**TC-01-01 Filter button present** · M or S · `/manage/orders`
1. Open the Orders page.

Expected: a **Filter** button (funnel icon) between the search box and **View KDS**. Clicking it opens a panel titled **Filter orders** with the six fields in AC-01.2 and an **Apply filters** button.
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-02 Customer name** · M
1. Filter → Customer name `Tester Alpha` (C1) → Apply filters.

Expected: only C1's orders (O1, O2). Filter button shows a badge **1**. Pagination shows only as many pages as C1's orders need.
2. Change the name to `alpha` (lowercase, partial).

Expected: same result (match is case-insensitive and partial).
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-03 Customer phone, any format** · M
1. Filter → Customer phone `0918 000 2222` (C2) → Apply.
2. Repeat with `9180002222`, then `+63 918-000-2222`, then just `0002222`.

Expected: every variant shows only C2's orders (O3, O4).
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-04 Payment method** · M
1. Filter → Payment **Pay in store** → Apply.

Expected: only pay-in-store orders.
2. Payment **GCash / e-wallet**.

Expected: only online-payment orders (on the **All** tab these are paid online orders; unpaid ones live in Payment Issues). If you have none, the empty message appears — that is a pass.
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-05 Order type** · M
1. Filter → Type **Take out** → Apply.

Expected: only take-out orders (legacy "pickup" orders count as take-out).
2. Type **Dine in**.

Expected: only dine-in orders, or the empty message if there are none.
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-06 Date range** · M
1. Filter → From = today, To = today → Apply.

Expected: only orders placed today (local time, midnight to 23:59).
2. From = yesterday, To = yesterday.

Expected: only yesterday's orders; today's test orders are gone.
3. From = a date, To = only From set / only To set.

Expected: an open-ended range works either way.
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-07 Invalid range blocked** · M
1. Filter → From = today, To = yesterday.

Expected: red message "The end date can't be before the start date." and **Apply filters** is disabled. (The To picker also won't offer dates before From.)
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-08 Combining filters** · M
1. Name `Tester` + Payment **Pay in store** + From today → Apply.

Expected: badge **3**; only today's pay-in-store orders from both testers.
2. Type an order number (O2's) in **Search order #**.

Expected: only O2 (search + filters together).
3. Click the **Completed** tab.

Expected: filters still apply within that tab (likely empty until you complete a test order).
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-09 Clear, reopen, empty state** · M
1. With filters applied, open Filter → **Clear**.

Expected: all orders return, badge disappears.
2. Apply a name that matches nobody (`zzzz`).

Expected: "No orders match these filters."
3. Open Filter, type something, click outside the panel without applying, reopen.

Expected: the panel shows the filters actually applied, not the abandoned edits.
- [ ] Pass - [ ] Fail — notes: ______

**TC-01-10 Pagination respects the filter** · M
1. Page size 10. Filter to a customer with more than 10 orders (or use a date range covering many orders).
2. Go to page 2.

Expected: page 2 still only contains matching orders; the page count matches the filtered total. Changing a filter jumps back to page 1.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-02 — Manager-only "Payment Issues" tab

> **Issue:** Add a manager-only "Payment issues" tab on Orders showing awaiting_payment and payment_failed orders, so staff can help customers with stuck GCash payments.

**Acceptance criteria**
- AC-02.1 Managers see a **Payment Issues** tab on `/manage/orders` (second in the list). Staff do not.
- AC-02.2 It lists every online order still **awaiting payment** or **payment failed**, from the moment it is placed. (On live, the database's scheduled job cancels unpaid ones after 30 minutes, so the list only ever holds the last half hour.)
- AC-02.3 Cards show an **UNPAID** header (dark plum), the customer's name and contact in the detail view, and **no Confirm button** — an unpaid order can't be sent to the kitchen.
- AC-02.4 Staff can **Cancel** a stuck order (with a reason — see AC-10).
- AC-02.5 Unpaid orders do not appear on the **All** tab.
- AC-02.6 The server refuses the Payment Issues query for non-managers.

**TC-02-01 Visibility by role**
1. As **M**, open `/manage/orders`.

Expected: tabs read **All, Payment Issues, Queue, Preparation, Delivering / Pick Up, Completed, Canceled**.
2. As **S**, open `/manage/orders`.

Expected: no **Payment Issues** tab.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-02 Stuck payment appears** · setup: new order O5 (C1, pay in store), then helper **B3** on O5
1. As M, click **Payment Issues**.

Expected: O5 is listed with an **UNPAID** header. Footer shows only **Cancel**.
2. Click the card.

Expected: detail modal shows C1's name and phone/email so staff can contact them; header says UNPAID; only a Cancel action.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-03 Refused payment appears** · setup: new order O6, helper **B3b**
1. Payment Issues tab.

Expected: O6 listed as UNPAID.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-04 Fresh unpaid order is not yet an issue**
1. New order O7 → run B3 but change `interval '6 minutes'` to `interval '1 minute'`.
2. Payment Issues tab.

Expected: O7 is **not** listed. Wait ~4 more minutes and refresh: now it is.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-05 Not on the All tab**
1. **All** tab, search O5's number.

Expected: "No orders starting with #…" — unpaid orders are kept out of the working list.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-06 Cancel a stuck order**
1. Payment Issues → O5 → **Cancel** → pick **Customer request** → **Confirm**.

Expected: toast confirms; O5 disappears from Payment Issues and appears under **Canceled**. C1 gets an "Order … was cancelled by the store. Reason: Customer request" notification.
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-07 Empty state**
1. Cancel or clean up all stuck test orders, open Payment Issues.

Expected: "No stuck or failed payments right now."
- [ ] Pass - [ ] Fail — notes: ______

**TC-02-08 KDS agrees** · S or M · `/manage/kds`
1. With O6 still stuck, open the KDS tab **Payment Pending/Issues**.

Expected: O6 is there with a **Payment Issue** chip. (Same 5-minute rule as the Orders tab.)
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-03 — Customer list: server pagination, lifetime totals, last 10 orders

> **Issue:** Implement server-side pagination for the Customer list. Compute and display lifetime totalOrders and totalSpent per customer, make them sortable, and show the customer's last 10 orders in the detail view.

**Acceptance criteria**
- AC-03.1 `/manage/customers` (manager only) pages through customers on the server; page size can be changed.
- AC-03.2 Each row shows **Orders** (lifetime completed orders) and **Spent** (total paid on completed orders).
- AC-03.3 **Orders** and **Spent** (and Name, Since) are sortable ascending/descending across all pages.
- AC-03.4 Search matches name, email or phone, and punctuation in the search box (commas, brackets, `%`) cannot break the page.
- AC-03.5 Clicking a customer shows **Recent Orders (Last 10)** — that customer's 10 newest orders, and only theirs.

**TC-03-01 Totals are right** · setup: as S or M, take O1 through **Confirm → Ready → Picked Up** on the KDS or Orders page
1. As M, `/manage/customers`, search `Tester Alpha`.

Expected: **Orders** = number of C1's *completed* orders (at least 1), **Spent** = their total. Cancelled/unpaid/in-progress orders are not counted.
- [ ] Pass - [ ] Fail — notes: ______

**TC-03-02 Sorting across pages**
1. Clear search, page size 10. Click the **Spent** header → descending, again → ascending, again → back to default.

Expected: the highest spender overall is first on page 1 in descending order (not just the highest on the current page). Page 2 continues the order.
2. Repeat with **Orders**.
- [ ] Pass - [ ] Fail — notes: ______

**TC-03-03 Search by name, email, phone**
1. Search `alpha`, then C1's email, then `0001111`.

Expected: C1 each time.
- [ ] Pass - [ ] Fail — notes: ______

**TC-03-04 Punctuation-safe search**
1. Search `a,b` then `(test)` then `%` then `'`.

Expected: the page never errors; it shows matching customers or "No customers found." (`%` only matches names/emails/phones that literally contain `%`.)
- [ ] Pass - [ ] Fail — notes: ______

**TC-03-05 Last 10 orders are that customer's**
1. Click C1's row.

Expected: modal section **RECENT ORDERS (LAST 10)** lists only C1's orders, newest first, at most 10 (including unpaid/cancelled ones). C2's orders never appear.
2. Open C2.

Expected: only C2's orders.
- [ ] Pass - [ ] Fail — notes: ______

**TC-03-06 Staff cannot see customers**
1. As S, go to `/manage/customers`.

Expected: no Customers link in the sidebar; the URL redirects or refuses access.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-04 — Report breakdowns + CSV download

> **Issue:** Write queries for detailed report breakdowns: by payment method, by hour-of-day/weekday, by cancellation reason. Wire up a frontend CSV download button next to the existing PDF button.

**Acceptance criteria**
- AC-04.1 On `/manage/reports` (Sales and Order report, manager), an **Export CSV** button sits next to **Export to PDF**.
- AC-04.2 The CSV contains, for the chosen date range: **Cash remitted** by day with a total, **Sales by payment method**, **Sales by hour of day** (24 rows, 12 AM – 1 AM … 11 PM – 12 AM), **Sales by weekday** (Sunday … Saturday), **Cancellations by reason**.
- AC-04.3 Hours, weekdays and days are **Manila time** (the file says so).
- AC-04.4 Payment method spellings are grouped: "Pay in store" and "GCash / e-wallet".
- AC-04.5 Text with commas or quotes (e.g. a typed cancel reason) stays in one cell; the file opens correctly in Excel/Sheets (including ₱ and accents).
- AC-04.6 Only managers can export.

**TC-04-01 Button placement** · M · `/manage/reports`
1. Report type **Sales and Order**.

Expected: **Export to PDF** (red) and **Export CSV** (orange) side by side. Both disabled if End date is before Start date.
2. Switch to the menu / customer satisfaction report.

Expected: Export CSV is not offered there.
- [ ] Pass - [ ] Fail — notes: ______

**TC-04-02 CSV contents** · setup: at least 2 completed pay-in-store orders, 1 completed GCash order if available, 2 cancelled orders (one with preset reason, one with "Other" text containing a comma, e.g. `Rain, store flooded`)
1. Range covering today → **Export CSV**.

Expected file `yangs_report_<start>_to_<end>.csv` containing, in order:
- `Yang's Fried Rice report`, `Date range`, `Times,Asia/Manila`
- **Cash remitted (collected at the counter)** — `Date,Orders,Cash (PHP)` rows + `Total`
- **Sales by payment method** — `Pay in store` / `GCash / e-wallet` rows
- **Sales by hour of day** — exactly 24 rows
- **Sales by weekday** — exactly 7 rows, Sunday first
- **Cancellations by reason** — your preset reason and `Rain, store flooded` as one cell
- [ ] Pass - [ ] Fail — notes: ______

**TC-04-03 Manila hours** · setup: helper **B5** on one completed test order (19:30 Manila, Saturday 2026-09-26)
1. Export CSV for 2026-09-26 → 2026-09-26.

Expected: that order counts under **7 PM – 8 PM** and **Saturday**. (If it showed under 11 AM, times were being read as UTC.)
- [ ] Pass - [ ] Fail — notes: ______

**TC-04-04 Opens cleanly**
1. Open the CSV in Excel and in Google Sheets.

Expected: columns line up; the comma-containing reason is one cell; no garbled characters.
- [ ] Pass - [ ] Fail — notes: ______

**TC-04-05 Staff cannot export**
1. As S, try `/manage/reports`.

Expected: no Reports link; access refused/redirected.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-05 — "Cash remitted" table

> **Issue:** Add a "Cash remitted" table to the reports page showing daily cash totals collected at the counter. Powered by the backend aggregation query.

**Acceptance criteria**
- AC-05.1 The Sales and Order report shows a **Cash remitted** table below the charts: **Date · Orders · Cash**, one row per day with counter cash, and a **Total** row.
- AC-05.2 Counted: **completed** orders paid **in store** (cash), dated by the Manila day they were completed. GCash orders are not counted.
- AC-05.3 The **Cash Remitted** summary card equals the table's total.
- AC-05.4 A range with no counter cash says "No cash was collected at the counter in this period."

**TC-05-01 Today's cash** · setup: note today's Cash total, then complete O3 (pay in store) on the KDS: Confirm → Ready → Picked Up
1. Reload reports (range includes today).

Expected: today's row gained 1 order and O3's total; the Total row and the **Cash Remitted** card both went up by the same amount.
- [ ] Pass - [ ] Fail — notes: ______

**TC-05-02 GCash excluded**
1. Complete a GCash order (if online payment works on live) and reload.

Expected: Cash remitted unchanged.
- [ ] Pass - [ ] Fail / N/A — notes: ______

**TC-05-03 Empty range**
1. Pick a date range before the shop had orders.

Expected: "No cash was collected at the counter in this period." and the card reads ₱ 0.
- [ ] Pass - [ ] Fail — notes: ______

**TC-05-04 Matches the CSV**
1. Export CSV for the same range.

Expected: the CSV's Cash remitted rows and total equal the on-screen table.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-06 — Manager-only price changes + `product_price_log`

> **Issue:** Restrict menu price changes to MANAGER role only. Add a product_price_log table filled by a trigger so price changes are tracked.

**Acceptance criteria**
- AC-06.1 Staff see the price field greyed out and cannot change it; they can still edit other fields and toggle availability.
- AC-06.2 Staff don't get **+ Add item** (or the Shift+N shortcut), because a new dish sets a price.
- AC-06.3 The rule is enforced by the server and the database, not just the screen (see Part E, SEC-02/03).
- AC-06.4 Every price a product has had is in `product_price_log`: the starting price when created, then old → new on each change, with who changed it and when.

**TC-06-01 Staff view** · S · `/manage/menu`
1. Look at the header.

Expected: no **+ Add item** button. Pressing Shift+N does nothing.
2. Open a dish.

Expected: the price field is greyed out / not editable.
3. Change the description (or toggle availability) and save.

Expected: saves successfully; the price is unchanged.
- [ ] Pass - [ ] Fail — notes: ______

**TC-06-02 Manager changes a price** · M
1. Open a dish (note old price), change the price by ₱1, save.

Expected: saves; the customer menu shows the new price.
2. Run helper **B6**.

Expected: newest row = that dish, old price → new price, `changed_by_role` = Manager.
3. Change it back.

Expected: another log row (new → old).
- [ ] Pass - [ ] Fail — notes: ______

**TC-06-03 New dish is logged** · M
1. **+ Add item**, create a test dish at ₱10.
2. Run **B6**.

Expected: a row for it with empty old price and 10.00 new price.
3. Delete/archive the test dish.
- [ ] Pass - [ ] Fail — notes: ______

**TC-06-04 Saving without a price change adds no log row** · M
1. Edit only a dish's description and save. Run **B6**.

Expected: no new log row.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-07 — KDS amber / red timers, new-order chime, highlighted instructions

> **Issue:** Update the KDS frontend: turn cards amber past 15 minutes and red past 25. Play a short chime when a new order lands (add an "Enable sound" button for browser audio permission). Highlight special instructions more prominently.

**Acceptance criteria**
- AC-07.1 On the KDS **Active** tab, a queued or in-prep order's card header turns **amber** at 15 minutes and **red (pulsing)** at 25 minutes since it was placed. The same colours apply on the Orders page cards.
- AC-07.2 An **Enable sound** button is visible (pulsing, red outline) until clicked. Clicking it plays a test chime and it becomes **Sound on** (green). Clicking again turns sound off.
- AC-07.3 With sound on, a short two-note chime plays **once** when a new order reaches the kitchen — a new pay-in-store order the moment it's placed, or an online order the moment its payment lands — whichever KDS tab is open.
- AC-07.4 Orders already on the board when it opened don't chime. Status changes of existing orders (Confirm, Ready, …) don't chime.
- AC-07.5 An item's special instructions show in a yellow box with a warning icon and the label **SPECIAL INSTRUCTIONS**, in bold, larger than the item text around them.

**TC-07-01 Colours** · setup: O4 in the queue; helper **B2** with 16 minutes on O4
1. KDS **Active** tab (wait up to 30 s or reload).

Expected: O4's header is amber; timer shows 16:xx.
2. Run B2 again with `26 minutes`.

Expected: O4's header is red and pulsing.
3. Confirm O4 (moves to prep).

Expected: still red — the clock counts from when the order was placed.
4. Check `/manage/orders` for O4.

Expected: same colour there.
- [ ] Pass - [ ] Fail — notes: ______

**TC-07-02 Enable sound** · S on Screen 1, speakers on
1. Open `/manage/kds`.

Expected: **Enable sound** button, pulsing, bell-with-slash icon.
2. Click it.

Expected: you hear a short two-note chime immediately; the button turns green and reads **Sound on**.
3. Reload the page.

Expected: back to **Enable sound** (browsers need a click on every page load — this is expected).
- [ ] Pass - [ ] Fail — notes: ______

**TC-07-03 Chime on a new order** · Screen 1 KDS with Sound on; Screen 2 as C2
1. On Screen 2, place a pay-in-store order.

Expected on Screen 1 within ~2 seconds, **without reloading**: chime plays once, and the new card appears on the Active tab.
2. Switch Screen 1 to the **Cancelled (Today)** tab. Place another order on Screen 2.

Expected: chime still plays (tab doesn't matter).
3. Confirm one of the new orders on the KDS.

Expected: no chime.
- [ ] Pass - [ ] Fail — notes: ______

**TC-07-04 Chime when an online payment lands** (only if GCash/PayMongo test payments work on live)
1. As C1, place a **GCash / Maya** order and complete the payment.

Expected: when PayMongo confirms, the KDS chimes and the order appears on Active. No chime at the moment the unpaid order was created.
- [ ] Pass - [ ] Fail / N/A — notes: ______

**TC-07-05 Sound off**
1. Click **Sound on** to turn it off. Place an order on Screen 2.

Expected: card appears; no sound.
- [ ] Pass - [ ] Fail — notes: ______

**TC-07-06 Instructions stand out** · O2 (note "No onions, extra chili")
1. Find O2 on the KDS.

Expected: under the dish, a yellow box with a warning triangle, small caps label **SPECIAL INSTRUCTIONS**, then the note in bold. Add-ons stay on their own red italic "+ …" line.
2. Check the same in List view (AC-08).
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-08 — KDS sort, Grid/List, Cancelled (today)

> **Issue:** Add KDS sort toggle (Oldest/Newest, keep oldest as default), Grid/List view toggle, and a "Cancelled (today)" tab so cooks see cancelled orders immediately.

**Acceptance criteria**
- AC-08.1 A toolbar under the KDS header has **Oldest | Newest** and **Grid | List** toggles. **Oldest** and **Grid** are the defaults.
- AC-08.2 Oldest puts the order that has waited longest first (top-left); Newest reverses it. On the pick-up tabs, "oldest" means waiting longest since it was marked ready.
- AC-08.3 List shows one wide row per order (number + timer on the left, items in the middle, buttons on the right); Grid shows tickets in columns. Actions work the same in both.
- AC-08.4 The sort and view choices are remembered on that browser.
- AC-08.5 **Cancelled (Today)** shows orders cancelled since midnight today — including ones placed yesterday — and updates live when an order is cancelled elsewhere.

**TC-08-01 Default sort** · 3+ orders on Active
1. Open the KDS fresh (clear site data or use a new browser).

Expected: **Oldest** and **Grid** highlighted; the earliest-placed order is first.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-02 Newest**
1. Click **Newest**.

Expected: order reverses; the most recent order is first.
2. Reload.

Expected: still Newest (remembered). Set it back to Oldest.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-03 List view**
1. Click **List**.

Expected: one full-width row per order on a laptop; on a phone the row stacks vertically. Cancel / Confirm / Ready buttons still work.
2. Reload.

Expected: still List. Switch back to Grid.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-04 Cancelled (Today) live** · Screen 1 KDS on **Cancelled (Today)**; Screen 2 as M on `/manage/orders`
1. On Screen 2, cancel one test order with a reason.

Expected: within ~2 seconds, without reloading Screen 1, the order appears on Cancelled (Today) with a grey header and no timer.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-05 Only today**
1. Look for any order cancelled on an earlier day (B1 shows `order_status = cancelled`).

Expected: it is not on Cancelled (Today).
2. (Optional) Cancel an order that was *placed* yesterday.

Expected: it appears — it's about when it was cancelled.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-06 For Pick-up tab works** (was always empty before this release)
1. Mark O1 **Ready** on the KDS. Open **For Pick-up**.

Expected: O1 is listed with a **Pay In-store** chip and a timer counting from when it was marked ready. Clicking the card opens **Order #… — Mark order as picked up**.
2. Run helper **B4** on O1, open **Failed Pick-up**.

Expected: O1 is listed there (ready 90+ minutes, pay in store, not collected).
3. Mark it picked up.
- [ ] Pass - [ ] Fail — notes: ______

**TC-08-07 No flicker on refresh**
1. Leave the KDS open for 2 minutes.

Expected: the board refreshes silently; no skeleton/loading flash every 30 seconds.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-09 — 3RD PARTY COURIER / SELF PICKUP badge

> **Issue:** Add a clear 3RD PARTY COURIER or SELF PICKUP badge on each KDS and order card, allowing staff to know if they are handing off to the customer directly or to a service like Lalamove.

**Acceptance criteria**
- AC-09.1 At checkout the customer answers **Who's picking up?** — **I'll pick it up** (default) or **A courier will pick it up**.
- AC-09.2 The choice is saved on the order.
- AC-09.3 Every KDS card, Orders page card and order detail view shows **SELF PICKUP** (teal, person icon) or **3RD PARTY COURIER** (indigo, bike icon).
- AC-09.4 Orders placed before this release show **PICKUP BY: NOT SPECIFIED** (beige) rather than a guess.

**TC-09-01 Checkout choice** · C1, Screen 2
1. Add a dish, go to checkout.

Expected: a **WHO'S PICKING UP?** section above Payment method, with **I'll pick it up** selected and **A courier will pick it up** ("You book Lalamove, Grab or similar; we hand it to your rider.").
2. Pick courier, place the order.
- [ ] Pass - [ ] Fail — notes: ______

**TC-09-02 Badges everywhere**
1. Find O1 (self pickup) and O2 (courier) on: KDS Active (Grid), KDS List, `/manage/orders` card, order detail modal.

Expected: O1 → teal **SELF PICKUP**; O2 → indigo **3RD PARTY COURIER**, in all four places.
- [ ] Pass - [ ] Fail — notes: ______

**TC-09-03 Old orders**
1. Find any order from before today (Completed tab).

Expected: beige **PICKUP BY: NOT SPECIFIED**.
- [ ] Pass - [ ] Fail — notes: ______

**TC-09-04 Stored in the database**
1. Run helper **B1**.

Expected: O1 `self_pickup`, O2 `3rd_party_courier`, old orders empty (NULL).
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-10 — Cancel reasons and greyed-out Confirm

> **Issue:** Grey out the Cancel "Confirm" button until a reason is typed. Add preset cancel reasons: "Out of stock", "Store closing", "Customer request", "Duplicate order", plus "Other".

**Acceptance criteria**
- AC-10.1 The cancel dialog ("Cancel this order?") offers exactly: **Out of stock, Store closing, Customer request, Duplicate order, Other**.
- AC-10.2 **Confirm** is greyed out and unclickable until a preset is chosen.
- AC-10.3 Choosing **Other** shows a text box; Confirm stays greyed out until non-blank text is typed (spaces alone don't count).
- AC-10.4 The chosen reason (or the typed text) is saved, shown to the customer, and counted in the cancellation report.
- AC-10.5 Same dialog on the Orders page and the KDS.

**TC-10-01 Presets and greyed Confirm** · S · Orders page
1. On a queued test order click **Cancel**.

Expected: title **Cancel this order?**, the five options in AC-10.1, **Confirm** greyed out.
2. Select **Duplicate order**.

Expected: Confirm becomes active.
- [ ] Pass - [ ] Fail — notes: ______

**TC-10-02 Other**
1. Select **Other**.

Expected: a text box "Please specify the reason..." appears; Confirm greyed out again.
2. Type three spaces.

Expected: still greyed out.
3. Type `Rain, store flooded` → **Confirm**.

Expected: cancelled; C's notification reads "… Reason: Rain, store flooded"; it appears under that reason in the CSV (AC-04).
- [ ] Pass - [ ] Fail — notes: ______

**TC-10-03 KDS uses the same dialog**
1. On the KDS Active tab, click **Cancel** on a test order.

Expected: identical dialog and behaviour.
2. Close with **Back**, reopen.

Expected: selection was reset.
- [ ] Pass - [ ] Fail — notes: ______

---

### AC-11 — KDS link in the management sidebar

> **Issue:** Put the KDS link in the management sidebar so it's accessible without going through Orders first.

**Acceptance criteria**
- AC-11.1 A **KDS** item appears in the sidebar (under Orders) for managers and staff, and opens `/manage/kds`.

**TC-11-01**
1. As M, check the sidebar.

Expected: **KDS** between Orders and Customers; clicking opens the kitchen display.
2. As S.

Expected: sidebar shows Orders, Menu, KDS (no manager-only pages); KDS opens.
- [ ] Pass - [ ] Fail — notes: ______

---

## Part D — Real-time validation (two screens)

These confirm the live connection between the customer site and the kitchen, end to end. Screen 1: S on the KDS with **Sound on**. Screen 2: C2 on the customer site. Do not reload Screen 1 during this part.

| # | Action on Screen 2 (customer) or Screen 1 (staff) | Expected on the other screen, within ~2 s | Pass |
|---|---|---|---|
| RT-01 | C2 places a pay-in-store order, **courier** pickup | KDS chimes once; card appears on Active with **3RD PARTY COURIER** badge; IN QUEUE count +1 | [ ] |
| RT-02 | S clicks **Confirm** on it | C2's order tracking page moves to "preparing"; KDS: IN QUEUE −1, PREPARING +1; no chime | [ ] |
| RT-03 | S clicks **Ready** | C2 sees ready / notification "ready for pickup"; card leaves Active, appears on **For Pick-up** | [ ] |
| RT-04 | S opens For Pick-up, clicks the card → confirm picked up | C2 sees completed; card gone | [ ] |
| RT-05 | C2 places another order, then cancels it from their order page | KDS: card leaves Active and appears on **Cancelled (Today)** without reload | [ ] |
| RT-06 | M cancels a queued order on `/manage/orders` (another screen) | KDS Active updates and Cancelled (Today) shows it | [ ] |
| RT-07 | Turn Screen 1's Wi-Fi off for 1 minute, place an order on Screen 2, turn Wi-Fi back on | Within 30 s of reconnecting the order appears (the 30-second poll is the safety net) | [ ] |

---

## Part E — Database security checks (SQL)

These prove the rules hold even if someone bypasses the app and calls the database directly. Each block pretends to be a given user inside a transaction and **rolls back**, so nothing is changed. Run **one block at a time** in the SQL Editor.

Replace `CUSTOMER_UUID`, `STAFF_UUID`, `MANAGER_UUID` with the ids from A3.

> If the editor says *current transaction is aborted*, run `ROLLBACK;` on its own and continue — that's just the expected error from the previous block.

**SEC-01 A customer cannot read the customer list** (this was a real leak before this release)
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'CUSTOMER_UUID', 'role', 'authenticated')::text, true);
SELECT * FROM public.get_customer_stats();
ROLLBACK;
```
Expected: `ERROR: Unauthorized`
- [ ] Pass - [ ] Fail

**SEC-02 Staff cannot change a price**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'STAFF_UUID', 'role', 'authenticated')::text, true);
UPDATE public.product SET product_price = product_price + 1
WHERE product_id = (SELECT product_id FROM public.product WHERE archived_at IS NULL LIMIT 1);
ROLLBACK;
```
Expected: `ERROR: Only a manager can set or change menu prices.`
- [ ] Pass - [ ] Fail

**SEC-03 Staff cannot create a product**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'STAFF_UUID', 'role', 'authenticated')::text, true);
INSERT INTO public.product (product_name, product_price) VALUES ('SEC-03 test dish', 1);
ROLLBACK;
```
Expected: `ERROR: Only a manager can set or change menu prices.`
- [ ] Pass - [ ] Fail

**SEC-04 Staff can still toggle availability**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'STAFF_UUID', 'role', 'authenticated')::text, true);
UPDATE public.product SET is_available = is_available
WHERE product_id = (SELECT product_id FROM public.product WHERE archived_at IS NULL LIMIT 1);
ROLLBACK;
```
Expected: `UPDATE 1` (success), no error.
- [ ] Pass - [ ] Fail

**SEC-05 A manager's price change is logged**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'MANAGER_UUID', 'role', 'authenticated')::text, true);
UPDATE public.product SET product_price = product_price + 1
WHERE product_id = (SELECT product_id FROM public.product WHERE archived_at IS NULL ORDER BY product_name LIMIT 1);
SELECT old_price, new_price, changed_by FROM public.product_price_log ORDER BY changed_at DESC LIMIT 1;
ROLLBACK;
```
Expected: one row, `new_price = old_price + 1`, `changed_by = MANAGER_UUID`. (Rolled back afterwards — the real price is untouched.)
- [ ] Pass - [ ] Fail

**SEC-06 Customers and staff cannot read the price log or reports**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'STAFF_UUID', 'role', 'authenticated')::text, true);
SELECT count(*) AS visible_log_rows FROM public.product_price_log;
ROLLBACK;
```
Expected: `visible_log_rows = 0`. Then:
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'STAFF_UUID', 'role', 'authenticated')::text, true);
SELECT * FROM public.get_cash_remitted_daily(current_date - 30, current_date);
ROLLBACK;
```
Expected: `ERROR: Unauthorized`
- [ ] Pass - [ ] Fail

**SEC-07 Checkout rejects an unknown pickup type**
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', 'CUSTOMER_UUID', 'role', 'authenticated')::text, true);
SELECT public.submit_cart_to_order(p_cart_id => gen_random_uuid(), p_fulfillment_method => 'drone');
ROLLBACK;
```
Expected: `ERROR: Tell us who is picking up the order.`
- [ ] Pass - [ ] Fail

---

## Part F — Regression smoke test

Things this release touched indirectly. Quick pass, each should behave as before.

| # | Check | Pass |
|---|---|---|
| RG-01 | Customer: browse menu, add to cart, checkout with **Pay in store** → confirmation page → order tracking page | [ ] |
| RG-02 | Customer: GCash / Maya checkout opens the wallet (if configured on live) | [ ] |
| RG-03 | Customer: cancel own pending order from the order page | [ ] |
| RG-04 | Staff: Orders page Confirm / Ready / Picked Up with confirmation dialogs ("Yes, Confirm" etc.) | [ ] |
| RG-05 | Orders page search by order number (`#` + first characters) | [ ] |
| RG-06 | Completing a pay-in-store order sets its payment to paid (it then counts in Cash remitted) | [ ] |
| RG-07 | Manager: Reports Export to PDF still downloads | [ ] |
| RG-08 | Manager: Employees, Audit Log, Dashboard pages load | [ ] |
| RG-09 | Customer notifications bell still receives status updates | [ ] |
| RG-10 | Mobile width (≈375 px): Orders filter panel fits on screen; KDS toolbar wraps without horizontal scroll; checkout "Who's picking up?" options stack | [ ] |

---

## Part G — Clean-up

1. Cancel any test orders still open (reason **Duplicate order**), or leave them — they only affect test accounts' histories and today's reports.
2. Revert any test price changes (a manager edits them back; both changes stay in the price log, which is intended).
3. Archive the SEC/TC test dishes if any were created outside a rolled-back block.
4. Orders backdated with helpers B2–B5 keep their altered times; if that matters for real reports, cancel them or note their numbers.

---

## Known limitations (not defects)

- **Sound must be enabled on every page load.** Browsers block audio until the user clicks; the KDS can't remember that permission.
- **Payment Issues waits 5 minutes** before listing a refused or unfinished online payment, on both the Orders page and the KDS.
- **Add-on prices** (rice, drinks) are not in the price log or manager-only; the requirement covered menu item prices.
- **Older report widgets** (Total Revenue, charts) still cut days at UTC midnight (8 AM Manila). The new breakdowns, cash remitted table and CSV use Manila days, so a late-night order can sit on different days in the two.
- **Staff can't add dishes** anymore, because adding one sets a price.

---

## Sign-off

| Area | Result | Tester | Date |
|---|---|---|---|
| A — Setup (15/15 PASS) | | | |
| AC-01 Orders filtering | | | |
| AC-02 Payment Issues | | | |
| AC-03 Customer list | | | |
| AC-04 Breakdowns + CSV | | | |
| AC-05 Cash remitted | | | |
| AC-06 Prices + log | | | |
| AC-07 Timers, chime, instructions | | | |
| AC-08 Sort, view, cancelled | | | |
| AC-09 Pickup badge | | | |
| AC-10 Cancel reasons | | | |
| AC-11 Sidebar link | | | |
| D — Real-time | | | |
| E — Security | | | |
| F — Regression | | | |
