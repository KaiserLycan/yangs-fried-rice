# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 457 files · ~575,044 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2323 nodes · 6048 edges · 131 communities (115 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a499d210`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- toast.tsx
- auth.ts
- employee-modal.tsx
- db-cleanse.mjs
- createClient
- roles.ts
- requireManageAccess
- use-shortcut.ts
- actions.ts
- routers/admin.ts
- routers/profile.ts
- order-stage.ts
- reorderPastOrder
- actions/reports.ts
- lucide-react
- routers/reports.ts
- past-order.ts
- actions/employee-profile.ts
- cn
- package.json
- dashboard.ts
- database.types.ts
- customer-orders.ts
- routers/employee-profile.ts
- delivery-addresses-card.tsx
- actions/cart.ts
- paymongo
- menu-page-body.tsx
- requireApiEmployee
- cart-totals.ts
- devDependencies
- (account)/profile/page.tsx
- eta.ts
- actions/admin.ts
- engine.ts
- compilerOptions
- OrderData
- menu-actions.test.ts
- routers/addons.ts
- transactions.ts
- menu-item-detail-modal.tsx
- track-order-screen.test.tsx
- Details
- dependencies
- validate-ncr.ts
- brand-panel.tsx
- password-strength.ts
- map-content.tsx
- site-footer.tsx
- cart-line-row.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- next
- P2 — if time allows
- fields.ts
- checkout-screen.tsx
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- requireCustomer
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
- reports-charts.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- actions/menu.ts
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
- phone.ts
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- Review Checklist
- Review Checklist
- Review Checklist
- report-controls.tsx
- react
- User simulation — 17 personas + hard questions through the UI
- kds/page.tsx
- The 12 questions
- actions/profile.ts
- Limitations — gaps we can close in 1.5 days
- xss.test.tsx
- rewrite_docs.py
- ToastProvider
- Unimplemented Issues and Tasks
- Review Checklist
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts
- switchOrderToCashOnDelivery
- senior-pwd-ids.ts
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- Issue #106 — follow-up issues to file
- Handoff: put dispatched orders in the rider queue
- H. Test Evidence / Screenshots — **TO DO (manual)**
- D. Authorization Test
- E. XSS Test
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
- `B. Cart and checkout correctness` --references--> `clampQuantity()`  [INFERRED]
  docs/issue-106-followups.md → lib/menu/quantity.ts
- `E. Site-wide UX polish` --references--> `useShortcut()`  [INFERRED]
  docs/issue-106-followups.md → lib/hooks/use-shortcut.ts
- `F. Image handling` --references--> `compressImage()`  [INFERRED]
  docs/issue-106-followups.md → lib/image/compress.ts
- `H. Security and architecture` --references--> `submitCart()`  [INFERRED]
  docs/issue-106-followups.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (131 total, 16 thin omitted)

### Community 0 - "toast.tsx"
Cohesion: 0.13
Nodes (31): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+23 more)

### Community 1 - "auth.ts"
Cohesion: 0.09
Nodes (33): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+25 more)

### Community 2 - "employee-modal.tsx"
Cohesion: 0.21
Nodes (15): employeeFormSchema(), EmployeeModal(), FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields(), snapshotOf() (+7 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.20
Nodes (20): ManageMenuInner(), uploadMenuImage(), MenuGrid(), changeOwnPassword(), getCurrentEmployee(), createAddOn(), createCategory(), createProduct() (+12 more)

### Community 5 - "roles.ts"
Cohesion: 0.17
Nodes (20): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+12 more)

### Community 6 - "requireManageAccess"
Cohesion: 0.57
Nodes (7): Authentication Bypass, S4: Disabled account lockout (🟠 High), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", requireEmployee(), requireManageAccess(), requireReportAccess()

### Community 7 - "use-shortcut.ts"
Cohesion: 0.16
Nodes (17): app_globals, anton, dmSans, metadata, SearchField(), ShortcutsHelp(), STAFF_AREAS, Kbd() (+9 more)

### Community 8 - "actions.ts"
Cohesion: 0.14
Nodes (16): ActionResult, EmployeeLoginResult, RegisterResult, resetPassword(), lib_address_validate_ncr_addressforgeocoding, deleteSession(), EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField (+8 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (32): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+24 more)

