# Requirements Audit

This document maps the master list of requirements to the current state of the codebase.

## 🟢 User Registration and Profile Management
- [x] **Cust1 - Register account:** **Implemented** (Supabase Auth, `/register` flow)
- [x] **Cust2 - Log in:** **Implemented** (Supabase Auth, `/login` flow)
- [x] **Cust3 - Log out:** **Implemented** (`/api/auth/logout`)
- [x] **Cust4 - Update profile:** **Implemented** (Customer profile management wired via PR #74)
- [x] **Cust5 - Delete account:** **Implemented** (Customer profile deletion wired via PR #74)

## 🟡 Menu Management
- [x] **Menu1 - Add food items:** **Implemented** (Admin CRUD UI built and wired to API)
- [x] **Menu2 - Edit food items:** **Implemented** (Admin CRUD UI built and wired to API)
- [x] **Menu3 - Remove food items:** **Implemented** (Admin CRUD UI built and wired to API)
- [x] **Menu4 - Categorize items:** **Implemented** (Categories fully supported in DB, Admin UI, and Customer filtering)
- [x] **Menu5 - Real time updates:** **Implemented** (MenuScreen uses Supabase Realtime channels for instant UI updates)

## 🟡 Browsing and Ordering
- [x] **Browsing1 - Browse menu:** **Implemented** (`/menu` page)
- [x] **Browsing2 - Add to cart:** **Implemented** 
- [x] **Browsing3 - Remove from cart:** **Implemented**
- [x] **Browsing4 - Specify quantity:** **Implemented**
- [x] **Browsing5 - Calculate totals (incl. delivery):** **Implemented**
- [x] **Browsing6 - Special instructions:** **Implemented** (Wired to cart writes via PR #77)
- [x] **Browsing8 - Review order details:** **Implemented** (Checkout Screen)
- [x] **Browsing9 - Pickup vs delivery:** **Implemented** (`FulfilmentToggle`)
- [x] **Browsing10 - Choose payment method:** **Implemented** (`PaymentMethodPicker`)
- [x] **Browsing11 - Modify cart items pre-submit:** **Implemented** (Wired to cart writes via PR #77)
- [x] **Browsing12 - Lock cart post-submit:** **Implemented** (Wired to cart writes via PR #77)
- [x] **Browsing13 - Cancel unconfirmed order:** **Implemented** (`CancelOrderControl`)
- [x] **Browsing14 - Cancel confirmation prompt:** **Implemented**
- [x] **Browsing15 - Prevent cancel confirmed order:** **Implemented** (Backend validation properly restricts cancellation to 'pending' state)
- [x] **Browsing16 - Smart ETA range:** **Implemented** (Using lib/eta/engine to calculate dynamic ETA based on kitchen queue and transit distance)

## 🟢 Order Tracking and Management
- [x] **Order1 - Admin update order status:** **Implemented** (Wired to `updateOrderStatus` via PR #73)
- [x] **Order2 - Track prep & delivery:** **Implemented** (Supabase Real-time tracking screen)
- [x] **Order3 - Staff view sequence:** **Implemented** (KDS Dashboard)
- [x] **Order4 - Staff mark completed:** **Implemented** (Wired to `updateOrderStatus` via PR #73)
- [x] **Order5 - Driver receive request:** **Implemented** (Driver Dashboard)
- [x] **Order6 - Driver see customer details:** **Implemented** 
- [x] **Order7 - Driver mark delivered with proof:** **Implemented** (`ProofOfDeliveryModal`)

## 🟡 Payment Processing
- [x] **PP1 - Online payments (Cards/Wallets):** **Implemented** (PayMongo integration for GCash/Maya added)
- [x] **PP2 - COD and In-store payments:** **Implemented** 

## 🟡 System Administration and Support
- [x] **SAS1 - Manage users, orders, payments:** **Implemented** (Admin Dashboards wired to real API via PR #73)
- [x] **SAS2 - Generate performance/sales reports:** **Implemented** (PDF export and frontend charts wired to real data)

## 🟢 Search, Filters, and Recommendations
- [x] **SFR1 - Search by keywords:** **Implemented**
- [x] **SFR2 - Filter by categories:** **Implemented**

## 🟢 Order History and Feedback
- [x] **OHF1 - Order history & receipts:** **Implemented** (Wired to backend via PR #78)
- [x] **OHF2 - Numerical ratings & reviews:** **Implemented** (Order rating functionality wired via PR #78)

## 🟢 Third-Party Integrations
- [x] **TPI1 - Address validation:** **Implemented** (Simple text-based entry built as recommended)
