# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 496 files · ~601,060 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2365 nodes · 6145 edges · 123 communities (107 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfadf517`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useToast
- auth.ts
- next
- db-cleanse.mjs
- createClient
- sidebar.tsx
- actions/audit.ts
- checkout-screen.tsx
- ref_node_fs
- actions/admin.ts
- addCartItem
- order-stage.ts
- vitest
- actions/reports.ts
- signup.ts
- routers/reports.ts
- past-order.ts
- roles.ts
- react
- package.json
- dashboard.ts
- pdf-charts.ts
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- customer-signup-form.tsx
- paymongo
- The 12 questions
- server.ts
- order-summary-card.tsx
- devDependencies
- (account)/profile/page.tsx
- customer-profile.ts
- employee-modal.tsx
- engine.ts
- compilerOptions
- order-detail-modal.tsx
- validate-ncr.ts
- zod
- transactions.ts
- login.ts
- validation/admin.ts
- Details
- dependencies
- H. Test Evidence / Screenshots — **TO DO (manual)**
- brand-panel.tsx
- password-strength.ts
- B. SQL Injection Test
- site-footer.tsx
- cn
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- validation/profile.ts
- P2 — if time allows
- D. Authorization Test
- order-number.ts
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- actions/cart.ts
- [orderId]/page.tsx
- confirmation/page.tsx
- kds/page.tsx
- eta.ts
- scripts
- employee/login/page.tsx
- notifications.ts
- checkout-screen.test.tsx
- Phase 4 — Security & Testing Report
- submitCart
- log-out-control.test.tsx
- senior-pwd-ids.ts
- reports-charts.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- CustomerData
- stored-image.ts
- map-staff-order.ts
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- phone.ts
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- delete-confirmation.test.ts
- Review Checklist
- Review Checklist
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.test.tsx
- actions/profile.ts
- rewrite_docs.py
- Review Checklist
- Unimplemented Issues and Tasks
- Review Checklist
- audit-log/page.tsx
- cart-line-row.tsx
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- xss.test.tsx
- Handoff: put dispatched orders in the rider queue
- vitest.config.mts
- actions.ts
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 154 edges
2. `next` - 105 edges
3. `cn()` - 95 edges
4. `vitest` - 84 edges
5. `react` - 79 edges
6. `useToast()` - 57 edges
7. `resolveEmployeeRole()` - 37 edges
8. `lengthProps()` - 30 edges
9. `submitCart()` - 30 edges
10. `zod` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Database functions (RPC)` --references--> `submitCart()`  [INFERRED]
  README.md → lib/actions/cart.ts
- `Audit log` --references--> `recordEmployeeAction()`  [INFERRED]
  README.md → lib/audit/record-employee-action.ts
- `F1. Landing page for marketing — ❌` --references--> `MenuPageBody()`  [INFERRED]
  docs/feedback-verification.md → components/menu/menu-page-body.tsx
- `Recommended plan for the panel's points` --references--> `submitCart()`  [INFERRED]
  docs/feedback-verification.md → lib/actions/cart.ts
