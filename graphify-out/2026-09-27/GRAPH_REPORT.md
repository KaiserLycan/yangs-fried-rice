# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 480 files · ~583,440 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2174 nodes · 6187 edges · 108 communities (94 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dd242b6d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useToast
- createAdminClient
- actions/profile.ts
- db-cleanse.mjs
- createClient
- roles.ts
- validation/profile.ts
- menu-screen.tsx
- actions/delivery.ts
- routers/admin.ts
- site-nav-bar.tsx
- track-order-screen.tsx
- manage/orders/page.tsx
- actions/reports.ts
- react
- routers/reports.ts
- reports-summary.tsx
- lucide-react
- cn
- package.json
- reports-charts.tsx
- vitest
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- actions/cart.ts
- Review Checklist
- customer-profile.ts
- categories.ts
- cart-totals.ts
- devDependencies
- (account)/profile/page.tsx
- getOrderEtaAction
- actions/admin.ts
- engine.ts
- compilerOptions
- order-detail-modal.tsx
- xss.test.tsx
- routers/addons.ts
- requireApiEmployee
- menu-item-detail-modal.tsx
- track-order-screen.test.tsx
- map-staff-order.ts
- dependencies
- transactions.ts
- next
- resolveEmployeeRole
- map-content.tsx
- site-footer.tsx
- cart-line-row.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- customer-signup-form.tsx
- lengthProps
- actions.ts
- checkout-screen.tsx
- fix-transactions.js
- order-placed-screen.tsx
- server.ts
- requireCustomer
- employee/login/page.tsx
- wallet-tab.ts
- phone.ts
- sidebar.tsx
- scripts
- menu-actions.test.ts
- notifications.ts
- payment-status-card.tsx
- bottom-tab-bar.tsx
- checkout-screen.test.tsx
- reports-utils.ts
- cancel-order-control.tsx
- report-controls.tsx
- dashboard-skeleton.tsx
- route-placeholder.tsx
- cart-totals-summary.tsx
- Review Checklist
- toast.tsx
- use-shortcut.ts
- order-number.ts
- extends
- next.config.mjs
- postcss.config.mjs
- .prettierrc.json
- vitest.config.mts
- tailwindcss
- @testing-library/jest-dom
- Review Checklist
- employee-modal.tsx
- Review Checklist
- Review Checklist
- toInternationalMobile
- Review Checklist
- Review Checklist
- Review Checklist
- item-detail-modal.tsx
- eta.ts
- Review Checklist
- Review Checklist
- Review Checklist
- MenuItemDetailModal
- password-strength.ts
- changeEmployeeRole
- DeliveryAddressesCard

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 162 edges
2. `next` - 119 edges
3. `cn()` - 106 edges
4. `react` - 88 edges
5. `vitest` - 81 edges
6. `useToast()` - 61 edges
7. `resolveEmployeeRole()` - 35 edges
8. `lengthProps()` - 34 edges
9. `createAdminClient()` - 32 edges
10. `lucide-react` - 32 edges

## Surprising Connections (you probably didn't know these)
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-accountant/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `getDetailedOrders()`  [INFERRED]
  .agents/skills/persona-manager/SKILL.md → lib/actions/orders.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-new-customer/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-qa-tester/SKILL.md → lib/actions/cart.ts
- `Key Files to Check` --references--> `submitCart()`  [INFERRED]
  .agents/skills/persona-security-analyst/SKILL.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (108 total, 14 thin omitted)

### Community 0 - "useToast"
Cohesion: 0.15
Nodes (30): revalidate, RiderProfilePage(), revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema (+22 more)

### Community 1 - "createAdminClient"
Cohesion: 0.08
Nodes (36): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+28 more)

### Community 2 - "actions/profile.ts"
Cohesion: 0.09
Nodes (42): POST(), PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET (+34 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (44): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+36 more)

### Community 4 - "createClient"
Cohesion: 0.13
Nodes (34): ManageMenuInner(), uploadMenuImage(), MenuGrid(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn() (+26 more)

### Community 5 - "roles.ts"
Cohesion: 0.19
Nodes (18): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+10 more)

### Community 6 - "validation/profile.ts"
Cohesion: 0.11
Nodes (18): addressLabelSchema, deliveryNoteSchema, customerEmailSchema, customerPasswordSchema, LoginField, loginSchema, LoginValues, ContactDetailsField (+10 more)

