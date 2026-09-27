# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 472 files · ~587,009 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2400 nodes · 6297 edges · 134 communities (118 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f9bfbf3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- password-card.tsx
- auth.ts
- menu-item-detail-modal.tsx
- db-cleanse.mjs
- createClient
- sidebar.tsx
- actions/audit.ts
- order-summary-card.tsx
- ref_node_fs
- routers/admin.ts
- actions/profile.ts
- order-stage.ts
- vitest
- actions/reports.ts
- audit-log/page.tsx
- routers/reports.ts
- past-order.ts
- roles.ts
- react
- package.json
- reports-charts.tsx
- validation/menu.ts
- customer-orders.ts
- routers/employee-profile.ts
- actions.ts
- customer-signup-form.tsx
- paymongo
- eta.ts
- database.types.ts
- cart-totals.ts
- devDependencies
- identity.ts
- customer-profile.ts
- use-shortcut.ts
- engine.ts
- compilerOptions
- kds/page.tsx
- validate-ncr.ts
- routers/addons.ts
- transactions.ts
- toast.tsx
- phone.ts
- Details
- dependencies
- customer-portal-access.test.ts
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- cn
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- fields.ts
- P2 — if time allows
- reports-summary.tsx
- employee-modal.tsx
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- next
- track-order-screen.test.tsx
- wallet-tab.ts
- manage/orders/page.tsx
- order-placed-screen.tsx
- scripts
- employee/login/page.tsx
- notifications.ts
- checkout-screen.test.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- senior-pwd-ids.ts
- report-controls.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- Review Checklist
- actions/admin.ts
- map-staff-order.ts
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- actions/cart.ts
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- Supabase
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- H. Test Evidence / Screenshots — **TO DO (manual)**
- Review Checklist
- Review Checklist
- B. SQL Injection Test
- D. Authorization Test
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.test.tsx
- server.ts
- resolveEmployeeRole
- read-tracked-order.ts
- rewrite_docs.py
- Review Checklist
- Unimplemented Issues and Tasks
- Review Checklist
- Issue #106 — follow-up issues to file
- timingSafeEqual
- quantity-stepper.tsx
- account-status.ts
- cancelCustomerOrder
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- xss.test.tsx
- order-number.ts
- Panel feedback — verified against the code and docs
- Handoff: put dispatched orders in the rider queue
- vitest.config.mts
- lib_address_validate_ncr_addressforgeocoding
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

## Communities (134 total, 16 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.20
Nodes (19): revalidate, EmployeePersonalDetailsCard(), formatLastUpdated(), PasswordCard(), readPasswordForm(), PersonalDetailsCard(), CardField(), CardInput() (+11 more)

### Community 1 - "auth.ts"
Cohesion: 0.12
Nodes (25): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+17 more)

### Community 2 - "menu-item-detail-modal.tsx"
Cohesion: 0.13
Nodes (20): MenuGrid(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema (+12 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.11
Nodes (36): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+28 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (10): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar() (+2 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (41): GET, errorToStatus(), getAuditLog(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime(), SOURCE_LABELS (+33 more)

### Community 7 - "order-summary-card.tsx"
Cohesion: 0.20
Nodes (13): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PaymentMethod (+5 more)

### Community 8 - "ref_node_fs"
Cohesion: 0.17
Nodes (8): ref_node_fs, fixes, raw, sql, checkout, hardening, pickupOnly, quantityBounds

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (27): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+19 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.11
Nodes (29): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+21 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.10
Nodes (29): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), arrivalLineFor(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE (+21 more)

### Community 12 - "vitest"
Cohesion: 0.17
Nodes (8): CustomerSignupForm(), DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), @testing-library/react, vitest, profile, refresh, replace

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "audit-log/page.tsx"
Cohesion: 0.11
Nodes (20): CATEGORY_OPTIONS, DEFAULT_SORT, FilterDropdown(), Option, getVisiblePages(), ManagePagination(), ManagePaginationProps, EmployeeRoleDetailsCard() (+12 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.19
Nodes (20): OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), canRate(), formatPlacedAt(), formatTotal(), isPast() (+12 more)

### Community 17 - "roles.ts"
Cohesion: 0.16
Nodes (21): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+13 more)

### Community 18 - "react"
Cohesion: 0.11
Nodes (16): Window, EmployeeData, ROLES, LogOutControl(), CustomerModal(), CustomerModalProps, SortableHeader(), Button() (+8 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (28): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+20 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.15
Nodes (20): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+12 more)

### Community 21 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "customer-orders.ts"
Cohesion: 0.14
Nodes (14): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+6 more)

### Community 23 - "routers/employee-profile.ts"
Cohesion: 0.18
Nodes (15): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+7 more)

### Community 24 - "actions.ts"
Cohesion: 0.12
Nodes (30): ActionResult, EmployeeLoginResult, loginCustomer(), RegisterResult, requestPasswordReset(), resetPassword(), CustomerLoginForm(), LoginFormInner() (+22 more)

