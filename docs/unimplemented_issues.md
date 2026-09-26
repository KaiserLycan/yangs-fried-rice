# Unimplemented Issues and Tasks

This document tracks all the pending/unimplemented acceptance criteria from open issues regarding the backend, frontend, and API. It has been updated to reflect the current state of the codebase.

## Issue #114: Part 1: Security, Database & Privacy Enhancements
The shop is now **pickup-only**. The assigned-rider card, the rider queue and the `/deliver` area were removed with the `rider` and `delivery` tables, so the old "assigned rider on the tracking screen" items no longer apply. (`employee.phone_number` now exists, renamed from `phone-num`.)
- [x] **Implemented:** pending migrations applied; RLS on `employee`; `rider` / `delivery` archived to a private schema and dropped; RIDER accounts disabled.
- [x] **Implemented:** `submit_cart_to_order` atomic checkout (cart row lock, `is_final` check, one transaction, unique `order.cart_id`); checkout uses it exclusively.
- [x] **Implemented:** customer INSERT policies dropped on `order`, `order_item`, `order_add_on`, `order_item_add_on`; customer cancel limited to status and cancellation fields.
- [x] **Implemented:** `requireCustomer` uses `getUser()`; `is_account_disabled` checked in every guard and in the database; disabled users are signed out with a message.
- [x] **Implemented:** private `senior-pwd-ids` bucket with ≤5-minute signed URLs (`lib/storage/senior-pwd-ids.ts`).
- [x] **Implemented:** `EXECUTE` revoked on `handle_password_timestamp_update()`; `search_path = public` on every SECURITY DEFINER function.
- [x] **Implemented:** indexes on `order(customer_id, created_at)`, `order(order_status, created_at)`, `order_item(order_id)`, `transaction(order_id)`.
- [x] **Implemented:** `types/database.types.ts` regenerated; `employee."phone-num"` renamed to `phone_number`.
- [ ] **Open:** leaked-password protection needs the Supabase Pro plan.

## Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED)
- [x] **Implemented:** Frontend UI for managing customers (`app/manage/customers`) and orders (`app/manage/orders`) is fully wired to live Supabase queries and mutations.

## Issue #23: US-13: Customer Order Tracking (CLOSED)
- [x] **Implemented:** Customers can view the current preparation status of their orders in real-time.
- [x] **Implemented:** Customers can track the current delivery status of their orders.
- [x] **Implemented:** The system updates the customer interface automatically as staff and drivers change the order stages (via Supabase realtime channels).
- [x] **Implemented:** The staff and driver interfaces need their state mutations connected so they actually trigger these live updates.

## Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED)
- [x] **Implemented:** Customers must be able to review their complete order details (name, date, address, items ordered, estimated completion time, and amount payable) before confirming the placement.
- [x] **Implemented:** Customers must be able to choose a payment method before finalizing their order.
- [x] **Implemented:** The system must support cash on delivery and in-store payments as standard checkout options alongside digital payments.

## Issue #21: US-11: Advanced Profile Management (CLOSED)
- [x] **Implemented:** Customers can update their profile information (name, address, contact details, password) via the wired frontend and backend API.
- [x] **Implemented:** Customers can securely delete their account from the system.

## Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED)
- [x] **Implemented:** The system must allow the Delivery Driver to receive incoming delivery requests (basic layout & actions exist).
- [x] **Implemented:** The UI must display complete customer details (name and address) to the assigned Delivery Driver.
- [x] **Implemented:** The Delivery Driver must be able to mark an order as "delivered" (basic action exists).
- [x] **Implemented:** The system must require and accept **proof of delivery** (e.g. photo upload, signature) when an order is marked as delivered (Proof of Delivery Modal implemented).

## Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED)
- [x] **Implemented:** The system must calculate an estimated time of arrival (ETA) range. (Uses `getOrderEtaAction`).
- [x] **Implemented:** The ETA calculation must account for real-time kitchen queue traffic.
- [x] **Implemented:** The ETA calculation must factor in the delivery distance.

## Issue #9: US-04: Payment Processing & Kitchen Queue (CLOSED)
- [x] **Implemented:** The Stripe/Paymongo API processes digital payments successfully. (PayMongo integration via Edge Functions).
- [x] **Implemented:** Incoming orders display sequentially on a kitchen display system. (KDS button/layout exists).
- [x] **Implemented:** Staff can click to mark prepared orders as completed. (Backend and frontend wired).

## Issue #8: US-08: Order History & Feedback System (CLOSED)
- [x] **Implemented:** Customers can view a history of their past orders, including detailed receipts.
- [x] **Implemented:** Customers can submit a numerical rating for their completed orders.
- [x] **Implemented:** Customers can submit written reviews for their completed orders.

## Issue #7: US-06: Advanced Cart Modifications (CLOSED)
- [x] **Implemented:** Customers can add special instructions or modifications to selected menu items in their cart.
- [x] **Implemented:** Customers can modify items and quantities in their cart before submitting the order.
- [x] **Implemented:** The system locks the cart and prevents any item/quantity modifications immediately after the order is submitted.
- [x] **Implemented:** Customers must be able to cancel an order only before it is officially confirmed by restaurant staff.
- [x] **Implemented:** The system must display a confirmation prompt when a customer attempts to cancel an order.
- [x] **Implemented:** The system prevents order cancellation once the restaurant has confirmed it.

## Issue #6: US-09: Administration Analytics & System Oversight (CLOSED)
- [x] **Implemented:** The system must allow administrators to generate basic reports regarding platform performance. (PDF export and frontend charts built and wired).

## Issue #5: US-03: Menu Browsing & Checkout (CLOSED)
- [x] **Implemented:** The system automatically calculates the total cost, including delivery fees.
- [x] **Implemented:** The checkout process requires selecting between pickup or delivery options.

## Issue #3: US-02: Menu Management & Database Setup (CLOSED)
- [x] **Implemented:** Menu changes reflect instantly on the user interface. (MenuScreen subscribes to Supabase postgres changes).
