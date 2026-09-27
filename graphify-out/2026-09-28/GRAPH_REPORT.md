# Graph Report - Yangs-fried-rice  (2026-09-28)

## Corpus Check
- 605 files · ~824,249 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .patch 2, .example 1)

## Summary
- 3154 nodes · 8262 edges · 199 communities (149 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 143 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9dd1340`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store-control-panel.tsx
- actions.ts
- database.types.ts
- db-cleanse.mjs
- actions/menu.ts
- sidebar.tsx
- products.ts
- useToast
- cn
- resolveEmployeeRole
- wallet-tab.ts
- order-stage.ts
- order-summary-card.tsx
- actions/cart.ts
- store-status.ts
- routers/reports.ts
- past-order.ts
- roles.ts
- Issue #106 — follow-up issues to file
- package.json
- dashboard-content.tsx
- actions/admin.ts
- fields.ts
- brand-panel.tsx
- (account)/profile/page.tsx
- notification-bell.tsx
- Review Checklist
- order-issues.ts
- transactions.ts
- report-controls.tsx
- Dev Dependencies
- The 12 questions
- landing-page.test.tsx
- employee-modal.tsx
- engine.ts
- TypeScript Configuration
- kds/page.tsx
- cart-totals.ts
- routers/addons.ts
- reports-summary.tsx
- (shop)/page.tsx
- actions/employee-profile.ts
- Details
- Runtime Dependencies
- customers/page.tsx
- site-info.ts
- Review Checklist
- payment-status-card.tsx
- audit-log/page.tsx
- cart.limits.test.ts
- actions/orders.ts
- menu-screen.tsx
- validation/orders.ts
- item-detail-modal.tsx
- P2 — if time allows
- ref_fs
- Section 1 — P1 Items Still Open
- Part C — Acceptance criteria and test cases
- Section 9 — Simulated Frustration Scenarios & Persona Reviews
- routers/orders.ts
- updateCartItem
- delete-confirmation.test.ts
- reports-utils.ts
- Validation Testing Plan: Phases 1–9
- customer-signup-form.tsx
- NPM Scripts
- actions/profile.ts
- Notifications API
- @supabase/supabase-js
- Phase 4 — Security & Testing Report
- submitCart
- legal-page.tsx
- senior-pwd-ids.ts
- formatPeso
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Review Checklist
- order-receipt.tsx
- promotions.ts
- dashboard.ts
- ESLint Configuration
- next.config.mjs
- postcss.config.mjs
- Prettier Configuration
- session.ts
- Tailwind Configuration
- Vitest Test Setup
- Legal Compliance Persona
- Review Checklist
- System Analyst Persona
- UI/UX Designer Persona
- fix-transactions.js
- Kitchen Staff Persona
- Restaurant Owner Persona
- Review Checklist
- Market Research Findings
- password-strength-meter.tsx
- createAdminClient
- New Customer Persona
- Senior Customer Persona
- requireCustomer
- next
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.test.tsx
- map-staff-order.ts
- README.md
- store-hours.ts
- curl-test.js
- Docs Rewrite Script
- Review Checklist
- Unimplemented Issues and Tasks
- Manager Persona
- limits.ts
- read-tracked-order.ts
- employee/login/page.tsx
- actions/reports.ts
- track-order-screen.tsx
- Copy glossary
- Competitor Comparison Analysis
- Requirements Audit
- Yang's Fried Rice — Ordering System
- check-types.js
- createClient
- bottom-tab-bar.tsx
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- store-control-panel.test.tsx
- make-migration.js
- ToastProvider
- account-status.ts
- read-placed-order.ts
- get-staff.js
- customer-orders.ts
- order-rules.ts
- test-kds-query2.js
- fix-item-modal.js
- Graphify Rules
- Graphify Workflow
- readCustomerProfile
- fix-tokens-3.js
- patch-admin-orders-role.js
- menu-item-detail-modal.tsx
- check-ready-orders2.js
- vitest
- resolve-conflicts.js
- fix-addon-name.js
- paymongo
- fix-schema.js
- order-number.ts
- chart-colors.test.ts
- app/layout.tsx
- schema.ts
- order-timeline.tsx
- patch-db-types2.js
- test-kds-query.js
- profile.delete.test.ts
- pickup-followup.tsx
- patch-kds-card.js
- fix-ghost.js
- test-map.js
- patch-sidebar-manager.js
- Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)
- fix-tokens-2.js
- FINALE — Unimplemented Features for One Final Run
- removeCartItem
- patch-orders-filters.js
- patch-kds-order-card.js
- fix-tokens.js
- patch-db-types.js
- patch-addon.js
- Section 3 — Limitations Still Open (from `limitations.md`)
- patch-ts-errors-2.js
- patch-for-pickup-filter.js
- patch-ts-orders.js
- patch-for-pickup-filter2.js
- patch-order-card-badge.js
- patch-map-staff.js
- patch-admin-card.js
- patch-validation-customer-id.js
- patch-admin-orders-render.js
- patch-kds-sound.js
- fix-radii.js
- patch-order-with-details.js
- account-actions.test.tsx
- patch-orders.js
- lib_profile_identity_formatdateofbirth
- patch-orders-page-filter.js
- patch-db-types3.js
- patch-kds-modal.js
- patch-orders-page-modal.js
- patch-ts-errors-3.js

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 196 edges
2. `cn()` - 128 edges
3. `next` - 126 edges
4. `vitest` - 113 edges
5. `react` - 107 edges
6. `Button` - 73 edges
7. `useToast()` - 63 edges
8. `resolveEmployeeRole()` - 46 edges
9. `lucide-react` - 44 edges
10. `submitCart()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `1.1 🔴 Store hours only checked in the browser (L1)` --references--> `submitCart()`  [INFERRED]
  FINALE.md → lib/actions/cart.ts
- `1.2 🔴 No Senior Citizen / PWD discount (L4)` --references--> `SeniorPwdDiscountPicker()`  [INFERRED]
  FINALE.md → components/checkout/senior-pwd-discount-picker.tsx
- `7. No "pause store" / busy mode` --references--> `submitCart()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts
- `20. No "Order again" row on the menu` --references--> `reorderPastOrder()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts
- `30. Orders page can't filter by date, customer, payment or type (P2, high)` --references--> `getDetailedOrders()`  [INFERRED]
  docs/limitations.md → lib/actions/orders.ts

## Import Cycles
- None detected.

## Communities (199 total, 50 thin omitted)

### Community 0 - "store-control-panel.tsx"
Cohesion: 0.15
Nodes (18): formatCountdown(), formFrom(), SettingsForm, StoreControlPanel(), toInputTime(), ActionResult, pauseStore(), resumeStore() (+10 more)

### Community 1 - "actions.ts"
Cohesion: 0.06
Nodes (47): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+39 more)

