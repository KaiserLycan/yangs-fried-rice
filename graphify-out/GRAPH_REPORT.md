# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 472 files · ~587,009 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2397 nodes · 6294 edges · 125 communities (109 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d22f44c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- toast.tsx
- actions.ts
- MenuItem
- db-cleanse.mjs
- actions/menu.ts
- sidebar.tsx
- audit-log/page.tsx
- checkout-screen.tsx
- customer-portal-access.test.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- next
- actions/reports.ts
- products.ts
- routers/reports.ts
- past-order.ts
- roles.ts
- customers/page.tsx
- package.json
- reports-charts.tsx
- validation/menu.ts
- customer-orders.ts
- routers/employee-profile.ts
- fields.ts
- react
- Review Checklist
- The 12 questions
- requireApiEmployee
- order-summary-card.tsx
- devDependencies
- customer-profile.ts
- checkout/page.tsx
- cn
- engine.ts
- compilerOptions
- kds/page.tsx
- validate-ncr.ts
- routers/addons.ts
- transactions.ts
- menu-actions.test.ts
- phone.ts
- Details
- dependencies
- bottom-tab-bar.tsx
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- order-rating.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- validation/profile.ts
- P2 — if time allows
- reports-summary.tsx
- database.types.ts
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- actions/cart.ts
- ToastProvider
- wallet-tab.ts
- manage/orders/page.tsx
- eta.ts
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
- Limitations — gaps we can close in 1.5 days
- actions/admin.ts
- vitest
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- phone-input.tsx
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- Review Checklist
- Review Checklist
- Review Checklist
- paymongo
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- delete-confirmation.test.ts
- Review Checklist
- Review Checklist
- User simulation — 17 personas + hard questions through the UI
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- cancel-order-control.test.tsx
- createClient
- user-simulation.md
- rewrite_docs.py
- Review Checklist
- Unimplemented Issues and Tasks
- Review Checklist
- Issue #106 — follow-up issues to file
- cart-line-row.tsx
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- input-validation.test.ts
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
- `E. Site-wide UX polish` --references--> `useShortcut()`  [INFERRED]
  docs/issue-106-followups.md → lib/hooks/use-shortcut.ts
- `F7. Stepper: type the quantity — ❌` --references--> `clampQuantity()`  [INFERRED]
  docs/feedback-verification.md → lib/menu/quantity.ts
- `B. Cart and checkout correctness` --references--> `clampQuantity()`  [INFERRED]
  docs/issue-106-followups.md → lib/menu/quantity.ts
