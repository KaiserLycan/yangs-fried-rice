# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 471 files · ~583,676 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2393 nodes · 6274 edges · 130 communities (112 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f3b1b11`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- password-card.tsx
- actions.ts
- employee-modal.tsx
- db-cleanse.mjs
- actions/menu.ts
- roles.ts
- audit-actions.ts
- cn
- customer-portal-access.test.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- toast.tsx
- actions/reports.ts
- react
- routers/reports.ts
- past-order.ts
- database.types.ts
- manage/orders/page.tsx
- package.json
- dashboard.ts
- products.ts
- customer-orders.ts
- actions/employee-profile.ts
- customer-signup-form.tsx
- actions/cart.ts
- Review Checklist
- ToastProvider
- requireApiEmployee
- cart-totals.ts
- devDependencies
- customer-profile.ts
- checkout/page.tsx
- employee/page.tsx
- engine.ts
- compilerOptions
- order-detail-modal.tsx
- menu-actions.test.ts
- routers/addons.ts
- transactions.ts
- use-shortcut.ts
- phone.ts
- Details
- dependencies
- audit-log/page.tsx
- next
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- cart-line-row.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- fields.ts
- P2 — if time allows
- actions/audit.ts
- reorderPastOrder
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- requireCustomer
- track-order-screen.test.tsx
- wallet-tab.ts
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- Limitations — gaps we can close in 1.5 days
- scripts
- Supabase
- notifications.ts
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- cancel-order-control.test.tsx
- reports-charts.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- validation/menu.ts
- actions/admin.ts
- vitest
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
- audit-log-page.test.tsx
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- Review Checklist
- Review Checklist
- Review Checklist
- routers/audit.ts
- account-status.ts
- User simulation — 17 personas + hard questions through the UI
- kds/page.tsx
- The 12 questions
- createClient
- paymongo
- record-employee-action.ts
- rewrite_docs.py
- lib_address_validate_ncr_addressforgeocoding
- Unimplemented Issues and Tasks
- Review Checklist
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts
- removeCartItem
- senior-pwd-ids.ts
- menu-item-detail-modal.tsx
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- xss.test.tsx
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

## Communities (130 total, 18 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.18
Nodes (22): revalidate, EmployeeContactDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES, SHIFTS (+14 more)

### Community 1 - "actions.ts"
Cohesion: 0.11
Nodes (31): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+23 more)

### Community 2 - "employee-modal.tsx"
Cohesion: 0.18
Nodes (14): employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields(), snapshotOf() (+6 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "actions/menu.ts"
Cohesion: 0.18
Nodes (21): ManageMenuInner(), uploadMenuImage(), MenuGrid(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+13 more)

### Community 5 - "roles.ts"
Cohesion: 0.07
Nodes (31): logout(), handleLogOut(), ManageShell(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION (+23 more)

### Community 6 - "audit-actions.ts"
Cohesion: 0.16
Nodes (19): AuditLogModal(), formatAuditTime(), SOURCE_LABELS, ACTION_LABELS, APP_AUDIT_ACTIONS, AppAuditAction, AUDIT_CATEGORIES, AUDIT_CATEGORY_IDS (+11 more)

### Community 7 - "cn"
Cohesion: 0.15
Nodes (13): CustomerModal(), CustomerModalProps, MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, RateOrderButton(), RateOrderDialog(), SCORE_WORDS (+5 more)

### Community 8 - "customer-portal-access.test.ts"
Cohesion: 0.11
Nodes (14): ref_node_fs, raw, sql, checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure (+6 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.11
Nodes (24): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+16 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.14
Nodes (18): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+10 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.10
Nodes (32): CancelOrderControl(), withdrawnMessage(), OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), arrivalLineFor(), isPickupOrder() (+24 more)

### Community 12 - "toast.tsx"
Cohesion: 0.19
Nodes (13): MenuItemDetailModal(), EmployeeAvatarCard(), AvatarButton(), ShowToast, Toast, ToastContext, ToastTone, TONE_STYLES (+5 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (29): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+21 more)

### Community 14 - "react"
Cohesion: 0.17
Nodes (5): Window, BottomTab, BottomTabBar(), TABS, react

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.17
Nodes (22): OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), canRate(), formatPlacedAt(), formatTotal(), isPast(), isPickup() (+14 more)

### Community 17 - "database.types.ts"
Cohesion: 0.22
Nodes (8): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert

### Community 18 - "manage/orders/page.tsx"
Cohesion: 0.19
Nodes (10): LogOutControl(), OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS, AccountActions(), Button() (+2 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (29): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+21 more)

### Community 20 - "dashboard.ts"
Cohesion: 0.14
Nodes (21): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+13 more)

### Community 21 - "products.ts"
Cohesion: 0.20
Nodes (11): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+3 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.12
Nodes (16): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+8 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.13
Nodes (26): Authentication Bypass, S4: Disabled account lockout (🟠 High), PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount() (+18 more)

