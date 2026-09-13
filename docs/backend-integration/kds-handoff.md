# Kitchen Display System (KDS): Changes & Backend Integration Handoff

## Summary of Changes
1. **Kitchen Display System UI Implementation (`app/manage/kds/page.tsx`)**
   - Implemented the full-screen KDS view mirroring the provided Figma design.
   - Built a custom `KdsOrderCard` component to dynamically adjust height, color scheme, and metrics depending on whether the order is in `QUEUE` (red) or `PREP` (orange).
   
2. **Layout Adaptations (`app/manage/layout.tsx`)**
   - Transformed the `ManageLayout` to a Client Component.
   - Conditionally hidden the global admin sidebar and stripped default page padding strictly for the `/manage/kds` route, guaranteeing the wall-mounted/tablet experience without tearing down the existing back-office structure.

3. **Data Refactoring & Unification (`lib/mock-orders.ts`)**
   - Consolidated the mock data that previously lived inside `ManageOrdersPage`. Both `/manage/orders` and `/manage/kds` now point to the exact same centralized dataset (`MOCK_ORDERS`).
   - The KDS correctly filters this data to render only orders flagged as `QUEUE` or `PREP`.

4. **DOM Structure & Accessibility Fix (`components/manage/orders/order-card.tsx`)**
   - Fixed a severe Next.js hydration crash (`Hydration failed because the initial UI does not match what was rendered on the server`) caused by nested interactive elements (a Cancel `<button>` sitting inside the main Card `<button>`).
   - The main card is now a semantic `<div>` utilizing `role="button"` and `tabIndex={0}`, complete with explicit `onKeyDown` handlers for `Enter` and `Space`. This preserves focus outlines, accessibility, and click routing while strictly adhering to W3C DOM validation rules.

5. **Navigation Bridge (`app/manage/orders/page.tsx`)**
   - Upgraded the "View KDS" dummy button to a Next.js `Link`, forming a seamless bridge to the Kitchen Display System.
   - The KDS header features a `Back` arrow successfully linking back to the order management hub.

## Backend Integration TODO List
To transition the KDS from a mock UI to a fully functional, live-data module, the following backend tasks are required:

- [ ] **Realtime Subscriptions**: Establish a robust Supabase (or equivalent WebSocket) channel connection on the KDS route. Kitchen staff must see new orders flash onto the grid immediately without manual page refreshes.
- [ ] **State Mutations**: Wire up the `Cancel`, `Confirm` (Queue -> Prep), and `Deliver` (Prep -> Delivering) action buttons inside the KdsOrderCard. These should trigger a fast optimistic UI update while patching the order status in the backend.
- [ ] **Accurate Timestamps**: Replace the mock `time` and `timer` logic. The KDS relies heavily on precise timing. Implement a hook that computes the elapsed prep/queue time dynamically using `Date.now()` against the order's `created_at` or `accepted_at` backend timestamp.
- [ ] **Aggregate Metrics**: Hook up the "IN QUEUE" and "AVG PREP" metrics in the top header. The queue count should be a reactive state length, and the average prep time should compute the mean elapsed time of all orders currently marked as `PREP`.

## General UI Improvements Needed
- [ ] **Empty States**: Design and implement a visually pleasing empty state (e.g., a "No orders in queue, great job!" illustration) when the `kdsOrders` array is length 0.
- [ ] **Audio Cues**: Add an optional toggle for an audio chime to alert kitchen staff when a new order drops into the queue.
- [ ] **Pagination/Carousel**: If the screen floods with 20+ orders, consider auto-scrolling or implementing a swipeable carousel to handle overflow without requiring kitchen staff to touch the screen.