### Community 7 - "menu-screen.tsx"
Cohesion: 0.10
Nodes (16): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuScreen(), CartRead, CategoryOption (+8 more)

### Community 8 - "actions/delivery.ts"
Cohesion: 0.11
Nodes (39): DeliverHomePage(), DeliverSidebar(), fetchPageDetails(), loadSidebarQueue(), DeliveryData, DeliveryOverviewCard(), DeliveryOverviewCardProps, acceptDelivery() (+31 more)

### Community 9 - "routers/admin.ts"
Cohesion: 0.10
Nodes (30): DELETE, PATCH, GET, PATCH, PATCH, DELETE, GET, POST (+22 more)

### Community 10 - "site-nav-bar.tsx"
Cohesion: 0.13
Nodes (15): logout(), DeliverLayout(), handleLogout(), LogOutControl(), handleLogOut(), NAV_LINKS, NavSection, ResolvedProfileActions() (+7 more)

### Community 11 - "track-order-screen.tsx"
Cohesion: 0.06
Nodes (59): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+51 more)

### Community 12 - "manage/orders/page.tsx"
Cohesion: 0.21
Nodes (12): KdsInner(), ManageOrdersInner(), KdsOrderCard(), OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS (+4 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.10
Nodes (32): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+24 more)

### Community 14 - "react"
Cohesion: 0.09
Nodes (23): EmployeeData, ManageEmployeeInner(), ROLES, CustomerData, CustomerModal(), CustomerModalProps, getVisiblePages(), ManagePagination() (+15 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "reports-summary.tsx"
Cohesion: 0.18
Nodes (14): StatCard(), StatCardProps, SUBTITLE_COLORS, ReportsCharts(), fetchData(), formatPeso(), ReportsSummary(), fetchData() (+6 more)

### Community 17 - "lucide-react"
Cohesion: 0.22
Nodes (14): AcceptDeliveryModal(), AcceptDeliveryModalProps, ProofOfDeliveryModal(), ProofOfDeliveryModalProps, EmployeeAvatarCard(), AvatarButton(), Button(), ButtonProps (+6 more)

### Community 18 - "cn"
Cohesion: 0.16
Nodes (14): Tab(), DeliveryOverviewSkeleton(), DeliveryOverviewSkeletonProps, MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, AssignedRiderCard(), RateOrderButton() (+6 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (29): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+21 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.16
Nodes (19): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+11 more)

### Community 21 - "vitest"
Cohesion: 0.15
Nodes (14): DeliveryTab, matchesDeliveryTab(), resolveDeliveryTab(), DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), CategoryInput, categorySchema, ProductInput (+6 more)

### Community 22 - "customer-orders.ts"
Cohesion: 0.12
Nodes (17): POST(), RouteParams, GET(), RouteParams, GET(), RateOrderDialog(), ActionResult, getMyOrderDetail() (+9 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.13
Nodes (24): PATCH, PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus() (+16 more)

### Community 24 - "fields.ts"
Cohesion: 0.12
Nodes (23): employeeDateOfBirthSchema, employeePersonalDetailsSchema, employeeProfileUpdateSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema (+15 more)

### Community 25 - "actions/cart.ts"
Cohesion: 0.18
Nodes (16): SwitchToCodButton(), handleSwitch(), ActionResult, ActiveCart, CartItemDetail, switchOrderToCashOnDelivery(), isPaymentMethodAllowed(), MIN_DELIVERY_FEE_PHP (+8 more)

### Community 26 - "Review Checklist"
Cohesion: 0.04
Nodes (45): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+37 more)

### Community 27 - "customer-profile.ts"
Cohesion: 0.12
Nodes (24): CartPage(), CheckoutPage(), OrdersPage(), MenuPage(), MenuPageBody(), PastOrdersScreen(), getCategories(), getProducts() (+16 more)

