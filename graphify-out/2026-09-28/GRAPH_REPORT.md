# Graph Report - Yangs-fried-rice  (2026-09-28)

## Corpus Check
- 603 files · ~822,372 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .patch 2, .example 1)

## Summary
- 3144 nodes · 8249 edges · 197 communities (147 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 142 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c199a478`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store-status.ts
- actions.ts
- database.types.ts
- db-cleanse.mjs
- createClient
- sidebar.tsx
- audit-actions.ts
- toast.tsx
- cn
- resolveEmployeeRole
- products.ts
- track-order-screen.tsx
- checkout-screen.tsx
- actions/cart.ts
- order-placed-screen.tsx
- routers/reports.ts
- past-order.ts
- roles.ts
- Issue #106 — follow-up issues to file
- package.json
- dashboard-content.tsx
- store-control-panel.tsx
- actions/admin.ts
- brand-panel.tsx
- (account)/profile/page.tsx
- notification-bell.tsx
- paymongo
- report-problem.tsx
- transactions.ts
- employee-modal.tsx
- Dev Dependencies
- The 12 questions
- landing-page.test.tsx
- audit-log/page.tsx
- engine.ts
- TypeScript Configuration
- order-detail-modal.tsx
- cart-totals.ts
- routers/addons.ts
- reports-client.tsx
- (shop)/page.tsx
- actions/employee-profile.ts
- Details
- Runtime Dependencies
- customers/page.tsx
- site-info.ts
- Review Checklist
- manage/orders/page.tsx
- actions/audit.ts
- cart.limits.test.ts
- actions/orders.ts
- menu-screen.tsx
- validation/orders.ts
- cart-line-row.tsx
- P2 — if time allows
- ref_fs
- Section 1 — P1 Items Still Open
- Part C — Acceptance criteria and test cases
- Section 9 — Simulated Frustration Scenarios & Persona Reviews
- menu-actions.test.ts
- updateCartItem
- vitest
- reports-utils.ts
- Validation Testing Plan: Phases 1–9
- next
- NPM Scripts
- actions/profile.ts
- Notifications API
- @supabase/supabase-js
- Phase 4 — Security & Testing Report
- submitCart
- store-control-panel.test.tsx
- senior-pwd-ids.ts
- order-summary-card.tsx
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Review Checklist
- order-receipt.tsx
- avatar-button.tsx
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
- Persona: QA Tester — "Paolo, tries to break things"
- Market Research Findings
- password-strength-meter.tsx
- server.ts
- New Customer Persona
- Senior Customer Persona
- clearCart
- react
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.tsx
- map-staff-order.ts
- cart-totals-summary.tsx
- curl-test.js
- Docs Rewrite Script
- kds/page.tsx
- Unimplemented Issues and Tasks
- Manager Persona
- limits.ts
- ToastProvider
- employee/login/page.tsx
- actions/reports.ts
- Review Checklist
- Copy glossary
- Competitor Comparison Analysis
- Requirements Audit
- Yang's Fried Rice — Ordering System
- check-types.js
- auth-confirm-route.test.ts
- CustomerData
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- design-scale.test.ts
- make-migration.js
- track-order-screen.test.tsx
- test-map.js
- read-placed-order.ts
- get-staff.js
- customer-orders.ts
- order-rules.ts
- test-kds-query2.js
- fix-item-modal.js
- Graphify Rules
- Graphify Workflow
- checkout-screen.test.tsx
- fix-tokens-3.js
- patch-admin-orders-role.js
- menu-client.tsx
- check-ready-orders2.js
- xss.test.tsx
- resolve-conflicts.js
- fix-addon-name.js
- Section 4 — User Simulation Findings Still Open
- fix-schema.js
- patch-addon.js
- chart-colors.test.ts
- fix-tokens.js
- schema.ts
- customer-portal-access.test.ts
- patch-db-types2.js
- test-kds-query.js
- profile.delete.test.ts
- Review Checklist
- patch-kds-card.js
- fix-ghost.js
- patch-orders.js
- patch-sidebar-manager.js
- Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)
- fix-tokens-2.js
- FINALE — Unimplemented Features for One Final Run
- patch-order-with-details.js
- patch-orders-filters.js
- patch-kds-order-card.js
- Supabase
- patch-db-types.js
- patch-kds-sound.js
- Section 3 — Limitations Still Open (from `limitations.md`)
- patch-ts-errors-2.js
- patch-for-pickup-filter.js
- patch-ts-orders.js
- patch-for-pickup-filter2.js
- patch-order-card-badge.js
- patch-map-staff.js
- patch-orders-page-filter.js
- patch-validation-customer-id.js
- routers/audit.ts
- fix-radii.js
- patch-admin-card.js
- log-out-control.test.tsx
- patch-admin-orders-render.js
- lib_profile_identity_formatdateofbirth
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
6. `Button` - 72 edges
7. `useToast()` - 63 edges
8. `resolveEmployeeRole()` - 46 edges
9. `lucide-react` - 44 edges
10. `submitCart()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Key Files to Check` --references--> `getDetailedOrders()`  [INFERRED]
  .agents/skills/persona-manager/SKILL.md → lib/actions/orders.ts
- `30. Orders page can't filter by date, customer, payment or type (P2, high)` --references--> `getDetailedOrders()`  [INFERRED]
  docs/limitations.md → lib/actions/orders.ts
- `Test Cases` --references--> `getPaymentIssuesForAdmin()`  [INFERRED]
  validation_testing_phases_1_to_5.md → lib/actions/orders.ts
- `Functional issues found earlier in the QA pass` --references--> `isRestaurantOpen()`  [INFERRED]
  docs/phase4-security-testing-report.md → lib/store-hours.ts
- `Order numbers` --references--> `formatOrderNumber()`  [INFERRED]
  docs/copy-glossary.md → lib/orders/order-number.ts

## Import Cycles
- None detected.

## Communities (197 total, 50 thin omitted)

### Community 0 - "store-status.ts"
Cohesion: 0.14
Nodes (25): dynamic, GET(), StoreStrip(), StorePage(), closesAfterOpening(), DEFAULT_STORE_HOURS, formatTime(), isRestaurantOpen() (+17 more)

### Community 1 - "actions.ts"
Cohesion: 0.07
Nodes (44): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+36 more)