### Community 2 - "database.types.ts"
Cohesion: 0.10
Nodes (23): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+15 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "actions/menu.ts"
Cohesion: 0.08
Nodes (41): ManageMenuInner(), menuStats(), uploadMenuImage(), MenuAvailabilityFilter, MenuGrid(), MenuSort, QuickStat, QuickStats() (+33 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.09
Nodes (11): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference(), saveCollapsedPreference(), Sidebar() (+3 more)

### Community 6 - "products.ts"
Cohesion: 0.11
Nodes (20): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+12 more)

### Community 7 - "useToast"
Cohesion: 0.13
Nodes (31): revalidate, MenuItemDetailModal(), EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap (+23 more)

### Community 8 - "cn"
Cohesion: 0.10
Nodes (28): OPTIONS, PickupByPicker(), TipPicker(), PromoCarousel(), sameSiteHref(), Slide(), MenuSidebar(), MenuSidebarProps (+20 more)

### Community 9 - "resolveEmployeeRole"
Cohesion: 0.09
Nodes (39): Authentication Bypass, S4: Disabled account lockout (🟠 High), DELETE, PATCH, GET, PATCH, PATCH, PATCH (+31 more)

### Community 10 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 11 - "order-stage.ts"
Cohesion: 0.10
Nodes (21): CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES, Fulfilment, furtherAlong(), minutesSince(), normaliseStatus(), ORDER_STAGES, ORDER_STATUS_STAGES (+13 more)

### Community 12 - "order-summary-card.tsx"
Cohesion: 0.10
Nodes (32): CashTenderedField(), NOTES, formatSummaryMoney(), OrderSummaryCard(), handlePlaceOrder(), PaymentMethodPicker(), payWith(), PickupBy (+24 more)

### Community 13 - "actions/cart.ts"
Cohesion: 0.15
Nodes (18): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, CartLineQuantity, getCancellationErrorMessage() (+10 more)

