# Codebase Gap Analysis

This document compares the pending tasks listed in `docs/unimplemented_issues.md` with the current state of the codebase, detailing what is partially implemented (e.g., UI with dummy data) and what is completely missing.

## Summary of Findings
Many of the "unimplemented" features actually have **frontend foundations** already built, but they are currently disconnected from the backend. They rely on hardcoded `dummyData` arrays. Conversely, some **backend actions** and API routes exist (e.g., `lib/actions/orders.ts`, `app/api/orders`) but are not yet wired up to the frontend components.

---

### Issue #42 & #6: Admin Oversight (Customers, Orders, Reports)
- **Status in Codebase**: **Partially Implemented (Frontend UI built, Backend missing integration)**
- **Details**:
  - The UI for managing customers (`app/manage/customers/page.tsx`) and orders (`app/manage/orders/page.tsx`) is fully styled and interactive.
  - However, both pages currently use `dummyCustomers` and `dummyOrders` respectively.
  - **TODOs** in the code explicitly call out the need to replace these mock arrays with real Supabase fetches and wire up the mutation endpoints (like Cancel/Confirm).
  - The backend endpoints and server actions (`app/api/routers/orders.ts`, `lib/actions/orders.ts`) *do* exist, meaning the next step is just integration.

### Issue #23: Customer Order Tracking
- **Status in Codebase**: **Partially Implemented (Real-time updates exist)**
- **Details**: 
  - The `TrackOrderScreen` (`components/orders/track-order-screen.tsx`) is actually quite advanced. It uses Supabase realtime subscriptions (`supabase.channel('order-tracking-...')`) to listen to `postgres_changes` on both the `order` and `delivery` tables.
  - The UI automatically updates based on these real-time payloads. 
  - **Gap**: While the frontend handles the tracking, the backend triggers for these stage changes (by staff/drivers) need to be robustly connected.

### Issue #10: Real-Time Estimated Time of Arrival (ETA)
- **Status in Codebase**: **Mostly Missing**
- **Details**: There is no sophisticated logic in the codebase for calculating ETAs based on kitchen queue traffic or delivery distance. The tracking screen currently relies on a static `arrivalWindow` field.

### Issue #21: Advanced Profile Management
- **Status in Codebase**: **Mostly Missing (Customer Side)**
- **Details**: While there is staff/employee profile management (`components/manage/profile`), the customer-facing profile editing and account deletion UI is completely missing. A helper file (`lib/profile/customer-profile.ts`) exists, but the frontend views are absent.

### Issue #11: Driver Operations & Proof of Delivery
- **Status in Codebase**: **Partially Implemented**
- **Details**: The `app/deliver` directory exists with a layout and page for drivers. Server actions like `lib/actions/delivery.ts` exist. However, the specific UI for capturing "Proof of .Delivery" (e.g., photo upload or signature) is missing.

### Issue #22 & #9: Payment Processing & Order Review
- **Status in Codebase**: **Mostly Missing (Payment Integrations)**
- **Details**: There are no references to Stripe or Paymongo SDKs in the codebase. Checkout flows exist conceptually, but the backend implementation for processing digital payments is absent.

### Issue #7: Advanced Cart Modifications
- **Status in Codebase**: **Partially Implemented**
- **Details**: Cart reading and basic logic exists (`lib/cart/read-cart.ts`), and the frontend has a `CancelOrderControl`. However, logic to modify quantities *after* adding to the cart but *before* submission, and the strict locking mechanism based on restaurant confirmation status, requires more robust backend validation.

### Issue #8: Order History & Feedback System
- **Status in Codebase**: **Mostly Missing**
- **Details**: While fetching past orders is possible via the orders API, the **feedback system** (numerical ratings and written reviews) has no database schema, backend actions, or frontend components built yet.

### Issue #5 & #3: Menu Browsing, Checkout, and Database Setup
- **Status in Codebase**: **Significantly Implemented**
- **Details**: 
  - Menu browsing (`components/menu/menu-screen.tsx`) is functional and interacts with the backend (`lib/actions/menu.ts`). 
  - CRUD operations for administrators are partially wired up. 
  - **Gap**: Real-time reflection of menu changes (Issue #3) and dynamic delivery fee calculation (Issue #5) still need refinement.