### Community 2 - "database.types.ts"
Cohesion: 0.11
Nodes (21): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+13 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.17
Nodes (27): ManageMenuInner(), menuStats(), changeOwnPassword(), getCurrentEmployee(), ActionResult, callerIsManager(), Category, createAddOn() (+19 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.09
Nodes (11): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference(), saveCollapsedPreference(), Sidebar() (+3 more)

### Community 6 - "audit-actions.ts"
Cohesion: 0.21
Nodes (12): ACTION_LABELS, APP_AUDIT_ACTIONS, AUDIT_CATEGORIES, AUDIT_CATEGORY_IDS, AuditCategoryId, AuditChange, auditChangeRows(), categoryOf() (+4 more)

### Community 7 - "toast.tsx"
Cohesion: 0.12
Nodes (32): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+24 more)

### Community 8 - "cn"
Cohesion: 0.13
Nodes (21): Tab(), TipPicker(), BestSellerBadge(), BestSellerContext, useIsBestSeller(), AddOnsSection(), CartLineEdit, ItemSummary() (+13 more)

### Community 9 - "resolveEmployeeRole"
Cohesion: 0.08
Nodes (42): Authentication Bypass, S4: Disabled account lockout (🟠 High), DELETE, PATCH, GET, PATCH, PATCH, PATCH (+34 more)

### Community 10 - "products.ts"
Cohesion: 0.11
Nodes (20): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+12 more)

### Community 11 - "track-order-screen.tsx"
Cohesion: 0.07
Nodes (52): metadata, TrackPage(), GuestTrackingScreen(), manilaTime(), OrderTimeline(), StageMarker(), stageMeta(), STATE_LABELS (+44 more)

