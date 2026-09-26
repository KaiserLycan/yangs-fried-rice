# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 456 files · ~574,030 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2323 nodes · 6042 edges · 144 communities (127 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28e6ab52`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- contact-details-card.tsx
- createAdminClient
- employee-modal.tsx
- db-cleanse.mjs
- createClient
- roles.ts
- reports-summary.tsx
- item-detail-modal.tsx
- menu-page-body.tsx
- routers/admin.ts
- actions/profile.ts
- order-stage.ts
- products.ts
- actions/reports.ts
- employee/page.tsx
- routers/reports.ts
- past-order.ts
- stored-image.ts
- cn
- package.json
- reports-charts.tsx
- validation/menu.ts
- customer-orders.ts
- actions/employee-profile.ts
- delivery-addresses-card.tsx
- actions/cart.ts
- paymongo
- (account)/orders/page.tsx
- requireApiEmployee
- cart-totals.ts
- devDependencies
- site-nav-bar.tsx
- eta.ts
- actions/admin.ts
- engine.ts
- compilerOptions
- kds/page.tsx
- xss.test.tsx
- routers/addons.ts
- transactions.ts
- menu-item-detail-modal.tsx
- ToastProvider
- Details
- dependencies
- validate-ncr.ts
- brand-panel.tsx
- 13. Cybersecurity analyst — "Dana, hired to assess the system before launch"
- map-content.tsx
- site-footer.tsx
- cart-line-row.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- actions.ts
- P2 — if time allows
- fields.ts
- checkout-screen.tsx
- fix-transactions.js
- read-placed-order.ts
- menu-screen.tsx
- requireCustomer
- employee/login/page.tsx
- wallet-tab.ts
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- sidebar.tsx
- scripts
- menu-actions.test.ts
- notifications.ts
- payment-status-card.tsx
- Phase 4 — Security & Testing Report
- submitCart
- reports-utils.ts
- cancel-order-control.tsx
- report-controls.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- app/layout.tsx
- order-summary-card.tsx
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
- useValidatedValues
- next
- User simulation — 17 personas + hard questions through the UI
- checkout/page.tsx
- The 12 questions
- server.ts
- user-simulation.md
- Limitations — gaps we can close in 1.5 days
- ref_node_fs
- rewrite_docs.py
- order-placed-screen.tsx
- Unimplemented Issues and Tasks
- Review Checklist
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts
- manage/orders/page.tsx
- senior-pwd-ids.ts
- lucide-react
- useDropdown
- Comparison analysis — Yang's Fried Rice vs current ordering systems
- Requirements Audit
- Yang's Fried Rice — Ordering System
- checkout-screen.test.tsx
- Issue #106 — follow-up issues to file
- mobile-menu-header.tsx
- Handoff: put dispatched orders in the rider queue
- Supabase
- Persona: Cybersecurity Analyst — "Dana, assesses the system before launch"
- resolveEmployeeRole
- 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1)
- H. Test Evidence / Screenshots — **TO DO (manual)**
- B. SQL Injection Test
- D. Authorization Test
- E. XSS Test
- api-guard.ts
- signupSchema
- I. Bug / Issue Log
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
9. `submitCart()` - 29 edges
10. `zod` - 28 edges

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

## Communities (144 total, 17 thin omitted)

### Community 0 - "contact-details-card.tsx"
Cohesion: 0.17
Nodes (24): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+16 more)

### Community 1 - "createAdminClient"
Cohesion: 0.08
Nodes (33): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+25 more)

### Community 2 - "employee-modal.tsx"
Cohesion: 0.18
Nodes (17): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+9 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "createClient"
Cohesion: 0.19
Nodes (26): ManageMenuInner(), uploadMenuImage(), MenuItemDetailModal(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn() (+18 more)

### Community 5 - "roles.ts"
Cohesion: 0.18
Nodes (19): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+11 more)

### Community 6 - "reports-summary.tsx"
Cohesion: 0.16
Nodes (16): S4: Disabled account lockout (🟠 High), StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary() (+8 more)

### Community 7 - "item-detail-modal.tsx"
Cohesion: 0.17
Nodes (12): MenuGrid(), AddOnsSection(), ItemDetailModal(), ItemSummary(), ProductCard(), ProductPhotoPlaceholder(), ProductRow(), ActionResult (+4 more)

