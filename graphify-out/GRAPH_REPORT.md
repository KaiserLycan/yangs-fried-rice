# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 553 files · ~792,033 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .patch 2, .example 1)

## Summary
- 2721 nodes · 7299 edges · 149 communities (132 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 136 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d60051d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store-control-panel.tsx
- auth.ts
- actions.ts
- Database Cleanse Script
- createClient
- sidebar.tsx
- audit-log-modal.tsx
- useToast
- customer-orders.ts
- routers/admin.ts
- actions/profile.ts
- order-stage.ts
- dashboard/page.tsx
- actions/reports.ts
- database.types.ts
- routers/reports.ts
- past-order.ts
- roles.ts
- audit-log/page.tsx
- package.json
- dashboard-content.tsx
- senior-pwd-discount.test.tsx
- validation/profile.ts
- actions/audit.ts
- order-placed-screen.tsx
- employee/login/page.tsx
- Review Checklist
- employee-modal.tsx
- cn
- checkout-screen.tsx
- Dev Dependencies
- (account)/profile/page.tsx
- menu-page-body.tsx
- menu-item-detail-modal.tsx
- engine.ts
- TypeScript Configuration
- xss.test.tsx
- cart-totals.ts
- routers/addons.ts
- transactions.ts
- session.ts
- sales-chart.tsx
- Details
- Runtime Dependencies
- The 12 questions
- site-info.ts
- Review Checklist
- order-issues.ts
- notification-bell.tsx
- cart.limits.test.ts
- actions/orders.ts
- pdf-charts.ts
- validation/orders.ts
- quantity-stepper.tsx
- P2 — if time allows
- profile.delete.test.ts
- Section 1 — P1 Items Still Open
- ref_fs
- Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)
- menu-screen.tsx
- actions/cart.ts
- reports-charts.tsx
- confirmation/page.tsx
- readStoreStatus
- next
- NPM Scripts
- actions/employee-profile.ts
- Notifications API
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- Report Date Grouping
- senior-pwd-ids.ts
- updateCartItem
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Review Checklist
- requireCustomer
- promotions.ts
- map-staff-order.ts
- ESLint Configuration
- next.config.mjs
- postcss.config.mjs
- Prettier Configuration
- Supabase
- Tailwind Configuration
- Vitest Test Setup
- Legal Compliance Persona
- Review Checklist
- System Analyst Persona
- UI/UX Designer Persona
- store-control-panel.test.tsx
- Kitchen Staff Persona
- Restaurant Owner Persona
- Review Checklist
- Market Research Findings
- Password Strength Meter
- Review Checklist
- New Customer Persona
- Senior Customer Persona
- audit-log-page.test.tsx
- manage/orders/page.tsx
- User simulation — 17 personas + hard questions through the UI
- Design & Analysis Roles
- cancel-order-control.test.tsx
- order-receipt.tsx
- store-status.ts
- menu-actions.test.ts
- Docs Rewrite Script
- bottom-tab-bar.tsx
- Unimplemented Issues and Tasks
- Manager Persona
- Issue #106 — follow-up issues to file
- read-tracked-order.ts
- ref_node_fs
- @testing-library/react
- item-detail-modal.tsx
- Copy glossary
- Competitor Comparison Analysis
- Requirements Audit
- Yang's Fried Rice — Ordering System
- vitest
- server.ts
- actions/admin.ts
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- paymongo
- Section 3 — Limitations Still Open (from `limitations.md`)
- database-lockdown.test.ts
- account-status.ts
- confirm/route.ts
- (shop)/page.tsx
- Section 4 — User Simulation Findings Still Open
- Section 5 — Design & UX Gaps (from Persona Reviews)
- record-employee-action.ts
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- Graphify Rules
- Graphify Workflow
- routers/audit.ts
- FINALE — Unimplemented Features for One Final Run
- Section 6 — Legal & Compliance Gaps (from Persona 15 — Atty. Reyes)
- Section 7 — Database & Infrastructure (from Persona 10 — Rica, DBA)

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 179 edges
2. `next` - 120 edges
3. `cn()` - 109 edges
4. `vitest` - 107 edges
5. `react` - 91 edges
6. `useToast()` - 63 edges
7. `Button` - 61 edges
8. `resolveEmployeeRole()` - 41 edges
9. `submitCart()` - 38 edges
10. `lucide-react` - 33 edges