### Community 14 - "store-status.ts"
Cohesion: 0.17
Nodes (16): dynamic, GET(), open(), readStoreStatus, rpc, isForceOpenByEnv(), readStoreStatus(), rpc (+8 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (23): GET, GET, GET, GET, POST, GET, GET, GET (+15 more)

### Community 16 - "past-order.ts"
Cohesion: 0.16
Nodes (21): OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), isPickupOrder(), canRate(), formatPlacedAt(), formatTotal(), isPast() (+13 more)

### Community 17 - "roles.ts"
Cohesion: 0.16
Nodes (21): ProfilePage(), canAccessAdminOnly(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+13 more)

### Community 18 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (8): A. Customer signup and form copy cleanup, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture, Issue #106 — follow-up issues to file

### Community 19 - "package.json"
Cohesion: 0.08
Nodes (25): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+17 more)

### Community 20 - "dashboard-content.tsx"
Cohesion: 0.11
Nodes (22): DashboardContentProps, ProductRanking(), ProductRankingProps, RefundsPanel(), SalesChart(), SalesChartProps, ReportsChartsProps, DailySales (+14 more)

### Community 21 - "actions/admin.ts"
Cohesion: 0.12
Nodes (28): PhoneInput(), handleChange(), handlePaste(), ActionResult, Customer, CustomerStats, Employee, EmployeeEditInput (+20 more)

### Community 22 - "fields.ts"
Cohesion: 0.06
Nodes (43): employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, boundedText(), emailSchema, FIELD_LIMITS, firstNameSchema, lastNameSchema (+35 more)

### Community 23 - "brand-panel.tsx"
Cohesion: 0.18
Nodes (4): AuthShell(), BrandPanel(), CustomerLoginForm(), ErrorScreen()

### Community 24 - "(account)/profile/page.tsx"
Cohesion: 0.09
Nodes (32): ProfilePage(), revalidate, logout(), LogOutControl(), handleLogOut(), OrderPlacedScreen(), ResolvedMobileProfile(), NAV_LINKS (+24 more)

### Community 25 - "notification-bell.tsx"
Cohesion: 0.25
Nodes (12): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+4 more)

### Community 26 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags, Report Dimensions (+2 more)

### Community 27 - "order-issues.ts"
Cohesion: 0.11
Nodes (26): OpenIssuesPanel(), resolve(), ReportProblemDialog(), pickPhoto(), ActionResult, first(), getOpenOrderIssues(), OpenOrderIssue (+18 more)

### Community 28 - "transactions.ts"
Cohesion: 0.18
Nodes (14): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+6 more)