### Community 10 - "routers/profile.ts"
Cohesion: 0.12
Nodes (22): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+14 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.09
Nodes (33): OrderDetailPage(), OrderRatingDisplay(), OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), ARRIVAL_UNKNOWN, arrivalLineFor() (+25 more)

### Community 12 - "reorderPastOrder"
Cohesion: 0.18
Nodes (11): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+3 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.11
Nodes (31): ReportDateFilters(), ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), fetchDailyTransactionData() (+23 more)

### Community 14 - "lucide-react"
Cohesion: 0.25
Nodes (4): BottomTab, BottomTabBar(), TABS, lucide-react

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.21
Nodes (18): PastOrderCard(), canRate(), formatPlacedAt(), formatTotal(), isPast(), isPickup(), isUnpaid(), MAX_RATING (+10 more)

### Community 17 - "actions/employee-profile.ts"
Cohesion: 0.21
Nodes (13): getEmployeeForEdit(), ActionResult, deleteMyEmployeeAccount(), removeStoredImage(), removeStoredImages(), EXTENSION_BY_TYPE, IMAGE_BUCKETS, ImageBucket (+5 more)

### Community 18 - "cn"
Cohesion: 0.09
Nodes (24): CustomerModal(), CustomerModalProps, getVisiblePages(), ManagePagination(), ManagePaginationProps, MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a… (+16 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (29): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+21 more)

### Community 20 - "dashboard.ts"
Cohesion: 0.14
Nodes (21): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+13 more)

### Community 21 - "database.types.ts"
Cohesion: 0.11
Nodes (20): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+12 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.11
Nodes (18): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderDialog(), ActionResult, getMyOrderDetail() (+10 more)

### Community 23 - "routers/employee-profile.ts"
Cohesion: 0.21
Nodes (13): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+5 more)

### Community 24 - "delivery-addresses-card.tsx"
Cohesion: 0.12
Nodes (20): AddressValidationNote(), AddressValidationStatus, noteFor(), ValidateResponse, ValidationState, DeliveryDetailsCard(), handleFormChange(), FORM_LABELS (+12 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.17
Nodes (16): POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage(), AddCartItemInput (+8 more)

### Community 26 - "paymongo"
Cohesion: 0.13
Nodes (15): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+7 more)

### Community 27 - "menu-page-body.tsx"
Cohesion: 0.13
Nodes (19): CartPage(), OrdersPage(), MenuPage(), DesktopCartRail(), MenuPageBody(), ResolvedBottomTabBar(), PastOrdersScreen(), F1. Landing page for marketing — ❌ (+11 more)

### Community 28 - "requireApiEmployee"
Cohesion: 0.21
Nodes (12): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+4 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.15
Nodes (15): CartContents(), CartEmptyState(), CartTotalsSummary(), OrderPlacedScreen(), OrderSummaryRows(), PlacedOrder, calculateDeliveryFee(), CartLine (+7 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.12
Nodes (19): ProfilePage(), revalidate, MobileMenuHeader(), ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), AccountActions() (+11 more)

### Community 32 - "eta.ts"
Cohesion: 0.19
Nodes (11): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, SESSION_COOKIE_NAME, readArrivalQuote(), Coordinates (+3 more)

### Community 33 - "actions/admin.ts"
Cohesion: 0.23
Nodes (13): ActionResult, Customer, Employee, EmployeeEditInput, EmployeeRole, ChangePasswordInput, changePasswordSchema, ChangeRoleInput (+5 more)

### Community 34 - "engine.ts"
Cohesion: 0.17
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "OrderData"
Cohesion: 0.25
Nodes (14): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, MOCK_ORDERS (+6 more)

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
Cohesion: 0.14
Nodes (19): MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModal() (+11 more)

### Community 41 - "track-order-screen.test.tsx"
Cohesion: 0.17
Nodes (7): TrackedOrder, getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 42 - "Details"
Cohesion: 0.08
Nodes (26): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+18 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "validate-ncr.ts"
Cohesion: 0.15
Nodes (14): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+6 more)

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

