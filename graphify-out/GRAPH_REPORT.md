# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 498 files · ~601,779 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2482 nodes · 6626 edges · 141 communities (123 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84046ba2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useToast
- auth.ts
- actions.ts
- Database Cleanse Script
- actions/menu.ts
- sidebar.tsx
- audit-log/page.tsx
- cn
- customer-portal-access.test.ts
- routers/admin.ts
- actions/profile.ts
- order-stage.ts
- Root Layout and Errors
- actions/reports.ts
- requireApiEmployee
- Reports API Routes
- past-order.ts
- roles.ts
- actions/admin.ts
- package.json
- reports-charts.tsx
- Menu Validation Schemas
- fields.ts
- order-cancelled.ts
- validation/profile.ts
- customer-login-form.tsx
- paymongo
- employee-modal.tsx
- react
- cart-totals.ts
- Dev Dependencies
- (account)/profile/page.tsx
- customer-profile.ts
- menu-item-detail-modal.tsx
- engine.ts
- TypeScript Configuration
- xss.test.tsx
- products.ts
- routers/addons.ts
- Transactions API
- brand-panel.tsx
- phone.ts
- Details
- Runtime Dependencies
- The 12 questions
- site-info.ts
- delete-confirmation.test.ts
- order-issues.ts
- notification-bell.tsx
- toast.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- cart-line-row.tsx
- P2 — if time allows
- read-tracked-order.ts
- customer-signup-form.tsx
- Maintenance & Webhook Scripts
- use-shortcut.ts
- menu-screen.tsx
- actions/cart.ts
- reports-summary.tsx
- confirmation/page.tsx
- session.ts
- vitest
- NPM Scripts
- Employee Login Page
- Notifications API
- checkout-screen.test.tsx
- Phase 4 — Security & Testing Report
- submitCart
- Report Date Grouping
- Senior/PWD ID Uploads
- report-controls.tsx
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Security Analyst Persona
- next
- stored-image.ts
- map-staff-order.ts
- ESLint Configuration
- next.config.mjs
- postcss.config.mjs
- Prettier Configuration
- Supabase Backend Overview
- Tailwind Configuration
- Vitest Test Setup
- Legal Compliance Persona
- Review Checklist
- System Analyst Persona
- UI/UX Designer Persona
- 13. Cybersecurity analyst — "Dana, hired to assess the system before launch"
- Kitchen Staff Persona
- Restaurant Owner Persona
- Review Checklist
- Market Research Findings
- Password Strength Meter
- Review Checklist
- New Customer Persona
- Senior Customer Persona
- read-placed-order.ts
- manage/orders/page.tsx
- User simulation — 17 personas + hard questions through the UI
- Design & Analysis Roles
- cancel-order-control.test.tsx
- order-receipt.tsx
- kds/page.tsx
- menu-actions.test.ts
- Docs Rewrite Script
- Developer Persona
- GitHub User Story Issues
- Manager Persona
- Issue 106 Follow-up Plan
- track-order-screen.test.tsx
- database-lockdown.test.ts
- database.types.ts
- arrival-window.ts
- resolveEmployeeRole
- Competitor Comparison Analysis
- Requirements Audit
- Project README
- signup.ts
- createClient
- app/error.tsx
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- order-again-row.tsx
- B. SQL Injection Test
- D. Authorization Test
- order-number.ts
- E. XSS Test
- G. Usability Testing — **TO DO (manual)**
- read-past-orders.ts
- Graphify Rules
- Graphify Workflow

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 164 edges
2. `next` - 115 edges
3. `cn()` - 109 edges
4. `vitest` - 90 edges
5. `react` - 86 edges
6. `useToast()` - 63 edges
7. `resolveEmployeeRole()` - 39 edges
8. `lengthProps()` - 30 edges
9. `submitCart()` - 30 edges
10. `zod` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED)` --references--> `getOrderEtaAction()`  [INFERRED]
  docs/unimplemented_issues.md → lib/actions/eta.ts
- `12. Data scientist — "Miguel, wants to predict demand and improve the ETA"` --references--> `getOrderEtaAction()`  [INFERRED]
  docs/user-simulation.md → lib/actions/eta.ts
- `Key Files to Check` --references--> `getDetailedOrders()`  [INFERRED]
  .agents/skills/persona-manager/SKILL.md → lib/actions/orders.ts
- `30. Orders page can't filter by date, customer, payment or type (P2, high)` --references--> `getDetailedOrders()`  [INFERRED]
  docs/limitations.md → lib/actions/orders.ts