### Community 12 - "checkout-screen.tsx"
Cohesion: 0.16
Nodes (15): CheckoutScreen(), PaymentMethodPicker(), OPTIONS, PickupBy, PickupByPicker(), payInStoreBlock(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD (+7 more)

### Community 13 - "actions/cart.ts"
Cohesion: 0.15
Nodes (19): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, CartLineQuantity, getCancellationErrorMessage() (+11 more)

### Community 14 - "order-placed-screen.tsx"
Cohesion: 0.18
Nodes (10): OrderPlacedScreen(), OrderSummaryDiscount, foldPaymentStatus(), PaymentStatus, PlacedOrder, order(), profile, refresh (+2 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.13
Nodes (27): GET(), OrderAgainRow(), reorder(), OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), canRate() (+19 more)

### Community 17 - "roles.ts"
Cohesion: 0.16
Nodes (21): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+13 more)

### Community 18 - "Issue #106 — follow-up issues to file"
Cohesion: 0.20
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (26): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+18 more)

### Community 20 - "dashboard-content.tsx"
Cohesion: 0.10
Nodes (24): DashboardContentProps, ProductRanking(), ProductRankingProps, RefundsPanel(), SalesChart(), SalesChartProps, StatCard(), StatCardProps (+16 more)

### Community 21 - "store-control-panel.tsx"
Cohesion: 0.15
Nodes (19): formatCountdown(), formFrom(), SettingsForm, StoreControlPanel(), toInputTime(), ActionResult, pauseStore(), resumeStore() (+11 more)

### Community 22 - "actions/admin.ts"
Cohesion: 0.05
Nodes (63): ActionResult, Customer, CustomerStats, Employee, EmployeeEditInput, SORTABLE_CUSTOMER_COLUMNS, ChangePasswordInput, changePasswordSchema (+55 more)

### Community 23 - "brand-panel.tsx"
Cohesion: 0.19
Nodes (3): AuthShell(), BrandPanel(), ErrorScreen()

### Community 24 - "(account)/profile/page.tsx"
Cohesion: 0.25
Nodes (12): ProfilePage(), revalidate, ProfileHeader(), ProfileSummaryCard(), countActiveOrders(), FINISHED_ORDER_STATUSES, readMyActiveOrderCount(), formatMemberSince() (+4 more)

### Community 25 - "notification-bell.tsx"
Cohesion: 0.25
Nodes (12): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+4 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "report-problem.tsx"
Cohesion: 0.10
Nodes (33): OpenIssuesPanel(), resolve(), ReportProblem(), ReportProblemDialog(), pickPhoto(), submit(), ActionResult, first() (+25 more)

### Community 28 - "transactions.ts"
Cohesion: 0.18
Nodes (14): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+6 more)