### Community 24 - "customer-signup-form.tsx"
Cohesion: 0.09
Nodes (44): AuthTabs(), Tab(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner() (+36 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.18
Nodes (15): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+7 more)

### Community 26 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "ToastProvider"
Cohesion: 0.25
Nodes (11): CheckoutConfirmationPage(), OrderDetailPage(), GET(), POST(), ToastProvider(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam() (+3 more)

### Community 28 - "requireApiEmployee"
Cohesion: 0.17
Nodes (14): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+6 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.08
Nodes (26): CartContents(), CartEmptyState(), CartTotalsSummary(), DesktopCartRail(), OrderPlacedScreen(), OrderSummaryRows(), foldPaymentStatus(), PaymentStatus (+18 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "customer-profile.ts"
Cohesion: 0.06
Nodes (33): ProfilePage(), revalidate, MobileMenuHeader(), ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar() (+25 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.11
Nodes (19): CartPage(), CheckoutPage(), OrdersPage(), MenuPage(), MenuPageBody(), ResolvedBottomTabBar(), getCategories(), getProducts() (+11 more)

### Community 33 - "employee/page.tsx"
Cohesion: 0.18
Nodes (12): ManageAuditLogInner(), EmployeeData, ROLES, getVisiblePages(), ManagePagination(), ManagePaginationProps, SortableHeader(), SortableHeaderProps (+4 more)

### Community 34 - "engine.ts"
Cohesion: 0.09
Nodes (34): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+26 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-detail-modal.tsx"
Cohesion: 0.25
Nodes (15): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+7 more)

### Community 37 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "use-shortcut.ts"
Cohesion: 0.16
Nodes (17): app_globals, anton, dmSans, metadata, SearchField(), ShortcutsHelp(), STAFF_AREAS, Kbd() (+9 more)

### Community 41 - "phone.ts"
Cohesion: 0.10
Nodes (28): PhoneInput(), handleChange(), handlePaste(), ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput (+20 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (24): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+16 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "audit-log/page.tsx"
Cohesion: 0.20
Nodes (12): CATEGORY_OPTIONS, FilterDropdown(), Option, DateInput(), DateInputProps, ReportDateFiltersProps, ReportTypeSelect(), NavAddressDropdown() (+4 more)

### Community 45 - "next"
Cohesion: 0.10
Nodes (9): metadata, AuthShell(), BrandPanel(), CustomerLoginForm(), CustomerSignupForm(), EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm() (+1 more)

### Community 46 - "password-strength.ts"
Cohesion: 0.47
Nodes (4): PasswordFields(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "map-content.tsx"
Cohesion: 0.14
Nodes (13): Code Consistency, DeliveryMap(), MapContent, LiveMapPanel(), Structure and naming, DeliveryData, DeliveryItem, DeliveryLocation (+5 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cart-line-row.tsx"
Cohesion: 0.22
Nodes (11): CartLineRow(), AddOnsSection(), ItemDetailModal(), ItemSummary(), QuantityStepper(), StepButton(), useCartAction(), formatPeso() (+3 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.17
Nodes (19): EmployeePersonalDetailsCard(), PersonalDetailsCard(), formatDateOfBirth(), dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, earliestBirthdate() (+11 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.13
Nodes (23): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition() (+15 more)

### Community 53 - "fields.ts"
Cohesion: 0.04
Nodes (58): dateOfBirthSchema, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues, addressLabelSchema, AddressParts, addressPartsSchema (+50 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "actions/audit.ts"
Cohesion: 0.31
Nodes (11): ActionResult, getAuditActors(), getAuditLog(), requireAuditAccess(), entityTypesFor(), AuditLogFilters, auditLogFilterSchema, isoDate (+3 more)

### Community 56 - "reorderPastOrder"
Cohesion: 0.18
Nodes (11): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+3 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.24
Nodes (12): fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+4 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (17): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ProductCard(), ProductPhotoPlaceholder() (+9 more)

### Community 60 - "requireCustomer"
Cohesion: 0.22
Nodes (12): DELETE(), POST(), DELETE(), GET(), SwitchToCodButton(), handleSwitch(), handleAddToCart(), addCartItem() (+4 more)

### Community 61 - "track-order-screen.test.tsx"
Cohesion: 0.18
Nodes (6): getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.14
Nodes (14): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+6 more)

### Community 64 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.20
Nodes (10): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Found by the "hard questions through the UI" walkthrough, Limitations — gaps we can close in 1.5 days (+2 more)

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "Supabase"
Cohesion: 0.25
Nodes (8): Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase, Triggers

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.10
Nodes (31): CheckoutScreen(), OrderSummaryCard(), handlePlaceOrder(), PaymentMethodPicker(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL (+23 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "submitCart"
Cohesion: 0.14
Nodes (17): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up (+9 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.test.tsx"
Cohesion: 0.25
Nodes (7): OrderProgress, ACCEPTED, confirmCancel(), openDialog(), PREPARING, RECEIVED, refresh

### Community 73 - "reports-charts.tsx"
Cohesion: 0.14
Nodes (21): getDefaultStartDate(), getToday(), ReportsContent(), ReportDateFilters(), ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso() (+13 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 79 - "actions/admin.ts"
Cohesion: 0.12
Nodes (37): ManageCustomersInner(), loadCustomers(), ManageEmployeeInner(), ActionResult, auditChanges(), changeOwnPassword(), createEmployee(), Customer (+29 more)

### Community 80 - "vitest"
Cohesion: 0.17
Nodes (17): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+9 more)

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

### Community 95 - "audit-log-page.test.tsx"
Cohesion: 0.29
Nodes (5): ManageAuditLogPage(), AuditLogModalProps, AuditLogEntry, getAuditActors, getAuditLog

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
Cohesion: 0.35
Nodes (8): ManageLayout(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret(), jose

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "routers/audit.ts"
Cohesion: 0.60
Nodes (3): GET, errorToStatus(), getAuditLog()

### Community 105 - "account-status.ts"
Cohesion: 0.38
Nodes (5): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, ACCOUNT_DISABLED_MESSAGE, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "kds/page.tsx"
Cohesion: 0.50
Nodes (6): KdsInner(), ManageOrdersInner(), getDetailedOrders(), updateOrderStatus(), actionCopy(), dbStatusFor()

### Community 108 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 109 - "createClient"
Cohesion: 0.14
Nodes (32): GET(), POST(), registerCustomer(), requestPasswordReset(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress() (+24 more)

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

### Community 119 - "removeCartItem"
Cohesion: 0.47
Nodes (5): DELETE(), PATCH(), RouteParams, removeCartItem(), updateCartItem()

### Community 120 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 121 - "menu-item-detail-modal.tsx"
Cohesion: 0.14
Nodes (17): MenuGridProps, MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModalProps, MenuCategory (+9 more)

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "xss.test.tsx"
Cohesion: 0.33
Nodes (3): ref_node_path, sourceFiles(), XSS_PAYLOADS

### Community 127 - "Issue #106 — follow-up issues to file"
Cohesion: 0.25
Nodes (8): B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture, Issue #106 — follow-up issues to file

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **779 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `getAuditLog` (+774 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 967 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `actions.ts`, `actions/menu.ts`, `roles.ts`, `cn`, `routers/admin.ts`, `routers/profile.ts`, `order-stage.ts`, `toast.tsx`, `react`, `routers/reports.ts`, `past-order.ts`, `manage/orders/page.tsx`, `package.json`, `dashboard.ts`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `actions/cart.ts`, `ToastProvider`, `requireApiEmployee`, `cart-totals.ts`, `customer-profile.ts`, `checkout/page.tsx`, `engine.ts`, `menu-actions.test.ts`, `routers/addons.ts`, `transactions.ts`, `use-shortcut.ts`, `audit-log/page.tsx`, `map-content.tsx`, `site-footer.tsx`, `routers/orders.ts`, `reorderPastOrder`, `requireCustomer`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `reports-charts.tsx`, `session.ts`, `routers/audit.ts`, `account-status.ts`, `kds/page.tsx`, `createClient`, `removeCartItem`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `actions.ts`, `actions/menu.ts`, `roles.ts`, `routers/admin.ts`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `dashboard.ts`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `actions/cart.ts`, `ToastProvider`, `requireApiEmployee`, `customer-profile.ts`, `checkout/page.tsx`, `routers/addons.ts`, `transactions.ts`, `routers/orders.ts`, `actions/orders.ts`, `actions/audit.ts`, `reorderPastOrder`, `read-placed-order.ts`, `requireCustomer`, `notifications.ts`, `submitCart`, `reports-charts.tsx`, `actions/admin.ts`, `kds/page.tsx`, `record-employee-action.ts`, `removeCartItem`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `actions.ts`, `employee-modal.tsx`, `roles.ts`, `audit-actions.ts`, `customer-portal-access.test.ts`, `order-stage.ts`, `toast.tsx`, `actions/reports.ts`, `past-order.ts`, `package.json`, `customer-orders.ts`, `customer-signup-form.tsx`, `actions/cart.ts`, `ToastProvider`, `cart-totals.ts`, `customer-profile.ts`, `checkout/page.tsx`, `engine.ts`, `order-detail-modal.tsx`, `menu-actions.test.ts`, `phone.ts`, `audit-log/page.tsx`, `next`, `password-strength.ts`, `site-footer.tsx`, `cart-line-row.tsx`, `date-of-birth.ts`, `actions/orders.ts`, `fields.ts`, `actions/audit.ts`, `read-placed-order.ts`, `menu-screen.tsx`, `track-order-screen.test.tsx`, `wallet-tab.ts`, `order-summary-card.tsx`, `reports-utils.ts`, `cancel-order-control.test.tsx`, `validation/menu.ts`, `actions/admin.ts`, `vitest.config.mts`, `audit-log-page.test.tsx`, `session.ts`, `createClient`, `record-employee-action.ts`, `delete-confirmation.test.ts`, `senior-pwd-ids.ts`, `menu-item-detail-modal.tsx`, `xss.test.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _779 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10609756097560975 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `roles.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06802721088435375 - nodes in this community are weakly interconnected._