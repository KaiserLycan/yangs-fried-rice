# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 508 files · ~754,557 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2586 nodes · 6981 edges · 146 communities (129 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2781dfd9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- delivery-addresses-card.tsx
- auth.ts
- actions.ts
- Database Cleanse Script
- createClient
- sidebar.tsx
- actions/audit.ts
- useToast
- customer-orders.ts
- routers/admin.ts
- actions/profile.ts
- order-stage.ts
- Root Layout and Errors
- actions/reports.ts
- database.types.ts
- Reports API Routes
- past-order.ts
- roles.ts
- audit-log/page.tsx
- package.json
- dashboard-content.tsx
- Menu Validation Schemas
- actions/admin.ts
- order-number.ts
- order-placed-screen.tsx
- employee-login-form.tsx
- Review Checklist
- employee-modal.tsx
- react
- checkout-screen.tsx
- Dev Dependencies
- (account)/profile/page.tsx
- menu-page-body.tsx
- manage/menu/page.tsx
- engine.ts
- TypeScript Configuration
- senior-pwd-discount.test.tsx
- cart/page.tsx
- routers/addons.ts
- transactions.ts
- brand-panel.tsx
- phone-input.tsx
- Details
- Runtime Dependencies
- The 12 questions
- site-info.ts
- delete-confirmation.test.ts
- order-issues.ts
- notification-bell.tsx
- site-nav-bar.tsx
- actions/orders.ts
- date-of-birth.ts
- validation/orders.ts
- item-detail-modal.tsx
- P2 — if time allows
- track-order-screen.tsx
- forgot-password-form.tsx
- Maintenance & Webhook Scripts
- use-shortcut.ts
- menu-screen.tsx
- actions/cart.ts
- reports-charts.tsx
- confirmation/page.tsx
- eta.ts
- next
- NPM Scripts
- routers/employee-profile.ts
- Notifications API
- payment-status-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- Report Date Grouping
- order-summary-card.tsx
- updateCartItem
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Review Checklist
- requireCustomer
- actions/employee-profile.ts
- map-staff-order.ts
- ESLint Configuration
- next.config.mjs
- postcss.config.mjs
- Prettier Configuration
- avatar-button.tsx
- Tailwind Configuration
- Vitest Test Setup
- Legal Compliance Persona
- Review Checklist
- System Analyst Persona
- UI/UX Designer Persona
- cart-totals.ts
- Kitchen Staff Persona
- Restaurant Owner Persona
- Review Checklist
- Market Research Findings
- Password Strength Meter
- order-again-row.tsx
- New Customer Persona
- Senior Customer Persona
- order-timeline.tsx
- cn
- User simulation — 17 personas + hard questions through the UI
- Design & Analysis Roles
- cancel-order-control.test.tsx
- order-receipt.tsx
- user-simulation.md
- store-hours.ts
- menu-actions.test.ts
- Docs Rewrite Script
- bottom-tab-bar.tsx
- GitHub User Story Issues
- Manager Persona
- Issue 106 Follow-up Plan
- track-order-screen.test.tsx
- injection.test.ts
- checkout-screen.test.tsx
- cart-totals-summary.tsx
- Copy glossary
- Competitor Comparison Analysis
- Requirements Audit
- Yang's Fried Rice — Ordering System
- read-past-orders.ts
- read-recent-orders.ts
- formatMobileNumber
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
- paymongo
- B. SQL Injection Test
- D. Authorization Test
- account-status.ts
- E. XSS Test
- G. Usability Testing — **TO DO (manual)**
- customer-profile.ts
- removeCartItem
- H. Test Evidence / Screenshots — **TO DO (manual)**
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- Graphify Rules
- Graphify Workflow
- I. Bug / Issue Log
- address-label.test.ts

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 167 edges
2. `next` - 117 edges
3. `cn()` - 109 edges
4. `vitest` - 94 edges
5. `react` - 87 edges
6. `useToast()` - 65 edges
7. `Button` - 57 edges
8. `resolveEmployeeRole()` - 39 edges
9. `submitCart()` - 33 edges
10. `lucide-react` - 32 edges

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

## Communities (146 total, 17 thin omitted)