- `Security issues found by this phase's testing` --references--> `requireApiEmployee()`  [INFERRED]
  docs/phase4-security-testing-report.md → lib/auth/api-guard.ts

## Import Cycles
- None detected.

## Communities (141 total, 18 thin omitted)

### Community 0 - "useToast"
Cohesion: 0.17
Nodes (27): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+19 more)

### Community 1 - "auth.ts"
Cohesion: 0.12
Nodes (26): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+18 more)

### Community 2 - "actions.ts"
Cohesion: 0.16
Nodes (14): ActionResult, EmployeeLoginResult, RegisterResult, requestPasswordReset(), ForgotPasswordForm(), EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema (+6 more)

### Community 3 - "Database Cleanse Script"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "actions/menu.ts"
Cohesion: 0.17
Nodes (24): ManageMenuInner(), uploadMenuImage(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory() (+16 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (11): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference(), saveCollapsedPreference(), Sidebar() (+3 more)

### Community 6 - "audit-log/page.tsx"
Cohesion: 0.06
Nodes (52): GET, errorToStatus(), getAuditLog(), CATEGORY_OPTIONS, DEFAULT_SORT, FilterDropdown(), ManageAuditLogInner(), ManageAuditLogPage() (+44 more)

### Community 7 - "cn"
Cohesion: 0.12
Nodes (22): MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, OrderRatingDisplay(), RateOrderButton(), RateOrderDialog(), SCORE_WORDS, OrderTimeline() (+14 more)

### Community 8 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (31): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+23 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.06
Nodes (70): POST(), PATCH, DELETE, GET, PATCH, PATCH, DELETE, PATCH (+62 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.12
Nodes (23): TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES, Fulfilment, fulfilmentOf(), furtherAlong() (+15 more)

### Community 12 - "Root Layout and Errors"
Cohesion: 0.25
Nodes (4): app_globals, anton, dmSans, metadata

### Community 13 - "actions/reports.ts"
Cohesion: 0.13
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "requireApiEmployee"
Cohesion: 0.17
Nodes (14): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+6 more)

### Community 15 - "Reports API Routes"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.22
Nodes (15): PastOrderCard(), PastOrdersScreen(), canRate(), formatTotal(), isPast(), isUnpaid(), MAX_RATING, OrderOutcome (+7 more)

### Community 17 - "roles.ts"
Cohesion: 0.16
Nodes (18): ProfilePage(), canAccessAdminOnly(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+10 more)

### Community 18 - "actions/admin.ts"
Cohesion: 0.20
Nodes (15): ActionResult, Customer, Employee, EmployeeEditInput, isEmployeeRole(), normalizeEmployeeRoleLabel(), ChangePasswordInput, changePasswordSchema (+7 more)

### Community 19 - "package.json"
Cohesion: 0.08
Nodes (25): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+17 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.14
Nodes (21): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+13 more)

### Community 21 - "Menu Validation Schemas"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "fields.ts"
Cohesion: 0.11
Nodes (22): employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema (+14 more)

### Community 23 - "order-cancelled.ts"
Cohesion: 0.23
Nodes (13): ReceiptBody(), first(), notifyOrderCancelled(), contactLine(), orderCancelledEmail(), OrderCancelledEmailInput, refundNoteFor(), EmailMessage (+5 more)

### Community 24 - "validation/profile.ts"
Cohesion: 0.11
Nodes (19): newPasswordSchema, passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField, loginSchema, LoginValues (+11 more)

### Community 25 - "customer-login-form.tsx"
Cohesion: 0.21
Nodes (13): resetPassword(), LoginFormInner(), EmployeeLoginFormInner(), ResetPasswordForm(), Field(), Input, InputProps, ShowHideToggle() (+5 more)

### Community 26 - "paymongo"
Cohesion: 0.11
Nodes (19): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+11 more)

### Community 27 - "employee-modal.tsx"
Cohesion: 0.27
Nodes (11): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+3 more)