### Community 28 - "categories.ts"
Cohesion: 0.20
Nodes (11): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+3 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.14
Nodes (18): CartContents(), CartEmptyState(), DesktopCartRail(), FulfilmentToggle(), ToggleOption(), OrderSummaryRows(), ResolvedBottomTabBar(), calculateDeliveryFee() (+10 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "(account)/profile/page.tsx"
Cohesion: 0.18
Nodes (15): ProfilePage(), revalidate, MobileMenuHeader(), ResolvedMobileProfile(), ProfileAvatarCard(), ProfileHeader(), ProfileSummaryCard(), shortAddressLabel() (+7 more)

### Community 32 - "getOrderEtaAction"
Cohesion: 0.60
Nodes (4): GET(), GET(), POST(), getOrderEtaAction()

### Community 33 - "actions/admin.ts"
Cohesion: 0.15
Nodes (19): ActionResult, Customer, Employee, EmployeeEditInput, ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema (+11 more)

### Community 34 - "engine.ts"
Cohesion: 0.08
Nodes (38): POST, validateAddress(), DeliveryDetailsPage(), DeliveryDetailsClient(), DeliveryDetailsClientProps, DeliveryDetailsPanel(), getDeliveryDetail(), geocodeCandidates() (+30 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "order-detail-modal.tsx"
Cohesion: 0.27
Nodes (14): KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig, MOCK_ORDERS (+6 more)

### Community 37 - "xss.test.tsx"
Cohesion: 0.33
Nodes (3): ref_node_path, sourceFiles(), XSS_PAYLOADS

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "requireApiEmployee"
Cohesion: 0.09
Nodes (29): DELETE, GET, PUT, GET, POST, DELETE(), GET(), PUT() (+21 more)

### Community 40 - "menu-item-detail-modal.tsx"
Cohesion: 0.16
Nodes (15): MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps, menuItemFormSchema, MenuItemModalProps, MenuCategory, MenuItem (+7 more)

### Community 41 - "track-order-screen.test.tsx"
Cohesion: 0.12
Nodes (15): OrderDetailPage(), ITEM_GONE_LABEL, orderItemName(), orderItemUnitPrice(), AssignedRider, geocode(), readAssignedRider(), readTrackedOrder() (+7 more)

### Community 42 - "map-staff-order.ts"
Cohesion: 0.22
Nodes (12): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+4 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "transactions.ts"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 45 - "next"
Cohesion: 0.11
Nodes (10): Window, registerCustomer(), metadata, AuthShell(), BrandPanel(), CustomerLoginForm(), CustomerSignupForm(), next (+2 more)

### Community 46 - "resolveEmployeeRole"
Cohesion: 0.33
Nodes (7): Authentication Bypass, S4: Disabled account lockout (🟠 High), ManageLayout(), ManageShell(), requireManageAccess(), requireReportAccess(), resolveEmployeeRole()

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
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.14
Nodes (20): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, isValidTransition() (+12 more)

### Community 53 - "customer-signup-form.tsx"
Cohesion: 0.12
Nodes (24): AuthTabs(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), AddressValidationNote(), AddressValidationStatus, noteFor() (+16 more)

### Community 54 - "lengthProps"
Cohesion: 0.22
Nodes (16): requestPasswordReset(), resetPassword(), LoginFormInner(), EmployeeLoginForm(), ForgotPasswordForm(), ResetPasswordForm(), AddressFieldName, Values (+8 more)

### Community 55 - "actions.ts"
Cohesion: 0.13
Nodes (17): ActionResult, EMPLOYEE_ROLE_REDIRECTS, EmployeeLoginResult, RegisterResult, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField, employeeLoginSchema, EmployeeLoginValues (+9 more)

### Community 56 - "checkout-screen.tsx"
Cohesion: 0.21
Nodes (13): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+5 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "order-placed-screen.tsx"
Cohesion: 0.11
Nodes (21): CheckoutConfirmationPage(), OrderPlacedScreen(), formatOrderTime(), walletFromParam(), foldPaymentStatus(), PaymentStatus, PlacedOrder, fulfilmentFromOrderType() (+13 more)

### Community 59 - "server.ts"
Cohesion: 0.10
Nodes (20): GET(), PATCH(), GET(), getDeliveries(), getDeliveryById(), RouteParams, updateDelivery(), DeliveryUpdateInput (+12 more)

### Community 60 - "requireCustomer"
Cohesion: 0.24
Nodes (10): DELETE(), POST(), DELETE(), GET(), ItemDetailModal(), handleAddToCart(), addCartItem(), clearCart() (+2 more)

### Community 62 - "wallet-tab.ts"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "phone.ts"
Cohesion: 0.15
Nodes (16): dateOfBirthSchema, INVALID_MOBILE_MESSAGE, isValidPhMobile(), optionalPhoneSchema, PH_MOBILE_DIGITS, PH_MOBILE_GROUPS_PATTERN, PH_MOBILE_PREFIX, PHONE_SEPARATORS (+8 more)

### Community 64 - "sidebar.tsx"
Cohesion: 0.11
Nodes (8): DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar(), handleLogout(), loadSidebarEmployee()

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
Cohesion: 0.14
Nodes (19): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), createPaymentIntent() (+11 more)

### Community 69 - "bottom-tab-bar.tsx"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 70 - "checkout-screen.test.tsx"
Cohesion: 0.15
Nodes (8): POST(), resolveDeliveryFee(), submitCart(), lines, profile, push, refresh, replace

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.tsx"
Cohesion: 0.14
Nodes (16): POST(), RouteParams, CancelOrderControl(), withdrawnMessage(), cancelCustomerOrder(), getCancellationErrorMessage(), ActionResult, useCartAction() (+8 more)

### Community 73 - "report-controls.tsx"
Cohesion: 0.19
Nodes (13): getDefaultStartDate(), getToday(), ReportsContent(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect(), LEGACY_MENU_SATISFACTION_TYPES (+5 more)

### Community 77 - "Review Checklist"
Cohesion: 0.08
Nodes (21): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S10: Webhook security (🟡 Low), S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical) (+13 more)

### Community 78 - "toast.tsx"
Cohesion: 0.11
Nodes (14): app_globals, anton, dmSans, metadata, SiteNavBar(), ShowToast, Toast, ToastContext (+6 more)

### Community 79 - "use-shortcut.ts"
Cohesion: 0.25
Nodes (13): SearchField(), ShortcutsHelp(), STAFF_AREAS, Kbd(), Tooltip(), formatCombo(), isMac(), isTypingTarget() (+5 more)

### Community 80 - "order-number.ts"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 81 - "extends"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 91 - "Review Checklist"
Cohesion: 0.12
Nodes (15): J10: Evidence for Disputes (🟡), J1: Personal Data Exposure (🔴 — Data Privacy Act), J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754), J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act), J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025), J5: Privacy Notice (🟠 — Data Privacy Act), J6: Minors (🟠 — Civil Code), J7: Delivery Photos (🟠 — Data Privacy Act) (+7 more)

