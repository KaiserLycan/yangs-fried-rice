# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 457 files · ~575,381 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2410 nodes · 6221 edges · 132 communities (115 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f3b1b11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- auth.ts
- actions.ts
- db-cleanse.mjs
- createClient
- sidebar.tsx
- actions/audit.ts
- order-placed-screen.tsx
- ref_node_fs
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- next
- actions/reports.ts
- server.ts
- routers/reports.ts
- past-order.ts
- roles.ts
- actions/admin.ts
- package.json
- reports-charts.tsx
- validation/menu.ts
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- customer-signup-form.tsx
- paymongo
- updateCartItem
- requireApiEmployee
- cart-totals.ts
- devDependencies
- (account)/profile/page.tsx
- customer-profile.ts
- react
- engine.ts
- compilerOptions
- order-detail-modal.tsx
- routers/address.ts
- routers/addons.ts
- transactions.ts
- menu-actions.test.ts
- phone.ts
- Details
- dependencies
- bottom-tab-bar.tsx
- site-footer.tsx
- vitest
- track-order-screen.tsx
- login-rate-limit.ts
- toast.tsx
- actions/orders.ts
- date-of-birth.ts
- validation/orders.ts
- validation/profile.ts
- P2 — if time allows
- [orderId]/page.tsx
- resolveEmployeeRole
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- actions/cart.ts
- ToastProvider
- wallet-tab.ts
- manage/orders/page.tsx
- eta.ts
- scripts
- employee/login/page.tsx
- notifications.ts
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- senior-pwd-ids.ts
- report-controls.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- requireCustomer
- actions/profile.ts
- map-staff-order.ts
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- Supabase
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- customer-portal-access.test.ts
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Persona: QA Tester — "Paolo, tries to break things"
- Lacking — compared with current restaurant ordering apps
- session.ts
- record-employee-action.ts
- Review Checklist
- Review Checklist
- Persona: Cybersecurity Analyst — "Dana, assesses the system before launch"
- getOrderEtaAction
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.test.tsx
- validate-ncr.ts
- xss.test.tsx
- B. SQL Injection Test
- rewrite_docs.py
- Review Checklist
- Unimplemented Issues and Tasks
- Review Checklist
- Issue #106 — follow-up issues to file
- D. Authorization Test
- cart-line-row.tsx
- G. Usability Testing — **TO DO (manual)**
- me/route.ts
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- zod
- Handoff: put dispatched orders in the rider queue
- vitest.config.mts
- lib_address_validate_ncr_addressforgeocoding
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 154 edges
2. `next` - 109 edges
3. `cn()` - 101 edges
4. `vitest` - 84 edges
5. `react` - 80 edges
6. `useToast()` - 57 edges
7. `resolveEmployeeRole()` - 37 edges
8. `submitCart()` - 30 edges
9. `lengthProps()` - 30 edges
10. `zod` - 29 edges

## Surprising Connections (you probably didn't know these)
- `F1. Landing page for marketing — ❌` --references--> `MenuPageBody()`  [INFERRED]
  docs/feedback-verification.md → components/menu/menu-page-body.tsx
- `Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567."` --references--> `getAllCustomers()`  [INFERRED]
  docs/user-simulation.md → lib/actions/admin.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-accountant/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-new-customer/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-qa-tester/SKILL.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (132 total, 17 thin omitted)

### Community 0 - "cn"
Cohesion: 0.11
Nodes (41): revalidate, Tab(), employeeFormSchema(), EmployeeModal(), inputClass(), snapshotFields(), snapshotOf(), EmployeeContactDetailsCard() (+33 more)

### Community 1 - "auth.ts"
Cohesion: 0.19
Nodes (15): POST, POST, POST, POST, changeOwnPassword(), customerLogin(), employeeLogin(), employeeLogout() (+7 more)

