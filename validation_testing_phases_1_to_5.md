# Validation Testing Plan: Phases 1–9

This guide provides step-by-step test cases to validate the feature implementations and security restrictions rolled out in Phases 1 through 9. Follow these steps logged in as different roles to confirm correctness and data safety.

---

## 🔒 Phase 1 & 2: Orders Filtering & Payment Issues Tab

**Objective:** Verify that the new filters and tabs on the Manage Orders page accurately slice the dataset and that the backend properly handles the new queries.

### Test Cases

1. **Filtering by Customer Name / Phone:**
   - **Action:** Go to the Manage Orders page and type a known customer name or phone number into the search bar.
   - **Expected:** The list should filter server-side to show only orders matching that customer across the active tab.

2. **Manager-Only Payment Issues Tab:**
   - **Action:** Log in as `MANAGER`.
   - **Expected:** The "Payment Issues" tab is visible in the sidebar. Clicking it shows orders fetched via `getPaymentIssuesForAdmin()` (which includes `awaiting_payment` orders > 5 mins old and `payment_failed` orders).
   - **Action:** Log in as `STAFF`.
   - **Expected:** The "Payment Issues" tab is hidden from the sidebar.

3. **Total Paid Fix (Pay-in-store):**
   - **Action:** Take a new `pay-in-store` order and mark it as `completed`.
   - **Expected:** The database updates the corresponding transaction with `payment_status = 'paid'` and `total_paid` equal to the order total.

---

## 👥 Phase 3: Customer Lifetime Stats & History

**Objective:** Verify that customer analytics calculate accurately and that staff can view paginated histories.

### Test Cases

1. **Server-Side Pagination:**
   - **Action:** Navigate to the Customers page (`/manage/customers`).
   - **Expected:** The customer list is paginated. Changing pages fetches the next set of customers rather than loading them all at once.

2. **Total Orders and Total Spent:**
   - **Action:** Look at the customer rows.
   - **Expected:** The "Total Orders" and "Total Spent" columns reflect accurate lifetime values (using the fixed `total_paid` logic).

3. **Customer Detail View (Last 10 Orders):**
   - **Action:** Click on a customer row.
   - **Expected:** The detail modal/panel displays their last 10 orders correctly.

---

## 📈 Phase 4: Reports CSV + Cash Remitted

**Objective:** Verify that the Cash Remitted KPI displays correctly and reports export safely.

### Test Cases

1. **Cash Remitted KPI:**
   - **Action:** Go to the Reports page (`/manage/reports`).
   - **Expected:** A summary metric correctly aggregates all cash collections (`pay-in-store` or `cash` payment methods) for completed orders within the selected timeframe.

2. **CSV Export:**
   - **Action:** Generate a report breakdown and click the export to CSV button.
   - **Expected:** The CSV file downloads safely with accurate date boundaries and payment breakdowns matching the UI.

---

## 🛡️ Phase 5: Menu Price RBAC & Audit Log

**Objective:** Verify that pricing cannot be altered by non-managers, and that the database audit log natively captures price changes.

### Test Cases

1. **Manager Price Change:**
   - **Action:** Log in as `MANAGER`, go to the Menu page, and update a product's price.
   - **Expected:** The price updates successfully.

2. **Staff Price Change Rejection:**
   - **Action:** Log in as `STAFF` (or spoof the API request). Attempt to change a product's price.
   - **Expected:** The database RLS policy natively rejects the update.

3. **Audit Log Capture:**
   - **Action:** Verify the `product_price_log` or audit table.
   - **Expected:** The price change is recorded securely by the PostgreSQL trigger, showing the `old_price`, `new_price`, and who changed it.

---

## 🔔 Phase 6: KDS Enhancements (Timers, Colors, Sounds, & Notes)

**Objective:** Verify that the KDS alerts staff via timers, colors, sounds, and notes.

### Test Cases

1. **Live Ascending Timer & Colors:**
   - **Action:** Open `/manage/kds` with a new order.
   - **Expected:** Timer starts at `0:00` with default Red (QUEUE) or Orange (PREP) header. At 15 mins, header becomes Amber. At 25 mins, header turns Red and pulses.

2. **Audio Notification (Sound):**
   - **Action:** With `/manage/kds` open and interacted with, place a new order.
   - **Expected:** A bell/beep chime plays to alert staff. It only plays for new orders, not on every refresh.

3. **Prominent Special Instructions:**
   - **Action:** Place an order with a special instruction/note.
   - **Expected:** A yellow "Order Note" block appears at the bottom of the KDS card.

---

## 📱 Phase 7: KDS Navigation & Viewing

**Objective:** Verify KDS sorting, view toggling, and cancelled order visibility.

### Test Cases

1. **Sidebar Navigation:**
   - **Expected:** KDS link is available in the sidebar, navigating to `/manage/kds` directly.

2. **Sort and View Toggles:**
   - **Action:** Click the Oldest/Newest sort toggle and Grid/List view toggle.
   - **Expected:** Cards reorder properly and layout switches between multi-column grid and single-column list.

3. **Cancelled (Today) Tab:**
   - **Expected:** Displays only orders cancelled today, with grey headers and no action buttons at the bottom.

---

## 🏷️ Phase 8: Fulfillment Badges

**Objective:** Verify fulfillment badges are distinct and safely handle missing data.

### Test Cases

1. **Badge Display:**
   - **Action:** Check order cards on `/manage/orders` and `/manage/kds`.
   - **Expected:** A badge reading "3RD PARTY COURIER" (indigo) or "SELF PICKUP" (teal) displays between the header and items.

2. **Handling NULL Fulfillment (Phase 8/9 Fix):**
   - **Action:** Find or create an older order where `fulfillment_method` is NULL (the default was dropped).
   - **Expected:** The badge should either not render or render as "Unspecified". It MUST NOT default to showing "SELF PICKUP" silently.

3. **Visual Distinction:**
   - **Expected:** Badges use different colors than the timer alerts (amber/red) and remain visible even on Grey/Cancelled headers.

---

## 🛑 Phase 9: Cancel-Reason UX

**Objective:** Verify structured cancellation reasons are enforced on the UI and Server.

### Test Cases

1. **Cancel Modal (Preset vs Other):**
   - **Action:** Click Cancel on an order in Admin or KDS.
   - **Expected:** Modal appears with preset reasons. "Confirm" is disabled. Selecting "Other" shows a text area which must be filled before Confirm enables.

2. **Server-Side Enforcement:**
   - **Action:** Attempt to send a cancellation request via API or raw curl to `updateOrderStatus` with a missing or empty `cancellationReason`.
   - **Expected:** The server immediately rejects the transition with a validation error payload, ignoring the request. (Enforced directly inside the `updateOrderStatus` function).

3. **Data Persistence:**
   - **Action:** Cancel an order successfully.
   - **Expected:** The chosen preset or typed string is accurately saved to the `cancellation_reason` column in the database.