### Community 25 - "customer-signup-form.tsx"
Cohesion: 0.09
Nodes (29): AuthTabs(), Tab(), FIELD_LABELS, AddressValidationNote(), AddressValidationStatus, noteFor(), ValidateResponse, ValidationState (+21 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "eta.ts"
Cohesion: 0.23
Nodes (9): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, Coordinates, EtaResult, ACTIVE_KITCHEN_STATUSES (+1 more)

### Community 28 - "database.types.ts"
Cohesion: 0.07
Nodes (34): DELETE, GET, PUT, GET, POST, DELETE, GET, PUT (+26 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.12
Nodes (16): CartContents(), CartEmptyState(), CartLineRow(), CartTotalsSummary(), DesktopCartRail(), OrderSummaryRows(), calculateDeliveryFee(), CartLine (+8 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "identity.ts"
Cohesion: 0.20
Nodes (12): MobileMenuHeader(), ResolvedMobileProfile(), ResolvedProfileActions(), ProfileHeader(), ProfileSummaryCard(), shortAddressLabel(), DATE_OF_BIRTH_FORMAT, formatMemberSince() (+4 more)

### Community 32 - "customer-profile.ts"
Cohesion: 0.11
Nodes (22): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), revalidate, MenuPage(), MenuPageBody(), BottomTab (+14 more)

### Community 33 - "use-shortcut.ts"
Cohesion: 0.16
Nodes (17): app_globals, anton, dmSans, metadata, SearchField(), ShortcutsHelp(), STAFF_AREAS, Kbd() (+9 more)

### Community 34 - "engine.ts"
Cohesion: 0.17
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "kds/page.tsx"
Cohesion: 0.22
Nodes (16): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+8 more)

### Community 37 - "validate-ncr.ts"
Cohesion: 0.15
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "toast.tsx"
Cohesion: 0.14
Nodes (12): SwitchToCodButton(), handleSwitch(), AccountActions(), DeliveryAddressesCard(), ShowToast, Toast, ToastContext, ToastTone (+4 more)

### Community 41 - "phone.ts"
Cohesion: 0.14
Nodes (23): EmployeeContactDetailsCard(), ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput (+15 more)

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.47
Nodes (4): PasswordFields(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "map-content.tsx"
Cohesion: 0.15
Nodes (12): Code Consistency, DeliveryMap(), MapContent, LiveMapPanel(), DeliveryData, DeliveryItem, DeliveryLocation, MOCK_DELIVERIES (+4 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cn"
Cohesion: 0.15
Nodes (15): MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, NavAddressDropdown(), NAV_LINKS, NavSection, RateOrderButton(), RateOrderDialog() (+7 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.17
Nodes (18): readSignupForm(), SignupFormInner(), handleFormChange(), dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE (+10 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.11
Nodes (23): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, findAwaitingPaymentOrder() (+15 more)

### Community 53 - "fields.ts"
Cohesion: 0.06
Nodes (41): dateOfBirthSchema, addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema (+33 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.04
Nodes (47): CustomerData, 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows (+39 more)

### Community 55 - "reports-summary.tsx"
Cohesion: 0.18
Nodes (14): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+6 more)

### Community 56 - "employee-modal.tsx"
Cohesion: 0.16
Nodes (20): ManageAuditLogInner(), uploadMenuImage(), employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS (+12 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.31
Nodes (8): formatOrderTime(), PAYMENT_METHODS, fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder()

### Community 59 - "menu-screen.tsx"
Cohesion: 0.08
Nodes (24): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemDetailModal(), ItemSummary(), MenuEmptyState() (+16 more)

### Community 60 - "next"
Cohesion: 0.18
Nodes (15): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), handleAddToCart() (+7 more)

### Community 61 - "track-order-screen.test.tsx"
Cohesion: 0.18
Nodes (6): getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "manage/orders/page.tsx"
Cohesion: 0.24
Nodes (11): KdsInner(), ManageOrdersInner(), OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS, getDetailedOrders() (+3 more)

### Community 64 - "order-placed-screen.tsx"
Cohesion: 0.12
Nodes (16): CheckoutConfirmationPage(), OrderDetailPage(), OrderPlacedScreen(), SiteNavBar(), walletFromParam(), PlacedOrder, WALLET_TAB_PARAM, ARRIVAL_UNKNOWN (+8 more)

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
Nodes (23): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, foldPaymentStatus(), PaymentStatus (+15 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.08
Nodes (24): A. Input Validation Test, Application-level checks after the migration, C. Authentication Test, E. XSS Test, End-to-end checks against the live API, F. Functional Testing, Feedback form (one per tester), Functional issues found earlier in the QA pass (+16 more)

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
Cohesion: 0.19
Nodes (15): getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect() (+7 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.12
Nodes (16): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical) (+8 more)

### Community 78 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 79 - "actions/admin.ts"
Cohesion: 0.11
Nodes (32): ManageEmployeeInner(), ActionResult, auditChanges(), createEmployee(), Customer, deleteEmployee(), Employee, EmployeeEditInput (+24 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.20
Nodes (13): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+5 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "actions/cart.ts"
Cohesion: 0.21
Nodes (12): ActionResult, ActiveCart, CartItemDetail, AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema, SubmitCartInput (+4 more)

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

### Community 95 - "Supabase"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

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

### Community 101 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 105 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "server.ts"
Cohesion: 0.21
Nodes (19): POST(), registerCustomer(), AddressFormDialog(), handleFormChange(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress() (+11 more)

### Community 111 - "resolveEmployeeRole"
Cohesion: 0.35
Nodes (13): Authentication Bypass, S4: Disabled account lockout (🟠 High), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", changeEmployeeRole(), getEmployeeForEdit(), requireRole(), resetEmployeePassword() (+5 more)

### Community 112 - "read-tracked-order.ts"
Cohesion: 0.28
Nodes (9): ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice(), totalOf(), productNameOf(), readPastOrders(), geocode(), readTrackedOrder() (+1 more)

### Community 114 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 118 - "timingSafeEqual"
Cohesion: 0.29
Nodes (5): S10: Webhook security (🟡 Low), ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 119 - "quantity-stepper.tsx"
Cohesion: 0.42
Nodes (6): QuantityStepper(), StepButton(), F7. Stepper: type the quantity — ❌, clampQuantity(), MAX_QUANTITY, MIN_QUANTITY

### Community 120 - "account-status.ts"
Cohesion: 0.38
Nodes (5): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, ACCOUNT_DISABLED_MESSAGE, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 121 - "cancelCustomerOrder"
Cohesion: 0.50
Nodes (4): POST(), RouteParams, cancelCustomerOrder(), getCancellationErrorMessage()

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

### Community 126 - "xss.test.tsx"
Cohesion: 0.18
Nodes (8): escapeLikePattern(), ReviewSubmission, reviewSubmissionSchema, ref_node_path, INJECTION_PAYLOADS, sourceFiles(), sourceFiles(), XSS_PAYLOADS

### Community 127 - "order-number.ts"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 128 - "Panel feedback — verified against the code and docs"
Cohesion: 0.67
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **782 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `getAuditLog` (+777 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 970 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `auth.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `order-summary-card.tsx`, `routers/admin.ts`, `actions/profile.ts`, `order-stage.ts`, `vitest`, `audit-log/page.tsx`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `routers/employee-profile.ts`, `actions.ts`, `customer-signup-form.tsx`, `eta.ts`, `database.types.ts`, `cart-totals.ts`, `identity.ts`, `customer-profile.ts`, `use-shortcut.ts`, `kds/page.tsx`, `validate-ncr.ts`, `routers/addons.ts`, `transactions.ts`, `toast.tsx`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `cn`, `routers/orders.ts`, `employee-modal.tsx`, `manage/orders/page.tsx`, `order-placed-screen.tsx`, `employee/login/page.tsx`, `notifications.ts`, `checkout-screen.test.tsx`, `submitCart`, `report-controls.tsx`, `session.ts`, `server.ts`, `account-status.ts`, `cancelCustomerOrder`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `sidebar.tsx`, `actions/audit.ts`, `routers/admin.ts`, `actions/profile.ts`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `reports-charts.tsx`, `customer-orders.ts`, `routers/employee-profile.ts`, `actions.ts`, `eta.ts`, `database.types.ts`, `customer-profile.ts`, `routers/addons.ts`, `transactions.ts`, `toast.tsx`, `routers/orders.ts`, `actions/orders.ts`, `reports-summary.tsx`, `employee-modal.tsx`, `read-placed-order.ts`, `next`, `manage/orders/page.tsx`, `notifications.ts`, `submitCart`, `actions/admin.ts`, `actions/cart.ts`, `server.ts`, `resolveEmployeeRole`, `read-tracked-order.ts`, `cancelCustomerOrder`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `auth.ts`, `menu-item-detail-modal.tsx`, `vitest.config.mts`, `createClient`, `actions/audit.ts`, `ref_node_fs`, `order-stage.ts`, `actions/reports.ts`, `audit-log/page.tsx`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `validation/menu.ts`, `customer-orders.ts`, `actions.ts`, `customer-signup-form.tsx`, `eta.ts`, `cart-totals.ts`, `identity.ts`, `customer-profile.ts`, `engine.ts`, `kds/page.tsx`, `validate-ncr.ts`, `toast.tsx`, `phone.ts`, `customer-portal-access.test.ts`, `password-strength.ts`, `site-footer.tsx`, `date-of-birth.ts`, `actions/orders.ts`, `fields.ts`, `employee-modal.tsx`, `read-placed-order.ts`, `menu-screen.tsx`, `track-order-screen.test.tsx`, `wallet-tab.ts`, `order-placed-screen.tsx`, `checkout-screen.test.tsx`, `reports-utils.ts`, `senior-pwd-ids.ts`, `actions/admin.ts`, `map-staff-order.ts`, `actions/cart.ts`, `session.ts`, `cancel-order-control.test.tsx`, `read-tracked-order.ts`, `quantity-stepper.tsx`, `xss.test.tsx`, `order-number.ts`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _782 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `menu-item-detail-modal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1330049261083744 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._