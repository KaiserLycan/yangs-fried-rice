# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 472 files · ~586,216 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2397 nodes · 6283 edges · 128 communities (111 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f3b1b11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- password-card.tsx
- auth.ts
- cn
- db-cleanse.mjs
- createClient
- resolveEmployeeRole
- audit-log/page.tsx
- checkout-screen.tsx
- ref_node_fs
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- vitest
- actions/reports.ts
- bottom-tab-bar.tsx
- routers/reports.ts
- past-order.ts
- roles.ts
- react
- package.json
- reports-charts.tsx
- products.ts
- customer-orders.ts
- actions/employee-profile.ts
- customer-signup-form.tsx
- actions/cart.ts
- Review Checklist
- eta.ts
- database.types.ts
- cart-totals.ts
- devDependencies
- next
- checkout/page.tsx
- customers/page.tsx
- engine.ts
- compilerOptions
- manage/orders/page.tsx
- validate-ncr.ts
- routers/addons.ts
- requireApiEmployee
- use-shortcut.ts
- phone.ts
- Details
- dependencies
- actions.ts
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- menu-screen.test.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- validation/profile.ts
- P2 — if time allows
- reports-summary.tsx
- fields.ts
- senior-pwd-ids.ts
- read-placed-order.ts
- menu-screen.tsx
- addCartItem
- ToastProvider
- wallet-tab.ts
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- track-order-screen.tsx
- scripts
- employee/login/page.tsx
- notifications.ts
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- cancel-order-control.test.tsx
- reports/page.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- customer-portal-access.test.ts
- actions/admin.ts
- map-staff-order.ts
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- vitest.config.mts
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- server.ts
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- Review Checklist
- Review Checklist
- Review Checklist
- change-password/route.ts
- account-status.ts
- User simulation — 17 personas + hard questions through the UI
- cancelCustomerOrder
- The 12 questions
- actions/profile.ts
- user-simulation.md
- paymongo
- rewrite_docs.py
- lib_address_validate_ncr_addressforgeocoding
- Unimplemented Issues and Tasks
- Review Checklist
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts
- requireCustomer
- MenuItem
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- input-validation.test.ts
- Issue #106 — follow-up issues to file
- Handoff: put dispatched orders in the rider queue
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 154 edges
2. `next` - 106 edges
3. `cn()` - 99 edges
4. `vitest` - 84 edges
5. `react` - 82 edges
6. `useToast()` - 57 edges
7. `resolveEmployeeRole()` - 37 edges
8. `lengthProps()` - 32 edges
9. `submitCart()` - 30 edges
10. `zod` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567."` --references--> `getAllCustomers()`  [INFERRED]
  docs/user-simulation.md → lib/actions/admin.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-accountant/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-new-customer/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-qa-tester/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-security-analyst/SKILL.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (128 total, 17 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.15
Nodes (27): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+19 more)

### Community 1 - "auth.ts"
Cohesion: 0.16
Nodes (22): POST, POST, POST, customerLogin(), employeeLogin(), employeeLogout(), loginGate(), loginCustomer() (+14 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (48): Tab(), employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS (+40 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.12
Nodes (35): ManageMenuInner(), uploadMenuImage(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory() (+27 more)

### Community 5 - "resolveEmployeeRole"
Cohesion: 0.09
Nodes (21): Authentication Bypass, S4: Disabled account lockout (🟠 High), logout(), ManageLayout(), handleLogOut(), ManageShell(), DEFAULT_SIDEBAR_USER, initialsFromName() (+13 more)

### Community 6 - "audit-log/page.tsx"
Cohesion: 0.06
Nodes (52): GET, errorToStatus(), getAuditLog(), CATEGORY_OPTIONS, FilterDropdown(), ManageAuditLogInner(), ManageAuditLogPage(), Option (+44 more)

### Community 7 - "checkout-screen.tsx"
Cohesion: 0.11
Nodes (18): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+10 more)

### Community 8 - "ref_node_fs"
Cohesion: 0.17
Nodes (8): ref_node_fs, fixes, raw, sql, checkout, hardening, pickupOnly, quantityBounds

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (29): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+21 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.12
Nodes (25): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+17 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.10
Nodes (28): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+20 more)

### Community 12 - "vitest"
Cohesion: 0.14
Nodes (8): CustomerLoginForm(), CustomerSignupForm(), ToastTone, @testing-library/react, vitest, Trigger(), OPTIONS, RolePicker()

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (29): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+21 more)

### Community 14 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.11
Nodes (31): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+23 more)

### Community 17 - "roles.ts"
Cohesion: 0.15
Nodes (22): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+14 more)

### Community 18 - "react"
Cohesion: 0.11
Nodes (22): EmployeeData, ROLES, LogOutControl(), RateOrderDialog(), SCORE_WORDS, AccountActions(), Button(), ButtonProps (+14 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (28): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+20 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.15
Nodes (20): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+12 more)

