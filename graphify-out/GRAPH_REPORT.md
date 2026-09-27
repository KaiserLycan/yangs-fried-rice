# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 496 files · ~601,158 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2373 nodes · 6154 edges · 128 communities (113 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4138a6fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useToast
- auth.ts
- routers/addons.ts
- db-cleanse.mjs
- createClient
- sidebar.tsx
- actions/audit.ts
- order-placed-screen.test.tsx
- ref_node_fs
- routers/admin.ts
- next
- order-stage.ts
- @testing-library/react
- actions/reports.ts
- report-controls.tsx
- routers/reports.ts
- past-order.ts
- roles.ts
- toast.tsx
- package.json
- dashboard.ts
- actions/orders.ts
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- customer-signup-form.tsx
- paymongo
- The 12 questions
- server.ts
- order-summary-card.tsx
- devDependencies
- customer-profile.ts
- checkout/page.tsx
- employee-modal.tsx
- engine.ts
- compilerOptions
- order-card.tsx
- menu-actions.test.ts
- actions.ts
- requireApiEmployee
- Review Checklist
- actions/admin.ts
- Details
- dependencies
- validation/menu.ts
- brand-panel.tsx
- password-strength.ts
- B. SQL Injection Test
- site-footer.tsx
- cn
- routers/orders.ts
- date-of-birth.ts
- validation/orders.ts
- actions/address.ts
- P2 — if time allows
- D. Authorization Test
- 13. Cybersecurity analyst — "Dana, hired to assess the system before launch"
- fix-transactions.js
- vitest
- menu-screen.tsx
- actions/cart.ts
- track-order-screen.test.tsx
- confirmation/page.tsx
- kds/page.tsx
- reports-utils.ts
- scripts
- employee/login/page.tsx
- notifications.ts
- checkout-screen.test.tsx
- Phase 4 — Security & Testing Report
- submitCart
- Supabase
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
- Issue #106 — follow-up issues to file
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Persona: QA Tester — "Paolo, tries to break things"
- Lacking — compared with current restaurant ordering apps
- session.ts
- customer-portal-access.test.ts
- Review Checklist
- Review Checklist
- Persona: Cybersecurity Analyst — "Dana, assesses the system before launch"
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.tsx
- actions/profile.ts
- G. Usability Testing — **TO DO (manual)**
- Panel feedback — verified against the code and docs
- rewrite_docs.py
- Review Checklist
- Unimplemented Issues and Tasks
- Review Checklist
- react
- cart-line-row.tsx
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- injection.test.ts
- Handoff: put dispatched orders in the rider queue
- vitest.config.mts
- record-employee-action.ts
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 154 edges
2. `next` - 105 edges
3. `cn()` - 95 edges
4. `vitest` - 85 edges
5. `react` - 79 edges
6. `useToast()` - 57 edges
7. `resolveEmployeeRole()` - 37 edges
8. `lengthProps()` - 30 edges
9. `submitCart()` - 30 edges
10. `zod` - 29 edges

## Surprising Connections (you probably didn't know these)
- `E. Site-wide UX polish` --references--> `useShortcut()`  [INFERRED]
  docs/issue-106-followups.md → lib/hooks/use-shortcut.ts
- `F7. Stepper: type the quantity — ❌` --references--> `clampQuantity()`  [INFERRED]
  docs/feedback-verification.md → lib/menu/quantity.ts
- `B. Cart and checkout correctness` --references--> `clampQuantity()`  [INFERRED]
  docs/issue-106-followups.md → lib/menu/quantity.ts
- `Reorder Flow` --references--> `reorderPastOrder()`  [INFERRED]
  .agents/skills/persona-regular-customer/SKILL.md → lib/actions/cart.ts