### Community 29 - "employee-modal.tsx"
Cohesion: 0.08
Nodes (32): FilterDropdown(), EmployeeData, ManageEmployeeInner(), ROLES, employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot (+24 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 32 - "landing-page.test.tsx"
Cohesion: 0.46
Nodes (4): MenuPage(), PromoSlide, categoryParam(), itemParam()

### Community 33 - "audit-log/page.tsx"
Cohesion: 0.08
Nodes (39): app_globals, anton, dmSans, metadata, CATEGORY_OPTIONS, DEFAULT_SORT, ManageAuditLogInner(), Option (+31 more)

### Community 34 - "engine.ts"
Cohesion: 0.07
Nodes (42): CheckoutConfirmationPage(), GET(), POST(), WalletTabCloser(), getOrderEtaAction(), GetOrderEtaResult, quoteArrivalWindow(), walletFromParam() (+34 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-detail-modal.tsx"
Cohesion: 0.12
Nodes (28): KdsOrderCard(), KdsOrderCardProps, CancelReasonModalProps, FulfillmentBadge(), OrderCard(), OrderCardProps, statusConfig, OrderDetailModal() (+20 more)

### Community 37 - "cart-totals.ts"
Cohesion: 0.13
Nodes (22): CartPage(), CartContents(), CartEmptyState(), DesktopCartRail(), fulfilmentFromParam(), OrderType, calculateDeliveryFee(), cartItemCount() (+14 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.14
Nodes (17): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+9 more)

### Community 39 - "reports-client.tsx"
Cohesion: 0.11
Nodes (28): getDefaultStartDate(), getToday(), ReportsContent(), CashRemittedTable(), CashRemittedTableProps, formatDay(), formatPeso(), ReportDateFilters() (+20 more)

### Community 40 - "(shop)/page.tsx"
Cohesion: 0.13
Nodes (21): BestSellerCard(), HomePage(), STEPS, MenuPageBody(), F1. Landing page for marketing — ❌, getCategories(), getProducts(), getActivePromotions() (+13 more)

### Community 41 - "actions/employee-profile.ts"
Cohesion: 0.13
Nodes (27): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+19 more)

### Community 42 - "Details"
Cohesion: 0.07
Nodes (28): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+20 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "customers/page.tsx"
Cohesion: 0.14
Nodes (18): EnhancedCustomerData, formatDay(), ManageCustomersInner(), CustomerFilterPopover(), CustomerFilterPopoverProps, isoDay(), periodPresets(), toNumber() (+10 more)

### Community 45 - "site-info.ts"
Cohesion: 0.11
Nodes (23): metadata, PrivacyPage(), metadata, metadata, TermsPage(), FOOTER_LINKS, SiteFooter(), LegalPage() (+15 more)

### Community 46 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 47 - "manage/orders/page.tsx"
Cohesion: 0.23
Nodes (11): ManageOrdersInner(), CancelReasonModal(), OrderFilterState, dbStatusForTab(), ORDER_TABS, OrderSidebar(), OrderSidebarProps, OrderStatus (+3 more)

### Community 48 - "actions/audit.ts"
Cohesion: 0.25
Nodes (13): ActionResult, auditEntitiesForOrder(), getAuditActors(), getAuditLog(), requireAuditAccess(), AUDIT_SORT_COLUMNS, AuditLogFilters, auditLogFilterSchema (+5 more)

### Community 49 - "cart.limits.test.ts"
Cohesion: 0.18
Nodes (6): builder(), b, inserted, TableData, tables, writes

### Community 50 - "actions/orders.ts"
Cohesion: 0.09
Nodes (32): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+24 more)

