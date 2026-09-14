# Requirements Audit

This document maps the master list of requirements to the current state of the codebase.

## 🟢 User Registration and Profile Management
- [x] **Cust1 - Register account:** **Implemented** (Supabase Auth, `/register` flow)
- [x] **Cust2 - Log in:** **Implemented** (Supabase Auth, `/login` flow)
- [x] **Cust3 - Log out:** **Implemented** (`/api/auth/logout`)
- [ ] **Cust4 - Update profile:** **Missing** (UI and backend missing - *Issue #21*)
- [ ] **Cust5 - Delete account:** **Missing** (*Issue #21*)

## 🟡 Menu Management
- [~] **Menu1 - Add food items:** **Partially Implemented** (Admin CRUD UI built, partial API integration)
- [~] **Menu2 - Edit food items:** **Partially Implemented** (Admin CRUD UI built, partial API integration)
- [~] **Menu3 - Remove food items:** **Partially Implemented** (Admin CRUD UI built, partial API integration)
- [~] **Menu4 - Categorize items:** **Partially Implemented** 
- [ ] **Menu5 - Real time updates:** **Missing** 

## 🟡 Browsing and Ordering
- [x] **Browsing1 - Browse menu:** **Implemented** (`/menu` page)
- [x] **Browsing2 - Add to cart:** **Implemented** 
- [x] **Browsing3 - Remove from cart:** **Implemented**
- [x] **Browsing4 - Specify quantity:** **Implemented**
- [x] **Browsing5 - Calculate totals (incl. delivery):** **Implemented**
- [ ] **Browsing6 - Special instructions:** **Missing** (*Issue #7*)
- [x] **Browsing8 - Review order details:** **Implemented** (Checkout Screen)
- [x] **Browsing9 - Pickup vs delivery:** **Implemented** (`FulfilmentToggle`)
- [x] **Browsing10 - Choose payment method:** **Implemented** (`PaymentMethodPicker`)
- [ ] **Browsing11 - Modify cart items pre-submit:** **Missing** (*Issue #7*)
- [ ] **Browsing12 - Lock cart post-submit:** **Missing** (*Issue #7*)
- [x] **Browsing13 - Cancel unconfirmed order:** **Implemented** (`CancelOrderControl`)
- [x] **Browsing14 - Cancel confirmation prompt:** **Implemented**
- [ ] **Browsing15 - Prevent cancel confirmed order:** **Missing** (Backend validation missing)
- [ ] **Browsing16 - Smart ETA range:** **Missing** (Using static placeholders - *Issue #10*)

## 🟢 Order Tracking and Management
- [~] **Order1 - Admin update order status:** **Partially Implemented** (UI uses dummy data, no API integration)
- [x] **Order2 - Track prep & delivery:** **Implemented** (Supabase Real-time tracking screen)
- [x] **Order3 - Staff view sequence:** **Implemented** (KDS Dashboard)
- [~] **Order4 - Staff mark completed:** **Partially Implemented** (UI exists, backend API wiring missing)
- [x] **Order5 - Driver receive request:** **Implemented** (Driver Dashboard)
- [x] **Order6 - Driver see customer details:** **Implemented** 
- [x] **Order7 - Driver mark delivered with proof:** **Implemented** (`ProofOfDeliveryModal`)

## 🟡 Payment Processing
- [ ] **PP1 - Online payments (Cards/Wallets):** **Missing** (No Stripe/Paymongo integration - *Issue #9*)
- [x] **PP2 - COD and In-store payments:** **Implemented** 

## 🟡 System Administration and Support
- [~] **SAS1 - Manage users, orders, payments:** **Partially Implemented** (Admin Dashboards use dummy data)
- [~] **SAS2 - Generate performance/sales reports:** **Partially Implemented** (Backend `/api/reports/pdf` works, but frontend `/manage/reports` uses mock data)

## 🟢 Search, Filters, and Recommendations
- [x] **SFR1 - Search by keywords:** **Implemented**
- [x] **SFR2 - Filter by categories:** **Implemented**

## 🔴 Order History and Feedback
- [ ] **OHF1 - Order history & receipts:** **Missing** (*Issue #8*)
- [ ] **OHF2 - Numerical ratings & reviews:** **Missing** (*Issue #8*)

## 🟢 Third-Party Integrations
- [x] **TPI1 - Address validation:** **Implemented** (Simple text-based entry built as recommended)
