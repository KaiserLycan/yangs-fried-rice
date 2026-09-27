# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 472 files · ~586,216 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2394 nodes · 6279 edges · 125 communities (109 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e48195d8`
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
- checkout-screen.tsx
- database-lockdown.test.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- vitest
- actions/reports.ts
- lucide-react
- routers/reports.ts
- past-order.ts
- roles.ts
- react
- package.json
- reports-charts.tsx
- validation/menu.ts
- actions/cart.ts
- actions/employee-profile.ts
- next
- delivery-addresses-card.tsx
- paymongo
- server.ts
- database.types.ts
- cart-totals.ts
- devDependencies
- customer-profile.ts
- checkout/page.tsx
- CustomerData
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
- actions.ts
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- site-nav-bar.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- validation/profile.ts
- P2 — if time allows
- reports-summary.tsx
- employee-modal.tsx
- fix-transactions.js
- read-placed-order.ts
- cn
- stored-image.ts
- track-order-screen.test.tsx
- wallet-tab.ts
- utils.ts
- track-order-screen.tsx
- scripts
- employee/login/page.tsx
- notifications.ts
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- senior-pwd-ids.ts
- audit-log/page.tsx
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
- checkout-screen.test.tsx
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
- useValidatedValues
- The 12 questions
- actions/profile.ts
- Limitations — gaps we can close in 1.5 days
- api-docs/page.tsx
- rewrite_docs.py
- Unimplemented Issues and Tasks
- Review Checklist
- delete-confirmation.test.ts
- cart-line-row.tsx
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- xss.test.tsx
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

## Communities (125 total, 16 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.17
Nodes (24): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+16 more)

### Community 1 - "auth.ts"
Cohesion: 0.10
Nodes (31): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+23 more)