## Surprising Connections (you probably didn't know these)
- `1.2 🔴 No Senior Citizen / PWD discount (L4)` --references--> `SeniorPwdDiscountPicker()`  [INFERRED]
  FINALE.md → components/checkout/senior-pwd-discount-picker.tsx
- `F1. Landing page for marketing — ❌` --references--> `MenuPageBody()`  [INFERRED]
  docs/feedback-verification.md → components/menu/menu-page-body.tsx
- `Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567."` --references--> `getAllCustomers()`  [INFERRED]
  docs/user-simulation.md → lib/actions/admin.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-accountant/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-new-customer/SKILL.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (149 total, 17 thin omitted)

### Community 0 - "store-control-panel.tsx"
Cohesion: 0.15
Nodes (18): formatCountdown(), formFrom(), SettingsForm, StoreControlPanel(), toInputTime(), ActionResult, pauseStore(), resumeStore() (+10 more)

### Community 1 - "auth.ts"
Cohesion: 0.12
Nodes (26): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+18 more)

### Community 2 - "actions.ts"
Cohesion: 0.17
Nodes (13): ActionResult, EmployeeLoginResult, RegisterResult, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues, emailSchema (+5 more)

### Community 3 - "Database Cleanse Script"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.11
Nodes (36): ManageMenuInner(), uploadMenuImage(), MenuGrid(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn() (+28 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.09
Nodes (14): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference() (+6 more)

### Community 6 - "audit-log-modal.tsx"
Cohesion: 0.15
Nodes (22): ManageAuditLogInner(), AuditLogModal(), formatAuditTime(), SOURCE_LABELS, ACTION_LABELS, APP_AUDIT_ACTIONS, AUDIT_CATEGORIES, auditActionLabel() (+14 more)

### Community 7 - "useToast"
Cohesion: 0.13
Nodes (34): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+26 more)

### Community 8 - "customer-orders.ts"
Cohesion: 0.12
Nodes (16): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+8 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.11
Nodes (22): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+14 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.14
Nodes (21): PATCH, DELETE, GET, PATCH, changeMyPassword(), deleteMyAccount(), errorToStatus(), getMyProfile() (+13 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.08
Nodes (43): OrderTimeline(), StageMarker(), stageMeta(), STATE_LABELS, PickupPointPanel(), ReportProblem(), TrackOrderScreen(), formatClockTime() (+35 more)

### Community 12 - "dashboard/page.tsx"
Cohesion: 0.21
Nodes (14): DashboardPage(), metadata, DashboardContent(), dayBounds(), getDashboardStats(), getTopSellers(), getWeeklySales(), salesForDay() (+6 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.17
Nodes (20): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+12 more)

### Community 14 - "database.types.ts"
Cohesion: 0.08
Nodes (33): DELETE, GET, PUT, GET, POST, DELETE, GET, PUT (+25 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.12
Nodes (23): GET, GET, GET, GET, POST, GET, GET, GET (+15 more)

### Community 16 - "past-order.ts"
Cohesion: 0.14
Nodes (19): PastOrdersScreen(), isPickupOrder(), canRate(), isPast(), isPickup(), isUnpaid(), MAX_RATING, OrderOutcome (+11 more)

### Community 17 - "roles.ts"
Cohesion: 0.17
Nodes (16): ApiEmployee, GuardResult, canAccessAdminOnly(), canAccessManagePath(), EMPLOYEE_ROLES, EmployeeRole, homePathForRole(), isEmployeeRole() (+8 more)

### Community 18 - "audit-log/page.tsx"
Cohesion: 0.11
Nodes (29): anton, dmSans, metadata, CATEGORY_OPTIONS, DEFAULT_SORT, Option, EmployeeData, ROLES (+21 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (26): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+18 more)

### Community 20 - "dashboard-content.tsx"
Cohesion: 0.15
Nodes (17): DashboardContentProps, ProductRanking(), ProductRankingProps, RefundsPanel(), StatCard(), StatCardProps, SUBTITLE_COLORS, DashboardStats (+9 more)

### Community 21 - "senior-pwd-discount.test.tsx"
Cohesion: 0.21
Nodes (14): OrderCard(), OrderDetailModal(), statusConfig, getSeniorPwdIdPhotoUrl(), canCancel(), primaryActionFor(), statusLabelFor(), lines112 (+6 more)

### Community 22 - "validation/profile.ts"
Cohesion: 0.06
Nodes (45): ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput, createEmployeeSchema, UpdateCustomerInput, updateCustomerSchema (+37 more)

### Community 23 - "actions/audit.ts"
Cohesion: 0.24
Nodes (13): ActionResult, getAuditActors(), getAuditLog(), requireAuditAccess(), AUDIT_CATEGORY_IDS, AUDIT_SORT_COLUMNS, AuditLogFilters, auditLogFilterSchema (+5 more)

### Community 24 - "order-placed-screen.tsx"
Cohesion: 0.20
Nodes (11): OrderPlacedScreen(), formatSummaryMoney(), OrderSummaryDiscount, OrderSummaryRows(), PlacedOrder, formatPesoCentavos(), order(), profile (+3 more)

### Community 25 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 26 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags, Report Dimensions (+2 more)

### Community 27 - "employee-modal.tsx"
Cohesion: 0.10
Nodes (30): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+22 more)

### Community 28 - "cn"
Cohesion: 0.07
Nodes (40): Window, app_globals, Tab(), LogOutControl(), CustomerModal(), CustomerModalProps, MenuSidebar(), MenuSidebarProps (+32 more)

### Community 29 - "checkout-screen.tsx"
Cohesion: 0.20
Nodes (12): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PaymentMethod (+4 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.12
Nodes (22): OrderDetailPage(), OrdersPage(), ProfilePage(), revalidate, ResolvedMobileProfile(), ResolvedProfileActions(), SiteNavBar(), ProfileAvatarCard() (+14 more)

### Community 32 - "menu-page-body.tsx"
Cohesion: 0.19
Nodes (13): CartPage(), CheckoutPage(), MenuPage(), MenuPageBody(), CartRead, EMPTY, readCart(), fulfilmentFromParam() (+5 more)

### Community 33 - "menu-item-detail-modal.tsx"
Cohesion: 0.10
Nodes (25): FilterDropdown(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema (+17 more)

### Community 34 - "engine.ts"
Cohesion: 0.10
Nodes (29): GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES (+21 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "xss.test.tsx"
Cohesion: 0.14
Nodes (14): KdsOrderCard(), KdsOrderCardProps, OrderCardProps, statusConfig, OrderDetailModalProps, 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, isPendingTooLong() (+6 more)

### Community 37 - "cart-totals.ts"
Cohesion: 0.17
Nodes (18): CartContents(), CartEmptyState(), CartLineRow(), DesktopCartRail(), calculateDeliveryFee(), cartItemCount(), CartLine, computeCartTotals() (+10 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.16
Nodes (16): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+8 more)

### Community 39 - "transactions.ts"
Cohesion: 0.18
Nodes (14): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+6 more)

### Community 40 - "session.ts"
Cohesion: 0.28
Nodes (9): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret() (+1 more)

### Community 41 - "sales-chart.tsx"
Cohesion: 0.21
Nodes (7): SalesChart(), SalesChartProps, DailySales, CHART_COLORS, CHART_TOKENS, css, recharts

### Community 42 - "Details"
Cohesion: 0.07
Nodes (27): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+19 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "The 12 questions"
Cohesion: 0.09
Nodes (22): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September." (+14 more)

### Community 45 - "site-info.ts"
Cohesion: 0.06
Nodes (33): metadata, PrivacyPage(), metadata, TermsPage(), AuthShell(), BrandPanel(), ErrorScreen(), FOOTER_LINKS (+25 more)

### Community 46 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 47 - "order-issues.ts"
Cohesion: 0.11
Nodes (26): OpenIssuesPanel(), resolve(), ReportProblemDialog(), pickPhoto(), ActionResult, first(), getOpenOrderIssues(), OpenOrderIssue (+18 more)

### Community 48 - "notification-bell.tsx"
Cohesion: 0.25
Nodes (12): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+4 more)

### Community 49 - "cart.limits.test.ts"
Cohesion: 0.18
Nodes (6): builder(), b, inserted, TableData, tables, writes

### Community 50 - "actions/orders.ts"
Cohesion: 0.12
Nodes (21): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+13 more)

### Community 51 - "pdf-charts.ts"
Cohesion: 0.27
Nodes (8): CHART_COLORS, ChartBar, drawBarChart(), drawHorizontalBarChart(), drawTitle(), RGB, reportPdfFileName(), jspdf

### Community 52 - "validation/orders.ts"
Cohesion: 0.22
Nodes (13): isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES, ReportDateRange (+5 more)

### Community 53 - "quantity-stepper.tsx"
Cohesion: 0.38
Nodes (8): quantityCeiling(), QuantityInput(), handleChange(), QuantityStepper(), StepButton(), clampQuantity(), MAX_QUANTITY, MIN_QUANTITY

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (16): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+8 more)

### Community 55 - "profile.delete.test.ts"
Cohesion: 0.20
Nodes (6): builder(), b, deleteUser, expireAbandonedOrders, orderCount, writes

### Community 56 - "Section 1 — P1 Items Still Open"
Cohesion: 0.22
Nodes (9): 1.1 🔴 Store hours only checked in the browser (L1), 1.2 🔴 No Senior Citizen / PWD discount (L4), 1.3 🔴 No minimum order amount or cash cap (L6), 1.4 🔴 Checkout: show VAT (F17), 1.5 🔴 Customer can delete account before picking up (L16), 1.6 🔴 No separate privacy notice or business details (L13), 1.7 🔴 Terms promise things that don't exist (L29), 1.8 🟠 Pay-in-store sales never marked paid (L27) (+1 more)

### Community 57 - "ref_fs"
Cohesion: 0.04
Nodes (31): content, fs, isOverOrderCap, content, fs, fs, content1, content2 (+23 more)

### Community 58 - "Section 2 — Panel Feedback Items Still Open (Excluding Issue #117)"
Cohesion: 0.22
Nodes (9): 2.1 🟠 High demand: pause store, auto-reopen, smart restriction (F11, F15), 2.2 🟠 Customer no-show status and strikes (F14), 2.3 🟡 Separate food/service ratings; per-item; "rate all the same" (F25), 2.4 🟡 "Find a store" page (F4), 2.5 🟡 Per-item prep time in the ETA; keep the promised time (F18), 2.6 🟡 Promo banner managed by the manager (F1), 2.7 🟡 CAPTCHA on sign-up and login (F13), 2.8 🟡 Staff tips with preset amounts (F19) (+1 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (15): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ResolvedBottomTabBar(), subscribe() (+7 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.13
Nodes (20): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, CartLineQuantity, getCancellationErrorMessage() (+12 more)

### Community 61 - "reports-charts.tsx"
Cohesion: 0.14
Nodes (21): getDefaultStartDate(), getToday(), ReportsContent(), ReportDateFilters(), ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso() (+13 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "readStoreStatus"
Cohesion: 0.24
Nodes (11): dynamic, GET(), open(), readStoreStatus, rpc, isForceOpenByEnv(), readStoreStatus(), rpc (+3 more)

### Community 64 - "next"
Cohesion: 0.12
Nodes (26): registerCustomer(), requestPasswordReset(), resetPassword(), AuthTabs(), CustomerLoginForm(), LoginFormInner(), CustomerSignupForm(), FIELD_LABELS (+18 more)

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "actions/employee-profile.ts"
Cohesion: 0.15
Nodes (25): Authentication Bypass, S4: Disabled account lockout (🟠 High), PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount() (+17 more)

### Community 67 - "Notifications API"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.13
Nodes (27): formatSummaryMoney(), OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, SeniorPwdDiscountPicker() (+19 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "submitCart"
Cohesion: 0.16
Nodes (16): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+8 more)

### Community 71 - "Report Date Grouping"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (8): discardSeniorPwdIdPhoto(), EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, signSeniorPwdIdUrl()

### Community 73 - "updateCartItem"
Cohesion: 0.14
Nodes (24): ItemDetailModal(), capNotice(), handleAddToCart(), handleSaveEdit(), reorder(), 20. No "Order again" row on the menu, addCartItem(), addOnProblem() (+16 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.07
Nodes (25): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+17 more)

### Community 78 - "requireCustomer"
Cohesion: 0.16
Nodes (14): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), SwitchToCodButton() (+6 more)

### Community 79 - "promotions.ts"
Cohesion: 0.18
Nodes (19): ManagePromotionsPage(), setEmployeePhoto(), uploadProfileImage(), createPromotion(), deletePromotion(), getAllPromotions(), Promotion, PromotionRow (+11 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.16
Nodes (17): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+9 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "Supabase"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

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

### Community 95 - "store-control-panel.test.tsx"
Cohesion: 0.22
Nodes (4): counts, refresh, status(), updateStoreSettings

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

### Community 100 - "Password Strength Meter"
Cohesion: 0.48
Nodes (4): PasswordStrengthMeter(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 102 - "New Customer Persona"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Senior Customer Persona"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "audit-log-page.test.tsx"
Cohesion: 0.29
Nodes (5): ManageAuditLogPage(), AuditLogModalProps, AuditLogEntry, getAuditActors, getAuditLog

### Community 105 - "manage/orders/page.tsx"
Cohesion: 0.24
Nodes (12): KdsInner(), ManageOrdersInner(), dbStatusForTab(), ORDER_TABS, OrderSidebar(), OrderSidebarProps, OrderStatus, getDetailedOrders() (+4 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "Design & Analysis Roles"
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "order-receipt.tsx"
Cohesion: 0.20
Nodes (14): NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptBody(), ReceiptOrder, isPaidStatus(), TrackedOrder, formatReceiptPeso() (+6 more)

### Community 111 - "store-status.ts"
Cohesion: 0.20
Nodes (16): closesAfterOpening(), DEFAULT_STORE_HOURS, formatTime(), isRestaurantOpen(), isValidTime(), manilaMinutes(), minutesOfDay(), StoreHours (+8 more)

### Community 112 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 114 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.13
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Manager Persona"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "Issue #106 — follow-up issues to file"
Cohesion: 0.20
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 118 - "read-tracked-order.ts"
Cohesion: 0.12
Nodes (12): StatusChange, first(), readTrackedOrder(), TrackedOrderIssue, TrackedOrderLine, TrackedOrderPayment, getOrderEtaAction, Handler (+4 more)

### Community 119 - "ref_node_fs"
Cohesion: 0.11
Nodes (14): ref_node_fs, ref_node_path, FILES, walk(), fixes, raw, sql, checkLoginAllowed (+6 more)

### Community 120 - "@testing-library/react"
Cohesion: 0.12
Nodes (7): AccountActions(), @testing-library/react, lines, profile, push, refresh, replace

### Community 121 - "item-detail-modal.tsx"
Cohesion: 0.12
Nodes (17): CartTotalsSummary(), AddOnsSection(), CartLineEdit, primaryAction(), ItemSummary(), ProductCard(), ProductRow(), BULK_ORDER_NOTE (+9 more)

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
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "vitest"
Cohesion: 0.17
Nodes (11): ABANDONED_REASON, expireAbandonedOrders(), PAYMENT_WINDOW_MS, mockAdmin(), NOW, findAwaitingPaymentOrder(), ABANDONED_PAYMENT_REASON, DELETE_CONFIRMATION_WORD (+3 more)

### Community 127 - "server.ts"
Cohesion: 0.20
Nodes (14): GET(), PAYMENT_METHODS, fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+6 more)

### Community 128 - "actions/admin.ts"
Cohesion: 0.17
Nodes (28): ManageCustomersInner(), loadCustomers(), ManageEmployeeInner(), ActionResult, auditChanges(), changeEmployeeRole(), createEmployee(), Customer (+20 more)

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "paymongo"
Cohesion: 0.22
Nodes (9): Payment Method Split, 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo() (+1 more)

### Community 133 - "Section 3 — Limitations Still Open (from `limitations.md`)"
Cohesion: 0.29
Nodes (7): 3.1 🟠 Unpaid GCash/Maya orders never expire (L3), 3.2 🟡 No "change for ₱___" on cash payments (L8), 3.3 🟡 No order status history (L9), 3.4 🟡 No "Best seller" labels on the menu (L14), 3.5 🟡 Nothing stops repeat pickup no-shows (L18), 3.6 🟡 Nothing happens when staff don't accept an order (L22), Section 3 — Limitations Still Open (from `limitations.md`)

### Community 134 - "database-lockdown.test.ts"
Cohesion: 0.29
Nodes (4): checkout, hardening, pickupOnly, quantityBounds

### Community 135 - "account-status.ts"
Cohesion: 0.38
Nodes (5): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, ACCOUNT_DISABLED_MESSAGE, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 136 - "confirm/route.ts"
Cohesion: 0.47
Nodes (4): GET(), call(), exchangeCodeForSession, verifyOtp

### Community 137 - "(shop)/page.tsx"
Cohesion: 0.47
Nodes (5): HomePage(), MobileMenuHeader(), getFeaturedProducts(), getActivePromotions(), SITE_DESCRIPTION

### Community 138 - "Section 4 — User Simulation Findings Still Open"
Cohesion: 0.33
Nodes (6): 4.1 🟡 GCash and Maya both saved as `paymongo` (Finding 13), 4.2 🟡 Report dates use UTC instead of Manila time (Finding 14), 4.3 🟡 ETA accuracy can't be measured (Finding 11), 4.4 🟡 Payment webhook has no replay window (Finding S10), 4.5 🟡 Employee session secret can fall back to service-role key (Finding S11), Section 4 — User Simulation Findings Still Open

### Community 139 - "Section 5 — Design & UX Gaps (from Persona Reviews)"
Cohesion: 0.33
Nodes (6): 5.1 🟡 697 hard-coded colours instead of tokens (Persona 16 — Mika, UI designer), 5.2 🟡 35 font sizes, 14 corner radii (Persona 16), 5.3 🟡 113 raw `<button>` vs 44 `<Button>` uses (Persona 16), 5.4 🟡 Copy glossary — inconsistent terminology (Persona 16), 5.5 🟡 Readable order number (Persona 6 — Lolo Ben), Section 5 — Design & UX Gaps (from Persona Reviews)

### Community 140 - "record-employee-action.ts"
Cohesion: 0.33
Nodes (3): AppAuditAction, EmployeeActionEntry, SessionClient

### Community 141 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 144 - "routers/audit.ts"
Cohesion: 0.60
Nodes (3): GET, errorToStatus(), getAuditLog()

### Community 145 - "FINALE — Unimplemented Features for One Final Run"
Cohesion: 0.40
Nodes (5): Cross-Reference: What Issue #117 Covers (Excluded from This List), FINALE — Unimplemented Features for One Final Run, Section 8 — Future Work (Document as Limitations Only), Status Legend, Summary Counts

### Community 146 - "Section 6 — Legal & Compliance Gaps (from Persona 15 — Atty. Reyes)"
Cohesion: 0.50
Nodes (4): 6.1 🟡 Minors: age minimum and parental consent (J6), 6.2 🟡 Data retention / automatic deletion (from lacking.md security), 6.3 🟡 Account deletion doesn't erase all personal data (J5), Section 6 — Legal & Compliance Gaps (from Persona 15 — Atty. Reyes)

### Community 147 - "Section 7 — Database & Infrastructure (from Persona 10 — Rica, DBA)"
Cohesion: 0.50
Nodes (4): 7.1 🟡 Payment method CHECK constraints, 7.2 🟡 Order status CHECK constraints in the database, 7.3 🟡 `received` is a dead status, Section 7 — Database & Infrastructure (from Persona 10 — Rica, DBA)

## Knowledge Gaps
- **873 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `getAuditLog` (+868 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1087 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `store-control-panel.tsx`, `auth.ts`, `actions.ts`, `createClient`, `sidebar.tsx`, `useToast`, `customer-orders.ts`, `routers/admin.ts`, `actions/profile.ts`, `confirm/route.ts`, `dashboard/page.tsx`, `(shop)/page.tsx`, `database.types.ts`, `routers/reports.ts`, `routers/audit.ts`, `past-order.ts`, `audit-log/page.tsx`, `order-stage.ts`, `dashboard-content.tsx`, `roles.ts`, `package.json`, `order-placed-screen.tsx`, `employee/login/page.tsx`, `employee-modal.tsx`, `cn`, `checkout-screen.tsx`, `(account)/profile/page.tsx`, `menu-page-body.tsx`, `menu-item-detail-modal.tsx`, `engine.ts`, `cart-totals.ts`, `routers/addons.ts`, `transactions.ts`, `session.ts`, `account-status.ts`, `site-info.ts`, `order-issues.ts`, `notification-bell.tsx`, `actions/orders.ts`, `actions/cart.ts`, `reports-charts.tsx`, `confirmation/page.tsx`, `readStoreStatus`, `actions/employee-profile.ts`, `Notifications API`, `order-summary-card.tsx`, `submitCart`, `updateCartItem`, `Placeholder Manage Pages`, `requireCustomer`, `manage/orders/page.tsx`, `menu-actions.test.ts`, `bottom-tab-bar.tsx`, `item-detail-modal.tsx`, `server.ts`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `actions/admin.ts`, `auth.ts`, `actions.ts`, `store-control-panel.tsx`, `sidebar.tsx`, `confirm/route.ts`, `routers/admin.ts`, `customer-orders.ts`, `(shop)/page.tsx`, `dashboard/page.tsx`, `actions/profile.ts`, `database.types.ts`, `actions/reports.ts`, `routers/reports.ts`, `record-employee-action.ts`, `roles.ts`, `past-order.ts`, `dashboard-content.tsx`, `senior-pwd-discount.test.tsx`, `actions/audit.ts`, `(account)/profile/page.tsx`, `menu-page-body.tsx`, `engine.ts`, `routers/addons.ts`, `transactions.ts`, `site-info.ts`, `order-issues.ts`, `actions/orders.ts`, `actions/cart.ts`, `reports-charts.tsx`, `readStoreStatus`, `next`, `actions/employee-profile.ts`, `Notifications API`, `submitCart`, `updateCartItem`, `requireCustomer`, `promotions.ts`, `manage/orders/page.tsx`, `read-tracked-order.ts`, `vitest`, `server.ts`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `actions/admin.ts`, `paymongo`, `createClient`, `senior-pwd-discount.test.tsx`, `Details`, `P2 — if time allows`, `Section 1 — P1 Items Still Open`, `actions/cart.ts`, `readStoreStatus`, `next`, `order-summary-card.tsx`, `senior-pwd-ids.ts`, `Accountant Persona`, `Review Checklist`, `requireCustomer`, `Supabase`, `Review Checklist`, `Review Checklist`, `New Customer Persona`, `Senior Customer Persona`, `User simulation — 17 personas + hard questions through the UI`, `Design & Analysis Roles`, `store-status.ts`, `Issue #106 — follow-up issues to file`, `@testing-library/react`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _873 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store-control-panel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1476923076923077 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Should `Database Cleanse Script` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._