### Community 92 - "employee-modal.tsx"
Cohesion: 0.22
Nodes (12): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, EMPTY_RIDER, FormSnapshot, inputClass(), ROLES, SHIFTS (+4 more)

### Community 93 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "Review Checklist"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 95 - "toInternationalMobile"
Cohesion: 0.32
Nodes (9): ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), formatMobileNumber(), maskPhoneDigits(), PH_MOBILE_MASKED_LENGTH, phoneDigitsOf() (+1 more)

### Community 96 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+3 more)

### Community 98 - "Review Checklist"
Cohesion: 0.17
Nodes (11): Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist, RLS Verification (+3 more)

### Community 99 - "item-detail-modal.tsx"
Cohesion: 0.30
Nodes (6): AddOnsSection(), ItemSummary(), ProductCard(), ProductPhotoPlaceholder(), ProductRow(), formatPeso()

### Community 100 - "eta.ts"
Cohesion: 0.30
Nodes (9): GetOrderEtaResult, createSession(), decrypt(), EmployeeSessionPayload, encrypt(), SESSION_COOKIE_NAME, sessionSecret(), EtaResult (+1 more)

### Community 101 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Key Files to Check, Persona: Developer — "Kai, joins the team next sprint", Red Flags, Review Checklist, Security Rules Audit, Setup & Onboarding, Testing, Two Entry Points Problem (+2 more)

### Community 102 - "Review Checklist"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "MenuItemDetailModal"
Cohesion: 0.32
Nodes (6): MenuItemDetailModal(), MenuItemModal(), useValidatedValues(), Mirror(), Probe(), schema

