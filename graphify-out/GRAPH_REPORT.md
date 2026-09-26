# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- 481 files · ~586,507 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 5, .example 1, .css 1)

## Summary
- 2319 nodes · 6380 edges · 119 communities (103 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ffe2cfe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- password-card.tsx
- auth.ts
- routers/profile.ts
- db-cleanse.mjs
- actions/menu.ts
- roles.ts
- profile.test.ts
- menu-screen.tsx
- deliver-sidebar.tsx
- actions/admin.ts
- actions/profile.ts
- order-stage.ts
- database.types.ts
- actions/reports.ts
- react
- routers/reports.ts
- past-order.ts
- actions/delivery.ts
- cn
- package.json
- reports-charts.tsx
- validation/menu.ts
- customer-orders.ts
- actions/employee-profile.ts
- fields.ts
- input-validation.test.ts
- paymongo
- (account)/profile/page.tsx
- createClient
- cart-totals.ts
- devDependencies
- customer-profile.ts
- eta.ts
- validation/admin.ts
- engine.ts
- compilerOptions
- manage/orders/page.tsx
- xss.test.tsx
- routers/addons.ts
- riders.ts
- employee-modal.tsx
- track-order-screen.test.tsx
- Details
- dependencies
- validate-ncr.ts
- brand-panel.tsx
- requireManageAccess
- delivery-details-client.tsx
- site-footer.tsx
- cart-line-row.tsx
- routers/orders.ts
- date-of-birth.ts
- actions/orders.ts
- customer-signup-form.tsx
- P2 — if time allows
- actions.ts
- checkout-screen.tsx
- fix-transactions.js
- read-placed-order.ts
- deliveries.ts
- next
- employee/login/page.tsx
- confirmation/page.tsx
- 16. UI/UX designer — "Mika, joins to polish the product before the defense"
- sidebar.tsx
- scripts
- menu-actions.test.ts
- notifications.ts
- order-summary-card.tsx
- delivery-assignment.ts
- submitCart
- reports-utils.ts
- cancel-order-control.test.tsx
- report-controls.tsx
- dashboard-skeleton.tsx
- RoutePlaceholder
- Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"
- Review Checklist
- app/layout.tsx
- onKeyDown
- formatOrderNumber
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
- toInternationalMobile
- Review Checklist
- Persona: Restaurant Owner — "Mr. Yang"
- Review Checklist
- Lacking — compared with current restaurant ordering apps
- session.ts
- Review Checklist
- Review Checklist
- Review Checklist
- vitest
- password-strength.ts
- User simulation — 17 personas + hard questions through the UI
- DeliveryAddressesCard
- The 12 questions
- Review Checklist
- user-simulation.md
- Limitations — gaps we can close in 1.5 days
- customer-portal-access.test.ts
- rewrite_docs.py
- order-placed-screen.test.tsx
- delivery-status.ts
- order-timeline.tsx
- 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live"
- delete-confirmation.test.ts

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
- `F5. Minimum purchase total — ❌` --references--> `submitCart()`  [INFERRED]
  docs/feedback-verification.md → lib/actions/cart.ts
- `F9. Bulk orders: cap by capacity — ◐` --references--> `submitCart()`  [INFERRED]
  docs/feedback-verification.md → lib/actions/cart.ts
- `Recommended plan for the panel's points` --references--> `submitCart()`  [INFERRED]
  docs/feedback-verification.md → lib/actions/cart.ts
- `7. No "pause store" / busy mode` --references--> `submitCart()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts
- `20. No "Order again" row on the menu` --references--> `reorderPastOrder()`  [INFERRED]
  docs/limitations.md → lib/actions/cart.ts

## Import Cycles
- None detected.

## Communities (119 total, 16 thin omitted)

### Community 0 - "password-card.tsx"
Cohesion: 0.15
Nodes (28): revalidate, RiderProfilePage(), revalidate, EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap (+20 more)

### Community 1 - "auth.ts"
Cohesion: 0.11
Nodes (28): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+20 more)

### Community 2 - "routers/profile.ts"
Cohesion: 0.13
Nodes (21): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+13 more)

### Community 3 - "db-cleanse.mjs"
Cohesion: 0.06
Nodes (44): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+36 more)

### Community 4 - "actions/menu.ts"
Cohesion: 0.16
Nodes (24): ManageMenuInner(), uploadMenuImage(), MenuItemDetailModal(), MenuItemModal(), ActionResult, Category, createAddOn(), createCategory() (+16 more)

### Community 5 - "roles.ts"
Cohesion: 0.18
Nodes (18): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, EmployeeRole (+10 more)

### Community 7 - "menu-screen.tsx"
Cohesion: 0.08
Nodes (26): DesktopCartRail(), CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemDetailModal(), handleAddToCart() (+18 more)

### Community 8 - "deliver-sidebar.tsx"
Cohesion: 0.18
Nodes (20): DeliverHomePage(), DeliverSidebar(), fetchPageDetails(), loadSidebarQueue(), DeliveryData, DeliveryOverviewSkeleton(), DeliveryOverviewSkeletonProps, getAssignedDeliveries() (+12 more)

### Community 9 - "actions/admin.ts"
Cohesion: 0.09
Nodes (45): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+37 more)

### Community 10 - "actions/profile.ts"
Cohesion: 0.15
Nodes (28): POST(), registerCustomer(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult, upsertCustomerAddress(), addMyAddress() (+20 more)

### Community 11 - "order-stage.ts"
Cohesion: 0.11
Nodes (24): OrderDetailPage(), isCollectedInStore(), TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES, Fulfilment (+16 more)

### Community 12 - "database.types.ts"
Cohesion: 0.10
Nodes (21): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+13 more)

### Community 13 - "actions/reports.ts"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "react"
Cohesion: 0.09
Nodes (36): EmployeeData, ROLES, LogOutControl(), AcceptDeliveryModal(), AcceptDeliveryModalProps, DeliveryDetailsPanel(), DeliveryOverviewCard(), DeliveryOverviewCardProps (+28 more)

### Community 15 - "routers/reports.ts"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "past-order.ts"
Cohesion: 0.17
Nodes (21): PastOrderCard(), PastOrdersScreen(), canRate(), formatPlacedAt(), formatTotal(), isPast(), isPickup(), isUnpaid() (+13 more)

### Community 17 - "actions/delivery.ts"
Cohesion: 0.17
Nodes (20): ProofOfDeliveryModal(), ProofOfDeliveryModalProps, EmployeeAvatarCard(), setEmployeePhoto(), ALLOWED_PROOF_TYPES, DeliveryDetail, DeliverySummary, getProofFile() (+12 more)

### Community 18 - "cn"
Cohesion: 0.19
Nodes (11): Tab(), CustomerModal(), CustomerModalProps, LiveMapPanel(), OrderRatingDisplay(), RateOrderButton(), OrderTimeline(), Checkbox (+3 more)

### Community 19 - "package.json"
Cohesion: 0.07
Nodes (29): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+21 more)

### Community 20 - "reports-charts.tsx"
Cohesion: 0.15
Nodes (20): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+12 more)

### Community 21 - "validation/menu.ts"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "customer-orders.ts"
Cohesion: 0.14
Nodes (14): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+6 more)

### Community 23 - "actions/employee-profile.ts"
Cohesion: 0.16
Nodes (21): PATCH, PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus() (+13 more)

### Community 24 - "fields.ts"
Cohesion: 0.08
Nodes (36): formatAddress(), employeePersonalDetailsSchema, EmployeeProfileUpdateInput, RiderDetailsUpdateInput, riderDetailsUpdateSchema, addressLabelSchema, AddressParts, addressPartsSchema (+28 more)

### Community 25 - "input-validation.test.ts"
Cohesion: 0.16
Nodes (14): isPaymentMethodAllowed(), AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema, SubmitCartInput, submitCartSchema, UpdateCartItemInput (+6 more)

### Community 26 - "paymongo"
Cohesion: 0.14
Nodes (14): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+6 more)

### Community 27 - "(account)/profile/page.tsx"
Cohesion: 0.12
Nodes (21): CartPage(), CheckoutPage(), OrdersPage(), ProfilePage(), revalidate, MenuPage(), MenuPageBody(), BottomTab (+13 more)

### Community 28 - "createClient"
Cohesion: 0.12
Nodes (26): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+18 more)

### Community 29 - "cart-totals.ts"
Cohesion: 0.12
Nodes (19): CartContents(), CartEmptyState(), CartTotalsSummary(), FulfilmentToggle(), ToggleOption(), OrderPlacedScreen(), OrderSummaryRows(), PlacedOrder (+11 more)

### Community 30 - "devDependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "customer-profile.ts"
Cohesion: 0.11
Nodes (24): ResolvedMobileProfile(), SearchField(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), AssignedRiderCard(), AvatarButton() (+16 more)

### Community 32 - "eta.ts"
Cohesion: 0.23
Nodes (9): GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, Coordinates, EtaResult, ACTIVE_KITCHEN_STATUSES (+1 more)

### Community 33 - "validation/admin.ts"
Cohesion: 0.14
Nodes (19): ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput, createEmployeeSchema, RiderDetailsInput, riderDetailsSchema (+11 more)

### Community 34 - "engine.ts"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "manage/orders/page.tsx"
Cohesion: 0.07
Nodes (49): Customer Management, Key Files to Check, Navigation & Onboarding, Order Cancellation, Order Management, Persona: Newly Hired Manager — "Ms. Cruz, first week", Red Flags, Review Checklist (+41 more)

### Community 37 - "xss.test.tsx"
Cohesion: 0.19
Nodes (8): contactDetailsSchema, ReviewSubmission, reviewSubmissionSchema, ref_node_path, INJECTION_PAYLOADS, sourceFiles(), sourceFiles(), XSS_PAYLOADS

### Community 38 - "routers/addons.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "riders.ts"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createRider(), deleteRider(), getRiderById() (+7 more)

### Community 40 - "employee-modal.tsx"
Cohesion: 0.09
Nodes (40): employeeFormSchema(), EmployeeModal(), EMPTY_RIDER, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+32 more)

### Community 41 - "track-order-screen.test.tsx"
Cohesion: 0.14
Nodes (12): AssignedRider, geocode(), readAssignedRider(), readTrackedOrder(), TrackedOrder, getOrderEtaAction, Handler, handlers (+4 more)

### Community 42 - "Details"
Cohesion: 0.08
Nodes (25): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+17 more)

### Community 43 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "validate-ncr.ts"
Cohesion: 0.15
Nodes (16): POST, validateAddress(), DeliveryDetailsPage(), getDeliveryDetail(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection (+8 more)

### Community 45 - "brand-panel.tsx"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "requireManageAccess"
Cohesion: 0.13
Nodes (16): Authentication Bypass, S10: Webhook security (🟡 Low), S4: Disabled account lockout (🟠 High), 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026) (+8 more)

### Community 47 - "delivery-details-client.tsx"
Cohesion: 0.12
Nodes (14): Code Consistency, DeliveryDetailsClient(), DeliveryDetailsClientProps, DeliveryMap(), MapContent, Structure and naming, DeliveryData, DeliveryItem (+6 more)

### Community 48 - "site-footer.tsx"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "cart-line-row.tsx"
Cohesion: 0.31
Nodes (8): CartLineRow(), QuantityStepper(), StepButton(), F7. Stepper: type the quantity — ❌, useCartAction(), clampQuantity(), MAX_QUANTITY, MIN_QUANTITY

### Community 50 - "routers/orders.ts"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "date-of-birth.ts"
Cohesion: 0.19
Nodes (15): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, employeeDateOfBirthSchema, latestBirthdate() (+7 more)

### Community 52 - "actions/orders.ts"
Cohesion: 0.11
Nodes (25): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, ensureDeliveryRow() (+17 more)

### Community 53 - "customer-signup-form.tsx"
Cohesion: 0.09
Nodes (41): AuthTabs(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginForm(), ForgotPasswordForm() (+33 more)

### Community 54 - "P2 — if time allows"
Cohesion: 0.12
Nodes (17): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+9 more)

### Community 55 - "actions.ts"
Cohesion: 0.08
Nodes (30): ActionResult, EMPLOYEE_ROLE_REDIRECTS, EmployeeLoginResult, RegisterResult, requestPasswordReset(), dateOfBirthSchema, EMPLOYEE_SIGN_IN_FAILED, EmployeeLoginField (+22 more)

### Community 56 - "checkout-screen.tsx"
Cohesion: 0.11
Nodes (18): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+10 more)

### Community 57 - "fix-transactions.js"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "read-placed-order.ts"
Cohesion: 0.27
Nodes (10): formatOrderTime(), fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL (+2 more)

### Community 59 - "deliveries.ts"
Cohesion: 0.24
Nodes (9): GET(), PATCH(), GET(), getDeliveries(), getDeliveryById(), RouteParams, updateDelivery(), DeliveryUpdateInput (+1 more)

### Community 60 - "next"
Cohesion: 0.11
Nodes (27): DELETE(), PATCH(), RouteParams, DELETE(), POST(), DELETE(), GET(), POST() (+19 more)

### Community 62 - "confirmation/page.tsx"
Cohesion: 0.17
Nodes (13): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+5 more)

### Community 63 - "16. UI/UX designer — "Mika, joins to polish the product before the defense""
Cohesion: 0.14
Nodes (14): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+6 more)

### Community 64 - "sidebar.tsx"
Cohesion: 0.10
Nodes (12): logout(), DeliverLayout(), handleLogout(), handleLogOut(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem (+4 more)

### Community 65 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "menu-actions.test.ts"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 67 - "notifications.ts"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "order-summary-card.tsx"
Cohesion: 0.16
Nodes (19): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, orderTypeFor(), foldPaymentStatus() (+11 more)

### Community 69 - "delivery-assignment.ts"
Cohesion: 0.30
Nodes (12): canAcceptDelivery(), canReleaseDelivery(), DeliveryAssignment, FINISHED_STATUSES, fold(), isAssignedTo(), isAtDeliveryCap(), isDeliveryFinished() (+4 more)

### Community 70 - "submitCart"
Cohesion: 0.20
Nodes (13): POST(), 15. Placing an order is not atomic, 16. A customer can delete their account before picking up, 1. Store hours are only checked in the browser, 21. Customers can write orders straight into the database, 2. Cart is not re-checked at checkout, 3. Unpaid GCash/Maya orders never expire, 4. No Senior Citizen / PWD discount (+5 more)

### Community 71 - "reports-utils.ts"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "cancel-order-control.test.tsx"
Cohesion: 0.25
Nodes (7): OrderProgress, ACCEPTED, confirmCancel(), openDialog(), PREPARING, RECEIVED, refresh

### Community 73 - "report-controls.tsx"
Cohesion: 0.11
Nodes (27): getDefaultStartDate(), getToday(), ReportsContent(), StatCard(), StatCardProps, SUBTITLE_COLORS, DateInputProps, ReportDateFilters() (+19 more)

### Community 76 - "Persona: Finance / Accountant — "Mrs. Santos, closes the books every month""
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Review Checklist"
Cohesion: 0.12
Nodes (16): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical) (+8 more)

### Community 78 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): app_globals, anton, dmSans, metadata

### Community 79 - "onKeyDown"
Cohesion: 0.67
Nodes (3): isTypingTarget(), matchesCombo(), onKeyDown()

### Community 80 - "formatOrderNumber"
Cohesion: 0.50
Nodes (4): formatOrderNumber(), normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

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

### Community 95 - "toInternationalMobile"
Cohesion: 0.30
Nodes (10): EmployeeContactDetailsCard(), ContactDetailsCard(), PhoneInput(), handleChange(), handlePaste(), formatMobileNumber(), maskPhoneDigits(), PH_MOBILE_MASKED_LENGTH (+2 more)

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

### Community 104 - "vitest"
Cohesion: 0.11
Nodes (13): CustomerLoginForm(), CustomerSignupForm(), ToastTone, useValidatedValues(), Mirror(), Probe(), schema, @testing-library/react (+5 more)

### Community 105 - "password-strength.ts"
Cohesion: 0.60
Nodes (3): passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 106 - "User simulation — 17 personas + hard questions through the UI"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 108 - "The 12 questions"
Cohesion: 0.17
Nodes (12): Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store.", Q5. Manager: "Which dish do people order most between 3 and 6 PM on weekdays?", Q6. Manager: "Which customer/courier had the most late deliveries this week?" (+4 more)

### Community 109 - "Review Checklist"
Cohesion: 0.18
Nodes (10): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+2 more)

### Community 110 - "user-simulation.md"
Cohesion: 0.24
Nodes (7): Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary, Part 2 — Hard questions answered through the UI, not SQL, Patterns, Quick wins (added to `limitations.md` as L30–L32), What each screen can actually do

### Community 111 - "Limitations — gaps we can close in 1.5 days"
Cohesion: 0.20
Nodes (10): CustomerData, 30. Orders page can't filter by date, customer, payment or type (P2, high), 31. Customer list has no order totals or history, and loads every customer (P2), 32. Reports have no breakdowns and no CSV (P2), 33. No error pages; `received` status is unreachable; real types live in "mock" files (P2), Found by the designer and system analyst walkthroughs, Found by the "hard questions through the UI" walkthrough, Limitations — gaps we can close in 1.5 days (+2 more)

### Community 112 - "customer-portal-access.test.ts"
Cohesion: 0.22
Nodes (8): ref_node_fs, checkLoginAllowed, credentials, deleteSession, maybeSingle, recordLoginFailure, signInWithPassword, signOut

### Community 114 - "order-placed-screen.test.tsx"
Cohesion: 0.33
Nodes (5): order(), profile, refresh, select, walletOrder()

### Community 115 - "delivery-status.ts"
Cohesion: 0.70
Nodes (3): DeliveryTab, matchesDeliveryTab(), resolveDeliveryTab()

### Community 116 - "order-timeline.tsx"
Cohesion: 0.40
Nodes (4): StageMarker(), STATE_LABELS, StageState, TimelineStage

### Community 117 - "15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live""
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

## Knowledge Gaps
- **700 isolated node(s):** `Summary`, `F2. Group order — ❌`, `F3. Guests shouldn't see "Add to cart" — ◐`, `F4. "Find a store" — ❌`, `F6. Minimum number of items — ❌` (+695 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 878 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `password-card.tsx`, `auth.ts`, `routers/profile.ts`, `actions/menu.ts`, `roles.ts`, `deliver-sidebar.tsx`, `actions/admin.ts`, `actions/profile.ts`, `database.types.ts`, `react`, `routers/reports.ts`, `past-order.ts`, `actions/delivery.ts`, `cn`, `package.json`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `(account)/profile/page.tsx`, `createClient`, `cart-totals.ts`, `customer-profile.ts`, `eta.ts`, `manage/orders/page.tsx`, `routers/addons.ts`, `riders.ts`, `employee-modal.tsx`, `validate-ncr.ts`, `brand-panel.tsx`, `delivery-details-client.tsx`, `site-footer.tsx`, `routers/orders.ts`, `customer-signup-form.tsx`, `actions.ts`, `checkout-screen.tsx`, `deliveries.ts`, `employee/login/page.tsx`, `confirmation/page.tsx`, `sidebar.tsx`, `menu-actions.test.ts`, `notifications.ts`, `order-summary-card.tsx`, `submitCart`, `report-controls.tsx`, `app/layout.tsx`, `session.ts`, `vitest`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `createClient()` connect `createClient` to `auth.ts`, `routers/profile.ts`, `actions/menu.ts`, `deliver-sidebar.tsx`, `actions/admin.ts`, `actions/profile.ts`, `database.types.ts`, `actions/reports.ts`, `react`, `routers/reports.ts`, `past-order.ts`, `actions/delivery.ts`, `reports-charts.tsx`, `customer-orders.ts`, `actions/employee-profile.ts`, `(account)/profile/page.tsx`, `customer-profile.ts`, `eta.ts`, `manage/orders/page.tsx`, `routers/addons.ts`, `riders.ts`, `track-order-screen.test.tsx`, `validate-ncr.ts`, `requireManageAccess`, `routers/orders.ts`, `actions/orders.ts`, `actions.ts`, `read-placed-order.ts`, `deliveries.ts`, `next`, `sidebar.tsx`, `notifications.ts`, `submitCart`, `report-controls.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `submitCart()` connect `submitCart` to `Review Checklist`, `order-summary-card.tsx`, `Review Checklist`, `Review Checklist`, `actions/admin.ts`, `Details`, `User simulation — 17 personas + hard questions through the UI`, `Persona: Finance / Accountant — "Mrs. Santos, closes the books every month"`, `Review Checklist`, `Review Checklist`, `user-simulation.md`, `createClient`, `P2 — if time allows`, `checkout-screen.tsx`, `paymongo`, `next`, `16. UI/UX designer — "Mika, joins to polish the product before the defense"`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `Summary`, `F2. Group order — ❌`, `F3. Guests shouldn't see "Add to cart" — ◐` to the rest of the system?**
  _700 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `password-card.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14518002322880372 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `routers/profile.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._