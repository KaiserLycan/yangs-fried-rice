# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 457 files · ~575,381 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2325 nodes · 6051 edges · 133 communities (118 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e9fee881`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- toast.tsx
- auth.ts
- employee-modal.tsx
- db-cleanse.mjs
- createClient
- roles.ts
- resolveEmployeeRole
- reports-summary.tsx
- customer-portal-access.test.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- signup.ts
- actions/reports.ts
- cn
- routers/reports.ts
- past-order.ts
- database.types.ts
- order-rating.tsx
- package.json
- reports-charts.tsx
- products.ts
- customer-orders.ts
- actions/employee-profile.ts
- customer-signup-form.tsx
- actions/cart.ts
- Review Checklist
- customer-profile.ts
- categories.ts
- cart-totals.ts
- devDependencies
- (account)/profile/page.tsx
- checkout/page.tsx
- actions/admin.ts
- engine.ts
- compilerOptions
- manage/orders/page.tsx
- menu-actions.test.ts
- routers/addons.ts
- transactions.ts
- menu-item-detail-modal.tsx
- phone.ts
- Details
- dependencies
- validate-ncr.ts
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- cart-line-row.tsx
- actions/orders.ts
- date-of-birth.ts
- validation/orders.ts
- next
- P2 — if time allows
- validation/profile.ts
- checkout-screen.tsx
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- addCartItem
- employee/login/page.tsx
- confirmation/page.tsx
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- sidebar.tsx
- scripts
- server.ts
- notifications.ts
- order-summary-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- cancel-order-control.tsx
- report-controls.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- validation/menu.ts
- employee/page.tsx
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
- phone-input.tsx
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- Review Checklist
- Review Checklist
- Review Checklist
- login.ts
- account-status.ts
- User simulation — 17 personas + hard questions through the UI
- kds/page.tsx
- The 12 questions
- actions/profile.ts
- user-simulation.md
- paymongo
- injection.test.ts
- rewrite_docs.py
- ToastProvider
- Unimplemented Issues and Tasks
- Review Checklist
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts
- requireCustomer
- senior-pwd-ids.ts
- MenuItem
- order-sidebar.tsx
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- xss.test.tsx
- Issue #106 — follow-up issues to file
- order-number.ts
- Handoff: put dispatched orders in the rider queue
- fields.test.ts
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 142 edges
2. `next` - 105 edges
3. `cn()` - 97 edges
4. `react` - 80 edges
5. `vitest` - 79 edges
6. `useToast()` - 55 edges
7. `resolveEmployeeRole()` - 35 edges
8. `lengthProps()` - 32 edges
9. `submitCart()` - 30 edges
10. `zod` - 28 edges

## Surprising Connections (you probably didn't know these)
- `Database functions (RPC)` --references--> `submitCart()`  [INFERRED]
  README.md → lib/actions/cart.ts
- `Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567."` --references--> `getAllCustomers()`  [INFERRED]
  docs/user-simulation.md → lib/actions/admin.ts
- `Key Files to Check` --references--> `getDetailedOrders()`  [INFERRED]
  .agents/skills/persona-manager/SKILL.md → lib/actions/orders.ts
- `30. Orders page can't filter by date, customer, payment or type (P2, high)` --references--> `getDetailedOrders()`  [INFERRED]
  docs/limitations.md → lib/actions/orders.ts