### Community 8 - "menu-page-body.tsx"
Cohesion: 0.15
Nodes (10): MenuPageBody(), MenuScreen(), F1. Landing page for marketing — ❌, getCategories(), getProducts(), fetchCategories(), fetchProducts(), mapProductRow() (+2 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (30): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+22 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.07
Nodes (51): POST(), PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET (+43 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.11
Nodes (27): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+19 more)

### Community 12 - "products.ts"
Cohesion: 0.18
Nodes (12): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+4 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (29): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+21 more)

### Community 14 - "employee/page.tsx"
Cohesion: 0.12
Nodes (17): ManageCustomersInner(), loadCustomers(), EmployeeData, ROLES, CustomerData, CustomerModal(), CustomerModalProps, getVisiblePages() (+9 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.12
Nodes (28): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+20 more)

### Community 17 - "stored-image.ts"
Cohesion: 0.31
Nodes (7): removeStoredImages(), ALLOWED_IMAGE_TYPES, EXTENSION_BY_TYPE, ImageBucket, imageExtensionFor(), MAX_IMAGE_UPLOAD_BYTES, storagePathFromPublicUrl()

### Community 18 - "cn"
Cohesion: 0.16
Nodes (14): Tab(), MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, SearchField(), OrderRatingDisplay(), SCORE_WORDS, Dialog() (+6 more)

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
Cohesion: 0.12
Nodes (17): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderButton(), RateOrderDialog(), ActionResult (+9 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.20
Nodes (17): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+9 more)