### Community 2 - "actions.ts"
Cohesion: 0.15
Nodes (14): ActionResult, EmployeeLoginResult, RegisterResult, resetPassword(), deleteSession(), EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema (+6 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.19
Nodes (25): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+17 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (13): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference() (+5 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (41): GET, errorToStatus(), getAuditLog(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime(), SOURCE_LABELS (+33 more)

### Community 7 - "order-placed-screen.tsx"
Cohesion: 0.21
Nodes (10): OrderPlacedScreen(), PaymentStatus, PlacedOrder, ARRIVAL_UNKNOWN, isUnpaidStatus(), order(), profile, refresh (+2 more)

### Community 8 - "ref_node_fs"
Cohesion: 0.17
Nodes (8): ref_node_fs, fixes, raw, sql, checkout, hardening, pickupOnly, quantityBounds

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (34): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+26 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.12
Nodes (25): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+17 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.13
Nodes (21): TrackOrderScreen(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES, Fulfilment, fulfilmentOf(), furtherAlong(), headlineFor() (+13 more)

### Community 12 - "next"
Cohesion: 0.10
Nodes (10): Window, app_globals, anton, dmSans, metadata, CustomerLoginForm(), CustomerSignupForm(), next (+2 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.11
Nodes (30): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+22 more)

### Community 14 - "server.ts"
Cohesion: 0.10
Nodes (21): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+13 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.11
Nodes (32): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+24 more)

### Community 17 - "roles.ts"
Cohesion: 0.14
Nodes (22): ApiEmployee, GuardResult, canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword() (+14 more)

### Community 18 - "actions/admin.ts"
Cohesion: 0.21
Nodes (14): ActionResult, Customer, Employee, EmployeeEditInput, ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema (+6 more)

### Community 19 - "package.json"
Cohesion: 0.06
Nodes (31): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+23 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.13
Nodes (22): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+14 more)

### Community 21 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "customer-orders.ts"
Cohesion: 0.13
Nodes (16): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderButton(), ActionResult, getMyOrderDetail() (+8 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.18
Nodes (19): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+11 more)

### Community 24 - "fields.ts"
Cohesion: 0.10
Nodes (25): addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema, deliveryNoteSchema (+17 more)

### Community 25 - "customer-signup-form.tsx"
Cohesion: 0.10
Nodes (36): AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner(), ForgotPasswordForm() (+28 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "updateCartItem"
Cohesion: 0.17
Nodes (12): DELETE(), PATCH(), RouteParams, POST(), ItemDetailModal(), handleAddToCart(), handleSaveEdit(), addCartItem() (+4 more)

### Community 28 - "requireApiEmployee"
Cohesion: 0.21
Nodes (12): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+4 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.13
Nodes (14): CartContents(), CartEmptyState(), CartTotalsSummary(), OrderSummaryRows(), calculateDeliveryFee(), CartLine, CartTotals, computeCartTotals() (+6 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.10
Nodes (26): revalidate, CustomerModal(), CustomerModalProps, MobileMenuHeader(), ResolvedMobileProfile(), components_nav_notification_bell, components_nav_notification_bell_notificationbell, NAV_LINKS (+18 more)

### Community 32 - "customer-profile.ts"
Cohesion: 0.09
Nodes (31): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar() (+23 more)

### Community 33 - "react"
Cohesion: 0.06
Nodes (62): CATEGORY_OPTIONS, DEFAULT_SORT, FilterDropdown(), ManageAuditLogInner(), Option, ManageCustomersInner(), loadCustomers(), EmployeeData (+54 more)

### Community 34 - "engine.ts"
Cohesion: 0.15
Nodes (22): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+14 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-detail-modal.tsx"
Cohesion: 0.27
Nodes (14): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+6 more)

### Community 37 - "routers/address.ts"
Cohesion: 0.36
Nodes (4): POST, validateAddress(), AddressInput, addressSchema

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 41 - "phone.ts"
Cohesion: 0.19
Nodes (13): employeeDateOfBirthSchema, employeePersonalDetailsSchema, employeeProfileUpdateSchema, lastNameSchema, INVALID_MOBILE_MESSAGE, isValidPhMobile(), optionalPhoneSchema, PH_MOBILE_DIGITS (+5 more)

### Community 42 - "Details"
Cohesion: 0.07
Nodes (27): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+19 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 45 - "site-footer.tsx"
Cohesion: 0.10
Nodes (14): metadata, AuthShell(), BrandPanel(), FOOTER_LINKS, SiteFooter(), copyrightYears(), PICKUP_COUNTER, SITE_BRANCH (+6 more)

### Community 46 - "vitest"
Cohesion: 0.15
Nodes (8): shortAddressLabel(), DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), passwordStrength, PasswordStrengthLabel, scoreOf(), UNPAID_ORDER_STATUSES, vitest

### Community 47 - "track-order-screen.tsx"
Cohesion: 0.15
Nodes (12): components_orders_order_receipt, components_orders_order_receipt_orderreceipt, OrderTimeline(), StageMarker(), STATE_LABELS, components_orders_pickup_point_panel, components_orders_pickup_point_panel_pickuppointpanel, components_orders_report_problem (+4 more)

### Community 48 - "login-rate-limit.ts"
Cohesion: 0.23
Nodes (9): checkLoginAllowed(), emailKey(), gateFromFailures(), LoginGate, MAX_FAILURES_PER_EMAIL, MAX_FAILURES_PER_IP, NOW, WINDOW_MINUTES (+1 more)

### Community 49 - "toast.tsx"
Cohesion: 0.08
Nodes (27): LogOutControl(), EmployeeAvatarCard(), RateOrderDialog(), SCORE_WORDS, AccountActions(), AvatarButton(), DeliveryAddressesCard(), ProfileAvatarCard() (+19 more)

### Community 50 - "actions/orders.ts"
Cohesion: 0.11
Nodes (25): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+17 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.22
Nodes (13): isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES, ReportDateRange (+5 more)

### Community 53 - "validation/profile.ts"
Cohesion: 0.10
Nodes (21): newPasswordSchema, passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField, loginSchema, LoginValues (+13 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.05
Nodes (43): CustomerData, 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows (+35 more)

### Community 55 - "[orderId]/page.tsx"
Cohesion: 0.24
Nodes (9): OrderDetailPage(), first(), readTrackedOrder(), TrackedOrder, TrackedOrderIssue, TrackedOrderLine, TrackedOrderPayment, lib_validation_order_issue (+1 more)

### Community 56 - "resolveEmployeeRole"
Cohesion: 0.29
Nodes (9): ManageEmployeeInner(), ManageLayout(), ManageShell(), setEmployeePhoto(), updateEmployeeDetails(), normalizeEmployeeRoleLabel(), resolveEmployeeRole(), roleDisplayLabel() (+1 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.19
Nodes (12): formatOrderTime(), foldPaymentStatus(), fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+4 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.09
Nodes (18): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), components_menu_order_again_row, components_menu_order_again_row_orderagainrow (+10 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.18
Nodes (15): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+7 more)

### Community 61 - "ToastProvider"
Cohesion: 0.18
Nodes (7): ToastProvider(), getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "manage/orders/page.tsx"
Cohesion: 0.19
Nodes (12): KdsInner(), ManageOrdersInner(), components_manage_orders_open_issues_panel, components_manage_orders_open_issues_panel_openissuespanel, OrderSidebar(), OrderSidebarProps, OrderStatus, statuses (+4 more)

### Community 64 - "eta.ts"
Cohesion: 0.33
Nodes (6): CheckoutConfirmationPage(), GetOrderEtaResult, walletFromParam(), EtaResult, arrivalLineFor(), arrivalWindowFrom()

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.08
Nodes (35): CheckoutScreen(), OrderSummaryCard(), handlePlaceOrder(), PaymentMethodPicker(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL (+27 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.08
Nodes (25): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, C. Authentication Test, E. XSS Test, End-to-end checks against the live API, F. Functional Testing (+17 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 73 - "report-controls.tsx"
Cohesion: 0.13
Nodes (25): getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect() (+17 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.06
Nodes (32): Authentication Bypass, Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Review Checklist, RLS Verification, Timing Attacks, Review Checklist (+24 more)

### Community 78 - "requireCustomer"
Cohesion: 0.29
Nodes (9): DELETE(), DELETE(), GET(), SwitchToCodButton(), handleSwitch(), clearCart(), getActiveCart(), requireCustomer() (+1 more)

### Community 79 - "actions/profile.ts"
Cohesion: 0.19
Nodes (12): uploadMenuImage(), AddressInput, RouterResult, UpdateProfileInput, removeStoredImages(), EXTENSION_BY_TYPE, IMAGE_BUCKETS, ImageBucket (+4 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.17
Nodes (16): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+8 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "Supabase"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

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

### Community 95 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 96 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Persona: Restaurant Owner — "Mr. Yang""
Cohesion: 0.17
Nodes (11): Business Intelligence, Cash Management, Key Files to Check, Persona: Restaurant Owner — "Mr. Yang", Red Flags, Revenue Accuracy, Review Checklist, Staff Accountability (+3 more)

### Community 98 - "Persona: QA Tester — "Paolo, tries to break things""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Verification SQL, Who is Paolo?

### Community 99 - "Lacking — compared with current restaurant ordering apps"
Cohesion: 0.17
Nodes (12): Business logic from ordering platforms, Features still lacking, Lacking — compared with current restaurant ordering apps, Philippine market insights (for the paper), Real-world scenarios still not handled, Round 3 — web articles, app reviews and social media, Security measures still lacking, Sources (+4 more)

### Community 100 - "session.ts"
Cohesion: 0.46
Nodes (6): createSession(), decrypt(), EmployeeSessionPayload, encrypt(), sessionSecret(), jose

### Community 101 - "record-employee-action.ts"
Cohesion: 0.33
Nodes (4): AppAuditAction, EmployeeActionEntry, recordEmployeeAction(), SessionClient

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "Persona: Cybersecurity Analyst — "Dana, assesses the system before launch""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Verification SQL, Who is Dana?

### Community 105 - "getOrderEtaAction"
Cohesion: 0.60
Nodes (4): GET(), GET(), POST(), getOrderEtaAction()

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "validate-ncr.ts"
Cohesion: 0.16
Nodes (24): POST(), registerCustomer(), requestPasswordReset(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress() (+16 more)

### Community 111 - "xss.test.tsx"
Cohesion: 0.33
Nodes (3): ref_node_path, sourceFiles(), XSS_PAYLOADS

### Community 112 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 114 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "Issue #106 — follow-up issues to file"
Cohesion: 0.25
Nodes (8): B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture, Issue #106 — follow-up issues to file

### Community 118 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 119 - "cart-line-row.tsx"
Cohesion: 0.14
Nodes (19): CartLineRow(), MenuGrid(), MenuGridProps, AddOnsSection(), CartLineEdit, ItemSummary(), ProductCard(), ProductPhotoPlaceholder() (+11 more)

### Community 120 - "G. Usability Testing — **TO DO (manual)**"
Cohesion: 0.50
Nodes (4): Feedback form (one per tester), G. Usability Testing — **TO DO (manual)**, Summary table to complete, Tasks to set each tester

### Community 122 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "zod"
Cohesion: 0.18
Nodes (8): escapeLikePattern(), ReviewSubmission, reviewSubmissionSchema, signupSchema, VALID, zod, INJECTION_PAYLOADS, sourceFiles()

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **788 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `refresh` (+783 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 990 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `cn`, `auth.ts`, `actions.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `order-placed-screen.tsx`, `routers/admin.ts`, `routers/profile.ts`, `server.ts`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `updateCartItem`, `requireApiEmployee`, `cart-totals.ts`, `(account)/profile/page.tsx`, `customer-profile.ts`, `react`, `routers/address.ts`, `routers/addons.ts`, `transactions.ts`, `menu-actions.test.ts`, `bottom-tab-bar.tsx`, `site-footer.tsx`, `track-order-screen.tsx`, `toast.tsx`, `actions/orders.ts`, `[orderId]/page.tsx`, `resolveEmployeeRole`, `actions/cart.ts`, `manage/orders/page.tsx`, `eta.ts`, `employee/login/page.tsx`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `report-controls.tsx`, `RoutePlaceholder`, `requireCustomer`, `actions/profile.ts`, `session.ts`, `getOrderEtaAction`, `validate-ncr.ts`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `actions.ts`, `sidebar.tsx`, `actions/audit.ts`, `routers/admin.ts`, `routers/profile.ts`, `actions/reports.ts`, `server.ts`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `actions/admin.ts`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `updateCartItem`, `requireApiEmployee`, `customer-profile.ts`, `routers/addons.ts`, `transactions.ts`, `vitest`, `actions/orders.ts`, `[orderId]/page.tsx`, `resolveEmployeeRole`, `read-placed-order.ts`, `menu-screen.tsx`, `actions/cart.ts`, `manage/orders/page.tsx`, `eta.ts`, `notifications.ts`, `submitCart`, `report-controls.tsx`, `Review Checklist`, `requireCustomer`, `actions/profile.ts`, `record-employee-action.ts`, `getOrderEtaAction`, `validate-ncr.ts`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `cn`, `actions.ts`, `vitest.config.mts`, `sidebar.tsx`, `actions/audit.ts`, `order-placed-screen.tsx`, `ref_node_fs`, `order-stage.ts`, `next`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `actions/admin.ts`, `package.json`, `validation/menu.ts`, `customer-orders.ts`, `fields.ts`, `cart-totals.ts`, `(account)/profile/page.tsx`, `customer-profile.ts`, `react`, `engine.ts`, `order-detail-modal.tsx`, `routers/address.ts`, `menu-actions.test.ts`, `phone.ts`, `site-footer.tsx`, `login-rate-limit.ts`, `toast.tsx`, `date-of-birth.ts`, `validation/orders.ts`, `validation/profile.ts`, `read-placed-order.ts`, `menu-screen.tsx`, `actions/cart.ts`, `ToastProvider`, `wallet-tab.ts`, `eta.ts`, `order-summary-card.tsx`, `reports-utils.ts`, `senior-pwd-ids.ts`, `actions/profile.ts`, `map-staff-order.ts`, `customer-portal-access.test.ts`, `session.ts`, `record-employee-action.ts`, `getOrderEtaAction`, `cancel-order-control.test.tsx`, `validate-ncr.ts`, `xss.test.tsx`, `cart-line-row.tsx`, `zod`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _788 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.10519480519480519 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._