- `20. No "Order again" row on the menu` --references--> `reorderPastOrder()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (128 total, 15 thin omitted)

### Community 0 - "useToast"
Cohesion: 0.17
Nodes (27): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+19 more)

### Community 1 - "auth.ts"
Cohesion: 0.12
Nodes (27): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+19 more)

### Community 2 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.18
Nodes (26): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), setEmployeePhoto(), ActionResult, Category, createAddOn(), createCategory() (+18 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (13): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference() (+5 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (41): GET, errorToStatus(), getAuditLog(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime(), SOURCE_LABELS (+33 more)

### Community 7 - "order-placed-screen.test.tsx"
Cohesion: 0.33
Nodes (5): order(), profile, refresh, select, walletOrder()

### Community 8 - "ref_node_fs"
Cohesion: 0.10
Nodes (14): lib_validation_order_issue, lib_validation_order_issue_canreportissue, lib_validation_order_issue_isorderissuephotopath, lib_validation_order_issue_orderissuephotoproblem, lib_validation_order_issue_reportorderissueschema, NOW, ref_node_fs, fixes (+6 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (30): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+22 more)

### Community 10 - "next"
Cohesion: 0.14
Nodes (15): DELETE(), POST(), DELETE(), GET(), Window, SwitchToCodButton(), handleSwitch(), ItemDetailModal() (+7 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.09
Nodes (32): OrderDetailPage(), OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom() (+24 more)

### Community 12 - "@testing-library/react"
Cohesion: 0.20
Nodes (5): CustomerLoginForm(), CustomerSignupForm(), RateOrderButton(), @testing-library/react, refresh

### Community 13 - "actions/reports.ts"
Cohesion: 0.11
Nodes (33): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+25 more)

### Community 14 - "report-controls.tsx"
Cohesion: 0.19
Nodes (15): getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect() (+7 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.14
Nodes (18): GET, GET, GET, GET, POST, GET, GET, GET (+10 more)

### Community 16 - "past-order.ts"
Cohesion: 0.15
Nodes (25): OrdersPage(), OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), canRate(), formatPlacedAt(), formatTotal() (+17 more)

### Community 17 - "roles.ts"
Cohesion: 0.14
Nodes (24): auditChanges(), updateEmployeeDetails(), ApiEmployee, GuardResult, canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee() (+16 more)

### Community 18 - "toast.tsx"
Cohesion: 0.07
Nodes (17): revalidate, app_globals, anton, dmSans, metadata, BottomTab, BottomTabBar(), TABS (+9 more)

### Community 19 - "package.json"
Cohesion: 0.06
Nodes (30): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+22 more)

### Community 20 - "dashboard.ts"
Cohesion: 0.17
Nodes (19): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+11 more)

### Community 21 - "actions/orders.ts"
Cohesion: 0.19
Nodes (13): ActionResult, attachOrderAddOns(), getAllOrders(), getOrderDetail(), getOrderStats(), Order, OrderStats, OrderSummary (+5 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.13
Nodes (18): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+10 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.09
Nodes (34): Authentication Bypass, Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Review Checklist, RLS Verification, Timing Attacks, S4: Disabled account lockout (🟠 High) (+26 more)

### Community 24 - "fields.ts"
Cohesion: 0.06
Nodes (42): formatAddress(), dateOfBirthSchema, addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema (+34 more)

### Community 25 - "customer-signup-form.tsx"
Cohesion: 0.11
Nodes (34): AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner(), ForgotPasswordForm() (+26 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 28 - "server.ts"
Cohesion: 0.10
Nodes (22): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+14 more)

### Community 29 - "order-summary-card.tsx"
Cohesion: 0.10
Nodes (28): CartContents(), CartEmptyState(), CartTotalsSummary(), CheckoutScreen(), OrderPlacedScreen(), OrderSummaryRows(), PaymentMethodPicker(), 🟡 Browsing and Ordering (+20 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "customer-profile.ts"
Cohesion: 0.12
Nodes (19): MobileMenuHeader(), ResolvedMobileProfile(), ResolvedProfileActions(), SiteNavBar(), ProfileHeader(), ProfileSummaryCard(), shortAddressLabel(), CustomerAddress (+11 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.12
Nodes (18): CartPage(), CheckoutPage(), ProfilePage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar(), F1. Landing page for marketing — ❌ (+10 more)

### Community 33 - "employee-modal.tsx"
Cohesion: 0.09
Nodes (35): FilterDropdown(), employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS (+27 more)

### Community 34 - "engine.ts"
Cohesion: 0.07
Nodes (44): POST, GET(), GET(), POST(), validateAddress(), getOrderEtaAction(), GetOrderEtaResult, geocodeCandidates() (+36 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-card.tsx"
Cohesion: 0.30
Nodes (11): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, canCancel() (+3 more)

### Community 37 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 38 - "actions.ts"
Cohesion: 0.12
Nodes (23): ActionResult, EmployeeLoginResult, registerCustomer(), RegisterResult, requestPasswordReset(), resetPassword(), fieldErrorsFrom(), upsertCustomerAddress() (+15 more)

### Community 39 - "requireApiEmployee"
Cohesion: 0.11
Nodes (25): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+17 more)

### Community 40 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 41 - "actions/admin.ts"
Cohesion: 0.12
Nodes (26): ActionResult, Customer, Employee, EmployeeEditInput, getEmployeeForEdit(), EmployeeRole, ChangePasswordInput, changePasswordSchema (+18 more)

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.31
Nodes (5): DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cn"
Cohesion: 0.08
Nodes (28): Tab(), LogOutControl(), CustomerModal(), CustomerModalProps, statusConfig, OrderSidebar(), OrderSidebarProps, OrderStatus (+20 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.21
Nodes (10): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+2 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.22
Nodes (13): isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES, ReportDateRange (+5 more)

### Community 53 - "actions/address.ts"
Cohesion: 0.17
Nodes (10): POST(), UpsertAddressInput, UpsertAddressResult, ADDRESS_COLUMNS, AddressPartsInput, AddressRow, addressRowFromParts(), deliveryAddressSchema (+2 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.10
Nodes (20): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+12 more)

### Community 55 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 56 - "13. Cybersecurity analyst — "Dana, hired to assess the system before launch""
Cohesion: 0.25
Nodes (6): S10: Webhook security (🟡 Low), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "vitest"
Cohesion: 0.22
Nodes (12): formatOrderTime(), foldPaymentStatus(), fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder() (+4 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.08
Nodes (21): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemSummary(), MenuEmptyState(), MenuScreen() (+13 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.17
Nodes (16): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+8 more)

### Community 61 - "track-order-screen.test.tsx"
Cohesion: 0.15
Nodes (9): geocode(), readTrackedOrder(), TrackedOrder, getOrderEtaAction, Handler, handlers, renderScreen(), router (+1 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "kds/page.tsx"
Cohesion: 0.50
Nodes (6): KdsInner(), ManageOrdersInner(), getDetailedOrders(), updateOrderStatus(), actionCopy(), dbStatusFor()

### Community 64 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

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
Nodes (23): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), PaymentStatus (+15 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.08
Nodes (25): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, C. Authentication Test, E. XSS Test, End-to-end checks against the live API, F. Functional Testing (+17 more)

### Community 70 - "submitCart"
Cohesion: 0.17
Nodes (15): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+7 more)

### Community 71 - "Supabase"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 73 - "reports-charts.tsx"
Cohesion: 0.17
Nodes (14): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso(), ReportsSummary() (+6 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.18
Nodes (11): Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical), S3: Direct database writes (🔴 High), S5: Session verification (🟠 Medium), S6: Storage bucket security (🟠 Medium) (+3 more)

### Community 78 - "CustomerData"
Cohesion: 0.33
Nodes (6): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Q3. Owner: "Who are my top 10 customers by spending this month?"

### Community 79 - "stored-image.ts"
Cohesion: 0.27
Nodes (8): uploadMenuImage(), removeStoredImages(), EXTENSION_BY_TYPE, IMAGE_BUCKETS, ImageBucket, imageExtensionFor(), MAX_IMAGE_UPLOAD_BYTES, storagePathFromPublicUrl()

### Community 80 - "map-staff-order.ts"
Cohesion: 0.18
Nodes (15): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+7 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "phone.ts"
Cohesion: 0.26
Nodes (12): ManageCustomersInner(), loadCustomers(), PhoneInput(), handleChange(), handlePaste(), formatMobileNumber(), maskPhoneDigits(), PH_MOBILE_DIGITS (+4 more)

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

### Community 95 - "Issue #106 — follow-up issues to file"
Cohesion: 0.25
Nodes (8): B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture, Issue #106 — follow-up issues to file

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
Cohesion: 0.30
Nodes (8): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), sessionSecret(), jose

### Community 101 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "Persona: Cybersecurity Analyst — "Dana, assesses the system before launch""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Verification SQL, Who is Dana?

### Community 105 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.tsx"
Cohesion: 0.21
Nodes (11): CancelOrderControl(), withdrawnMessage(), useCartAction(), isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "actions/profile.ts"
Cohesion: 0.11
Nodes (33): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+25 more)

### Community 111 - "G. Usability Testing — **TO DO (manual)**"
Cohesion: 0.50
Nodes (4): Feedback form (one per tester), G. Usability Testing — **TO DO (manual)**, Summary table to complete, Tasks to set each tester

### Community 112 - "Panel feedback — verified against the code and docs"
Cohesion: 0.67
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 114 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "react"
Cohesion: 0.09
Nodes (36): CATEGORY_OPTIONS, DEFAULT_SORT, ManageAuditLogInner(), Option, EmployeeData, ManageEmployeeInner(), ROLES, getVisiblePages() (+28 more)

### Community 119 - "cart-line-row.tsx"
Cohesion: 0.18
Nodes (13): DELETE(), PATCH(), RouteParams, CartLineRow(), QuantityStepper(), StepButton(), removeCartItem(), updateCartItem() (+5 more)

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "injection.test.ts"
Cohesion: 0.14
Nodes (10): contactDetailsSchema, ReviewSubmission, reviewSubmissionSchema, signupSchema, VALID, ref_node_path, INJECTION_PAYLOADS, sourceFiles() (+2 more)

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 131 - "record-employee-action.ts"
Cohesion: 0.33
Nodes (3): AppAuditAction, EmployeeActionEntry, SessionClient

## Knowledge Gaps
- **783 isolated node(s):** `NOW`, `OnValidResult`, `LoginGate`, `EmployeeSessionPayload`, `RouteParams` (+778 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 971 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `useToast`, `auth.ts`, `routers/addons.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `routers/admin.ts`, `order-stage.ts`, `@testing-library/react`, `report-controls.tsx`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `toast.tsx`, `package.json`, `dashboard.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `server.ts`, `order-summary-card.tsx`, `customer-profile.ts`, `checkout/page.tsx`, `employee-modal.tsx`, `engine.ts`, `menu-actions.test.ts`, `actions.ts`, `requireApiEmployee`, `brand-panel.tsx`, `site-footer.tsx`, `cn`, `routers/orders.ts`, `actions/address.ts`, `actions/cart.ts`, `confirmation/page.tsx`, `kds/page.tsx`, `employee/login/page.tsx`, `notifications.ts`, `checkout-screen.test.tsx`, `submitCart`, `session.ts`, `actions/profile.ts`, `react`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `routers/addons.ts`, `record-employee-action.ts`, `sidebar.tsx`, `actions/audit.ts`, `routers/admin.ts`, `next`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `dashboard.ts`, `actions/orders.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `server.ts`, `customer-profile.ts`, `checkout/page.tsx`, `engine.ts`, `actions.ts`, `requireApiEmployee`, `actions/admin.ts`, `actions/address.ts`, `vitest`, `actions/cart.ts`, `track-order-screen.test.tsx`, `kds/page.tsx`, `notifications.ts`, `submitCart`, `reports-charts.tsx`, `actions/profile.ts`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `auth.ts`, `vitest.config.mts`, `record-employee-action.ts`, `sidebar.tsx`, `actions/audit.ts`, `order-placed-screen.test.tsx`, `ref_node_fs`, `order-stage.ts`, `@testing-library/react`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `toast.tsx`, `package.json`, `fields.ts`, `order-summary-card.tsx`, `customer-profile.ts`, `checkout/page.tsx`, `employee-modal.tsx`, `engine.ts`, `order-card.tsx`, `menu-actions.test.ts`, `actions.ts`, `actions/admin.ts`, `validation/menu.ts`, `password-strength.ts`, `site-footer.tsx`, `cn`, `date-of-birth.ts`, `validation/orders.ts`, `actions/address.ts`, `menu-screen.tsx`, `actions/cart.ts`, `track-order-screen.test.tsx`, `confirmation/page.tsx`, `reports-utils.ts`, `checkout-screen.test.tsx`, `senior-pwd-ids.ts`, `stored-image.ts`, `map-staff-order.ts`, `phone.ts`, `session.ts`, `customer-portal-access.test.ts`, `cancel-order-control.tsx`, `cart-line-row.tsx`, `injection.test.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `NOW`, `OnValidResult`, `LoginGate` to the rest of the system?**
  _783 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11561561561561562 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._