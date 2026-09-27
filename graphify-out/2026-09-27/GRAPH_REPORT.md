# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 496 files · ~601,358 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2476 nodes · 6606 edges · 143 communities (122 shown, 21 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `98ccd0d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- password-card.tsx
- auth.ts
- actions.ts
- Database Cleanse Script
- createClient
- sidebar.tsx
- actions/audit.ts
- cn
- customer-portal-access.test.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- Root Layout and Errors
- actions/reports.ts
- database.types.ts
- Reports API Routes
- past-order.ts
- roles.ts
- actions/admin.ts
- package.json
- reports-charts.tsx
- Menu Validation Schemas
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- customer-signup-form.tsx
- paymongo
- employee-modal.tsx
- audit-log/page.tsx
- cart-totals.ts
- Dev Dependencies
- site-nav-bar.tsx
- next
- menu-item-detail-modal.tsx
- Delivery ETA Engine
- TypeScript Configuration
- kds/page.tsx
- validate-ncr.ts
- Product Add-ons API
- Transactions API
- brand-panel.tsx
- phone.ts
- Details
- Runtime Dependencies
- The 12 questions
- order-receipt.tsx
- delete-confirmation.test.ts
- report-problem.tsx
- Customer Notifications
- react
- routers/orders.ts
- date-of-birth.ts
- validation/orders.ts
- cart-line-row.tsx
- P2 — if time allows
- read-tracked-order.ts
- delivery-addresses-card.tsx
- Maintenance & Webhook Scripts
- checkout-screen.tsx
- menu-screen.tsx
- actions/cart.ts
- reports-summary.tsx
- confirmation/page.tsx
- session.ts
- dialog.tsx
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
- updateCartItem
- avatar-button.tsx
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
- requireReportAccess
- Market Research Findings
- Password Strength Meter
- Review Checklist
- New Customer Persona
- Senior Customer Persona
- read-placed-order.ts
- eta.ts
- User Simulation Personas
- Design & Analysis Roles
- cancel-order-control.test.tsx
- actions/profile.ts
- actions/orders.ts
- Reporting and Customer Data Gaps
- Docs Rewrite Script
- Developer Persona
- GitHub User Story Issues
- Manager Persona
- Issue 106 Follow-up Plan
- log-out-control.test.tsx
- database-lockdown.test.ts
- Persona: QA Tester — "Paolo, tries to break things"
- change-password/route.ts
- Legal Review Findings
- Competitor Comparison Analysis
- Requirements Audit
- Project README
- vitest
- server.ts
- @supabase/supabase-js
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- H. Test Evidence / Screenshots — **TO DO (manual)**
- B. SQL Injection Test
- D. Authorization Test
- Limitations — gaps we can close in 1.5 days
- E. XSS Test
- employeeLogout
- api-docs/page.tsx
- Panel feedback — verified against the code and docs
- address-label.test.ts
- Graphify Rules
- Graphify Workflow

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 164 edges
2. `next` - 115 edges
3. `cn()` - 109 edges
4. `vitest` - 89 edges
5. `react` - 86 edges
6. `useToast()` - 63 edges
7. `resolveEmployeeRole()` - 39 edges
8. `lengthProps()` - 30 edges
9. `submitCart()` - 30 edges
10. `zod` - 30 edges

## Surprising Connections (you probably didn't know these)
- `Payment Accuracy` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-accountant/SKILL.md → lib/checkout/paymongo.ts
- `Revenue Accuracy` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-restaurant-owner/SKILL.md → lib/checkout/paymongo.ts
- `27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1)` --references--> `paymongo()`  [INFERRED]
  docs/limitations.md → lib/checkout/paymongo.ts
- `Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED)` --references--> `getOrderEtaAction()`  [INFERRED]
  docs/unimplemented_issues.md → lib/actions/eta.ts