### Community 105 - "password-strength.ts"
Cohesion: 0.47
Nodes (4): PasswordFields(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 106 - "changeEmployeeRole"
Cohesion: 0.50
Nodes (3): PATCH, changeEmployeeRole(), changeEmployeeRole()

## Knowledge Gaps
- **613 isolated node(s):** `Who is Mrs. Santos?`, `VAT`, `Senior/PWD Discounts`, `Reconciliation`, `Reporting` (+608 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 785 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `useToast`, `createAdminClient`, `actions/profile.ts`, `createClient`, `roles.ts`, `actions/delivery.ts`, `routers/admin.ts`, `site-nav-bar.tsx`, `track-order-screen.tsx`, `manage/orders/page.tsx`, `routers/reports.ts`, `lucide-react`, `cn`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `actions/cart.ts`, `customer-profile.ts`, `categories.ts`, `cart-totals.ts`, `(account)/profile/page.tsx`, `getOrderEtaAction`, `engine.ts`, `routers/addons.ts`, `requireApiEmployee`, `track-order-screen.test.tsx`, `transactions.ts`, `resolveEmployeeRole`, `map-content.tsx`, `site-footer.tsx`, `cart-line-row.tsx`, `routers/orders.ts`, `customer-signup-form.tsx`, `lengthProps`, `actions.ts`, `checkout-screen.tsx`, `order-placed-screen.tsx`, `server.ts`, `requireCustomer`, `employee/login/page.tsx`, `sidebar.tsx`, `menu-actions.test.ts`, `notifications.ts`, `payment-status-card.tsx`, `bottom-tab-bar.tsx`, `checkout-screen.test.tsx`, `cancel-order-control.tsx`, `report-controls.tsx`, `cart-totals-summary.tsx`, `toast.tsx`, `use-shortcut.ts`, `eta.ts`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `createAdminClient`, `actions/profile.ts`, `actions/delivery.ts`, `routers/admin.ts`, `site-nav-bar.tsx`, `track-order-screen.tsx`, `manage/orders/page.tsx`, `actions/reports.ts`, `routers/reports.ts`, `reports-summary.tsx`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `actions/cart.ts`, `customer-profile.ts`, `categories.ts`, `getOrderEtaAction`, `actions/admin.ts`, `engine.ts`, `routers/addons.ts`, `requireApiEmployee`, `track-order-screen.test.tsx`, `transactions.ts`, `next`, `resolveEmployeeRole`, `cart-line-row.tsx`, `routers/orders.ts`, `actions/orders.ts`, `lengthProps`, `actions.ts`, `order-placed-screen.tsx`, `server.ts`, `requireCustomer`, `notifications.ts`, `checkout-screen.test.tsx`, `cancel-order-control.tsx`, `eta.ts`, `changeEmployeeRole`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `vitest` connect `vitest` to `useToast`, `createAdminClient`, `createClient`, `roles.ts`, `validation/profile.ts`, `menu-screen.tsx`, `actions/delivery.ts`, `site-nav-bar.tsx`, `track-order-screen.tsx`, `actions/reports.ts`, `react`, `package.json`, `customer-orders.ts`, `fields.ts`, `actions/cart.ts`, `customer-profile.ts`, `cart-totals.ts`, `(account)/profile/page.tsx`, `getOrderEtaAction`, `actions/admin.ts`, `engine.ts`, `order-detail-modal.tsx`, `xss.test.tsx`, `menu-item-detail-modal.tsx`, `track-order-screen.test.tsx`, `map-staff-order.ts`, `next`, `site-footer.tsx`, `cart-line-row.tsx`, `date-of-birth.ts`, `actions/orders.ts`, `actions.ts`, `order-placed-screen.tsx`, `server.ts`, `wallet-tab.ts`, `phone.ts`, `sidebar.tsx`, `menu-actions.test.ts`, `payment-status-card.tsx`, `checkout-screen.test.tsx`, `reports-utils.ts`, `cancel-order-control.tsx`, `cart-totals-summary.tsx`, `toast.tsx`, `order-number.ts`, `vitest.config.mts`, `toInternationalMobile`, `eta.ts`, `MenuItemDetailModal`, `password-strength.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `Who is Mrs. Santos?`, `VAT`, `Senior/PWD Discounts` to the rest of the system?**
  _613 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createAdminClient` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._
- **Should `actions/profile.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09254901960784313 - nodes in this community are weakly interconnected._
- **Should `db-cleanse.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06397306397306397 - nodes in this community are weakly interconnected._