- `7. No "pause store" / busy mode` --references--> `submitCart()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (123 total, 16 thin omitted)

### Community 0 - "useToast"
Cohesion: 0.15
Nodes (30): ManageCustomersInner(), loadCustomers(), revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema (+22 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (32): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+24 more)

### Community 2 - "next"
Cohesion: 0.18
Nodes (12): DELETE(), PATCH(), RouteParams, Window, CartLineRow(), SwitchToCodButton(), handleSwitch(), removeCartItem() (+4 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (44): note(), addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer (+36 more)

### Community 4 - "createClient"
Cohesion: 0.09
Nodes (41): employeeLogout(), ManageMenuInner(), ActionResult, Category, createAddOn(), createCategory(), createProduct(), deleteAddOn() (+33 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (13): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference() (+5 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (42): GET, errorToStatus(), getAuditLog(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime(), SOURCE_LABELS (+34 more)

### Community 7 - "checkout-screen.tsx"
Cohesion: 0.13
Nodes (18): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+10 more)

### Community 8 - "ref_node_fs"
Cohesion: 0.17
Nodes (8): ref_node_fs, fixes, raw, sql, checkout, hardening, pickupOnly, quantityBounds

### Community 9 - "actions/admin.ts"
Cohesion: 0.09
Nodes (47): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+39 more)

### Community 10 - "addCartItem"
Cohesion: 0.24
Nodes (9): DELETE(), POST(), DELETE(), GET(), ItemDetailModal(), handleAddToCart(), addCartItem(), clearCart() (+1 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.11
Nodes (28): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+20 more)

### Community 12 - "vitest"
Cohesion: 0.23
Nodes (6): CustomerLoginForm(), CustomerSignupForm(), @testing-library/react, vitest, OPTIONS, RolePicker()

### Community 13 - "actions/reports.ts"
Cohesion: 0.11
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "signup.ts"
Cohesion: 0.13
Nodes (13): dateOfBirthSchema, escapeLikePattern(), customerFirstNameSchema, customerLastNameSchema, customerMobileSchema, DEFAULT_ADDRESS_LABEL, SignupField, signupFormSchema (+5 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.10
Nodes (34): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+26 more)

### Community 17 - "roles.ts"
Cohesion: 0.17
Nodes (20): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+12 more)

### Community 18 - "react"
Cohesion: 0.09
Nodes (26): EmployeeData, ROLES, LogOutControl(), getVisiblePages(), ManagePagination(), ManagePaginationProps, SortableHeader(), SortableHeaderProps (+18 more)

### Community 19 - "package.json"
Cohesion: 0.06
Nodes (30): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+22 more)

### Community 20 - "dashboard.ts"
Cohesion: 0.14
Nodes (22): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+14 more)

### Community 21 - "pdf-charts.ts"
Cohesion: 0.31
Nodes (7): CHART_COLORS, ChartBar, drawBarChart(), drawHorizontalBarChart(), drawTitle(), RGB, jspdf

### Community 22 - "customer-orders.ts"
Cohesion: 0.12
Nodes (17): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+9 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.14
Nodes (25): Authentication Bypass, S4: Disabled account lockout (🟠 High), PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount() (+17 more)

### Community 24 - "fields.ts"
Cohesion: 0.16
Nodes (13): AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema, firstNameSchema, LimitedField (+5 more)

### Community 25 - "customer-signup-form.tsx"
Cohesion: 0.11
Nodes (32): AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner(), ForgotPasswordForm() (+24 more)

### Community 26 - "paymongo"
Cohesion: 0.11
Nodes (18): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+10 more)

### Community 27 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 28 - "server.ts"
Cohesion: 0.05
Nodes (49): DELETE(), GET(), PUT(), DELETE, GET, PUT, GET, POST (+41 more)

### Community 29 - "order-summary-card.tsx"
Cohesion: 0.15
Nodes (18): CartPage(), CartContents(), CartEmptyState(), DesktopCartRail(), OrderPlacedScreen(), OrderSummaryRows(), PlacedOrder, calculateDeliveryFee() (+10 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.12
Nodes (19): ProfilePage(), revalidate, MobileMenuHeader(), ResolvedMobileProfile(), ResolvedProfileActions(), SiteNavBar(), AvatarButton(), DeliveryAddressesCard() (+11 more)

### Community 32 - "customer-profile.ts"
Cohesion: 0.11
Nodes (20): CheckoutPage(), MenuPage(), MenuPageBody(), getCategories(), getProducts(), ADDRESS_COLUMNS, addressPartsFromRow(), AddressPartsInput (+12 more)

### Community 33 - "employee-modal.tsx"
Cohesion: 0.08
Nodes (35): FilterDropdown(), employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+27 more)

### Community 34 - "engine.ts"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-detail-modal.tsx"
Cohesion: 0.29
Nodes (12): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+4 more)

### Community 37 - "validate-ncr.ts"
Cohesion: 0.17
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

### Community 38 - "zod"
Cohesion: 0.11
Nodes (15): AddonInput, addonSchema, AddonUpdateInput, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues, emailSchema (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "login.ts"
Cohesion: 0.22
Nodes (7): passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField, loginSchema, LoginValues

### Community 41 - "validation/admin.ts"
Cohesion: 0.18
Nodes (14): ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput, createEmployeeSchema, UpdateCustomerInput, updateCustomerSchema (+6 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (26): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+18 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.60
Nodes (3): passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cn"
Cohesion: 0.11
Nodes (19): Tab(), CustomerModal(), CustomerModalProps, OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS (+11 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.13
Nodes (23): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition() (+15 more)

### Community 53 - "validation/profile.ts"
Cohesion: 0.15
Nodes (13): addressLabelSchema, deliveryNoteSchema, ContactDetailsField, contactDetailsSchema, ContactDetailsValues, DeliveryAddressField, DeliveryAddressValues, PasswordChangeField (+5 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.10
Nodes (21): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+13 more)

### Community 55 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 56 - "order-number.ts"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.27
Nodes (10): formatOrderTime(), fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL (+2 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.06
Nodes (28): CartTotalsSummary(), MenuGrid(), MenuGridProps, CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection() (+20 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.17
Nodes (16): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+8 more)

### Community 61 - "[orderId]/page.tsx"
Cohesion: 0.12
Nodes (13): OrderDetailPage(), ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom(), geocode(), readTrackedOrder(), TrackedOrder, getOrderEtaAction (+5 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "kds/page.tsx"
Cohesion: 0.50
Nodes (6): KdsInner(), ManageOrdersInner(), getDetailedOrders(), updateOrderStatus(), actionCopy(), dbStatusFor()

### Community 64 - "eta.ts"
Cohesion: 0.23
Nodes (9): GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, readArrivalQuote(), Coordinates, EtaResult, ACTIVE_KITCHEN_STATUSES (+1 more)

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "checkout-screen.test.tsx"
Cohesion: 0.10
Nodes (24): uploadMenuImage(), OrderSummaryCard(), handlePlaceOrder(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), foldPaymentStatus() (+16 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.08
Nodes (24): A. Input Validation Test, Application-level checks after the migration, C. Authentication Test, E. XSS Test, End-to-end checks against the live API, F. Functional Testing, Feedback form (one per tester), Functional issues found earlier in the QA pass (+16 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "log-out-control.test.tsx"
Cohesion: 0.40
Nodes (3): profile, refresh, replace

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 73 - "reports-charts.tsx"
Cohesion: 0.13
Nodes (22): getDefaultStartDate(), getToday(), ReportsContent(), ReportDateFilters(), ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso() (+14 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "CustomerData"
Cohesion: 0.33
Nodes (6): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Q3. Owner: "Who are my top 10 customers by spending this month?"

### Community 79 - "stored-image.ts"
Cohesion: 0.27
Nodes (9): uploadProfileImage(), removeStoredImages(), EXTENSION_BY_TYPE, IMAGE_BUCKETS, ImageBucket, imageExtensionFor(), imageUploadProblem(), MAX_IMAGE_UPLOAD_BYTES (+1 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.20
Nodes (13): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+5 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "phone.ts"
Cohesion: 0.20
Nodes (13): PhoneInput(), handleChange(), handlePaste(), INVALID_MOBILE_MESSAGE, isValidPhMobile(), maskPhoneDigits(), PH_MOBILE_DIGITS, PH_MOBILE_GROUPS_PATTERN (+5 more)

### Community 91 - "Review Checklist"
Cohesion: 0.12
Nodes (15): J10: Evidence for Disputes (🟡), J1: Personal Data Exposure (🔴 — Data Privacy Act), J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754), J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act), J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025), J5: Privacy Notice (🟠 — Data Privacy Act), J6: Minors (🟠 — Civil Code), J7: Delivery Photos (🟠 — Data Privacy Act) (+7 more)

### Community 92 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Cleanup Jobs (pg_cron), Constraints & Data Quality, Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags (+3 more)

### Community 93 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 96 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Persona: Restaurant Owner — "Mr. Yang""
Cohesion: 0.17
Nodes (11): Business Intelligence, Cash Management, Key Files to Check, Persona: Restaurant Owner — "Mr. Yang", Red Flags, Revenue Accuracy, Review Checklist, Staff Accountability (+3 more)

### Community 98 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist, RLS Verification (+3 more)

### Community 99 - "Lacking — compared with current restaurant ordering apps"
Cohesion: 0.17
Nodes (12): Business logic from ordering platforms, Features still lacking, Lacking — compared with current restaurant ordering apps, Philippine market insights (for the paper), Real-world scenarios still not handled, Round 3 — web articles, app reviews and social media, Security measures still lacking, Sources (+4 more)

### Community 100 - "session.ts"
Cohesion: 0.28
Nodes (9): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret() (+1 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.12
Nodes (17): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint" (+9 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "actions/profile.ts"
Cohesion: 0.08
Nodes (48): GET(), POST(), PATCH, DELETE, PATCH, POST, PATCH, DELETE (+40 more)

### Community 114 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "audit-log/page.tsx"
Cohesion: 0.10
Nodes (25): app_globals, anton, dmSans, metadata, CATEGORY_OPTIONS, DEFAULT_SORT, ManageAuditLogInner(), Option (+17 more)

### Community 119 - "cart-line-row.tsx"
Cohesion: 0.14
Nodes (16): QuantityStepper(), StepButton(), F7. Stepper: type the quantity — ❌, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling (+8 more)

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (19): Audit log, Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure (+11 more)

### Community 126 - "xss.test.tsx"
Cohesion: 0.24
Nodes (5): ReviewSubmission, reviewSubmissionSchema, ref_node_path, sourceFiles(), XSS_PAYLOADS

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 131 - "actions.ts"
Cohesion: 0.17
Nodes (9): ActionResult, EmployeeLoginResult, RegisterResult, requestPasswordReset(), resetPassword(), lib_address_validate_ncr_addressforgeocoding, EmployeeActionEntry, SessionClient (+1 more)

## Knowledge Gaps
- **782 isolated node(s):** `User roles`, `Tech stack`, `External services`, `Business rules`, `Triggers` (+777 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 964 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `useToast`, `auth.ts`, `actions.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `checkout-screen.tsx`, `actions/admin.ts`, `addCartItem`, `order-stage.ts`, `vitest`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `dashboard.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `server.ts`, `order-summary-card.tsx`, `(account)/profile/page.tsx`, `customer-profile.ts`, `employee-modal.tsx`, `validate-ncr.ts`, `transactions.ts`, `brand-panel.tsx`, `site-footer.tsx`, `cn`, `routers/orders.ts`, `menu-screen.tsx`, `actions/cart.ts`, `[orderId]/page.tsx`, `confirmation/page.tsx`, `kds/page.tsx`, `eta.ts`, `employee/login/page.tsx`, `notifications.ts`, `checkout-screen.test.tsx`, `submitCart`, `reports-charts.tsx`, `session.ts`, `actions/profile.ts`, `audit-log/page.tsx`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `next`, `actions.ts`, `sidebar.tsx`, `actions/audit.ts`, `actions/admin.ts`, `addCartItem`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `dashboard.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `server.ts`, `customer-profile.ts`, `transactions.ts`, `routers/orders.ts`, `actions/orders.ts`, `read-placed-order.ts`, `actions/cart.ts`, `[orderId]/page.tsx`, `kds/page.tsx`, `eta.ts`, `notifications.ts`, `submitCart`, `reports-charts.tsx`, `stored-image.ts`, `actions/profile.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Review Checklist`, `next`, `checkout-screen.test.tsx`, `createClient`, `Review Checklist`, `Review Checklist`, `Details`, `User simulation — 17 personas + hard questions through the UI`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`, `past-order.ts`, `Yang's Fried Rice — Ordering System`, `P2 — if time allows`, `cart-line-row.tsx`, `paymongo`, `actions/cart.ts`, `order-summary-card.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `User roles`, `Tech stack`, `External services` to the rest of the system?**
  _782 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0632996632996633 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.09178743961352658 - nodes in this community are weakly interconnected._