- `12. Data scientist — "Miguel, wants to predict demand and improve the ETA"` --references--> `getOrderEtaAction()`  [INFERRED]
  docs/user-simulation.md → lib/actions/eta.ts

## Import Cycles
- None detected.

## Communities (143 total, 21 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.17
Nodes (23): revalidate, EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES, SHIFTS (+15 more)

### Community 1 - "auth.ts"
Cohesion: 0.18
Nodes (20): POST, POST, customerLogin(), employeeLogin(), loginGate(), loginCustomer(), loginEmployee(), checkLoginAllowed() (+12 more)

### Community 2 - "actions.ts"
Cohesion: 0.16
Nodes (14): ActionResult, EmployeeLoginResult, RegisterResult, resetPassword(), deleteSession(), EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema (+6 more)

### Community 3 - "Database Cleanse Script"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.11
Nodes (36): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+28 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (11): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference(), saveCollapsedPreference(), Sidebar() (+3 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (41): GET, errorToStatus(), getAuditLog(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime(), SOURCE_LABELS (+33 more)

### Community 7 - "cn"
Cohesion: 0.12
Nodes (20): Tab(), MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, ChipButton(), CategoryButton(), CategorySidebar(), ProductPhotoPlaceholder() (+12 more)

### Community 8 - "customer-portal-access.test.ts"
Cohesion: 0.25
Nodes (7): checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 9 - "routers/admin.ts"
Cohesion: 0.09
Nodes (31): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+23 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.12
Nodes (25): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+17 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.09
Nodes (31): SwitchToCodButton(), handleSwitch(), StageMarker(), STATE_LABELS, TrackOrderScreen(), switchOrderToCashOnDelivery(), isPickupOrder(), cancellationNoticeFor() (+23 more)

### Community 12 - "Root Layout and Errors"
Cohesion: 0.25
Nodes (4): app_globals, anton, dmSans, metadata

### Community 13 - "actions/reports.ts"
Cohesion: 0.13
Nodes (27): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+19 more)

### Community 14 - "database.types.ts"
Cohesion: 0.07
Nodes (35): DELETE, GET, PUT, GET, POST, DELETE, GET, PUT (+27 more)

### Community 15 - "Reports API Routes"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.19
Nodes (20): OrderAgainRow(), reorder(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), canRate(), formatPlacedAt(), formatTotal() (+12 more)

### Community 17 - "roles.ts"
Cohesion: 0.17
Nodes (21): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+13 more)

### Community 18 - "actions/admin.ts"
Cohesion: 0.11
Nodes (29): ActionResult, auditChanges(), Customer, deleteCustomer(), deleteEmployee(), Employee, EmployeeEditInput, updateEmployeeDetails() (+21 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (26): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+18 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.16
Nodes (19): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+11 more)

### Community 21 - "Menu Validation Schemas"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "customer-orders.ts"
Cohesion: 0.10
Nodes (21): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderDialog(), ActionResult, getMyOrderDetail() (+13 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.13
Nodes (23): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+15 more)

### Community 24 - "fields.ts"
Cohesion: 0.05
Nodes (42): dateOfBirthSchema, addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema (+34 more)

### Community 25 - "customer-signup-form.tsx"
Cohesion: 0.12
Nodes (28): requestPasswordReset(), AuthTabs(), CustomerLoginForm(), LoginFormInner(), CustomerSignupForm(), FIELD_LABELS, readSignupForm(), SignupFormInner() (+20 more)

### Community 26 - "paymongo"
Cohesion: 0.13
Nodes (15): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+7 more)

### Community 27 - "employee-modal.tsx"
Cohesion: 0.16
Nodes (17): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+9 more)