### Community 49 - "cart-line-row.tsx"
Cohesion: 0.24
Nodes (11): DELETE(), PATCH(), RouteParams, CartLineRow(), QuantityStepper(), StepButton(), removeCartItem(), updateCartItem() (+3 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.20
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), latestBirthdateForMinAge() (+7 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.13
Nodes (22): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition() (+14 more)

### Community 53 - "next"
Cohesion: 0.13
Nodes (27): registerCustomer(), requestPasswordReset(), AuthTabs(), Tab(), CustomerLoginForm(), LoginFormInner(), CustomerSignupForm(), FIELD_LABELS (+19 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "fields.ts"
Cohesion: 0.06
Nodes (49): dateOfBirthSchema, employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, addressLabelSchema, AddressParts, addressPartsSchema (+41 more)

### Community 56 - "checkout-screen.tsx"
Cohesion: 0.18
Nodes (13): CheckoutScreen(), PaymentMethodPicker(), 🟡 Browsing and Ordering, DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT (+5 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.27
Nodes (11): fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+3 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.08
Nodes (22): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemDetailModal(), handleAddToCart(), ItemSummary() (+14 more)

### Community 60 - "requireCustomer"
Cohesion: 0.33
Nodes (8): DELETE(), POST(), DELETE(), GET(), addCartItem(), clearCart(), getActiveCart(), requireCustomer()

### Community 61 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 64 - "sidebar.tsx"
Cohesion: 0.11
Nodes (10): logout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar() (+2 more)

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "server.ts"
Cohesion: 0.16
Nodes (13): CheckoutPage(), ADDRESS_COLUMNS, addressPartsFromRow(), AddressPartsInput, AddressRow, formatAddress(), findAwaitingPaymentOrder(), formatOrderTime() (+5 more)

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.16
Nodes (20): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), WalletProvider (+12 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.08
Nodes (25): A. Input Validation Test, Application-level checks after the migration, B. SQL Injection Test, C. Authentication Test, End-to-end checks against the live API, F. Functional Testing, Feedback form (one per tester), Functional issues found earlier in the QA pass (+17 more)

### Community 70 - "submitCart"
Cohesion: 0.18
Nodes (14): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout (+6 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.tsx"
Cohesion: 0.18
Nodes (12): CancelOrderControl(), withdrawnMessage(), ActionResult, useCartAction(), isCancellable(), OrderProgress, ACCEPTED, confirmCancel() (+4 more)

### Community 73 - "reports-charts.tsx"
Cohesion: 0.14
Nodes (21): getDefaultStartDate(), getToday(), ReportsContent(), ReportsCharts(), fetchData(), ReportsChartsProps, formatPeso(), ReportsSummary() (+13 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "actions/menu.ts"
Cohesion: 0.20
Nodes (13): ActionResult, Category, Product, ProductWithCategory, toggleAvailability(), CategoryInput, categorySchema, ProductInput (+5 more)

### Community 79 - "employee/page.tsx"
Cohesion: 0.23
Nodes (12): EmployeeData, ManageEmployeeInner(), ROLES, createEmployee(), setEmployeePhoto(), updateEmployeeDetails(), ApiEmployee, GuardResult (+4 more)

### Community 80 - "vitest"
Cohesion: 0.18
Nodes (16): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+8 more)

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 91 - "Review Checklist"
Cohesion: 0.12
Nodes (15): J10: Evidence for Disputes (🟡), J1: Personal Data Exposure (🔴 — Data Privacy Act), J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754), J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act), J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025), J5: Privacy Notice (🟠 — Data Privacy Act), J6: Minors (🟠 — Civil Code), J7: Delivery Photos (🟠 — Data Privacy Act) (+7 more)

### Community 92 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cleanup Jobs (pg_cron), Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags, Review Checklist (+2 more)

### Community 93 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 95 - "phone.ts"
Cohesion: 0.22
Nodes (14): ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), formatMobileNumber(), INVALID_MOBILE_MESSAGE, maskPhoneDigits(), PH_MOBILE_DIGITS (+6 more)

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
Cohesion: 0.30
Nodes (8): ManageLayout(), ManageShell(), createSession(), decrypt(), EmployeeSessionPayload, encrypt(), sessionSecret(), jose

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "report-controls.tsx"
Cohesion: 0.23
Nodes (8): DateInputProps, ReportDateFiltersProps, ReportTypeSelect(), NavAddressDropdown(), DROPDOWN_FOCUS_RING, useDropdown(), OPTIONS, RolePicker()

### Community 105 - "react"
Cohesion: 0.14
Nodes (12): Window, LogOutControl(), CustomerData, SortableHeader(), SortableHeaderProps, SortDirection, Button(), buttonVariants (+4 more)

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
Cohesion: 0.17
Nodes (24): POST(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), describeProfileUpdateError(), updateMyEmployeeProfile() (+16 more)