### Community 29 - "report-controls.tsx"
Cohesion: 0.18
Nodes (18): getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect() (+10 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "The 12 questions"
Cohesion: 0.09
Nodes (22): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September." (+14 more)

### Community 32 - "landing-page.test.tsx"
Cohesion: 0.42
Nodes (4): MenuPage(), PromoSlide, categoryParam(), itemParam()

### Community 33 - "employee-modal.tsx"
Cohesion: 0.10
Nodes (28): FilterDropdown(), EmployeeData, ManageEmployeeInner(), ROLES, employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot (+20 more)

### Community 34 - "engine.ts"
Cohesion: 0.15
Nodes (22): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+14 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "kds/page.tsx"
Cohesion: 0.09
Nodes (44): CASH_METHODS, KdsInner(), KdsTab, readPref(), SortOrder, startOfToday(), TAB_LABELS, ViewMode (+36 more)

### Community 37 - "cart-totals.ts"
Cohesion: 0.13
Nodes (22): CartPage(), CartContents(), CartEmptyState(), DesktopCartRail(), OrderSummaryDiscount, fulfilmentFromParam(), OrderType, calculateDeliveryFee() (+14 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.16
Nodes (16): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+8 more)

### Community 39 - "reports-summary.tsx"
Cohesion: 0.14
Nodes (19): StatCard(), StatCardProps, SUBTITLE_COLORS, CashRemittedTable(), CashRemittedTableProps, formatDay(), formatPeso(), ReportsCharts() (+11 more)

### Community 40 - "(shop)/page.tsx"
Cohesion: 0.18
Nodes (13): HomePage(), STEPS, StoreStrip(), StorePage(), getActivePromotions(), CategoryTile, LandingProduct, ProductRow (+5 more)

### Community 41 - "actions/employee-profile.ts"
Cohesion: 0.19
Nodes (17): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+9 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (24): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+16 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "customers/page.tsx"
Cohesion: 0.14
Nodes (18): EnhancedCustomerData, formatDay(), ManageCustomersInner(), CustomerFilterPopover(), CustomerFilterPopoverProps, isoDay(), periodPresets(), toNumber() (+10 more)

### Community 45 - "site-info.ts"
Cohesion: 0.15
Nodes (17): metadata, FOOTER_LINKS, SiteFooter(), MobileMenuHeader(), PickupPointPanel(), copyrightYears(), DIRECTIONS_HREF, PICKUP_COUNTER (+9 more)

### Community 46 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 47 - "payment-status-card.tsx"
Cohesion: 0.21
Nodes (12): note(), PaymentStatusCard(), WALLET_LABEL, submit(), subscribe(), OrderRow, useKitchenOrderFeed(), foldPaymentStatus() (+4 more)

### Community 48 - "audit-log/page.tsx"
Cohesion: 0.08
Nodes (46): GET, errorToStatus(), getAuditLog(), CATEGORY_OPTIONS, DEFAULT_SORT, ManageAuditLogInner(), ManageAuditLogPage(), Option (+38 more)

### Community 49 - "cart.limits.test.ts"
Cohesion: 0.18
Nodes (6): builder(), b, inserted, TableData, tables, writes

### Community 50 - "actions/orders.ts"
Cohesion: 0.11
Nodes (21): OrderTodayStats(), ActionResult, attachOrderAddOns(), CASH_PAYMENT_METHODS, _fetchPaymentIssuesBase(), getPaymentIssuesForAdmin(), getPaymentIssuesForKds(), getTodayOrderStats() (+13 more)

### Community 51 - "menu-screen.tsx"
Cohesion: 0.09
Nodes (19): BestSellerProvider(), CategoryChips(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ResolvedBottomTabBar(), CartRead, EMPTY (+11 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.12
Nodes (22): addCartItemSchema, isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES (+14 more)

### Community 53 - "item-detail-modal.tsx"
Cohesion: 0.19
Nodes (12): CartLineRow(), CartLineEdit, QuantityInput(), handleChange(), F7. Stepper: type the quantity — ❌, B. Cart and checkout correctness, quantityRoom(), useCartAction() (+4 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "ref_fs"
Cohesion: 0.08
Nodes (17): content, fs, ref_fs, c, fs, c, fs, c (+9 more)

### Community 56 - "Section 1 — P1 Items Still Open"
Cohesion: 0.22
Nodes (9): 1.1 🔴 Store hours only checked in the browser (L1), 1.2 🔴 No Senior Citizen / PWD discount (L4), 1.3 🔴 No minimum order amount or cash cap (L6), 1.4 🔴 Checkout: show VAT (F17), 1.5 🔴 Customer can delete account before picking up (L16), 1.6 🔴 No separate privacy notice or business details (L13), 1.7 🔴 Terms promise things that don't exist (L29), 1.8 🟠 Pay-in-store sales never marked paid (L27) (+1 more)

### Community 57 - "Part C — Acceptance criteria and test cases"
Cohesion: 0.08
Nodes (25): A1. Apply the database script (Supabase) — required, A2. Deploy the app, A3. Accounts and devices, A4. Baseline test orders, AC-01 — Orders filtering (date, customer, payment, type), AC-02 — Manager-only "Payment Issues" tab, AC-03 — Customer list: server pagination, lifetime totals, last 10 orders, AC-04 — Report breakdowns + CSV download (+17 more)

### Community 58 - "Section 9 — Simulated Frustration Scenarios & Persona Reviews"
Cohesion: 0.17
Nodes (12): 9.10 The "Silent Price Hike" (Customer Frustration: Confusion & Repetition), 9.11 The "Disabled Dead End" (Customer Frustration: Infinite Loop), 9.1 The "Out of Stock Trap" (Customer Frustration: False Hope), 9.2 The "Ghost Wallet" Delay (Customer Frustration: Anxiety), 9.3 The "Missing Context" Review Follow-up (Manager Frustration: Multiple Clicks), 9.4 The "Refund Maze" (Staff Frustration: Disconnected Systems), 9.5 The "Invisible High-Spender" (Manager Frustration: No Advance Queries), 9.6 The "Disappearing Ticket" (Kitchen Frustration: Abrupt Workflow Changes) (+4 more)

### Community 59 - "routers/orders.ts"
Cohesion: 0.18
Nodes (14): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+6 more)

### Community 60 - "updateCartItem"
Cohesion: 0.19
Nodes (18): ItemDetailModal(), capNotice(), handleAddToCart(), handleSaveEdit(), primaryAction(), OrderAgainRow(), reorder(), addCartItem() (+10 more)

### Community 62 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 63 - "Validation Testing Plan: Phases 1–9"
Cohesion: 0.12
Nodes (15): 👥 Phase 3: Customer Lifetime Stats & History, 📈 Phase 4: Reports CSV + Cash Remitted, 🛡️ Phase 5: Menu Price RBAC & Audit Log, 🔔 Phase 6: KDS Enhancements (Timers, Colors, Sounds, & Notes), 📱 Phase 7: KDS Navigation & Viewing, 🏷️ Phase 8: Fulfillment Badges, 🛑 Phase 9: Cancel-Reason UX, Test Cases (+7 more)

### Community 64 - "customer-signup-form.tsx"
Cohesion: 0.11
Nodes (28): requestPasswordReset(), AuthTabs(), Tab(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), EmployeeLoginFormInner() (+20 more)

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "actions/profile.ts"
Cohesion: 0.15
Nodes (20): PATCH, DELETE, GET, PATCH, changeMyPassword(), deleteMyAccount(), errorToStatus(), getMyProfile() (+12 more)

### Community 67 - "Notifications API"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "@supabase/supabase-js"
Cohesion: 0.11
Nodes (11): @supabase/supabase-js, { createClient }, env, fs, supabase, { createClient }, supabase, { createClient } (+3 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "submitCart"
Cohesion: 0.17
Nodes (15): POST(), F5. Minimum purchase total — ❌, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout, 3. Unpaid GCash/Maya orders never expire (+7 more)

### Community 71 - "legal-page.tsx"
Cohesion: 0.30
Nodes (7): metadata, PrivacyPage(), metadata, TermsPage(), LegalPage(), LegalSection(), SellerContact()

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.24
Nodes (9): getSeniorPwdIdPhotoUrl(), discardSeniorPwdIdPhoto(), EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS (+1 more)

### Community 73 - "formatPeso"
Cohesion: 0.19
Nodes (12): BestSellerCard(), CartTotalsSummary(), formatSummaryMoney(), OrderSummaryRows(), AddOnsSection(), ItemSummary(), BIG_ORDER_MESSAGE, amountToMinimum() (+4 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.07
Nodes (26): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+18 more)

### Community 78 - "order-receipt.tsx"
Cohesion: 0.12
Nodes (24): NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptBody(), ReceiptOrder, first(), notifyOrderCancelled(), contactLine() (+16 more)

### Community 79 - "promotions.ts"
Cohesion: 0.18
Nodes (19): ManagePromotionsPage(), setEmployeePhoto(), uploadProfileImage(), createPromotion(), deletePromotion(), getAllPromotions(), Promotion, PromotionRow (+11 more)

### Community 80 - "dashboard.ts"
Cohesion: 0.26
Nodes (17): DashboardPage(), metadata, DashboardContent(), dayBounds(), getDashboardStats(), getTopSellers(), getWeeklySales(), salesForDay() (+9 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "session.ts"
Cohesion: 0.13
Nodes (17): ManageLayout(), ManageMenuPage(), MenuPage(), ReportsPage(), ReportsPageClient(), ManageShell(), createSession(), decrypt() (+9 more)

### Community 91 - "Legal Compliance Persona"
Cohesion: 0.12
Nodes (15): J10: Evidence for Disputes (🟡), J1: Personal Data Exposure (🔴 — Data Privacy Act), J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754), J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act), J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025), J5: Privacy Notice (🟠 — Data Privacy Act), J6: Minors (🟠 — Civil Code), J7: Delivery Photos (🟠 — Data Privacy Act) (+7 more)

### Community 92 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Cleanup Jobs (pg_cron), Constraints & Data Quality, Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags (+3 more)

### Community 93 - "System Analyst Persona"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "UI/UX Designer Persona"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 95 - "fix-transactions.js"
Cohesion: 0.12
Nodes (13): AC-08 — KDS sort, Grid/List, Cancelled (today), ref_crypto, { createClient }, crypto, env, fs, supabase, crypto (+5 more)

### Community 96 - "Kitchen Staff Persona"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Restaurant Owner Persona"
Cohesion: 0.17
Nodes (11): Business Intelligence, Cash Management, Key Files to Check, Persona: Restaurant Owner — "Mr. Yang", Red Flags, Revenue Accuracy, Review Checklist, Staff Accountability (+3 more)

### Community 98 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist, RLS Verification (+3 more)

### Community 99 - "Market Research Findings"
Cohesion: 0.17
Nodes (12): Business logic from ordering platforms, Features still lacking, Lacking — compared with current restaurant ordering apps, Philippine market insights (for the paper), Real-world scenarios still not handled, Round 3 — web articles, app reviews and social media, Security measures still lacking, Sources (+4 more)

### Community 100 - "password-strength-meter.tsx"
Cohesion: 0.48
Nodes (4): PasswordStrengthMeter(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 101 - "createAdminClient"
Cohesion: 0.24
Nodes (9): ABANDONED_REASON, expireAbandonedOrders(), PAYMENT_WINDOW_MS, mockAdmin(), NOW, findAwaitingPaymentOrder(), ABANDONED_PAYMENT_REASON, createAdminClient() (+1 more)

### Community 102 - "New Customer Persona"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Senior Customer Persona"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "requireCustomer"
Cohesion: 0.24
Nodes (10): DELETE(), POST(), DELETE(), GET(), SwitchToCodButton(), handleSwitch(), clearCart(), getActiveCart() (+2 more)

### Community 105 - "next"
Cohesion: 0.10
Nodes (25): Window, CustomerModal(), CustomerModalProps, Standing, EmployeeAvatarCard(), PromotionModal(), SortableHeader(), SortableHeaderProps (+17 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.12
Nodes (17): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint" (+9 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "map-staff-order.ts"
Cohesion: 0.22
Nodes (12): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+4 more)

### Community 110 - "README.md"
Cohesion: 0.35
Nodes (4): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary, More things:

### Community 111 - "store-hours.ts"
Cohesion: 0.35
Nodes (9): closesAfterOpening(), DEFAULT_STORE_HOURS, formatTime(), isRestaurantOpen(), isValidTime(), manilaMinutes(), minutesOfDay(), StoreHours (+1 more)

### Community 112 - "curl-test.js"
Cohesion: 0.15
Nodes (11): ref_child_process, { createClient }, env, fs, run(), supabase, { createClient }, env (+3 more)

### Community 114 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.13
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Manager Persona"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "limits.ts"
Cohesion: 0.33
Nodes (7): BULK_ORDER_NOTE, DISH_LIMIT_CODE, isOverOrderCap(), MAX_ITEMS_PER_ORDER, ORDER_TOO_LARGE_CODE, remainingItems(), wouldExceedOrderCap()

### Community 118 - "read-tracked-order.ts"
Cohesion: 0.13
Nodes (18): CheckoutConfirmationPage(), OrderDetailPage(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam(), EtaResult (+10 more)

### Community 119 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 120 - "actions/reports.ts"
Cohesion: 0.11
Nodes (28): ActionResult, compactAmount(), csvCell(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso() (+20 more)

### Community 121 - "track-order-screen.tsx"
Cohesion: 0.16
Nodes (22): metadata, TrackPage(), GuestTrackingScreen(), manilaTime(), ReportProblem(), ShareTrackingLink(), TrackOrderScreen(), idsSchema (+14 more)

### Community 122 - "Copy glossary"
Cohesion: 0.25
Nodes (7): Capitalisation, Copy glossary, Money (#116), Order numbers, Order stages, Spelling and wording, Store hours

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.20
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (19): Audit log, Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure (+11 more)

### Community 126 - "check-types.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 127 - "createClient"
Cohesion: 0.14
Nodes (22): CheckoutPage(), GET(), GET(), MenuPageBody(), changeOwnPassword(), getCategories(), getFeaturedProducts(), getProducts() (+14 more)

### Community 128 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "store-control-panel.test.tsx"
Cohesion: 0.22
Nodes (4): counts, refresh, status(), updateStoreSettings

### Community 133 - "make-migration.js"
Cohesion: 0.33
Nodes (5): content, endIndex, fs, func, startIndex

### Community 134 - "ToastProvider"
Cohesion: 0.07
Nodes (21): CheckoutScreen(), ToastProvider(), defaultPaymentMethodFor(), lines, profile, push, refresh, replace (+13 more)

### Community 135 - "account-status.ts"
Cohesion: 0.47
Nodes (4): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 136 - "read-placed-order.ts"
Cohesion: 0.27
Nodes (10): formatOrderTime(), fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice() (+2 more)

### Community 137 - "get-staff.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 138 - "customer-orders.ts"
Cohesion: 0.09
Nodes (23): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderButton(), Done in this run, Future work (unchanged from FINALE §8) (+15 more)

### Community 139 - "order-rules.ts"
Cohesion: 0.27
Nodes (10): CASH_LIMIT, FIRST_CASH_LIMIT, MAX_TIP, MIN_ORDER, NO_SHOW_CASH_BLOCK, NO_SHOW_DISABLE_PROMPT, NO_SHOW_REASONS, payInStoreBlock() (+2 more)

### Community 140 - "test-kds-query2.js"
Cohesion: 0.40
Nodes (3): c_users_joseph_rey_downloads_projects_yangs_fried_rice_scratch_lib_actions_orders, c_users_joseph_rey_downloads_projects_yangs_fried_rice_scratch_lib_actions_orders_getdetailedorders, { getDetailedOrders }

### Community 141 - "fix-item-modal.js"
Cohesion: 0.50
Nodes (3): content, fs, isOverOrderCap

### Community 144 - "readCustomerProfile"
Cohesion: 0.46
Nodes (6): OrdersPage(), HISTORY_PAGE, productNameOf(), readPastOrders(), readCustomerProfile(), isUnpaidStatus()

### Community 145 - "fix-tokens-3.js"
Cohesion: 0.50
Nodes (3): content1, content2, fs

### Community 146 - "patch-admin-orders-role.js"
Cohesion: 0.50
Nodes (3): fs, ordersTs, pageTsx

### Community 147 - "menu-item-detail-modal.tsx"
Cohesion: 0.09
Nodes (32): MenuGridProps, SORTERS, MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModal() (+24 more)

### Community 149 - "check-ready-orders2.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 150 - "vitest"
Cohesion: 0.12
Nodes (10): VALID, ref_node_path, vitest, FILES, walk(), ROOTS, SKIP_DIRS, sourceFiles() (+2 more)

### Community 153 - "paymongo"
Cohesion: 0.13
Nodes (15): Payment Method Split, 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, 4.1 🟡 GCash and Maya both saved as `paymongo` (Finding 13) (+7 more)

### Community 155 - "order-number.ts"
Cohesion: 0.73
Nodes (4): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch(), orderNumberSearch()

### Community 156 - "chart-colors.test.ts"
Cohesion: 0.38
Nodes (3): CHART_COLORS, CHART_TOKENS, css

### Community 157 - "app/layout.tsx"
Cohesion: 0.25
Nodes (4): app_globals, anton, dmSans, metadata

### Community 158 - "schema.ts"
Cohesion: 0.35
Nodes (7): ref_node_fs, BASELINE, functionSql(), PLATFORM, policiesOn(), SCHEMA, tableSql()

### Community 159 - "order-timeline.tsx"
Cohesion: 0.32
Nodes (7): OrderTimeline(), StageMarker(), stageMeta(), STATE_LABELS, formatClockTime(), StageState, TimelineStage

### Community 161 - "test-kds-query.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 162 - "profile.delete.test.ts"
Cohesion: 0.20
Nodes (6): builder(), b, deleteUser, expireAbandonedOrders, orderCount, writes

### Community 163 - "pickup-followup.tsx"
Cohesion: 0.38
Nodes (5): PickupFollowup(), markOrderNoShow(), undoOrderPickedUp(), NoShowReason, UNDO_PICKUP_MINUTES

### Community 166 - "test-map.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 168 - "Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)"
Cohesion: 0.22
Nodes (9): 2.1 🟠 High demand: pause store, auto-reopen, smart restriction (F11, F15), 2.2 🟠 Customer no-show status and strikes (F14), 2.3 🟡 Separate food/service ratings; per-item; "rate all the same" (F25), 2.4 🟡 "Find a store" page (F4), 2.5 🟡 Per-item prep time in the ETA; keep the promised time (F18), 2.6 🟡 Promo banner managed by the manager (F1), 2.7 🟡 CAPTCHA on sign-up and login (F13), 2.8 🟡 Staff tips with preset amounts (F19) (+1 more)

### Community 169 - "fix-tokens-2.js"
Cohesion: 0.50
Nodes (3): content1, content2, fs

### Community 170 - "FINALE — Unimplemented Features for One Final Run"
Cohesion: 0.11
Nodes (19): 5.1 🟡 697 hard-coded colours instead of tokens (Persona 16 — Mika, UI designer), 5.2 🟡 35 font sizes, 14 corner radii (Persona 16), 5.3 🟡 113 raw `<button>` vs 44 `<Button>` uses (Persona 16), 5.4 🟡 Copy glossary — inconsistent terminology (Persona 16), 5.5 🟡 Readable order number (Persona 6 — Lolo Ben), 6.1 🟡 Minors: age minimum and parental consent (J6), 6.2 🟡 Data retention / automatic deletion (from lacking.md security), 6.3 🟡 Account deletion doesn't erase all personal data (J5) (+11 more)

### Community 171 - "removeCartItem"
Cohesion: 0.50
Nodes (4): DELETE(), PATCH(), RouteParams, removeCartItem()

### Community 177 - "Section 3 — Limitations Still Open (from `limitations.md`)"
Cohesion: 0.29
Nodes (7): 3.1 🟠 Unpaid GCash/Maya orders never expire (L3), 3.2 🟡 No "change for ₱___" on cash payments (L8), 3.3 🟡 No order status history (L9), 3.4 🟡 No "Best seller" labels on the menu (L14), 3.5 🟡 Nothing stops repeat pickup no-shows (L18), 3.6 🟡 Nothing happens when staff don't accept an order (L22), Section 3 — Limitations Still Open (from `limitations.md`)

## Knowledge Gaps
- **1058 isolated node(s):** `Status Legend`, `1.3 🔴 No minimum order amount or cash cap (L6)`, `1.4 🔴 Checkout: show VAT (F17)`, `1.5 🔴 Customer can delete account before picking up (L16)`, `1.6 🔴 No separate privacy notice or business details (L13)` (+1053 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1294 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `store-control-panel.tsx`, `actions.ts`, `database.types.ts`, `bottom-tab-bar.tsx`, `actions/menu.ts`, `sidebar.tsx`, `products.ts`, `useToast`, `cn`, `resolveEmployeeRole`, `customer-orders.ts`, `account-status.ts`, `order-summary-card.tsx`, `actions/cart.ts`, `store-status.ts`, `routers/reports.ts`, `readCustomerProfile`, `past-order.ts`, `roles.ts`, `menu-item-detail-modal.tsx`, `dashboard-content.tsx`, `package.json`, `brand-panel.tsx`, `(account)/profile/page.tsx`, `notification-bell.tsx`, `order-issues.ts`, `transactions.ts`, `app/layout.tsx`, `report-controls.tsx`, `kds/page.tsx`, `cart-totals.ts`, `routers/addons.ts`, `(shop)/page.tsx`, `actions/employee-profile.ts`, `removeCartItem`, `site-info.ts`, `payment-status-card.tsx`, `audit-log/page.tsx`, `item-detail-modal.tsx`, `routers/orders.ts`, `updateCartItem`, `customer-signup-form.tsx`, `actions/profile.ts`, `Notifications API`, `submitCart`, `legal-page.tsx`, `formatPeso`, `Placeholder Manage Pages`, `dashboard.ts`, `session.ts`, `requireCustomer`, `read-tracked-order.ts`, `employee/login/page.tsx`, `track-order-screen.tsx`, `createClient`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `store-control-panel.tsx`, `actions.ts`, `database.types.ts`, `actions/menu.ts`, `products.ts`, `read-placed-order.ts`, `resolveEmployeeRole`, `customer-orders.ts`, `actions/cart.ts`, `store-status.ts`, `routers/reports.ts`, `readCustomerProfile`, `dashboard-content.tsx`, `actions/admin.ts`, `(account)/profile/page.tsx`, `order-issues.ts`, `transactions.ts`, `report-controls.tsx`, `employee-modal.tsx`, `pickup-followup.tsx`, `kds/page.tsx`, `routers/addons.ts`, `reports-summary.tsx`, `(shop)/page.tsx`, `actions/employee-profile.ts`, `removeCartItem`, `customers/page.tsx`, `audit-log/page.tsx`, `actions/orders.ts`, `menu-screen.tsx`, `routers/orders.ts`, `updateCartItem`, `customer-signup-form.tsx`, `actions/profile.ts`, `Notifications API`, `submitCart`, `senior-pwd-ids.ts`, `order-receipt.tsx`, `promotions.ts`, `dashboard.ts`, `createAdminClient`, `requireCustomer`, `read-tracked-order.ts`, `actions/reports.ts`, `track-order-screen.tsx`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `test-kds-query.js`, `db-cleanse.mjs`, `createAdminClient`, `test-map.js`, `senior-pwd-ids.ts`, `get-staff.js`, `order-summary-card.tsx`, `curl-test.js`, `package.json`, `check-ready-orders2.js`, `read-tracked-order.ts`, `fix-transactions.js`, `check-types.js`, `createClient`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `Status Legend`, `1.3 🔴 No minimum order amount or cash cap (L6)`, `1.4 🔴 Checkout: show VAT (F17)` to the rest of the system?**
  _1058 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store-control-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `database.types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._