### Community 21 - "products.ts"
Cohesion: 0.11
Nodes (20): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+12 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.13
Nodes (16): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderButton(), ActionResult, getMyOrderDetail() (+8 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.12
Nodes (27): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+19 more)

### Community 24 - "customer-signup-form.tsx"
Cohesion: 0.09
Nodes (40): requestPasswordReset(), AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner() (+32 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.25
Nodes (11): ActionResult, ActiveCart, CartItemDetail, AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema, SubmitCartInput (+3 more)

### Community 26 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "eta.ts"
Cohesion: 0.27
Nodes (9): CheckoutConfirmationPage(), GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam(), Coordinates (+1 more)

### Community 28 - "database.types.ts"
Cohesion: 0.11
Nodes (20): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+12 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.12
Nodes (20): CartContents(), CartEmptyState(), OrderPlacedScreen(), OrderSummaryRows(), PlacedOrder, calculateDeliveryFee(), CartLine, CartTotals (+12 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "next"
Cohesion: 0.09
Nodes (23): revalidate, Window, CustomerModal(), CustomerModalProps, ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions() (+15 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.12
Nodes (24): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar() (+16 more)

### Community 33 - "customers/page.tsx"
Cohesion: 0.21
Nodes (10): ManageCustomersInner(), loadCustomers(), CustomerData, SortableHeader(), SortableHeaderProps, SortDirection, 31. Customer list has no order totals or history, and loads every customer (P2), Q3. Owner: "Who are my top 10 customers by spending this month?" (+2 more)

### Community 34 - "engine.ts"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "manage/orders/page.tsx"
Cohesion: 0.15
Nodes (26): KdsInner(), ManageOrdersInner(), KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal() (+18 more)

### Community 37 - "validate-ncr.ts"
Cohesion: 0.17
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "requireApiEmployee"
Cohesion: 0.23
Nodes (12): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+4 more)

### Community 40 - "use-shortcut.ts"
Cohesion: 0.16
Nodes (17): app_globals, anton, dmSans, metadata, SearchField(), ShortcutsHelp(), STAFF_AREAS, Kbd() (+9 more)

### Community 41 - "phone.ts"
Cohesion: 0.17
Nodes (18): PhoneInput(), handleChange(), handlePaste(), employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, INVALID_MOBILE_MESSAGE (+10 more)

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "actions.ts"
Cohesion: 0.16
Nodes (14): ActionResult, EmployeeLoginResult, RegisterResult, resetPassword(), deleteSession(), EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema (+6 more)

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.60
Nodes (3): passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "map-content.tsx"
Cohesion: 0.16
Nodes (10): DeliveryMap(), MapContent, LiveMapPanel(), DeliveryData, DeliveryItem, MOCK_DELIVERIES, OrderStatus, RESTAURANT_LOCATION (+2 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "menu-screen.test.tsx"
Cohesion: 0.15
Nodes (6): CartTotalsSummary(), MenuScreen(), fetchCategories(), isRestaurantOpen(), MOCK_CATEGORIES, MOCK_PRODUCTS

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.13
Nodes (22): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition() (+14 more)

### Community 53 - "validation/profile.ts"
Cohesion: 0.07
Nodes (27): dateOfBirthSchema, addressLabelSchema, deliveryNoteSchema, passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField (+19 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.09
Nodes (22): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+14 more)

### Community 55 - "reports-summary.tsx"
Cohesion: 0.18
Nodes (14): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+6 more)

### Community 56 - "fields.ts"
Cohesion: 0.15
Nodes (15): formatAddress(), AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema, LimitedField (+7 more)

### Community 57 - "senior-pwd-ids.ts"
Cohesion: 0.09
Nodes (21): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+13 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.27
Nodes (10): formatOrderTime(), fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL (+2 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.09
Nodes (27): CartLineRow(), CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemDetailModal(), handleAddToCart() (+19 more)

### Community 60 - "addCartItem"
Cohesion: 0.33
Nodes (7): DELETE(), POST(), DELETE(), GET(), addCartItem(), clearCart(), getActiveCart()

### Community 61 - "ToastProvider"
Cohesion: 0.18
Nodes (7): ToastProvider(), getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.14
Nodes (14): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+6 more)

### Community 64 - "track-order-screen.tsx"
Cohesion: 0.31
Nodes (7): OrderDetailPage(), ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom(), geocode(), readTrackedOrder(), TrackedOrder

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
Cohesion: 0.15
Nodes (20): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), foldPaymentStatus() (+12 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 73 - "reports/page.tsx"
Cohesion: 0.20
Nodes (12): getDefaultStartDate(), getToday(), ReportsContent(), ReportDateFilters(), ReportTypeSelect(), LEGACY_MENU_SATISFACTION_TYPES, MENU_SATISFACTION_REPORT, normalizeReportType() (+4 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 79 - "actions/admin.ts"
Cohesion: 0.15
Nodes (23): ManageEmployeeInner(), ActionResult, auditChanges(), createEmployee(), Customer, Employee, EmployeeEditInput, updateEmployeeDetails() (+15 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.18
Nodes (15): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+7 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

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
Cohesion: 0.29
Nodes (7): createSession(), decrypt(), EmployeeSessionPayload, encrypt(), sessionSecret(), loginSchema, jose

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "change-password/route.ts"
Cohesion: 0.27
Nodes (4): POST, GET, changeOwnPassword(), getMe()

### Community 105 - "account-status.ts"
Cohesion: 0.38
Nodes (5): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, ACCOUNT_DISABLED_MESSAGE, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "cancelCustomerOrder"
Cohesion: 0.50
Nodes (4): POST(), RouteParams, cancelCustomerOrder(), getCancellationErrorMessage()

### Community 108 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 109 - "actions/profile.ts"
Cohesion: 0.19
Nodes (23): POST(), registerCustomer(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress() (+15 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.22
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 111 - "paymongo"
Cohesion: 0.29
Nodes (7): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo()

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 119 - "requireCustomer"
Cohesion: 0.29
Nodes (9): DELETE(), PATCH(), RouteParams, SwitchToCodButton(), handleSwitch(), removeCartItem(), requireCustomer(), switchOrderToCashOnDelivery() (+1 more)

### Community 121 - "MenuItem"
Cohesion: 0.32
Nodes (8): Code Consistency, MenuItemDetailModalProps, MenuItemModalProps, MenuItem, 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Structure and naming, DeliveryLocation

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (19): Audit log, Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure (+11 more)

### Community 126 - "input-validation.test.ts"
Cohesion: 0.13
Nodes (13): contactDetailsSchema, reviewSubmissionSchema, signupSchema, TransactionInput, transactionSchema, TransactionUpdateInput, transactionUpdateSchema, ref_node_path (+5 more)

### Community 127 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **781 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `getAuditLog` (+776 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `auth.ts`, `cn`, `createClient`, `resolveEmployeeRole`, `audit-log/page.tsx`, `checkout-screen.tsx`, `routers/admin.ts`, `routers/profile.ts`, `vitest`, `bottom-tab-bar.tsx`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `reports-charts.tsx`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `eta.ts`, `database.types.ts`, `cart-totals.ts`, `checkout/page.tsx`, `manage/orders/page.tsx`, `validate-ncr.ts`, `routers/addons.ts`, `requireApiEmployee`, `use-shortcut.ts`, `actions.ts`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `menu-screen.test.tsx`, `routers/orders.ts`, `addCartItem`, `track-order-screen.tsx`, `employee/login/page.tsx`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `reports/page.tsx`, `server.ts`, `session.ts`, `account-status.ts`, `cancelCustomerOrder`, `actions/profile.ts`, `requireCustomer`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `resolveEmployeeRole`, `audit-log/page.tsx`, `routers/admin.ts`, `routers/profile.ts`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `reports-charts.tsx`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `actions/cart.ts`, `eta.ts`, `database.types.ts`, `next`, `checkout/page.tsx`, `customers/page.tsx`, `manage/orders/page.tsx`, `routers/addons.ts`, `requireApiEmployee`, `actions.ts`, `routers/orders.ts`, `actions/orders.ts`, `reports-summary.tsx`, `read-placed-order.ts`, `addCartItem`, `track-order-screen.tsx`, `notifications.ts`, `submitCart`, `actions/admin.ts`, `server.ts`, `cancelCustomerOrder`, `actions/profile.ts`, `requireCustomer`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `password-card.tsx`, `auth.ts`, `cn`, `createClient`, `audit-log/page.tsx`, `checkout-screen.tsx`, `ref_node_fs`, `order-stage.ts`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `actions/cart.ts`, `eta.ts`, `cart-totals.ts`, `next`, `checkout/page.tsx`, `engine.ts`, `manage/orders/page.tsx`, `validate-ncr.ts`, `phone.ts`, `actions.ts`, `password-strength.ts`, `site-footer.tsx`, `menu-screen.test.tsx`, `date-of-birth.ts`, `actions/orders.ts`, `validation/profile.ts`, `fields.ts`, `senior-pwd-ids.ts`, `read-placed-order.ts`, `menu-screen.tsx`, `ToastProvider`, `wallet-tab.ts`, `track-order-screen.tsx`, `order-summary-card.tsx`, `reports-utils.ts`, `cancel-order-control.test.tsx`, `customer-portal-access.test.ts`, `actions/admin.ts`, `map-staff-order.ts`, `vitest.config.mts`, `server.ts`, `session.ts`, `delete-confirmation.test.ts`, `input-validation.test.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _781 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `password-card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14743589743589744 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07327001356852103 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._