### Community 28 - "audit-log/page.tsx"
Cohesion: 0.12
Nodes (22): CATEGORY_OPTIONS, DEFAULT_SORT, FilterDropdown(), ManageAuditLogInner(), Option, EmployeeData, ManageEmployeeInner(), ROLES (+14 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.15
Nodes (17): CartContents(), CartEmptyState(), OrderPlacedScreen(), OrderSummaryRows(), OrderType, orderTypeFor(), PlacedOrder, calculateDeliveryFee() (+9 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "site-nav-bar.tsx"
Cohesion: 0.16
Nodes (17): MobileMenuHeader(), ResolvedMobileProfile(), SearchField(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), ProfileHeader() (+9 more)

### Community 32 - "next"
Cohesion: 0.12
Nodes (24): CartPage(), CheckoutPage(), OrderDetailPage(), OrdersPage(), ProfilePage(), revalidate, MenuPage(), MenuPageBody() (+16 more)

### Community 33 - "menu-item-detail-modal.tsx"
Cohesion: 0.13
Nodes (26): uploadMenuImage(), MenuGrid(), MenuGridProps, MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema (+18 more)

### Community 34 - "Delivery ETA Engine"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "kds/page.tsx"
Cohesion: 0.26
Nodes (14): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+6 more)

### Community 37 - "validate-ncr.ts"
Cohesion: 0.16
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

### Community 38 - "Product Add-ons API"
Cohesion: 0.16
Nodes (16): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+8 more)

### Community 39 - "Transactions API"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "brand-panel.tsx"
Cohesion: 0.16
Nodes (4): metadata, AuthShell(), BrandPanel(), ErrorScreen()

### Community 41 - "phone.ts"
Cohesion: 0.17
Nodes (20): EmployeeContactDetailsCard(), ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput (+12 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (24): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+16 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 45 - "order-receipt.tsx"
Cohesion: 0.06
Nodes (40): FOOTER_LINKS, SiteFooter(), NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptBody(), ReceiptOrder, first() (+32 more)

### Community 47 - "report-problem.tsx"
Cohesion: 0.12
Nodes (28): OpenIssuesPanel(), resolve(), ReportProblem(), ReportProblemDialog(), pickPhoto(), submit(), ActionResult, first() (+20 more)

### Community 48 - "Customer Notifications"
Cohesion: 0.37
Nodes (10): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+2 more)