### Community 0 - "delivery-addresses-card.tsx"
Cohesion: 0.20
Nodes (19): ADDRESS_FIELD_LABELS, AddressFields(), EmployeePersonalDetailsCard(), ADDRESS_FORM_LABELS, DialogState, PasswordFields(), PersonalDetailsCard(), CardField() (+11 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (33): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+25 more)

### Community 2 - "actions.ts"
Cohesion: 0.11
Nodes (22): ActionResult, EmployeeLoginResult, RegisterResult, resetPassword(), ManageLayout(), ManageShell(), createSession(), decrypt() (+14 more)

### Community 3 - "Database Cleanse Script"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.19
Nodes (24): ManageMenuInner(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory(), createProduct() (+16 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.11
Nodes (10): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference(), saveCollapsedPreference(), Sidebar() (+2 more)

### Community 6 - "actions/audit.ts"
Cohesion: 0.07
Nodes (44): GET, errorToStatus(), getAuditLog(), ManageAuditLogInner(), ManageAuditLogPage(), AuditLogModal(), AuditLogModalProps, formatAuditTime() (+36 more)

### Community 7 - "useToast"
Cohesion: 0.09
Nodes (23): revalidate, EmployeeContactDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES, SHIFTS (+15 more)

### Community 8 - "customer-orders.ts"
Cohesion: 0.15
Nodes (15): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+7 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.11
Nodes (23): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+15 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.07
Nodes (50): POST(), PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET (+42 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.10
Nodes (32): TrackOrderScreen(), ABANDONED_PAYMENT_REASON, cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES, Fulfilment, fulfilmentOf(), furtherAlong() (+24 more)

### Community 12 - "Root Layout and Errors"
Cohesion: 0.25
Nodes (4): app_globals, anton, dmSans, metadata

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "database.types.ts"
Cohesion: 0.08
Nodes (31): DELETE, GET, PUT, GET, POST, DELETE, GET, PUT (+23 more)

### Community 15 - "Reports API Routes"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.21
Nodes (18): PastOrderCard(), isPickupOrder(), canRate(), formatPlacedAt(), formatTotal(), isPast(), isPickup(), isUnpaid() (+10 more)

### Community 17 - "roles.ts"
Cohesion: 0.09
Nodes (39): Authentication Bypass, S4: Disabled account lockout (🟠 High), ManageEmployeeInner(), ProfilePage(), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", auditChanges(), getAllEmployees() (+31 more)

### Community 18 - "audit-log/page.tsx"
Cohesion: 0.17
Nodes (13): CATEGORY_OPTIONS, DEFAULT_SORT, Option, EmployeeData, ROLES, getVisiblePages(), ManagePagination(), ManagePaginationProps (+5 more)

### Community 19 - "package.json"
Cohesion: 0.08
Nodes (25): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+17 more)

### Community 20 - "dashboard-content.tsx"
Cohesion: 0.07
Nodes (38): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, components_manage_dashboard_refunds_panel, components_manage_dashboard_refunds_panel_refundspanel (+30 more)

### Community 21 - "Menu Validation Schemas"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "actions/admin.ts"
Cohesion: 0.05
Nodes (73): ActionResult, Customer, Employee, EmployeeEditInput, EmployeeRole, ChangePasswordInput, changePasswordSchema, ChangeRoleInput (+65 more)

### Community 23 - "order-number.ts"
Cohesion: 0.27
Nodes (9): first(), notifyOrderCancelled(), EmailMessage, sendEmail(), SendEmailResult, normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch() (+1 more)

### Community 24 - "order-placed-screen.tsx"
Cohesion: 0.18
Nodes (13): OrderPlacedScreen(), formatSummaryMoney(), OrderSummaryDiscount, OrderSummaryRows(), PlacedOrder, CartTotals, formatPesoCentavos(), isUnpaidStatus() (+5 more)

### Community 25 - "employee-login-form.tsx"
Cohesion: 0.14
Nodes (11): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm(), AddressFieldName, Values, FormErrorSummary(), Alert(), Field() (+3 more)

### Community 26 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "employee-modal.tsx"
Cohesion: 0.11
Nodes (23): FilterDropdown(), employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+15 more)

### Community 28 - "react"
Cohesion: 0.15
Nodes (14): Window, SCORE_WORDS, Button, BUTTON_BASE, buttonVariants, Checkbox, Dialog(), DialogRequestCloseContext (+6 more)

### Community 29 - "checkout-screen.tsx"
Cohesion: 0.20
Nodes (13): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PaymentMethod (+5 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.13
Nodes (17): ProfilePage(), revalidate, MobileMenuHeader(), ResolvedMobileProfile(), ResolvedProfileActions(), DeliveryAddressesCard(), ProfileAvatarCard(), ProfileHeader() (+9 more)

### Community 32 - "menu-page-body.tsx"
Cohesion: 0.22
Nodes (11): CheckoutPage(), MenuPage(), MenuPageBody(), F1. Landing page for marketing — ❌, getCategories(), getProducts(), readCart(), findAwaitingPaymentOrder() (+3 more)

### Community 33 - "manage/menu/page.tsx"
Cohesion: 0.12
Nodes (19): MenuGrid(), MenuGridProps, MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModalProps (+11 more)

### Community 34 - "engine.ts"
Cohesion: 0.15
Nodes (21): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+13 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "senior-pwd-discount.test.tsx"
Cohesion: 0.08
Nodes (40): Code Consistency, Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing (+32 more)

### Community 37 - "cart/page.tsx"
Cohesion: 0.26
Nodes (8): CartPage(), CartContents(), CartEmptyState(), DesktopCartRail(), cartItemCount(), CartLine, lines, refresh

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.18
Nodes (14): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+6 more)

### Community 40 - "brand-panel.tsx"
Cohesion: 0.20
Nodes (4): AuthShell(), BrandPanel(), ResetPasswordForm(), ErrorScreen()

### Community 41 - "phone-input.tsx"
Cohesion: 0.54
Nodes (6): PhoneInput(), handleChange(), handlePaste(), maskPhoneDigits(), PH_MOBILE_MASKED_LENGTH, phoneDigitsOf()

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "The 12 questions"
Cohesion: 0.09
Nodes (22): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September." (+14 more)

### Community 45 - "site-info.ts"
Cohesion: 0.12
Nodes (21): metadata, PrivacyPage(), metadata, TermsPage(), FOOTER_LINKS, SiteFooter(), LegalPage(), LegalSection() (+13 more)

### Community 47 - "order-issues.ts"
Cohesion: 0.14
Nodes (21): OpenIssuesPanel(), resolve(), ActionResult, first(), getOpenOrderIssues(), OpenOrderIssue, reportOrderIssue(), requireStaff() (+13 more)

### Community 48 - "notification-bell.tsx"
Cohesion: 0.25
Nodes (12): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+4 more)