### Community 28 - "react"
Cohesion: 0.10
Nodes (22): ManageCustomersInner(), loadCustomers(), EmployeeData, ROLES, SortableHeader(), SortableHeaderProps, BottomTab, BottomTabBar() (+14 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.08
Nodes (35): CartContents(), CartEmptyState(), CartTotalsSummary(), CheckoutScreen(), OrderPlacedScreen(), OrderSummaryRows(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT (+27 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.12
Nodes (18): revalidate, CustomerModal(), CustomerModalProps, ResolvedMobileProfile(), AccountActions(), AvatarButton(), DeliveryAddressesCard(), ProfileAvatarCard() (+10 more)

### Community 32 - "customer-profile.ts"
Cohesion: 0.16
Nodes (19): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar() (+11 more)

### Community 33 - "menu-item-detail-modal.tsx"
Cohesion: 0.12
Nodes (23): MenuGrid(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema (+15 more)

### Community 34 - "engine.ts"
Cohesion: 0.07
Nodes (42): POST, GET(), GET(), POST(), validateAddress(), getOrderEtaAction(), GetOrderEtaResult, geocodeCandidates() (+34 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "xss.test.tsx"
Cohesion: 0.19
Nodes (17): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+9 more)

### Community 37 - "products.ts"
Cohesion: 0.18
Nodes (12): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+4 more)

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "Transactions API"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "brand-panel.tsx"
Cohesion: 0.20
Nodes (4): metadata, AuthShell(), BrandPanel(), PICKUP_COUNTER

### Community 41 - "phone.ts"
Cohesion: 0.28
Nodes (12): PhoneInput(), handleChange(), handlePaste(), INVALID_MOBILE_MESSAGE, isValidPhMobile(), maskPhoneDigits(), optionalPhoneSchema, PH_MOBILE_DIGITS (+4 more)

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
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 47 - "order-issues.ts"
Cohesion: 0.06
Nodes (40): POST(), RouteParams, GET(), RouteParams, GET(), resolve(), ReportProblemDialog(), pickPhoto() (+32 more)

### Community 48 - "notification-bell.tsx"
Cohesion: 0.25
Nodes (12): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+4 more)

### Community 49 - "toast.tsx"
Cohesion: 0.11
Nodes (18): logout(), LogOutControl(), handleLogOut(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), ShowToast (+10 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.18
Nodes (14): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+6 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.14
Nodes (20): ActionResult, attachOrderAddOns(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition(), ORDER_STATUSES (+12 more)

### Community 53 - "cart-line-row.tsx"
Cohesion: 0.16
Nodes (17): CartLineRow(), AddOnsSection(), CartLineEdit, ItemSummary(), ProductCard(), ProductPhotoPlaceholder(), ProductRow(), QuantityInput() (+9 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.10
Nodes (21): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+13 more)

### Community 55 - "read-tracked-order.ts"
Cohesion: 0.26
Nodes (9): ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice(), first(), readTrackedOrder(), TrackedOrderIssue, TrackedOrderLine, TrackedOrderPayment (+1 more)

### Community 56 - "customer-signup-form.tsx"
Cohesion: 0.11
Nodes (23): AuthTabs(), Tab(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), AddressValidationNote(), AddressValidationStatus (+15 more)

### Community 57 - "Maintenance & Webhook Scripts"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "use-shortcut.ts"
Cohesion: 0.27
Nodes (12): ShortcutsHelp(), STAFF_AREAS, Kbd(), Tooltip(), formatCombo(), isMac(), isTypingTarget(), matchesCombo() (+4 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.08
Nodes (17): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), MobileMenuHeader(), SearchField() (+9 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.12
Nodes (21): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+13 more)

### Community 61 - "reports-summary.tsx"
Cohesion: 0.16
Nodes (16): S4: Disabled account lockout (🟠 High), StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary() (+8 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "session.ts"
Cohesion: 0.28
Nodes (9): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret() (+1 more)

### Community 64 - "vitest"
Cohesion: 0.15
Nodes (8): CustomerLoginForm(), CustomerSignupForm(), Mirror(), Probe(), schema, shortAddressLabel(), @testing-library/react, vitest

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "Employee Login Page"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 67 - "Notifications API"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "checkout-screen.test.tsx"
Cohesion: 0.10
Nodes (24): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, submit(), orderTypeFor() (+16 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.10
Nodes (21): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, C. Authentication Test, End-to-end checks against the live API, F. Functional Testing, Functional issues found earlier in the QA pass (+13 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "Report Date Grouping"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "Senior/PWD ID Uploads"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 73 - "report-controls.tsx"
Cohesion: 0.20
Nodes (14): getDefaultStartDate(), getToday(), ReportsContent(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect(), LEGACY_MENU_SATISFACTION_TYPES (+6 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Security Analyst Persona"
Cohesion: 0.12
Nodes (16): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical) (+8 more)

### Community 78 - "next"
Cohesion: 0.10
Nodes (23): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), Window (+15 more)

### Community 79 - "stored-image.ts"
Cohesion: 0.24
Nodes (11): EmployeeAvatarCard(), setEmployeePhoto(), compressImage(), removeStoredImages(), ALLOWED_IMAGE_TYPES, EXTENSION_BY_TYPE, ImageBucket, imageExtensionFor() (+3 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.20
Nodes (13): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+5 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "Supabase Backend Overview"
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

### Community 95 - "13. Cybersecurity analyst — "Dana, hired to assess the system before launch""
Cohesion: 0.25
Nodes (6): S10: Webhook security (🟡 Low), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 96 - "Kitchen Staff Persona"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Restaurant Owner Persona"
Cohesion: 0.17
Nodes (11): Business Intelligence, Cash Management, Key Files to Check, Persona: Restaurant Owner — "Mr. Yang", Red Flags, Revenue Accuracy, Review Checklist, Staff Accountability (+3 more)

### Community 98 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Authentication Bypass, Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist (+4 more)

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

### Community 104 - "read-placed-order.ts"
Cohesion: 0.26
Nodes (9): formatOrderTime(), foldPaymentStatus(), PaymentStatus, fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), isWalletMethod() (+1 more)

### Community 105 - "manage/orders/page.tsx"
Cohesion: 0.18
Nodes (10): getVisiblePages(), ManagePagination(), ManagePaginationProps, OpenIssuesPanel(), OrderSidebar(), OrderSidebarProps, OrderStatus, statuses (+2 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.12
Nodes (17): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint" (+9 more)

### Community 107 - "Design & Analysis Roles"
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.25
Nodes (7): OrderProgress, ACCEPTED, confirmCancel(), openDialog(), PREPARING, RECEIVED, refresh

### Community 109 - "order-receipt.tsx"
Cohesion: 0.20
Nodes (10): NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptOrder, TrackedOrder, formatReceiptTime(), RECEIPT_TIME_FORMAT, receiptTotals (+2 more)

### Community 111 - "kds/page.tsx"
Cohesion: 0.50
Nodes (6): KdsInner(), ManageOrdersInner(), getDetailedOrders(), updateOrderStatus(), actionCopy(), dbStatusFor()

### Community 112 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 114 - "Developer Persona"
Cohesion: 0.17
Nodes (11): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+3 more)

### Community 115 - "GitHub User Story Issues"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Manager Persona"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "Issue 106 Follow-up Plan"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 118 - "track-order-screen.test.tsx"
Cohesion: 0.18
Nodes (6): getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 119 - "database-lockdown.test.ts"
Cohesion: 0.29
Nodes (4): checkout, hardening, pickupOnly, quantityBounds

### Community 120 - "database.types.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 121 - "arrival-window.ts"
Cohesion: 0.38
Nodes (4): OrderDetailPage(), ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom()

### Community 122 - "resolveEmployeeRole"
Cohesion: 0.48
Nodes (6): resolveEmployeeRole(), clearSessionCookies(), config, middleware(), signOutDisabled(), @supabase/ssr

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Project README"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "signup.ts"
Cohesion: 0.15
Nodes (11): PH_MOBILE_GROUPS_PATTERN, PHONE_SEPARATORS, customerFirstNameSchema, customerLastNameSchema, customerMobileSchema, DEFAULT_ADDRESS_LABEL, SignupField, signupFormSchema (+3 more)

### Community 127 - "createClient"
Cohesion: 0.28
Nodes (8): GET(), submitProductReview(), findAwaitingPaymentOrder(), readRecentCompletedOrders(), RECENT_ORDERS_LIMIT, RecentOrder, createClient(), UNPAID_ORDER_STATUSES

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "order-again-row.tsx"
Cohesion: 0.60
Nodes (5): OrderAgainRow(), reorder(), reorderPastOrder(), formatPlacedAt(), summariseItems()

### Community 133 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 134 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 135 - "order-number.ts"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 136 - "E. XSS Test"
Cohesion: 0.50
Nodes (4): E. XSS Test, How the application was verified, Payloads used, Results

### Community 137 - "G. Usability Testing — **TO DO (manual)**"
Cohesion: 0.50
Nodes (4): Feedback form (one per tester), G. Usability Testing — **TO DO (manual)**, Summary table to complete, Tasks to set each tester

### Community 138 - "read-past-orders.ts"
Cohesion: 0.83
Nodes (3): totalOf(), productNameOf(), readPastOrders()

## Knowledge Gaps
- **781 isolated node(s):** `subscribedTopics`, `shared`, `WALLET_LABEL`, `OnValidResult`, `LoginGate` (+776 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 972 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app/error.tsx`, `auth.ts`, `actions.ts`, `useToast`, `order-again-row.tsx`, `sidebar.tsx`, `audit-log/page.tsx`, `cn`, `actions/menu.ts`, `routers/admin.ts`, `actions/profile.ts`, `Root Layout and Errors`, `requireApiEmployee`, `Reports API Routes`, `past-order.ts`, `package.json`, `reports-charts.tsx`, `customer-login-form.tsx`, `react`, `cart-totals.ts`, `(account)/profile/page.tsx`, `customer-profile.ts`, `engine.ts`, `products.ts`, `routers/addons.ts`, `Transactions API`, `brand-panel.tsx`, `site-info.ts`, `order-issues.ts`, `notification-bell.tsx`, `toast.tsx`, `routers/orders.ts`, `cart-line-row.tsx`, `customer-signup-form.tsx`, `use-shortcut.ts`, `menu-screen.tsx`, `actions/cart.ts`, `confirmation/page.tsx`, `session.ts`, `vitest`, `Employee Login Page`, `Notifications API`, `checkout-screen.test.tsx`, `submitCart`, `report-controls.tsx`, `Placeholder Manage Pages`, `stored-image.ts`, `manage/orders/page.tsx`, `kds/page.tsx`, `menu-actions.test.ts`, `resolveEmployeeRole`, `createClient`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `actions.ts`, `actions/menu.ts`, `order-again-row.tsx`, `audit-log/page.tsx`, `cn`, `routers/admin.ts`, `actions/profile.ts`, `read-past-orders.ts`, `actions/reports.ts`, `requireApiEmployee`, `Reports API Routes`, `actions/admin.ts`, `reports-charts.tsx`, `order-cancelled.ts`, `customer-login-form.tsx`, `(account)/profile/page.tsx`, `customer-profile.ts`, `menu-item-detail-modal.tsx`, `engine.ts`, `products.ts`, `routers/addons.ts`, `Transactions API`, `order-issues.ts`, `toast.tsx`, `routers/orders.ts`, `actions/orders.ts`, `read-tracked-order.ts`, `actions/cart.ts`, `reports-summary.tsx`, `Notifications API`, `submitCart`, `next`, `stored-image.ts`, `read-placed-order.ts`, `kds/page.tsx`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Review Checklist`, `checkout-screen.test.tsx`, `Review Checklist`, `New Customer Persona`, `Senior Customer Persona`, `Details`, `User simulation — 17 personas + hard questions through the UI`, `Accountant Persona`, `Security Analyst Persona`, `Design & Analysis Roles`, `next`, `Issue 106 Follow-up Plan`, `P2 — if time allows`, `Supabase Backend Overview`, `paymongo`, `actions/cart.ts`, `cart-totals.ts`, `createClient`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **What connects `subscribedTopics`, `shared`, `WALLET_LABEL` to the rest of the system?**
  _781 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Should `Database Cleanse Script` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1038961038961039 - nodes in this community are weakly interconnected._