- `20. No "Order again" row on the menu` --references--> `reorderPastOrder()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts
- `9. Newly hired staff — "Jun, kitchen and counter"` --references--> `homePathForRole()`  [INFERRED]
  docs/user-simulation.md → lib/auth/roles.ts

## Import Cycles
- None detected.

## Communities (125 total, 16 thin omitted)

### Community 0 - "toast.tsx"
Cohesion: 0.13
Nodes (32): revalidate, EmployeeAvatarCard(), EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap (+24 more)

### Community 1 - "actions.ts"
Cohesion: 0.09
Nodes (36): POST, POST, POST, POST, changeOwnPassword(), customerLogin(), employeeLogin(), employeeLogout() (+28 more)

### Community 2 - "MenuItem"
Cohesion: 0.24
Nodes (10): Code Consistency, MenuGrid(), MenuGridProps, MenuItemDetailModalProps, MenuItemModalProps, MenuItem, 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs (+2 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "actions/menu.ts"
Cohesion: 0.21
Nodes (19): ManageMenuInner(), uploadMenuImage(), ActionResult, Category, createAddOn(), createCategory(), createProduct(), deleteAddOn() (+11 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.10
Nodes (8): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar(), handleLogout(), loadSidebarEmployee()

### Community 6 - "audit-log/page.tsx"
Cohesion: 0.07
Nodes (50): GET, errorToStatus(), getAuditLog(), CATEGORY_OPTIONS, DEFAULT_SORT, FilterDropdown(), ManageAuditLogInner(), ManageAuditLogPage() (+42 more)

### Community 7 - "checkout-screen.tsx"
Cohesion: 0.13
Nodes (18): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+10 more)

### Community 8 - "customer-portal-access.test.ts"
Cohesion: 0.10
Nodes (15): ref_node_fs, fixes, raw, sql, checkLoginAllowed, credentials, deleteSession, maybeSingle (+7 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (25): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+17 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.14
Nodes (18): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+10 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.11
Nodes (28): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+20 more)

### Community 12 - "next"
Cohesion: 0.15
Nodes (7): Window, CustomerLoginForm(), CustomerSignupForm(), next, @testing-library/react, OPTIONS, RolePicker()

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "products.ts"
Cohesion: 0.18
Nodes (12): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+4 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.11
Nodes (31): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+23 more)

### Community 17 - "roles.ts"
Cohesion: 0.15
Nodes (22): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+14 more)

### Community 18 - "customers/page.tsx"
Cohesion: 0.18
Nodes (8): CustomerModal(), CustomerModalProps, MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, SortableHeader(), SortableHeaderProps, lucide-react

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
Cohesion: 0.13
Nodes (18): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+10 more)

### Community 23 - "routers/employee-profile.ts"
Cohesion: 0.15
Nodes (21): Authentication Bypass, S4: Disabled account lockout (🟠 High), PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount() (+13 more)

### Community 24 - "fields.ts"
Cohesion: 0.12
Nodes (20): formatAddress(), AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema, emailSchema (+12 more)

### Community 25 - "react"
Cohesion: 0.08
Nodes (48): AuthTabs(), Tab(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner() (+40 more)

### Community 26 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "The 12 questions"
Cohesion: 0.13
Nodes (15): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store.", Q5. Manager: "Which dish do people order most between 3 and 6 PM on weekdays?" (+7 more)

### Community 28 - "requireApiEmployee"
Cohesion: 0.17
Nodes (14): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+6 more)

### Community 29 - "order-summary-card.tsx"
Cohesion: 0.13
Nodes (17): CartContents(), CartEmptyState(), CartTotalsSummary(), OrderPlacedScreen(), OrderSummaryRows(), PlacedOrder, calculateDeliveryFee(), CartLine (+9 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "customer-profile.ts"
Cohesion: 0.08
Nodes (32): revalidate, LogOutControl(), ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), AccountActions() (+24 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.10
Nodes (26): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar() (+18 more)

### Community 33 - "cn"
Cohesion: 0.08
Nodes (47): EmployeeData, ROLES, employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES (+39 more)

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

### Community 40 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 41 - "phone.ts"
Cohesion: 0.14
Nodes (20): ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput, createEmployeeSchema, UpdateCustomerInput, updateCustomerSchema (+12 more)

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

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

### Community 49 - "order-rating.tsx"
Cohesion: 0.33
Nodes (4): RateOrderDialog(), SCORE_WORDS, Textarea, TextareaProps

### Community 50 - "routers/orders.ts"
Cohesion: 0.18
Nodes (14): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+6 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.12
Nodes (22): ActionResult, Order, OrderStats, OrderSummary, OrderWithDetails, findAwaitingPaymentOrder(), isValidTransition(), ORDER_STATUSES (+14 more)

### Community 53 - "validation/profile.ts"
Cohesion: 0.07
Nodes (30): dateOfBirthSchema, addressLabelSchema, deliveryNoteSchema, passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField (+22 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "reports-summary.tsx"
Cohesion: 0.20
Nodes (13): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+5 more)

### Community 56 - "database.types.ts"
Cohesion: 0.22
Nodes (8): CompositeTypes, Constants, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables, TablesInsert

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.24
Nodes (11): foldPaymentStatus(), PaymentStatus, fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder() (+3 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (16): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), MobileMenuHeader(), CategoryOption (+8 more)

### Community 60 - "actions/cart.ts"
Cohesion: 0.11
Nodes (27): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), POST() (+19 more)

### Community 61 - "ToastProvider"
Cohesion: 0.09
Nodes (14): app_globals, anton, dmSans, metadata, RateOrderButton(), ToastProvider(), TrackedOrder, refresh (+6 more)

### Community 62 - "wallet-tab.ts"
Cohesion: 0.30
Nodes (8): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WALLET_TAB_PARAM, WalletTab

### Community 63 - "manage/orders/page.tsx"
Cohesion: 0.18
Nodes (11): ManageOrdersInner(), getVisiblePages(), ManagePagination(), ManagePaginationProps, OrderSidebar(), OrderSidebarProps, OrderStatus, statuses (+3 more)

### Community 64 - "eta.ts"
Cohesion: 0.18
Nodes (14): CheckoutConfirmationPage(), OrderDetailPage(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam(), Coordinates (+6 more)

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
Cohesion: 0.11
Nodes (20): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, createPaymentIntent(), isOnlinePaymentConfigured() (+12 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

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
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.25
Nodes (8): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), Found by the "hard questions through the UI" walkthrough, Limitations — gaps we can close in 1.5 days, Panel feedback (verified in [`feedback-verification.md`](feedback-verification.md)), Q3. Owner: "Who are my top 10 customers by spending this month?"

### Community 79 - "actions/admin.ts"
Cohesion: 0.10
Nodes (42): GET, getMe(), ManageEmployeeInner(), ActionResult, auditChanges(), changeEmployeeRole(), changeOwnPassword(), createEmployee() (+34 more)

### Community 80 - "vitest"
Cohesion: 0.18
Nodes (16): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+8 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "phone-input.tsx"
Cohesion: 0.67
Nodes (5): PhoneInput(), handleChange(), handlePaste(), maskPhoneDigits(), phoneDigitsOf()

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

### Community 95 - "paymongo"
Cohesion: 0.29
Nodes (7): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo()

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
Cohesion: 0.16
Nodes (13): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret() (+5 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.14
Nodes (14): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+6 more)

### Community 108 - "cancel-order-control.test.tsx"
Cohesion: 0.17
Nodes (11): CancelOrderControl(), withdrawnMessage(), 🟡 Browsing and Ordering, isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog() (+3 more)

### Community 109 - "createClient"
Cohesion: 0.14
Nodes (34): GET(), POST(), registerCustomer(), requestPasswordReset(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult (+26 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.22
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

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

### Community 119 - "cart-line-row.tsx"
Cohesion: 0.16
Nodes (15): CartLineRow(), AddOnsSection(), ItemDetailModal(), handleAddToCart(), ItemSummary(), ProductCard(), ProductPhotoPlaceholder(), ProductRow() (+7 more)

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
Cohesion: 0.11
Nodes (19): Audit log, Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure (+11 more)

### Community 126 - "input-validation.test.ts"
Cohesion: 0.13
Nodes (14): addCartItemSchema, cancelOrderSchema, submitCartSchema, updateCartItemSchema, ReviewSubmission, reviewSubmissionSchema, signupSchema, VALID (+6 more)

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **782 isolated node(s):** `getAuditLog`, `getAuditActors`, `Option`, `CATEGORY_OPTIONS`, `DEFAULT_SORT` (+777 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `toast.tsx`, `actions.ts`, `actions/menu.ts`, `sidebar.tsx`, `audit-log/page.tsx`, `checkout-screen.tsx`, `routers/admin.ts`, `routers/profile.ts`, `order-stage.ts`, `products.ts`, `routers/reports.ts`, `past-order.ts`, `roles.ts`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `routers/employee-profile.ts`, `react`, `requireApiEmployee`, `order-summary-card.tsx`, `customer-profile.ts`, `checkout/page.tsx`, `cn`, `kds/page.tsx`, `validate-ncr.ts`, `routers/addons.ts`, `transactions.ts`, `menu-actions.test.ts`, `bottom-tab-bar.tsx`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `order-rating.tsx`, `routers/orders.ts`, `actions/cart.ts`, `ToastProvider`, `manage/orders/page.tsx`, `eta.ts`, `employee/login/page.tsx`, `notifications.ts`, `checkout-screen.test.tsx`, `submitCart`, `report-controls.tsx`, `session.ts`, `createClient`?**
  _High betweenness centrality (0.229) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Review Checklist`, `checkout-screen.test.tsx`, `Review Checklist`, `Review Checklist`, `User simulation — 17 personas + hard questions through the UI`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `user-simulation.md`, `createClient`, `past-order.ts`, `next`, `Issue #106 — follow-up issues to file`, `P2 — if time allows`, `Yang's Fried Rice — Ordering System`, `actions/cart.ts`, `order-summary-card.tsx`, `paymongo`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `actions.ts`, `actions/menu.ts`, `audit-log/page.tsx`, `routers/admin.ts`, `actions/reports.ts`, `products.ts`, `routers/reports.ts`, `past-order.ts`, `reports-charts.tsx`, `customer-orders.ts`, `routers/employee-profile.ts`, `requireApiEmployee`, `customer-profile.ts`, `checkout/page.tsx`, `routers/addons.ts`, `transactions.ts`, `routers/orders.ts`, `actions/orders.ts`, `reports-summary.tsx`, `read-placed-order.ts`, `actions/cart.ts`, `manage/orders/page.tsx`, `eta.ts`, `notifications.ts`, `submitCart`, `actions/admin.ts`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **What connects `getAuditLog`, `getAuditActors`, `Option` to the rest of the system?**
  _782 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `toast.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12580943570767808 - nodes in this community are weakly interconnected._
- **Should `actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._