# Unimplemented Issues and Tasks

This document tracks all the pending/unimplemented acceptance criteria from open issues regarding the backend, frontend, and API. It has been updated to reflect the current state of the codebase.

## Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments
- [x] **Implemented:** Frontend UI (mocked with dummy data) for managing customers (`app/manage/customers`) and orders (`app/manage/orders`). Backend actions and API endpoints exist.
- [ ] **Still Needed:** Wire up the frontend components to the backend API, replacing all dummy data with live Supabase queries and mutations.

## Issue #23: US-13: Customer Order Tracking (CLOSED)
- [x] **Implemented:** Customers can view the current preparation status of their orders in real-time.
- [x] **Implemented:** Customers can track the current delivery status of their orders.
- [x] **Implemented:** The system updates the customer interface automatically as staff and drivers change the order stages (via Supabase realtime channels).
- [ ] **Still Needed:** The staff and driver interfaces need their state mutations connected so they actually trigger these live updates.

## Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED)
- [x] **Implemented:** Customers must be able to review their complete order details (name, date, address, items ordered, estimated completion time, and amount payable) before confirming the placement.
- [x] **Implemented:** Customers must be able to choose a payment method before finalizing their order.
- [x] **Implemented:** The system must support cash on delivery and in-store payments as standard checkout options alongside digital payments.

## Issue #21: US-11: Advanced Profile Management
- [ ] **Still Needed:** Customers must be able to update their profile information, including their name, address, contact details, and password. (Frontend UI is completely missing).
- [ ] **Still Needed:** Customers must be able to securely delete their account from the system.

## Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED)
- [x] **Implemented:** The system must allow the Delivery Driver to receive incoming delivery requests (basic layout & actions exist).
- [x] **Implemented:** The UI must display complete customer details (name and address) to the assigned Delivery Driver.
- [x] **Implemented:** The Delivery Driver must be able to mark an order as "delivered" (basic action exists).
- [x] **Implemented:** The system must require and accept **proof of delivery** (e.g. photo upload, signature) when an order is marked as delivered (Proof of Delivery Modal implemented).

## Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA)
- [ ] **Still Needed:** The system must calculate an estimated time of arrival (ETA) range. (Currently uses a static, hardcoded arrival window).
- [ ] **Still Needed:** The ETA calculation must account for real-time kitchen queue traffic.
- [ ] **Still Needed:** The ETA calculation must factor in the delivery distance.

## Issue #9: US-04: Payment Processing & Kitchen Queue
- [ ] **Still Needed:** The Stripe/Paymongo API processes digital payments successfully. (No integration present).
- [x] **Implemented:** Incoming orders display sequentially on a kitchen display system. (KDS button/layout exists).
- [ ] **Still Needed:** Staff can click to mark prepared orders as completed. (Frontend UI exists, but needs backend wiring).

## Issue #8: US-08: Order History & Feedback System
- [ ] **Still Needed:** Customers must be able to view a history of their past orders, which includes detailed receipts.
- [ ] **Still Needed:** Customers must be able to submit a numerical rating for their completed orders.
- [ ] **Still Needed:** Customers must be able to submit written reviews for their completed orders.

## Issue #7: US-06: Advanced Cart Modifications
- [ ] **Still Needed:** Customers must be able to add special instructions or modifications to selected menu items in their cart.
- [ ] **Still Needed:** Customers must be able to modify items and quantities in their cart before submitting the order.
- [ ] **Still Needed:** The system must lock the cart and prevent any item/quantity modifications immediately after the order is submitted, regardless of restaurant confirmation status.
- [x] **Implemented:** Customers must be able to cancel an order only before it is officially confirmed by restaurant staff (UI and basic logic present).
- [x] **Implemented:** The system must display a confirmation prompt when a customer attempts to cancel an order.
- [ ] **Still Needed:** The system must prevent order cancellation once the restaurant has confirmed it (Requires solid backend validation).

## Issue #6: US-09: Administration Analytics & System Oversight
- [ ] **Still Needed:** The system must allow administrators to generate basic reports regarding platform performance. (Basic UI layout exists in `manage`, but reports are missing).

## Issue #5: US-03: Menu Browsing & Checkout (CLOSED)
- [x] **Implemented:** The system automatically calculates the total cost, including delivery fees.
- [x] **Implemented:** The checkout process requires selecting between pickup or delivery options.

## Issue #3: US-02: Menu Management & Database Setup
- [ ] **Still Needed:** Menu changes reflect instantly on the user interface.