### Community 111 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.18
Nodes (11): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), 30. Orders page can't filter by date, customer, payment or type (P2, high), 32. Reports have no breakdowns and no CSV (P2), 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Found by the "hard questions through the UI" walkthrough (+3 more)

### Community 112 - "xss.test.tsx"
Cohesion: 0.11
Nodes (13): escapeLikePattern(), ReviewSubmission, reviewSubmissionSchema, ref_node_fs, ref_node_path, checkout, hardening, pickupOnly (+5 more)

### Community 114 - "ToastProvider"
Cohesion: 0.08
Nodes (20): SiteNavBar(), ToastProvider(), CustomerProfile, @testing-library/react, lines, refresh, lines, profile (+12 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #114: Part 1: Security, Database & Privacy Enhancements, Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 119 - "switchOrderToCashOnDelivery"
Cohesion: 0.83
Nodes (3): SwitchToCodButton(), handleSwitch(), switchOrderToCashOnDelivery()

### Community 120 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.22
Nodes (9): 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support, 🟢 Third-Party Integrations (+1 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.11
Nodes (18): Business rules, Commands, Database functions (RPC), Docs, Edge functions, External services, Folder structure, Local development setup (+10 more)

### Community 127 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 135 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 137 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 138 - "E. XSS Test"
Cohesion: 0.50
Nodes (4): E. XSS Test, How the application was verified, Payloads used, Results

## Knowledge Gaps
- **761 isolated node(s):** `User roles`, `Tech stack`, `External services`, `Business rules`, `Triggers` (+756 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 945 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `toast.tsx`, `auth.ts`, `employee-modal.tsx`, `createClient`, `roles.ts`, `use-shortcut.ts`, `actions.ts`, `routers/admin.ts`, `routers/profile.ts`, `order-stage.ts`, `reorderPastOrder`, `lucide-react`, `routers/reports.ts`, `past-order.ts`, `cn`, `package.json`, `dashboard.ts`, `database.types.ts`, `customer-orders.ts`, `routers/employee-profile.ts`, `delivery-addresses-card.tsx`, `actions/cart.ts`, `menu-page-body.tsx`, `requireApiEmployee`, `cart-totals.ts`, `(account)/profile/page.tsx`, `eta.ts`, `menu-actions.test.ts`, `routers/addons.ts`, `transactions.ts`, `validate-ncr.ts`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `cart-line-row.tsx`, `routers/orders.ts`, `checkout-screen.tsx`, `requireCustomer`, `employee/login/page.tsx`, `confirmation/page.tsx`, `sidebar.tsx`, `server.ts`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `cancel-order-control.tsx`, `reports-charts.tsx`, `actions/menu.ts`, `employee/page.tsx`, `session.ts`, `report-controls.tsx`, `react`, `kds/page.tsx`, `actions/profile.ts`, `switchOrderToCashOnDelivery`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `employee-modal.tsx`, `requireManageAccess`, `actions.ts`, `routers/admin.ts`, `routers/profile.ts`, `reorderPastOrder`, `actions/reports.ts`, `routers/reports.ts`, `past-order.ts`, `actions/employee-profile.ts`, `dashboard.ts`, `database.types.ts`, `customer-orders.ts`, `routers/employee-profile.ts`, `actions/cart.ts`, `menu-page-body.tsx`, `requireApiEmployee`, `eta.ts`, `actions/admin.ts`, `routers/addons.ts`, `transactions.ts`, `cart-line-row.tsx`, `routers/orders.ts`, `actions/orders.ts`, `next`, `read-placed-order.ts`, `requireCustomer`, `sidebar.tsx`, `server.ts`, `notifications.ts`, `submitCart`, `reports-charts.tsx`, `actions/menu.ts`, `employee/page.tsx`, `kds/page.tsx`, `actions/profile.ts`, `switchOrderToCashOnDelivery`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `createClient`, `reorderPastOrder`, `actions/cart.ts`, `paymongo`, `Details`, `next`, `P2 — if time allows`, `requireCustomer`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`, `order-summary-card.tsx`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `Review Checklist`, `Review Checklist`, `Review Checklist`, `User simulation — 17 personas + hard questions through the UI`, `ToastProvider`, `Yang's Fried Rice — Ordering System`, `Issue #106 — follow-up issues to file`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `User roles`, `Tech stack`, `External services` to the rest of the system?**
  _761 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `toast.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13131313131313133 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08859357696567 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._