### Community 51 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (14): BestSellerProvider(), CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ResolvedBottomTabBar() (+6 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.13
Nodes (19): 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`), Requirements traceability, Structure and naming, What he'd deliver for the paper, isValidTransition() (+11 more)

### Community 53 - "cart-line-row.tsx"
Cohesion: 0.30
Nodes (10): CartLineRow(), quantityCeiling(), QuantityInput(), handleChange(), QuantityStepper(), StepButton(), quantityRoom(), clampQuantity() (+2 more)

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

### Community 59 - "menu-actions.test.ts"
Cohesion: 0.14
Nodes (12): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockGetCurrentEmployee, mockInsert, mockMaybeSingle, mockReadSelect (+4 more)

### Community 60 - "updateCartItem"
Cohesion: 0.16
Nodes (19): DELETE(), PATCH(), RouteParams, ItemDetailModal(), capNotice(), handleAddToCart(), handleSaveEdit(), primaryAction() (+11 more)

### Community 61 - "vitest"
Cohesion: 0.18
Nodes (8): ManageAuditLogPage(), DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), customer, employee, vitest, getAuditActors, getAuditLog

### Community 62 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 63 - "Validation Testing Plan: Phases 1–9"
Cohesion: 0.11
Nodes (17): 🔒 Phase 1 & 2: Orders Filtering & Payment Issues Tab, 👥 Phase 3: Customer Lifetime Stats & History, 📈 Phase 4: Reports CSV + Cash Remitted, 🛡️ Phase 5: Menu Price RBAC & Audit Log, 🔔 Phase 6: KDS Enhancements (Timers, Colors, Sounds, & Notes), 📱 Phase 7: KDS Navigation & Viewing, 🏷️ Phase 8: Fulfillment Badges, 🛑 Phase 9: Cancel-Reason UX (+9 more)

### Community 64 - "next"
Cohesion: 0.13
Nodes (24): requestPasswordReset(), AuthTabs(), CustomerLoginForm(), LoginFormInner(), CustomerSignupForm(), FIELD_LABELS, readSignupForm(), SignupFormInner() (+16 more)

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "actions/profile.ts"
Cohesion: 0.21
Nodes (16): PATCH, DELETE, GET, PATCH, changeMyPassword(), deleteMyAccount(), errorToStatus(), getMyProfile() (+8 more)

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
Cohesion: 0.12
Nodes (19): POST(), 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout, 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), 3. Unpaid GCash/Maya orders never expire (+11 more)

### Community 71 - "store-control-panel.test.tsx"
Cohesion: 0.22
Nodes (4): counts, refresh, status(), updateStoreSettings

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.22
Nodes (11): SeniorPwdDiscountPicker(), SeniorPwdDiscountState, discardSeniorPwdIdPhoto(), EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES (+3 more)

### Community 73 - "order-summary-card.tsx"
Cohesion: 0.13
Nodes (28): uploadMenuImage(), formatSummaryMoney(), OrderSummaryCard(), handlePlaceOrder(), formatSummaryMoney(), OrderSummaryRows(), note(), PaymentStatusCard() (+20 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.07
Nodes (27): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+19 more)

### Community 78 - "order-receipt.tsx"
Cohesion: 0.13
Nodes (23): NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptBody(), ReceiptOrder, PAYMENT_METHODS, contactLine(), orderCancelledEmail() (+15 more)

### Community 79 - "avatar-button.tsx"
Cohesion: 0.16
Nodes (21): EmployeeAvatarCard(), AvatarButton(), ProfileAvatarCard(), setEmployeePhoto(), uploadProfileImage(), createPromotion(), Promotion, PromotionRow (+13 more)

### Community 80 - "dashboard.ts"
Cohesion: 0.26
Nodes (17): DashboardPage(), metadata, DashboardContent(), dayBounds(), getDashboardStats(), getTopSellers(), getWeeklySales(), salesForDay() (+9 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "session.ts"
Cohesion: 0.20
Nodes (13): ManageLayout(), ManageMenuPage(), MenuPage(), ReportsPage(), ReportsPageClient(), ManageShell(), createSession(), decrypt() (+5 more)

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

### Community 98 - "Persona: QA Tester — "Paolo, tries to break things""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Verification SQL, Who is Paolo?

### Community 99 - "Market Research Findings"
Cohesion: 0.17
Nodes (12): Business logic from ordering platforms, Features still lacking, Lacking — compared with current restaurant ordering apps, Philippine market insights (for the paper), Real-world scenarios still not handled, Round 3 — web articles, app reviews and social media, Security measures still lacking, Sources (+4 more)

### Community 100 - "password-strength-meter.tsx"
Cohesion: 0.48
Nodes (4): PasswordStrengthMeter(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 101 - "server.ts"
Cohesion: 0.16
Nodes (14): CheckoutPage(), ABANDONED_REASON, expireAbandonedOrders(), PAYMENT_WINDOW_MS, mockAdmin(), NOW, findAwaitingPaymentOrder(), CashHistory (+6 more)

### Community 102 - "New Customer Persona"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Senior Customer Persona"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "clearCart"
Cohesion: 0.36
Nodes (6): DELETE(), POST(), DELETE(), GET(), clearCart(), getActiveCart()

### Community 105 - "react"
Cohesion: 0.06
Nodes (32): Window, SwitchToCodButton(), handleSwitch(), PromoCarousel(), sameSiteHref(), Slide(), CustomerModal(), CustomerModalProps (+24 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.11
Nodes (19): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 14. Finance / accountant — "Mrs. Santos, closes the books every month", 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things" (+11 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.25
Nodes (8): 16. UI/UX designer — "Mika, joins to polish the product before the defense", Copy and terminology, Flow review, Mobile and accessibility, Part 3 — Design and analysis roles, States (loading, empty, error), Visual consistency, What she'd deliver

### Community 108 - "cancel-order-control.tsx"
Cohesion: 0.21
Nodes (11): CancelOrderControl(), withdrawnMessage(), useCartAction(), isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "map-staff-order.ts"
Cohesion: 0.14
Nodes (20): first(), notifyOrderCancelled(), sendEmail(), formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first() (+12 more)

### Community 111 - "cart-totals-summary.tsx"
Cohesion: 0.32
Nodes (5): CartTotalsSummary(), BIG_ORDER_MESSAGE, BULK_ORDER_NOTE, useStoreStatus(), BULK_ORDER_CONTACT_HREF

### Community 112 - "curl-test.js"
Cohesion: 0.15
Nodes (11): ref_child_process, { createClient }, env, fs, run(), supabase, { createClient }, env (+3 more)

### Community 114 - "kds/page.tsx"
Cohesion: 0.14
Nodes (16): CASH_METHODS, KdsInner(), KdsTab, readPref(), SortOrder, startOfToday(), TAB_LABELS, ViewMode (+8 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.13
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Manager Persona"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "limits.ts"
Cohesion: 0.39
Nodes (6): DISH_LIMIT_CODE, isOverOrderCap(), MAX_ITEMS_PER_ORDER, ORDER_TOO_LARGE_CODE, remainingItems(), wouldExceedOrderCap()

### Community 118 - "ToastProvider"
Cohesion: 0.17
Nodes (14): OrderDetailPage(), OrdersPage(), MobileMenuHeader(), ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar() (+6 more)

### Community 119 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 120 - "actions/reports.ts"
Cohesion: 0.11
Nodes (32): ActionResult, compactAmount(), csvCell(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), exportReportCSV() (+24 more)

### Community 121 - "Review Checklist"
Cohesion: 0.33
Nodes (6): Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Review Checklist, RLS Verification, Timing Attacks

### Community 122 - "Copy glossary"
Cohesion: 0.25
Nodes (7): Capitalisation, Copy glossary, Money (#116), Order numbers, Order stages, Spelling and wording, Store hours

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.18
Nodes (10): 🟡 Browsing and Ordering, 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support (+2 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "check-types.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 127 - "auth-confirm-route.test.ts"
Cohesion: 0.50
Nodes (4): GET(), call(), exchangeCodeForSession, verifyOtp

### Community 128 - "CustomerData"
Cohesion: 0.33
Nodes (6): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Q3. Owner: "Who are my top 10 customers by spending this month?"

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "design-scale.test.ts"
Cohesion: 0.22
Nodes (6): ref_node_path, FILES, walk(), ROOTS, SKIP_DIRS, sourceFiles()

### Community 133 - "make-migration.js"
Cohesion: 0.33
Nodes (5): content, endIndex, fs, func, startIndex

### Community 134 - "track-order-screen.test.tsx"
Cohesion: 0.18
Nodes (6): getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 135 - "test-map.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 136 - "read-placed-order.ts"
Cohesion: 0.31
Nodes (8): formatOrderTime(), fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice()

### Community 137 - "get-staff.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 138 - "customer-orders.ts"
Cohesion: 0.10
Nodes (20): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderDialog(), ActionResult, getMyOrderDetail() (+12 more)

### Community 139 - "order-rules.ts"
Cohesion: 0.14
Nodes (19): CashTenderedField(), NOTES, PickupModal(), PickupModalProps, PickupFollowup(), markOrderNoShow(), undoOrderPickedUp(), CASH_LIMIT (+11 more)

### Community 140 - "test-kds-query2.js"
Cohesion: 0.40
Nodes (3): c_users_joseph_rey_downloads_projects_yangs_fried_rice_scratch_lib_actions_orders, c_users_joseph_rey_downloads_projects_yangs_fried_rice_scratch_lib_actions_orders_getdetailedorders, { getDetailedOrders }

### Community 141 - "fix-item-modal.js"
Cohesion: 0.50
Nodes (3): content, fs, isOverOrderCap

### Community 144 - "checkout-screen.test.tsx"
Cohesion: 0.20
Nodes (5): lines, profile, push, refresh, replace

### Community 145 - "fix-tokens-3.js"
Cohesion: 0.50
Nodes (3): content1, content2, fs

### Community 146 - "patch-admin-orders-role.js"
Cohesion: 0.50
Nodes (3): fs, ordersTs, pageTsx

### Community 147 - "menu-client.tsx"
Cohesion: 0.11
Nodes (26): MenuAvailabilityFilter, MenuGrid(), MenuGridProps, MenuSort, SORTERS, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing… (+18 more)

### Community 149 - "check-ready-orders2.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 153 - "Section 4 — User Simulation Findings Still Open"
Cohesion: 0.33
Nodes (6): 4.1 🟡 GCash and Maya both saved as `paymongo` (Finding 13), 4.2 🟡 Report dates use UTC instead of Manila time (Finding 14), 4.3 🟡 ETA accuracy can't be measured (Finding 11), 4.4 🟡 Payment webhook has no replay window (Finding S10), 4.5 🟡 Employee session secret can fall back to service-role key (Finding S11), Section 4 — User Simulation Findings Still Open

### Community 156 - "chart-colors.test.ts"
Cohesion: 0.38
Nodes (3): CHART_COLORS, CHART_TOKENS, css

### Community 158 - "schema.ts"
Cohesion: 0.35
Nodes (7): ref_node_fs, BASELINE, functionSql(), PLATFORM, policiesOn(), SCHEMA, tableSql()

### Community 159 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 161 - "test-kds-query.js"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 162 - "profile.delete.test.ts"
Cohesion: 0.20
Nodes (6): builder(), b, deleteUser, expireAbandonedOrders, orderCount, writes

### Community 163 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 168 - "Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)"
Cohesion: 0.22
Nodes (9): 2.1 🟠 High demand: pause store, auto-reopen, smart restriction (F11, F15), 2.2 🟠 Customer no-show status and strikes (F14), 2.3 🟡 Separate food/service ratings; per-item; "rate all the same" (F25), 2.4 🟡 "Find a store" page (F4), 2.5 🟡 Per-item prep time in the ETA; keep the promised time (F18), 2.6 🟡 Promo banner managed by the manager (F1), 2.7 🟡 CAPTCHA on sign-up and login (F13), 2.8 🟡 Staff tips with preset amounts (F19) (+1 more)

### Community 169 - "fix-tokens-2.js"
Cohesion: 0.50
Nodes (3): content1, content2, fs

### Community 170 - "FINALE — Unimplemented Features for One Final Run"
Cohesion: 0.11
Nodes (19): 5.1 🟡 697 hard-coded colours instead of tokens (Persona 16 — Mika, UI designer), 5.2 🟡 35 font sizes, 14 corner radii (Persona 16), 5.3 🟡 113 raw `<button>` vs 44 `<Button>` uses (Persona 16), 5.4 🟡 Copy glossary — inconsistent terminology (Persona 16), 5.5 🟡 Readable order number (Persona 6 — Lolo Ben), 6.1 🟡 Minors: age minimum and parental consent (J6), 6.2 🟡 Data retention / automatic deletion (from lacking.md security), 6.3 🟡 Account deletion doesn't erase all personal data (J5) (+11 more)

### Community 174 - "Supabase"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

### Community 177 - "Section 3 — Limitations Still Open (from `limitations.md`)"
Cohesion: 0.29
Nodes (7): 3.1 🟠 Unpaid GCash/Maya orders never expire (L3), 3.2 🟡 No "change for ₱___" on cash payments (L8), 3.3 🟡 No order status history (L9), 3.4 🟡 No "Best seller" labels on the menu (L14), 3.5 🟡 Nothing stops repeat pickup no-shows (L18), 3.6 🟡 Nothing happens when staff don't accept an order (L22), Section 3 — Limitations Still Open (from `limitations.md`)

### Community 187 - "routers/audit.ts"
Cohesion: 0.60
Nodes (3): GET, errorToStatus(), getAuditLog()

### Community 191 - "log-out-control.test.tsx"
Cohesion: 0.16
Nodes (9): logout(), LogOutControl(), handleLogOut(), AccountActions(), activeOrdersMessage(), DELETE_BLOCKED_MESSAGE, profile, refresh (+1 more)

## Knowledge Gaps
- **1053 isolated node(s):** `Option`, `CATEGORY_OPTIONS`, `DEFAULT_SORT`, `EmployeeData`, `ROLES` (+1048 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1288 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `store-status.ts`, `actions.ts`, `database.types.ts`, `createClient`, `sidebar.tsx`, `toast.tsx`, `cn`, `resolveEmployeeRole`, `customer-orders.ts`, `products.ts`, `track-order-screen.tsx`, `actions/cart.ts`, `checkout-screen.tsx`, `routers/reports.ts`, `past-order.ts`, `order-placed-screen.tsx`, `roles.ts`, `package.json`, `dashboard-content.tsx`, `store-control-panel.tsx`, `brand-panel.tsx`, `(account)/profile/page.tsx`, `notification-bell.tsx`, `report-problem.tsx`, `transactions.ts`, `employee-modal.tsx`, `audit-log/page.tsx`, `engine.ts`, `cart-totals.ts`, `routers/addons.ts`, `reports-client.tsx`, `(shop)/page.tsx`, `actions/employee-profile.ts`, `site-info.ts`, `manage/orders/page.tsx`, `actions/orders.ts`, `routers/audit.ts`, `updateCartItem`, `menu-actions.test.ts`, `log-out-control.test.tsx`, `actions/profile.ts`, `Notifications API`, `submitCart`, `order-summary-card.tsx`, `Placeholder Manage Pages`, `avatar-button.tsx`, `dashboard.ts`, `session.ts`, `server.ts`, `clearCart`, `react`, `cart-totals-summary.tsx`, `kds/page.tsx`, `ToastProvider`, `employee/login/page.tsx`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `store-status.ts`, `actions.ts`, `database.types.ts`, `read-placed-order.ts`, `resolveEmployeeRole`, `products.ts`, `customer-orders.ts`, `order-rules.ts`, `actions/cart.ts`, `track-order-screen.tsx`, `routers/reports.ts`, `past-order.ts`, `dashboard-content.tsx`, `store-control-panel.tsx`, `actions/admin.ts`, `(account)/profile/page.tsx`, `report-problem.tsx`, `transactions.ts`, `audit-log/page.tsx`, `engine.ts`, `order-detail-modal.tsx`, `routers/addons.ts`, `reports-client.tsx`, `(shop)/page.tsx`, `actions/employee-profile.ts`, `customers/page.tsx`, `actions/audit.ts`, `actions/orders.ts`, `updateCartItem`, `log-out-control.test.tsx`, `next`, `actions/profile.ts`, `Notifications API`, `submitCart`, `avatar-button.tsx`, `dashboard.ts`, `server.ts`, `clearCart`, `react`, `map-staff-order.ts`, `kds/page.tsx`, `ToastProvider`, `actions/reports.ts`, `auth-confirm-route.test.ts`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `next`, `test-kds-query.js`, `engine.ts`, `db-cleanse.mjs`, `test-map.js`, `senior-pwd-ids.ts`, `order-summary-card.tsx`, `actions/employee-profile.ts`, `get-staff.js`, `curl-test.js`, `package.json`, `check-ready-orders2.js`, `check-types.js`, `fix-transactions.js`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **What connects `Option`, `CATEGORY_OPTIONS`, `DEFAULT_SORT` to the rest of the system?**
  _1053 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store-status.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06721311475409836 - nodes in this community are weakly interconnected._
- **Should `database.types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11333333333333333 - nodes in this community are weakly interconnected._