### Community 2 - "menu-item-detail-modal.tsx"
Cohesion: 0.11
Nodes (30): MenuGrid(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema (+22 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.11
Nodes (34): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+26 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (10): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar() (+2 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (44): GET, errorToStatus(), getAuditLog(), ManageAuditLogInner(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime() (+36 more)

### Community 7 - "checkout-screen.tsx"
Cohesion: 0.19
Nodes (12): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+4 more)

### Community 8 - "database-lockdown.test.ts"
Cohesion: 0.29
Nodes (4): checkout, hardening, pickupOnly, quantityBounds

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (31): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+23 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.13
Nodes (21): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+13 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.07
Nodes (30): CancelOrderControl(), withdrawnMessage(), OrderTimeline(), StageMarker(), STATE_LABELS, 🟡 Browsing and Ordering, CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+22 more)

### Community 12 - "vitest"
Cohesion: 0.24
Nodes (6): CustomerLoginForm(), CustomerSignupForm(), ref_node_url, @testing-library/react, @vitejs/plugin-react, vitest

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "lucide-react"
Cohesion: 0.16
Nodes (9): EmployeeAvatarCard(), BottomTab, BottomTabBar(), TABS, AvatarButton(), ProfileAvatarCard(), compressImage(), ALLOWED_IMAGE_TYPES (+1 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.16
Nodes (24): OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), isPickupOrder(), canRate(), formatPlacedAt(), formatTotal() (+16 more)

### Community 17 - "roles.ts"
Cohesion: 0.12
Nodes (26): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+18 more)

### Community 18 - "react"
Cohesion: 0.09
Nodes (24): EmployeeData, ROLES, LogOutControl(), CustomerModal(), CustomerModalProps, SortableHeader(), SortableHeaderProps, SortDirection (+16 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (29): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+21 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.16
Nodes (19): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+11 more)

### Community 21 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "actions/cart.ts"
Cohesion: 0.05
Nodes (50): DELETE(), POST(), DELETE(), GET(), POST(), RouteParams, POST(), RouteParams (+42 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.18
Nodes (18): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+10 more)

### Community 24 - "next"
Cohesion: 0.15
Nodes (24): requestPasswordReset(), AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner() (+16 more)

### Community 25 - "delivery-addresses-card.tsx"
Cohesion: 0.14
Nodes (16): AddressValidationNote(), AddressValidationStatus, noteFor(), ValidateResponse, ValidationState, DeliveryDetailsCard(), handleFormChange(), FORM_LABELS (+8 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "server.ts"
Cohesion: 0.29
Nodes (4): GET(), GET(), POST(), findAwaitingPaymentOrder()

### Community 28 - "database.types.ts"
Cohesion: 0.07
Nodes (35): DELETE, GET, PUT, GET, POST, DELETE, GET, PUT (+27 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.13
Nodes (16): CartContents(), CartEmptyState(), CartTotalsSummary(), DesktopCartRail(), OrderSummaryRows(), calculateDeliveryFee(), CartLine, CartTotals (+8 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "customer-profile.ts"
Cohesion: 0.21
Nodes (11): revalidate, DeliveryAddressesCard(), ProfileHeader(), ProfileSummaryCard(), CustomerProfile, DATE_OF_BIRTH_FORMAT, formatMemberSince(), formatOrderCount() (+3 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.13
Nodes (20): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), MenuPage(), MenuPageBody(), ResolvedBottomTabBar(), getCategories() (+12 more)

### Community 33 - "CustomerData"
Cohesion: 0.33
Nodes (6): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Q3. Owner: "Who are my top 10 customers by spending this month?"

### Community 34 - "engine.ts"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "kds/page.tsx"
Cohesion: 0.21
Nodes (18): KdsInner(), KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps (+10 more)

### Community 37 - "validate-ncr.ts"
Cohesion: 0.17
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "toast.tsx"
Cohesion: 0.11
Nodes (13): app_globals, anton, dmSans, metadata, RateOrderButton(), ShowToast, Toast, ToastContext (+5 more)

### Community 41 - "phone.ts"
Cohesion: 0.18
Nodes (18): ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), employeeProfileUpdateSchema, formatMobileNumber(), INVALID_MOBILE_MESSAGE, isValidPhMobile() (+10 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (26): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+18 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "actions.ts"
Cohesion: 0.10
Nodes (20): ActionResult, EmployeeLoginResult, RegisterResult, lib_address_validate_ncr_addressforgeocoding, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues (+12 more)

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.60
Nodes (3): passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "map-content.tsx"
Cohesion: 0.05
Nodes (37): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+29 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "site-nav-bar.tsx"
Cohesion: 0.13
Nodes (12): MobileMenuHeader(), ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), Avatar(), shortAddressLabel() (+4 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.15
Nodes (18): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+10 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.20
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), latestBirthdateForMinAge() (+7 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.14
Nodes (21): ActionResult, Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition(), ORDER_STATUSES, OrderFilters (+13 more)

### Community 53 - "validation/profile.ts"
Cohesion: 0.07
Nodes (31): dateOfBirthSchema, addressLabelSchema, deliveryNoteSchema, newPasswordSchema, passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema (+23 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "reports-summary.tsx"
Cohesion: 0.16
Nodes (16): S4: Disabled account lockout (🟠 High), StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary() (+8 more)

### Community 56 - "employee-modal.tsx"
Cohesion: 0.10
Nodes (30): employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields(), snapshotOf() (+22 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.33
Nodes (9): fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+1 more)

### Community 59 - "cn"
Cohesion: 0.08
Nodes (22): Tab(), MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar() (+14 more)

### Community 60 - "stored-image.ts"
Cohesion: 0.24
Nodes (11): uploadMenuImage(), uploadProfileImage(), removeStoredImage(), removeStoredImages(), EXTENSION_BY_TYPE, IMAGE_BUCKETS, ImageBucket, imageExtensionFor() (+3 more)

### Community 61 - "track-order-screen.test.tsx"
Cohesion: 0.17
Nodes (7): TrackedOrder, getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "utils.ts"
Cohesion: 0.23
Nodes (8): getVisiblePages(), ManagePagination(), ManagePaginationProps, OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS

### Community 64 - "track-order-screen.tsx"
Cohesion: 0.16
Nodes (20): CheckoutConfirmationPage(), OrderDetailPage(), TrackOrderScreen(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam(), WALLET_TAB_PARAM, Coordinates (+12 more)

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
Cohesion: 0.11
Nodes (28): OrderPlacedScreen(), OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor() (+20 more)

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

### Community 73 - "audit-log/page.tsx"
Cohesion: 0.08
Nodes (33): CATEGORY_OPTIONS, FilterDropdown(), Option, getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps (+25 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (22): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+14 more)

### Community 78 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 79 - "actions/admin.ts"
Cohesion: 0.18
Nodes (21): ManageEmployeeInner(), ActionResult, auditChanges(), createEmployee(), Customer, deleteEmployee(), Employee, EmployeeEditInput (+13 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.17
Nodes (16): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+8 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "checkout-screen.test.tsx"
Cohesion: 0.20
Nodes (5): lines, profile, push, refresh, replace

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
Cohesion: 0.15
Nodes (12): Authentication Bypass, Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist (+4 more)

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
Cohesion: 0.12
Nodes (17): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint" (+9 more)

### Community 107 - "useValidatedValues"
Cohesion: 0.60
Nodes (4): useValidatedValues(), Mirror(), Probe(), schema

### Community 108 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 109 - "actions/profile.ts"
Cohesion: 0.17
Nodes (27): POST(), registerCustomer(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress() (+19 more)

### Community 111 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.22
Nodes (9): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Found by the security and finance walkthroughs (26 Sep 2026), Limitations — gaps we can close in 1.5 days (+1 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 119 - "cart-line-row.tsx"
Cohesion: 0.14
Nodes (18): DELETE(), PATCH(), RouteParams, CartLineRow(), AddOnsSection(), ItemSummary(), QuantityStepper(), StepButton() (+10 more)

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

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **781 isolated node(s):** `User roles`, `Tech stack`, `External services`, `Business rules`, `Triggers` (+776 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 968 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `auth.ts`, `menu-item-detail-modal.tsx`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `checkout-screen.tsx`, `routers/admin.ts`, `routers/profile.ts`, `vitest`, `lucide-react`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `react`, `package.json`, `reports-charts.tsx`, `actions/cart.ts`, `actions/employee-profile.ts`, `delivery-addresses-card.tsx`, `server.ts`, `database.types.ts`, `cart-totals.ts`, `customer-profile.ts`, `checkout/page.tsx`, `kds/page.tsx`, `validate-ncr.ts`, `routers/addons.ts`, `transactions.ts`, `toast.tsx`, `actions.ts`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `site-nav-bar.tsx`, `routers/orders.ts`, `utils.ts`, `track-order-screen.tsx`, `employee/login/page.tsx`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `audit-log/page.tsx`, `session.ts`, `actions/profile.ts`, `api-docs/page.tsx`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `sidebar.tsx`, `actions/audit.ts`, `routers/admin.ts`, `routers/profile.ts`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `reports-charts.tsx`, `actions/cart.ts`, `actions/employee-profile.ts`, `next`, `server.ts`, `database.types.ts`, `customer-profile.ts`, `checkout/page.tsx`, `routers/addons.ts`, `transactions.ts`, `actions.ts`, `routers/orders.ts`, `actions/orders.ts`, `reports-summary.tsx`, `read-placed-order.ts`, `stored-image.ts`, `track-order-screen.tsx`, `notifications.ts`, `submitCart`, `actions/admin.ts`, `actions/profile.ts`, `cart-line-row.tsx`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Review Checklist`, `order-summary-card.tsx`, `createClient`, `Review Checklist`, `Review Checklist`, `audit-log/page.tsx`, `Details`, `User simulation — 17 personas + hard questions through the UI`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `Review Checklist`, `map-content.tsx`, `checkout-screen.test.tsx`, `P2 — if time allows`, `actions/cart.ts`, `next`, `paymongo`, `Supabase`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `User roles`, `Tech stack`, `External services` to the rest of the system?**
  _781 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1048780487804878 - nodes in this community are weakly interconnected._
- **Should `menu-item-detail-modal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11074197120708748 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._