- `20. No "Order again" row on the menu` --references--> `reorderPastOrder()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (133 total, 15 thin omitted)

### Community 0 - "toast.tsx"
Cohesion: 0.12
Nodes (34): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+26 more)

### Community 1 - "auth.ts"
Cohesion: 0.12
Nodes (25): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+17 more)

### Community 2 - "employee-modal.tsx"
Cohesion: 0.17
Nodes (18): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+10 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.23
Nodes (21): ManageMenuInner(), uploadMenuImage(), ActionResult, Category, createAddOn(), createCategory(), createProduct(), deleteAddOn() (+13 more)

### Community 5 - "roles.ts"
Cohesion: 0.17
Nodes (19): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+11 more)

### Community 6 - "resolveEmployeeRole"
Cohesion: 0.29
Nodes (15): Authentication Bypass, S4: Disabled account lockout (🟠 High), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", changeEmployeeRole(), changeOwnPassword(), getCurrentEmployee(), requireRole() (+7 more)

### Community 7 - "reports-summary.tsx"
Cohesion: 0.18
Nodes (14): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+6 more)

### Community 8 - "customer-portal-access.test.ts"
Cohesion: 0.12
Nodes (12): ref_node_fs, checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut (+4 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.11
Nodes (23): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+15 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.12
Nodes (25): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+17 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.06
Nodes (49): OrderDetailPage(), GET(), GET(), POST(), OrderRatingDisplay(), OrderTimeline(), StageMarker(), STATE_LABELS (+41 more)

### Community 12 - "signup.ts"
Cohesion: 0.14
Nodes (12): dateOfBirthSchema, PH_MOBILE_GROUPS_PATTERN, PHONE_SEPARATORS, customerFirstNameSchema, customerLastNameSchema, customerMobileSchema, DEFAULT_ADDRESS_LABEL, SignupField (+4 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "cn"
Cohesion: 0.08
Nodes (26): Window, AuthTabs(), Tab(), MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, MobileMenuHeader(), ResolvedMobileProfile() (+18 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.12
Nodes (29): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+21 more)

### Community 17 - "database.types.ts"
Cohesion: 0.20
Nodes (9): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, TablesInsert (+1 more)

### Community 18 - "order-rating.tsx"
Cohesion: 0.14
Nodes (14): logout(), LogOutControl(), handleLogOut(), RateOrderDialog(), SCORE_WORDS, AccountActions(), Button(), ButtonProps (+6 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (28): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+20 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.15
Nodes (20): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+12 more)

### Community 21 - "products.ts"
Cohesion: 0.17
Nodes (14): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+6 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.13
Nodes (15): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderButton(), ActionResult, getMyOrderDetail() (+7 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.18
Nodes (18): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+10 more)

### Community 24 - "customer-signup-form.tsx"
Cohesion: 0.11
Nodes (24): registerCustomer(), CustomerSignupForm(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), AddressValidationNote(), AddressValidationStatus (+16 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.23
Nodes (12): ActionResult, ActiveCart, CartItemDetail, AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema, SubmitCartInput (+4 more)

### Community 26 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "customer-profile.ts"
Cohesion: 0.15
Nodes (19): CartPage(), OrdersPage(), ProfilePage(), DesktopCartRail(), ResolvedBottomTabBar(), PastOrdersScreen(), ADDRESS_COLUMNS, addressPartsFromRow() (+11 more)

### Community 28 - "categories.ts"
Cohesion: 0.20
Nodes (11): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+3 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.16
Nodes (12): CartContents(), CartEmptyState(), CartTotalsSummary(), OrderSummaryRows(), calculateDeliveryFee(), CartLine, CartTotals, computeCartTotals() (+4 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.14
Nodes (15): revalidate, CustomerModal(), CustomerModalProps, ResolvedProfileActions(), DeliveryAddressesCard(), ProfileAvatarCard(), ProfileHeader(), ProfileSummaryCard() (+7 more)

### Community 32 - "checkout/page.tsx"
Cohesion: 0.15
Nodes (12): CheckoutPage(), MenuPage(), MenuPageBody(), F1. Landing page for marketing — ❌, getCategories(), getProducts(), fulfilmentFromParam(), OrderType (+4 more)

### Community 33 - "actions/admin.ts"
Cohesion: 0.21
Nodes (14): ActionResult, Customer, Employee, EmployeeEditInput, getEmployeeForEdit(), EmployeeRole, ChangePasswordInput, changePasswordSchema (+6 more)

### Community 34 - "engine.ts"
Cohesion: 0.15
Nodes (21): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+13 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "manage/orders/page.tsx"
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

### Community 40 - "menu-item-detail-modal.tsx"
Cohesion: 0.08
Nodes (34): app_globals, anton, dmSans, metadata, MenuItemDetailModal(), WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps (+26 more)

### Community 41 - "phone.ts"
Cohesion: 0.23
Nodes (11): employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, lastNameSchema, INVALID_MOBILE_MESSAGE, isValidPhMobile(), optionalPhoneSchema (+3 more)

### Community 42 - "Details"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "validate-ncr.ts"
Cohesion: 0.18
Nodes (12): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+4 more)

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "password-strength.ts"
Cohesion: 0.60
Nodes (3): passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 47 - "map-content.tsx"
Cohesion: 0.15
Nodes (12): Code Consistency, DeliveryMap(), MapContent, LiveMapPanel(), DeliveryData, DeliveryItem, DeliveryLocation, MOCK_DELIVERIES (+4 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cart-line-row.tsx"
Cohesion: 0.26
Nodes (7): AddOnsSection(), ItemSummary(), QuantityStepper(), StepButton(), clampQuantity(), MAX_QUANTITY, MIN_QUANTITY

### Community 50 - "actions/orders.ts"
Cohesion: 0.11
Nodes (22): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+14 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "validation/orders.ts"
Cohesion: 0.22
Nodes (13): isValidTransition(), ORDER_STATUSES, orderFilterSchema, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema, REPORT_FREQUENCIES, ReportDateRange (+5 more)

### Community 53 - "next"
Cohesion: 0.07
Nodes (47): ActionResult, EmployeeLoginResult, loginCustomer(), RegisterResult, requestPasswordReset(), resetPassword(), CustomerLoginForm(), LoginFormInner() (+39 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.08
Nodes (24): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+16 more)

### Community 55 - "validation/profile.ts"
Cohesion: 0.15
Nodes (13): addressLabelSchema, deliveryNoteSchema, ContactDetailsField, contactDetailsSchema, ContactDetailsValues, DeliveryAddressField, DeliveryAddressValues, PasswordChangeField (+5 more)

### Community 56 - "checkout-screen.tsx"
Cohesion: 0.18
Nodes (14): CheckoutScreen(), PaymentMethodPicker(), 🟡 Browsing and Ordering, DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT (+6 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.14
Nodes (17): foldPaymentStatus(), PaymentStatus, PlacedOrder, fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three (+9 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (19): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), ProductCard(), ProductPhotoPlaceholder() (+11 more)

### Community 60 - "addCartItem"
Cohesion: 0.24
Nodes (9): DELETE(), POST(), DELETE(), GET(), ItemDetailModal(), handleAddToCart(), addCartItem(), clearCart() (+1 more)

### Community 61 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.24
Nodes (10): CheckoutConfirmationPage(), OrderPlacedScreen(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel() (+2 more)

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 64 - "sidebar.tsx"
Cohesion: 0.11
Nodes (8): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar(), handleLogout(), loadSidebarEmployee()

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "server.ts"
Cohesion: 0.32
Nodes (3): submitProductReview(), findAwaitingPaymentOrder(), UNPAID_ORDER_STATUSES

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.17
Nodes (19): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), WALLET_PROVIDERS (+11 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.tsx"
Cohesion: 0.16
Nodes (15): POST(), RouteParams, CancelOrderControl(), withdrawnMessage(), cancelCustomerOrder(), getCancellationErrorMessage(), useCartAction(), isCancellable() (+7 more)

### Community 73 - "report-controls.tsx"
Cohesion: 0.19
Nodes (14): getDefaultStartDate(), getToday(), ReportsContent(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect(), LEGACY_MENU_SATISFACTION_TYPES (+6 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 79 - "employee/page.tsx"
Cohesion: 0.11
Nodes (28): ManageCustomersInner(), loadCustomers(), EmployeeData, ManageEmployeeInner(), ROLES, CustomerData, getVisiblePages(), ManagePagination() (+20 more)

### Community 80 - "vitest"
Cohesion: 0.21
Nodes (13): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+5 more)

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

### Community 95 - "phone-input.tsx"
Cohesion: 0.54
Nodes (6): PhoneInput(), handleChange(), handlePaste(), maskPhoneDigits(), PH_MOBILE_MASKED_LENGTH, phoneDigitsOf()

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

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "login.ts"
Cohesion: 0.22
Nodes (7): passwordSchema, customerEmailSchema, customerNewPasswordSchema, customerPasswordSchema, LoginField, loginSchema, LoginValues

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

### Community 109 - "actions/profile.ts"
Cohesion: 0.24
Nodes (18): POST(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress(), AddressInput (+10 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.22
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 111 - "paymongo"
Cohesion: 0.29
Nodes (7): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo()

### Community 112 - "injection.test.ts"
Cohesion: 0.31
Nodes (5): escapeLikePattern(), ReviewSubmission, reviewSubmissionSchema, INJECTION_PAYLOADS, sourceFiles()

### Community 114 - "ToastProvider"
Cohesion: 0.10
Nodes (15): SiteNavBar(), ToastProvider(), CustomerProfile, @testing-library/react, lines, refresh, lines, profile (+7 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 119 - "requireCustomer"
Cohesion: 0.27
Nodes (10): DELETE(), PATCH(), RouteParams, CartLineRow(), SwitchToCodButton(), handleSwitch(), removeCartItem(), requireCustomer() (+2 more)

### Community 120 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 121 - "MenuItem"
Cohesion: 0.40
Nodes (5): MenuGrid(), MenuGridProps, MenuItemDetailModalProps, MenuItemModalProps, MenuItem

### Community 122 - "order-sidebar.tsx"
Cohesion: 0.33
Nodes (5): OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (18): Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure, Local development setup (+10 more)

### Community 126 - "xss.test.tsx"
Cohesion: 0.33
Nodes (3): ref_node_path, sourceFiles(), XSS_PAYLOADS

### Community 127 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 128 - "order-number.ts"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 130 - "fields.test.ts"
Cohesion: 0.40
Nodes (4): addressPartsSchema, firstNameSchema, migration, zipSchema

## Knowledge Gaps
- **762 isolated node(s):** `User roles`, `Tech stack`, `External services`, `Business rules`, `Triggers` (+757 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 946 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `toast.tsx`, `auth.ts`, `employee-modal.tsx`, `createClient`, `roles.ts`, `routers/admin.ts`, `routers/profile.ts`, `order-stage.ts`, `cn`, `routers/reports.ts`, `past-order.ts`, `order-rating.tsx`, `package.json`, `reports-charts.tsx`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `customer-profile.ts`, `categories.ts`, `cart-totals.ts`, `(account)/profile/page.tsx`, `checkout/page.tsx`, `manage/orders/page.tsx`, `menu-actions.test.ts`, `routers/addons.ts`, `transactions.ts`, `menu-item-detail-modal.tsx`, `validate-ncr.ts`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `actions/orders.ts`, `checkout-screen.tsx`, `addCartItem`, `employee/login/page.tsx`, `confirmation/page.tsx`, `sidebar.tsx`, `server.ts`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `cancel-order-control.tsx`, `report-controls.tsx`, `session.ts`, `account-status.ts`, `kds/page.tsx`, `actions/profile.ts`, `requireCustomer`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `employee-modal.tsx`, `resolveEmployeeRole`, `reports-summary.tsx`, `routers/admin.ts`, `routers/profile.ts`, `order-stage.ts`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `order-rating.tsx`, `reports-charts.tsx`, `products.ts`, `customer-orders.ts`, `actions/employee-profile.ts`, `customer-signup-form.tsx`, `actions/cart.ts`, `customer-profile.ts`, `categories.ts`, `checkout/page.tsx`, `actions/admin.ts`, `routers/addons.ts`, `transactions.ts`, `actions/orders.ts`, `next`, `read-placed-order.ts`, `addCartItem`, `server.ts`, `notifications.ts`, `submitCart`, `cancel-order-control.tsx`, `employee/page.tsx`, `kds/page.tsx`, `actions/profile.ts`, `requireCustomer`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `createClient`, `past-order.ts`, `actions/cart.ts`, `next`, `P2 — if time allows`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`, `order-summary-card.tsx`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `Review Checklist`, `Review Checklist`, `Review Checklist`, `User simulation — 17 personas + hard questions through the UI`, `user-simulation.md`, `paymongo`, `ToastProvider`, `requireCustomer`, `Yang's Fried Rice — Ordering System`, `Issue #106 — follow-up issues to file`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `User roles`, `Tech stack`, `External services` to the rest of the system?**
  _762 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `toast.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11607843137254902 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._