### Community 49 - "site-nav-bar.tsx"
Cohesion: 0.17
Nodes (12): logout(), LogOutControl(), handleLogOut(), handleLogout(), NAV_LINKS, NavSection, SiteNavBar(), CustomerProfile (+4 more)

### Community 50 - "actions/orders.ts"
Cohesion: 0.12
Nodes (24): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+16 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.20
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), latestBirthdateForMinAge() (+7 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.20
Nodes (14): isValidTransition(), ORDER_STATUSES, OrderFilters, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES (+6 more)

### Community 53 - "item-detail-modal.tsx"
Cohesion: 0.19
Nodes (15): CartLineRow(), CartTotalsSummary(), AddOnsSection(), CartLineEdit, ItemSummary(), QuantityInput(), handleChange(), QuantityStepper() (+7 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.10
Nodes (21): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+13 more)

### Community 55 - "track-order-screen.tsx"
Cohesion: 0.13
Nodes (18): OrderDetailPage(), OrderRatingDisplay(), ReportProblem(), subscribe(), lib_hooks_use_now, lib_hooks_use_now_usenow, ARRIVAL_UNKNOWN, arrivalLineFor() (+10 more)

### Community 56 - "forgot-password-form.tsx"
Cohesion: 0.27
Nodes (8): requestPasswordReset(), LoginFormInner(), EmployeeLoginFormInner(), ForgotPasswordForm(), AddressFormDialog(), useLiveValidation(), useSubmitShortcut(), Harness()

### Community 57 - "Maintenance & Webhook Scripts"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "use-shortcut.ts"
Cohesion: 0.24
Nodes (13): SearchField(), ButtonProps, ShortcutsHelp(), Kbd(), Tooltip(), formatCombo(), isMac(), isTypingTarget() (+5 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.09
Nodes (19): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ResolvedBottomTabBar(), CartRead (+11 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.13
Nodes (20): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), TOO_LARGE (+12 more)

### Community 61 - "reports-charts.tsx"
Cohesion: 0.13
Nodes (22): getDefaultStartDate(), getToday(), ReportsContent(), ReportDateFilters(), ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso() (+14 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "eta.ts"
Cohesion: 0.18
Nodes (12): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, SESSION_COOKIE_NAME, Coordinates, EtaResult (+4 more)

### Community 64 - "next"
Cohesion: 0.13
Nodes (15): GET(), AuthTabs(), Tab(), CustomerLoginForm(), CustomerSignupForm(), FIELD_LABELS, readSignupForm(), SignupFormInner() (+7 more)

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "routers/employee-profile.ts"
Cohesion: 0.25
Nodes (11): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+3 more)

### Community 67 - "Notifications API"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "payment-status-card.tsx"
Cohesion: 0.16
Nodes (16): uploadMenuImage(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, submit(), foldPaymentStatus(), PaymentStatus (+8 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.15
Nodes (13): A. Input Validation Test, Application-level checks after the migration, C. Authentication Test, End-to-end checks against the live API, F. Functional Testing, How this report was produced, and what it does not cover, Issue found and fixed — HIGH, J. Actions required before this is production-ready (+5 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "Report Date Grouping"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "order-summary-card.tsx"
Cohesion: 0.18
Nodes (18): formatSummaryMoney(), OrderSummaryCard(), handlePlaceOrder(), SeniorPwdDiscountPicker(), SeniorPwdDiscountState, orderTypeFor(), isOnlinePaymentConfigured(), openWalletTab() (+10 more)

### Community 73 - "updateCartItem"
Cohesion: 0.22
Nodes (11): ItemDetailModal(), handleAddToCart(), handleSaveEdit(), primaryAction(), addCartItem(), addOnProblem(), cartQuantityTotal(), replaceLineAddOns() (+3 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "requireCustomer"
Cohesion: 0.24
Nodes (10): DELETE(), POST(), DELETE(), GET(), SwitchToCodButton(), handleSwitch(), clearCart(), getActiveCart() (+2 more)

### Community 79 - "actions/employee-profile.ts"
Cohesion: 0.15
Nodes (20): deleteCustomer(), deleteEmployee(), setEmployeePhoto(), ActionResult, deleteMyEmployeeAccount(), describeProfileUpdateError(), uploadProfileImage(), EmployeeActionEntry (+12 more)

### Community 80 - "map-staff-order.ts"
Cohesion: 0.18
Nodes (13): isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow, row() (+5 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "avatar-button.tsx"
Cohesion: 0.26
Nodes (8): EmployeeAvatarCard(), ReportProblemDialog(), pickPhoto(), AvatarButton(), Avatar(), compressImage(), ALLOWED_IMAGE_TYPES, orderIssuePhotoProblem()

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

### Community 95 - "cart-totals.ts"
Cohesion: 0.36
Nodes (9): calculateDeliveryFee(), computeCartTotals(), lineTotal(), SENIOR_PWD_DISCOUNT_PERCENT, seniorPwdBreakdown(), toCentavos(), toPesos(), VAT_PERCENT (+1 more)

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

### Community 101 - "order-again-row.tsx"
Cohesion: 0.15
Nodes (14): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+6 more)

### Community 102 - "New Customer Persona"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Senior Customer Persona"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "order-timeline.tsx"
Cohesion: 0.25
Nodes (8): OrderTimeline(), StageMarker(), stageMeta(), STATE_LABELS, formatClockTime(), formatOrderTime(), StageState, TimelineStage

### Community 105 - "cn"
Cohesion: 0.20
Nodes (11): CustomerModal(), CustomerModalProps, dbStatusForTab(), ORDER_TABS, OrderSidebar(), OrderSidebarProps, OrderStatus, ProductCard() (+3 more)

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
Cohesion: 0.13
Nodes (25): NOT_OFFICIAL_RECEIPT, OrderReceipt(), RECEIPT_PRINT_ROOT_ID, ReceiptBody(), ReceiptOrder, PAYMENT_METHODS, fulfilmentFromOrderType(), productNameOf() (+17 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.22
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 111 - "store-hours.ts"
Cohesion: 0.38
Nodes (8): closesAfterOpening(), DEFAULT_STORE_HOURS, formatTime(), isRestaurantOpen(), isValidTime(), manilaMinutes(), minutesOfDay(), StoreHours

### Community 112 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 114 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

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

### Community 119 - "injection.test.ts"
Cohesion: 0.10
Nodes (14): escapeLikePattern(), ref_node_fs, ref_node_path, FILES, walk(), fixes, raw, sql (+6 more)

### Community 120 - "checkout-screen.test.tsx"
Cohesion: 0.20
Nodes (5): lines, profile, push, refresh, replace

### Community 121 - "cart-totals-summary.tsx"
Cohesion: 0.25
Nodes (6): lib_cart_limits, lib_cart_limits_big_order_message, lib_cart_limits_isoverordercap, lib_hooks_use_store_status, lib_hooks_use_store_status_usestorestatus, lib_store_store_status_storeblockfor

### Community 122 - "Copy glossary"
Cohesion: 0.25
Nodes (7): Capitalisation, Copy glossary, Money (#116), Order numbers, Order stages, Spelling and wording, Store hours

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (19): Audit log, Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure (+11 more)

### Community 126 - "read-past-orders.ts"
Cohesion: 0.36
Nodes (4): lib_checkout_expire_abandoned_orders, lib_checkout_expire_abandoned_orders_expireabandonedorders, lib_checkout_expire_abandoned_orders_payment_window_ms, UNPAID_ORDER_STATUSES

### Community 127 - "read-recent-orders.ts"
Cohesion: 0.35
Nodes (7): GET(), ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice(), totalOf(), readRecentCompletedOrders(), RECENT_ORDERS_LIMIT

### Community 128 - "formatMobileNumber"
Cohesion: 0.43
Nodes (5): ManageCustomersInner(), loadCustomers(), ContactDetailsCard(), getAllCustomers(), formatMobileNumber()

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 132 - "paymongo"
Cohesion: 0.29
Nodes (7): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo()

### Community 133 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 134 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 135 - "account-status.ts"
Cohesion: 0.38
Nodes (5): ACCOUNT_DISABLED_CODE, ACCOUNT_DISABLED_LOGIN_ERROR, ACCOUNT_DISABLED_MESSAGE, EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, ActionResult

### Community 136 - "E. XSS Test"
Cohesion: 0.50
Nodes (4): E. XSS Test, How the application was verified, Payloads used, Results

### Community 137 - "G. Usability Testing — **TO DO (manual)**"
Cohesion: 0.50
Nodes (4): Feedback form (one per tester), G. Usability Testing — **TO DO (manual)**, Summary table to complete, Tasks to set each tester

### Community 138 - "customer-profile.ts"
Cohesion: 0.23
Nodes (11): OrdersPage(), PastOrdersScreen(), ADDRESS_COLUMNS, addressPartsFromRow(), AddressPartsInput, AddressRow, formatAddress(), productNameOf() (+3 more)

### Community 139 - "removeCartItem"
Cohesion: 0.50
Nodes (4): DELETE(), PATCH(), RouteParams, removeCartItem()

### Community 140 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 141 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 144 - "I. Bug / Issue Log"
Cohesion: 0.67
Nodes (3): Functional issues found earlier in the QA pass, I. Bug / Issue Log, Security issues found by this phase's testing

## Knowledge Gaps
- **804 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `getAuditLog` (+799 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1018 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `delivery-addresses-card.tsx`, `auth.ts`, `actions.ts`, `createClient`, `sidebar.tsx`, `actions/audit.ts`, `useToast`, `customer-orders.ts`, `routers/admin.ts`, `customer-profile.ts`, `removeCartItem`, `actions/profile.ts`, `Root Layout and Errors`, `database.types.ts`, `Reports API Routes`, `past-order.ts`, `roles.ts`, `package.json`, `dashboard-content.tsx`, `order-placed-screen.tsx`, `employee-login-form.tsx`, `employee-modal.tsx`, `react`, `checkout-screen.tsx`, `(account)/profile/page.tsx`, `menu-page-body.tsx`, `senior-pwd-discount.test.tsx`, `cart/page.tsx`, `routers/addons.ts`, `transactions.ts`, `brand-panel.tsx`, `account-status.ts`, `site-info.ts`, `order-issues.ts`, `notification-bell.tsx`, `site-nav-bar.tsx`, `actions/orders.ts`, `item-detail-modal.tsx`, `track-order-screen.tsx`, `forgot-password-form.tsx`, `actions/cart.ts`, `reports-charts.tsx`, `confirmation/page.tsx`, `eta.ts`, `routers/employee-profile.ts`, `Notifications API`, `payment-status-card.tsx`, `submitCart`, `order-summary-card.tsx`, `updateCartItem`, `Placeholder Manage Pages`, `requireCustomer`, `avatar-button.tsx`, `order-again-row.tsx`, `cn`, `menu-actions.test.ts`, `bottom-tab-bar.tsx`, `cart-totals-summary.tsx`, `read-recent-orders.ts`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `formatMobileNumber`, `auth.ts`, `actions.ts`, `actions/audit.ts`, `customer-orders.ts`, `routers/admin.ts`, `actions/profile.ts`, `removeCartItem`, `customer-profile.ts`, `actions/reports.ts`, `database.types.ts`, `Reports API Routes`, `roles.ts`, `dashboard-content.tsx`, `actions/admin.ts`, `order-number.ts`, `menu-page-body.tsx`, `senior-pwd-discount.test.tsx`, `routers/addons.ts`, `transactions.ts`, `order-issues.ts`, `site-nav-bar.tsx`, `actions/orders.ts`, `track-order-screen.tsx`, `forgot-password-form.tsx`, `menu-screen.tsx`, `actions/cart.ts`, `reports-charts.tsx`, `eta.ts`, `next`, `routers/employee-profile.ts`, `Notifications API`, `submitCart`, `updateCartItem`, `requireCustomer`, `actions/employee-profile.ts`, `order-again-row.tsx`, `order-receipt.tsx`, `read-past-orders.ts`, `read-recent-orders.ts`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `vitest` connect `next` to `formatMobileNumber`, `auth.ts`, `actions.ts`, `Vitest Configuration`, `actions/audit.ts`, `useToast`, `customer-orders.ts`, `order-stage.ts`, `actions/reports.ts`, `past-order.ts`, `roles.ts`, `address-label.test.ts`, `package.json`, `dashboard-content.tsx`, `Menu Validation Schemas`, `actions/admin.ts`, `order-number.ts`, `order-placed-screen.tsx`, `employee-modal.tsx`, `(account)/profile/page.tsx`, `menu-page-body.tsx`, `manage/menu/page.tsx`, `engine.ts`, `senior-pwd-discount.test.tsx`, `cart/page.tsx`, `phone-input.tsx`, `site-info.ts`, `delete-confirmation.test.ts`, `order-issues.ts`, `notification-bell.tsx`, `site-nav-bar.tsx`, `date-of-birth.ts`, `validation/orders.ts`, `item-detail-modal.tsx`, `track-order-screen.tsx`, `menu-screen.tsx`, `actions/cart.ts`, `confirmation/page.tsx`, `eta.ts`, `payment-status-card.tsx`, `Report Date Grouping`, `order-summary-card.tsx`, `updateCartItem`, `actions/employee-profile.ts`, `map-staff-order.ts`, `cart-totals.ts`, `Password Strength Meter`, `order-timeline.tsx`, `cancel-order-control.test.tsx`, `order-receipt.tsx`, `store-hours.ts`, `menu-actions.test.ts`, `track-order-screen.test.tsx`, `injection.test.ts`, `checkout-screen.test.tsx`, `read-past-orders.ts`, `read-recent-orders.ts`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _804 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11182795698924732 - nodes in this community are weakly interconnected._
- **Should `Database Cleanse Script` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._