### Community 24 - "delivery-addresses-card.tsx"
Cohesion: 0.15
Nodes (17): AddressValidationNote(), AddressValidationStatus, noteFor(), ValidateResponse, ValidationState, DeliveryDetailsCard(), handleFormChange(), FORM_LABELS (+9 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.21
Nodes (12): ActionResult, ActiveCart, CartItemDetail, AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema, SubmitCartInput (+4 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "(account)/orders/page.tsx"
Cohesion: 0.16
Nodes (16): CartPage(), OrdersPage(), ProfilePage(), MenuPage(), DesktopCartRail(), ResolvedBottomTabBar(), PastOrdersScreen(), CartRead (+8 more)

### Community 28 - "requireApiEmployee"
Cohesion: 0.21
Nodes (12): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+4 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.14
Nodes (15): CartContents(), CartEmptyState(), CartTotalsSummary(), OrderSummaryRows(), calculateDeliveryFee(), CartLine, CartTotals, computeCartTotals() (+7 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "site-nav-bar.tsx"
Cohesion: 0.14
Nodes (17): NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), ProfileHeader(), ProfileSummaryCard(), CustomerProfile, DATE_OF_BIRTH_FORMAT (+9 more)

### Community 32 - "eta.ts"
Cohesion: 0.33
Nodes (7): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, Coordinates, EtaResult

### Community 33 - "actions/admin.ts"
Cohesion: 0.22
Nodes (14): ActionResult, Customer, Employee, EmployeeEditInput, ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema (+6 more)

### Community 34 - "engine.ts"
Cohesion: 0.15
Nodes (21): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateHaversineDistanceKm(), calculateKitchenPrepMinutes(), calculateOrderEta() (+13 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "kds/page.tsx"
Cohesion: 0.24
Nodes (15): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+7 more)

### Community 37 - "xss.test.tsx"
Cohesion: 0.21
Nodes (7): ReviewSubmission, reviewSubmissionSchema, ref_node_path, INJECTION_PAYLOADS, sourceFiles(), sourceFiles(), XSS_PAYLOADS

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "menu-item-detail-modal.tsx"
Cohesion: 0.15
Nodes (17): MenuGridProps, MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModalProps, MenuCategory (+9 more)

### Community 41 - "ToastProvider"
Cohesion: 0.11
Nodes (18): CheckoutConfirmationPage(), OrderDetailPage(), ToastProvider(), walletFromParam(), WALLET_TAB_PARAM, ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom() (+10 more)

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

### Community 46 - "13. Cybersecurity analyst — "Dana, hired to assess the system before launch""
Cohesion: 0.25
Nodes (6): S10: Webhook security (🟡 Low), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 47 - "map-content.tsx"
Cohesion: 0.14
Nodes (13): Code Consistency, DeliveryMap(), MapContent, LiveMapPanel(), Structure and naming, DeliveryData, DeliveryItem, DeliveryLocation (+5 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cart-line-row.tsx"
Cohesion: 0.24
Nodes (11): DELETE(), PATCH(), RouteParams, CartLineRow(), QuantityStepper(), StepButton(), removeCartItem(), updateCartItem() (+3 more)

### Community 50 - "routers/orders.ts"
Cohesion: 0.16
Nodes (17): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+9 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.20
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), latestBirthdateForMinAge() (+7 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.15
Nodes (20): ActionResult, Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition(), ORDER_STATUSES, OrderFilters (+12 more)

### Community 53 - "actions.ts"
Cohesion: 0.09
Nodes (45): ActionResult, EmployeeLoginResult, loginCustomer(), registerCustomer(), RegisterResult, requestPasswordReset(), resetPassword(), AuthTabs() (+37 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "fields.ts"
Cohesion: 0.06
Nodes (39): dateOfBirthSchema, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues, addressLabelSchema, AddressParts, barangaySchema (+31 more)

### Community 56 - "checkout-screen.tsx"
Cohesion: 0.20
Nodes (12): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+4 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.33
Nodes (9): fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+1 more)

### Community 59 - "menu-screen.tsx"
Cohesion: 0.18
Nodes (7): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), CategoryOption, RawProductRow

### Community 60 - "requireCustomer"
Cohesion: 0.26
Nodes (10): DELETE(), POST(), DELETE(), GET(), handleAddToCart(), 2. Cart is not re-checked at checkout, addCartItem(), clearCart() (+2 more)

### Community 61 - "employee/login/page.tsx"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.14
Nodes (14): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+6 more)

### Community 64 - "sidebar.tsx"
Cohesion: 0.12
Nodes (7): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar(), loadSidebarEmployee()

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "payment-status-card.tsx"
Cohesion: 0.18
Nodes (17): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, WALLET_PROVIDERS, createPaymentIntent() (+9 more)

### Community 69 - "Phase 4 — Security & Testing Report"
Cohesion: 0.12
Nodes (17): A. Input Validation Test, Application-level checks after the migration, C. Authentication Test, End-to-end checks against the live API, F. Functional Testing, Feedback form (one per tester), G. Usability Testing — **TO DO (manual)**, How this report was produced, and what it does not cover (+9 more)

### Community 70 - "submitCart"
Cohesion: 0.19
Nodes (13): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 3. Unpaid GCash/Maya orders never expire (+5 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.tsx"
Cohesion: 0.16
Nodes (14): POST(), RouteParams, CancelOrderControl(), withdrawnMessage(), cancelCustomerOrder(), getCancellationErrorMessage(), isCancellable(), OrderProgress (+6 more)

### Community 73 - "report-controls.tsx"
Cohesion: 0.19
Nodes (14): getDefaultStartDate(), getToday(), ReportsContent(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect(), LEGACY_MENU_SATISFACTION_TYPES (+6 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.18
Nodes (11): Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical), S3: Direct database writes (🔴 High), S5: Session verification (🟠 Medium), S6: Storage bucket security (🟠 Medium) (+3 more)

### Community 78 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, anton, dmSans, metadata

### Community 79 - "order-summary-card.tsx"
Cohesion: 0.23
Nodes (14): Button(), ButtonProps, buttonVariants, ShortcutsHelp(), STAFF_AREAS, Tooltip(), formatCombo(), isMac() (+6 more)

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
Cohesion: 0.17
Nodes (11): Cleanup Jobs (pg_cron), Constraints & Data Quality, Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags (+3 more)

### Community 93 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 95 - "phone.ts"
Cohesion: 0.20
Nodes (16): PhoneInput(), handleChange(), handlePaste(), employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, employeeProfileUpdateSchema, INVALID_MOBILE_MESSAGE (+8 more)

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

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "useValidatedValues"
Cohesion: 0.38
Nodes (5): MenuItemModal(), useValidatedValues(), Mirror(), Probe(), schema

### Community 105 - "next"
Cohesion: 0.08
Nodes (26): revalidate, Window, logout(), LogOutControl(), handleLogOut(), EmployeeAvatarCard(), handleLogout(), AccountActions() (+18 more)

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "checkout/page.tsx"
Cohesion: 0.23
Nodes (6): CheckoutPage(), findAwaitingPaymentOrder(), formatOrderTime(), readArrivalQuote(), ACTIVE_KITCHEN_STATUSES, countActiveKitchenOrders()

### Community 108 - "The 12 questions"
Cohesion: 0.12
Nodes (16): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store." (+8 more)

### Community 109 - "server.ts"
Cohesion: 0.15
Nodes (12): submitProductReview(), @supabase/ssr, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+4 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.39
Nodes (3): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary

### Community 111 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.29
Nodes (7): 30. Orders page can't filter by date, customer, payment or type (P2, high), 32. Reports have no breakdowns and no CSV (P2), 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Found by the "hard questions through the UI" walkthrough, Limitations — gaps we can close in 1.5 days, Panel feedback (verified in [`feedback-verification.md`](feedback-verification.md))

### Community 112 - "ref_node_fs"
Cohesion: 0.29
Nodes (4): ref_node_fs, checkout, hardening, pickupOnly

### Community 114 - "order-placed-screen.tsx"
Cohesion: 0.16
Nodes (13): OrderPlacedScreen(), SwitchToCodButton(), handleSwitch(), switchOrderToCashOnDelivery(), foldPaymentStatus(), PaymentStatus, PlacedOrder, isUnpaidStatus() (+5 more)

### Community 115 - "Unimplemented Issues and Tasks"
Cohesion: 0.14
Nodes (14): Issue #10: US-07: Real-Time Estimated Time of Arrival (ETA) (CLOSED), Issue #11: US-05: Driver Operations & Proof of Delivery (CLOSED), Issue #21: US-11: Advanced Profile Management (CLOSED), Issue #22: US-12: Order Review & Flexible Payment Options (CLOSED), Issue #23: US-13: Customer Order Tracking (CLOSED), Issue #3: US-02: Menu Management & Database Setup (CLOSED), Issue #42: SAS1- Administrators should be able to view and manage all registered user accounts, remote orders, and payments (CLOSED), Issue #5: US-03: Menu Browsing & Checkout (CLOSED) (+6 more)

### Community 116 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 117 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 119 - "manage/orders/page.tsx"
Cohesion: 0.24
Nodes (9): KdsInner(), ManageOrdersInner(), OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS, actionCopy() (+1 more)

### Community 120 - "senior-pwd-ids.ts"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 121 - "lucide-react"
Cohesion: 0.25
Nodes (4): BottomTab, BottomTabBar(), TABS, lucide-react

### Community 122 - "useDropdown"
Cohesion: 0.33
Nodes (6): NavAddressDropdown(), setActiveAddress(), DROPDOWN_FOCUS_RING, useDropdown(), OPTIONS, RolePicker()

### Community 123 - "Comparison analysis — Yang's Fried Rice vs current ordering systems"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.20
Nodes (10): 🟡 Browsing and Ordering, 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support (+2 more)

### Community 125 - "Yang's Fried Rice — Ordering System"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "checkout-screen.test.tsx"
Cohesion: 0.20
Nodes (5): lines, profile, push, refresh, replace

### Community 127 - "Issue #106 — follow-up issues to file"
Cohesion: 0.22
Nodes (9): A. Customer signup and form copy cleanup, B. Cart and checkout correctness, C. Order identity and terminology, D. Manager reports and modal behaviour, E. Site-wide UX polish, F. Image handling, G. New features, H. Security and architecture (+1 more)

### Community 128 - "mobile-menu-header.tsx"
Cohesion: 0.39
Nodes (4): MobileMenuHeader(), ResolvedMobileProfile(), Avatar(), shortAddressLabel()

### Community 129 - "Handoff: put dispatched orders in the rider queue"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

### Community 130 - "Supabase"
Cohesion: 0.29
Nodes (7): Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Storage buckets, Supabase, Triggers

### Community 131 - "Persona: Cybersecurity Analyst — "Dana, assesses the system before launch""
Cohesion: 0.33
Nodes (5): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Verification SQL, Who is Dana?

### Community 132 - "resolveEmployeeRole"
Cohesion: 0.60
Nodes (6): ManageEmployeeInner(), setEmployeePhoto(), updateEmployeeDetails(), normalizeEmployeeRoleLabel(), resolveEmployeeRole(), roleDisplayLabel()

### Community 134 - "28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1)"
Cohesion: 0.40
Nodes (5): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026)

### Community 135 - "H. Test Evidence / Screenshots — **TO DO (manual)**"
Cohesion: 0.40
Nodes (5): Authentication evidence, Authorization evidence, H. Test Evidence / Screenshots — **TO DO (manual)**, Security evidence, Validation evidence

### Community 136 - "B. SQL Injection Test"
Cohesion: 0.40
Nodes (5): B. SQL Injection Test, How the application was verified, Issue found and fixed, Payloads used, Results

### Community 137 - "D. Authorization Test"
Cohesion: 0.40
Nodes (5): D1 — Page access by role, D2 — Management actions by role, D3 — API route protection, D. Authorization Test, Issues found and fixed

### Community 138 - "E. XSS Test"
Cohesion: 0.50
Nodes (4): E. XSS Test, How the application was verified, Payloads used, Results

### Community 139 - "api-guard.ts"
Cohesion: 0.50
Nodes (3): ApiEmployee, GuardResult, EmployeeRole

### Community 141 - "I. Bug / Issue Log"
Cohesion: 0.67
Nodes (3): Functional issues found earlier in the QA pass, I. Bug / Issue Log, Security issues found by this phase's testing

## Knowledge Gaps
- **760 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `refresh` (+755 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 944 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `contact-details-card.tsx`, `createAdminClient`, `mobile-menu-header.tsx`, `employee-modal.tsx`, `createClient`, `roles.ts`, `item-detail-modal.tsx`, `routers/admin.ts`, `actions/profile.ts`, `order-stage.ts`, `products.ts`, `api-guard.ts`, `routers/reports.ts`, `past-order.ts`, `cn`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `delivery-addresses-card.tsx`, `(account)/orders/page.tsx`, `requireApiEmployee`, `cart-totals.ts`, `site-nav-bar.tsx`, `eta.ts`, `kds/page.tsx`, `routers/addons.ts`, `transactions.ts`, `ToastProvider`, `validate-ncr.ts`, `brand-panel.tsx`, `map-content.tsx`, `site-footer.tsx`, `cart-line-row.tsx`, `routers/orders.ts`, `actions.ts`, `checkout-screen.tsx`, `requireCustomer`, `employee/login/page.tsx`, `sidebar.tsx`, `menu-actions.test.ts`, `notifications.ts`, `payment-status-card.tsx`, `submitCart`, `cancel-order-control.tsx`, `report-controls.tsx`, `app/layout.tsx`, `order-summary-card.tsx`, `session.ts`, `checkout/page.tsx`, `server.ts`, `order-placed-screen.tsx`, `manage/orders/page.tsx`, `lucide-react`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `createAdminClient`, `employee-modal.tsx`, `reports-summary.tsx`, `menu-page-body.tsx`, `routers/admin.ts`, `actions/profile.ts`, `api-guard.ts`, `products.ts`, `actions/reports.ts`, `employee/page.tsx`, `routers/reports.ts`, `past-order.ts`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `actions/cart.ts`, `(account)/orders/page.tsx`, `requireApiEmployee`, `eta.ts`, `actions/admin.ts`, `routers/addons.ts`, `transactions.ts`, `ToastProvider`, `cart-line-row.tsx`, `routers/orders.ts`, `actions/orders.ts`, `actions.ts`, `read-placed-order.ts`, `requireCustomer`, `notifications.ts`, `submitCart`, `cancel-order-control.tsx`, `next`, `checkout/page.tsx`, `server.ts`, `order-placed-screen.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Persona: Cybersecurity Analyst — "Dana, assesses the system before launch"`, `createClient`, `past-order.ts`, `actions/cart.ts`, `paymongo`, `P2 — if time allows`, `requireCustomer`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`, `payment-status-card.tsx`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `order-summary-card.tsx`, `Review Checklist`, `Review Checklist`, `Review Checklist`, `next`, `User simulation — 17 personas + hard questions through the UI`, `user-simulation.md`, `checkout-screen.test.tsx`, `Issue #106 — follow-up issues to file`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _760 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createAdminClient` be split into smaller, more focused modules?**
  _Cohesion score 0.08456659619450317 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0649895178197065 - nodes in this community are weakly interconnected._
- **Should `menu-page-body.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._