### Community 49 - "react"
Cohesion: 0.11
Nodes (17): OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS, AccountActions(), Button(), buttonVariants (+9 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.18
Nodes (13): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+5 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.20
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), latestBirthdateForMinAge() (+7 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.22
Nodes (13): isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES, ReportDateRange (+5 more)

### Community 53 - "cart-line-row.tsx"
Cohesion: 0.21
Nodes (12): CartLineRow(), AddOnsSection(), CartLineEdit, ItemSummary(), QuantityInput(), handleChange(), QuantityStepper(), StepButton() (+4 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "read-tracked-order.ts"
Cohesion: 0.16
Nodes (19): GET(), ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice(), formatOrderNumber(), normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch() (+11 more)

### Community 56 - "delivery-addresses-card.tsx"
Cohesion: 0.16
Nodes (9): AddressValidationNote(), AddressValidationStatus, noteFor(), ValidateResponse, ValidationState, FormErrorSummary(), ADDRESS_FORM_LABELS, DeliveryAddressesCard() (+1 more)

### Community 57 - "Maintenance & Webhook Scripts"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "checkout-screen.tsx"
Cohesion: 0.13
Nodes (18): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+10 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.09
Nodes (18): CartTotalsSummary(), DesktopCartRail(), CategoryChips(), MenuEmptyState(), MenuScreen(), ResolvedBottomTabBar(), ProductCard(), ProductRow() (+10 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.19
Nodes (15): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+7 more)

### Community 61 - "reports-summary.tsx"
Cohesion: 0.20
Nodes (13): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+5 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.17
Nodes (13): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+5 more)

### Community 63 - "session.ts"
Cohesion: 0.28
Nodes (9): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret() (+1 more)

### Community 64 - "dialog.tsx"
Cohesion: 0.23
Nodes (6): CustomerModal(), CustomerModalProps, DialogDismiss(), DialogRequestCloseContext, DialogRoot(), useDialogRequestClose()

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
Cohesion: 0.13
Nodes (19): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, foldPaymentStatus(), PaymentStatus (+11 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.10
Nodes (20): A. Input Validation Test, Application-level checks after the migration, C. Authentication Test, End-to-end checks against the live API, F. Functional Testing, Feedback form (one per tester), Functional issues found earlier in the QA pass, G. Usability Testing — **TO DO (manual)** (+12 more)

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
Cohesion: 0.19
Nodes (15): getDefaultStartDate(), getToday(), ReportsContent(), DateInput(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect() (+7 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Security Analyst Persona"
Cohesion: 0.12
Nodes (16): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical) (+8 more)

### Community 78 - "updateCartItem"
Cohesion: 0.14
Nodes (18): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), ItemDetailModal() (+10 more)

### Community 79 - "avatar-button.tsx"
Cohesion: 0.47
Nodes (7): EmployeeAvatarCard(), AvatarButton(), setEmployeePhoto(), uploadProfileImage(), compressImage(), ALLOWED_IMAGE_TYPES, imageUploadProblem()

### Community 80 - "map-staff-order.ts"
Cohesion: 0.20
Nodes (12): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+4 more)

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
Cohesion: 0.18
Nodes (10): Cleanup Jobs (pg_cron), Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags, Review Checklist (+2 more)

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

### Community 98 - "requireReportAccess"
Cohesion: 0.13
Nodes (15): Authentication Bypass, Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Review Checklist, RLS Verification, Timing Attacks, S4: Disabled account lockout (🟠 High) (+7 more)

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
Cohesion: 0.36
Nodes (7): formatOrderTime(), fulfilmentFromOrderType(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), isWalletMethod(), paymentLabelFor()

### Community 105 - "eta.ts"
Cohesion: 0.23
Nodes (9): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, Coordinates, EtaResult, ACTIVE_KITCHEN_STATUSES (+1 more)

### Community 106 - "User Simulation Personas"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "Design & Analysis Roles"
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "actions/profile.ts"
Cohesion: 0.17
Nodes (23): POST(), registerCustomer(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress() (+15 more)

### Community 111 - "actions/orders.ts"
Cohesion: 0.20
Nodes (15): KdsInner(), ManageOrdersInner(), ActionResult, attachOrderAddOns(), getDetailedOrders(), getOrderDetail(), Order, OrderStats (+7 more)

### Community 112 - "Reporting and Customer Data Gaps"
Cohesion: 0.33
Nodes (6): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Q3. Owner: "Who are my top 10 customers by spending this month?"

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

### Community 118 - "log-out-control.test.tsx"
Cohesion: 0.32
Nodes (6): logout(), LogOutControl(), handleLogOut(), profile, refresh, replace

### Community 119 - "database-lockdown.test.ts"
Cohesion: 0.29
Nodes (4): checkout, hardening, pickupOnly, quantityBounds

### Community 120 - "Persona: QA Tester — "Paolo, tries to break things""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Verification SQL, Who is Paolo?

### Community 121 - "change-password/route.ts"
Cohesion: 0.27
Nodes (4): POST, GET, changeOwnPassword(), getMe()

### Community 122 - "Legal Review Findings"
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Project README"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "vitest"
Cohesion: 0.12
Nodes (15): contactDetailsSchema, reviewSubmissionSchema, signupSchema, VALID, ref_node_fs, ref_node_path, vitest, fixes (+7 more)

### Community 128 - "@supabase/supabase-js"
Cohesion: 0.33
Nodes (4): @supabase/supabase-js, fetchMock, invoke, start()

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 133 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 134 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 135 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.50
Nodes (4): 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Limitations — gaps we can close in 1.5 days, Panel feedback (verified in [`feedback-verification.md`](feedback-verification.md))

### Community 136 - "E. XSS Test"
Cohesion: 0.50
Nodes (4): E. XSS Test, How the application was verified, Payloads used, Results

### Community 139 - "Panel feedback — verified against the code and docs"
Cohesion: 0.67
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

## Knowledge Gaps
- **779 isolated node(s):** `MOCK_PRODUCTS`, `MOCK_CATEGORIES`, `OnValidResult`, `ShowToast`, `Toast` (+774 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `auth.ts`, `actions.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `cn`, `routers/admin.ts`, `api-docs/page.tsx`, `routers/profile.ts`, `Root Layout and Errors`, `order-stage.ts`, `database.types.ts`, `Reports API Routes`, `past-order.ts`, `roles.ts`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `cart-totals.ts`, `site-nav-bar.tsx`, `menu-item-detail-modal.tsx`, `kds/page.tsx`, `validate-ncr.ts`, `Product Add-ons API`, `Transactions API`, `brand-panel.tsx`, `order-receipt.tsx`, `report-problem.tsx`, `Customer Notifications`, `react`, `routers/orders.ts`, `cart-line-row.tsx`, `read-tracked-order.ts`, `delivery-addresses-card.tsx`, `checkout-screen.tsx`, `menu-screen.tsx`, `actions/cart.ts`, `confirmation/page.tsx`, `session.ts`, `Employee Login Page`, `Notifications API`, `checkout-screen.test.tsx`, `submitCart`, `report-controls.tsx`, `Placeholder Manage Pages`, `updateCartItem`, `avatar-button.tsx`, `eta.ts`, `actions/profile.ts`, `server.ts`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `actions.ts`, `actions/audit.ts`, `employeeLogout`, `routers/admin.ts`, `order-stage.ts`, `routers/profile.ts`, `actions/reports.ts`, `database.types.ts`, `Reports API Routes`, `past-order.ts`, `actions/admin.ts`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `next`, `Product Add-ons API`, `Transactions API`, `order-receipt.tsx`, `report-problem.tsx`, `routers/orders.ts`, `read-tracked-order.ts`, `actions/cart.ts`, `reports-summary.tsx`, `Notifications API`, `submitCart`, `updateCartItem`, `avatar-button.tsx`, `requireReportAccess`, `read-placed-order.ts`, `eta.ts`, `actions/profile.ts`, `actions/orders.ts`, `log-out-control.test.tsx`, `server.ts`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `@supabase/supabase-js`, `auth.ts`, `actions.ts`, `Vitest Configuration`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `customer-portal-access.test.ts`, `order-stage.ts`, `address-label.test.ts`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `actions/admin.ts`, `package.json`, `Menu Validation Schemas`, `customer-orders.ts`, `actions/employee-profile.ts`, `fields.ts`, `customer-signup-form.tsx`, `employee-modal.tsx`, `audit-log/page.tsx`, `cart-totals.ts`, `site-nav-bar.tsx`, `Delivery ETA Engine`, `kds/page.tsx`, `validate-ncr.ts`, `phone.ts`, `order-receipt.tsx`, `delete-confirmation.test.ts`, `report-problem.tsx`, `Customer Notifications`, `react`, `date-of-birth.ts`, `validation/orders.ts`, `cart-line-row.tsx`, `read-tracked-order.ts`, `checkout-screen.tsx`, `menu-screen.tsx`, `actions/cart.ts`, `confirmation/page.tsx`, `session.ts`, `dialog.tsx`, `checkout-screen.test.tsx`, `Report Date Grouping`, `Senior/PWD ID Uploads`, `map-staff-order.ts`, `Password Strength Meter`, `read-placed-order.ts`, `eta.ts`, `cancel-order-control.test.tsx`, `log-out-control.test.tsx`, `database-lockdown.test.ts`, `server.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `MOCK_PRODUCTS`, `MOCK_CATEGORIES`, `OnValidResult` to the rest of the system?**
  _779 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database Cleanse Script` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._