# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2478 nodes · 6608 edges · 131 communities (115 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.92)
- Token cost: 61,039 input · 1,767 output

## Graph Freshness
- Built from commit: `b98481de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Employee Profile Cards
- Authentication API Routes
- Session & Login Actions
- Database Cleanse Script
- Menu Management Actions
- Management Sidebar Shell
- Audit Log Viewer
- Shared UI Components
- Auth & Audit Tests
- Admin Customer & Employee API
- Profile & Address API
- Order Tracking Timeline
- Root Layout and Errors
- PDF Report Generation
- Products API
- Reports API Routes
- Regular Customer Persona
- Role-Based Access Rules
- Customer & Employee Admin
- Package Manifest
- Sales Dashboard
- Menu Validation Schemas
- Customer Order History API
- Employee Self-Profile API
- Form Field Validation Schemas
- Login, Signup & Password Reset
- Data Analyst Persona
- Employee Form Modal
- Categories API
- Cart Summary Components
- Dev Dependencies
- App Navigation & Pages
- Customer Page Loading States
- Menu Grid & Modals
- Delivery ETA Engine
- TypeScript Configuration
- Kitchen Display & Order Cards
- NCR Address Geocoding
- Product Add-ons API
- Transactions API
- Menu Action Test Mocks
- Admin Validation Schemas
- Panel Feature Requests
- Runtime Dependencies
- UI Hard-Question Scenarios
- Auth Pages & Error Boundaries
- Validation Utilities & Tests
- Order Issue Reporting
- Customer Notifications
- Order Actions & Logout Controls
- Staff Orders API
- Date of Birth Validation
- Order Queries & Payment Lookup
- Quantity Stepper
- Known Limitations List
- Problem Reports & Image Compression
- Order Review & Rating
- Maintenance & Webhook Scripts
- Checkout & Order Placement UI
- Menu Browsing Page
- Cart Actions & Validation
- Track Order Screen Tests
- Wallet Payment Confirmation
- Order Status Sidebar
- Delivery Arrival Window
- NPM Scripts
- Employee Login Page
- Notifications API
- PayMongo Payment Flow
- Security Testing Report
- Order Submission & Panel Feedback
- Report Date Grouping
- Senior/PWD ID Uploads
- Reports Page Controls
- Dashboard Loading Skeletons
- Placeholder Manage Pages
- Accountant Persona
- Security Analyst Persona
- Cart API & Recheck
- Image Storage Helpers
- Staff Order Mapping
- ESLint Configuration
- Next.js Configuration
- PostCSS Configuration
- Prettier Configuration
- Supabase Backend Overview
- Tailwind Configuration
- Vitest Test Setup
- Legal Compliance Persona
- Database Admin Persona
- System Analyst Persona
- UI/UX Designer Persona
- PayMongo Webhook Security
- Kitchen Staff Persona
- Restaurant Owner Persona
- QA Tester Persona
- Market Research Findings
- Password Strength Meter
- Employee Action Audit Logging
- New Customer Persona
- Senior Customer Persona
- Finance and Payment Findings
- Order ETA & Kitchen Queue
- User Simulation Personas
- Design & Analysis Roles
- Order Cancellation Control
- Customer Address Management
- Access Control Security Findings
- Reporting and Customer Data Gaps
- Docs Rewrite Script
- Developer Persona
- GitHub User Story Issues
- Manager Persona
- Issue 106 Follow-up Plan
- Customer Order Cancellation
- Cart Line Item Editing
- Switch to Cash on Delivery
- Legal Review Findings
- Competitor Comparison Analysis
- Requirements Audit
- Project README
- Injection & XSS Tests
- Rider Queue Handoff
- Vitest Configuration
- NCR Address Geocoding
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
- `Payment Method Split` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-data-analyst/SKILL.md → lib/checkout/paymongo.ts
- `Red Flags` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-data-analyst/SKILL.md → lib/checkout/paymongo.ts
- `Constraints & Data Quality` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-database-admin/SKILL.md → lib/checkout/paymongo.ts
- `Revenue Accuracy` --references--> `paymongo()`  [INFERRED]
  .agents/skills/persona-restaurant-owner/SKILL.md → lib/checkout/paymongo.ts

## Import Cycles
- None detected.

## Communities (131 total, 16 thin omitted)

### Community 0 - "Employee Profile Cards"
Cohesion: 0.13
Nodes (32): revalidate, EmployeeContactDetailsCard(), EmployeePersonalDetailsCard(), EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+24 more)

### Community 1 - "Authentication API Routes"
Cohesion: 0.12
Nodes (26): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+18 more)

### Community 2 - "Session & Login Actions"
Cohesion: 0.11
Nodes (22): ActionResult, EmployeeLoginResult, RegisterResult, createSession(), decrypt(), deleteSession(), EmployeeSessionPayload, encrypt() (+14 more)

### Community 3 - "Database Cleanse Script"
Cohesion: 0.06
Nodes (43): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+35 more)

### Community 4 - "Menu Management Actions"
Cohesion: 0.18
Nodes (26): ManageMenuInner(), uploadMenuImage(), changeOwnPassword(), getCurrentEmployee(), ActionResult, Category, createAddOn(), createCategory() (+18 more)

### Community 5 - "Management Sidebar Shell"
Cohesion: 0.08
Nodes (18): ManageLayout(), ManageShell(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, readCollapsedPreference() (+10 more)

### Community 6 - "Audit Log Viewer"
Cohesion: 0.06
Nodes (53): GET, errorToStatus(), getAuditLog(), CATEGORY_OPTIONS, DEFAULT_SORT, ManageAuditLogInner(), ManageAuditLogPage(), Option (+45 more)

### Community 7 - "Shared UI Components"
Cohesion: 0.14
Nodes (17): AuthTabs(), Tab(), CustomerModal(), CustomerModalProps, MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, SearchField() (+9 more)

### Community 8 - "Auth & Audit Tests"
Cohesion: 0.10
Nodes (15): ref_node_fs, fixes, raw, sql, checkLoginAllowed, credentials, deleteSession, maybeSingle (+7 more)

### Community 9 - "Admin Customer & Employee API"
Cohesion: 0.11
Nodes (24): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+16 more)

### Community 10 - "Profile & Address API"
Cohesion: 0.12
Nodes (22): PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET, PATCH (+14 more)

### Community 11 - "Order Tracking Timeline"
Cohesion: 0.11
Nodes (28): OrderTimeline(), StageMarker(), STATE_LABELS, TrackOrderScreen(), isPickupOrder(), cancellationNoticeFor(), CANCELLED_HEADLINE, DELIVERY_STATUS_STAGES (+20 more)

### Community 12 - "Root Layout and Errors"
Cohesion: 0.25
Nodes (4): app_globals, anton, dmSans, metadata

### Community 13 - "PDF Report Generation"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), fetchDailyTransactionData(), formatPeso() (+20 more)

### Community 14 - "Products API"
Cohesion: 0.10
Nodes (21): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+13 more)

### Community 15 - "Reports API Routes"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "Regular Customer Persona"
Cohesion: 0.09
Nodes (40): Cart & Checkout Speed, Key Files to Check, Notifications, Order History, Payment Recovery, Persona: Regular Customer — "Mark, orders lunch to the office 3× a week", Red Flags, Reorder Flow (+32 more)

### Community 17 - "Role-Based Access Rules"
Cohesion: 0.17
Nodes (20): canAccessAdminOnly(), canAccessManage(), canAccessManagePath(), canChangeRole(), canDisableEmployee(), canResetEmployeePassword(), EMPLOYEE_ROLES, homePathForRole() (+12 more)

### Community 18 - "Customer & Employee Admin"
Cohesion: 0.17
Nodes (25): ManageCustomersInner(), loadCustomers(), EmployeeData, ManageEmployeeInner(), ROLES, Q12. Manager at 10,000 customers: "Find the customer with phone ending 4567.", ActionResult, auditChanges() (+17 more)

### Community 19 - "Package Manifest"
Cohesion: 0.08
Nodes (24): prettier, name, private, version, autoprefixer, clsx, eslint, eslint-config-next (+16 more)

### Community 20 - "Sales Dashboard"
Cohesion: 0.11
Nodes (25): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+17 more)

### Community 21 - "Menu Validation Schemas"
Cohesion: 0.27
Nodes (8): CategoryInput, categorySchema, ProductInput, productSchema, ProductUpdateInput, productUpdateSchema, SearchParams, searchParamsSchema

### Community 22 - "Customer Order History API"
Cohesion: 0.15
Nodes (15): GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders(), OrderDetail, OrderHistoryItem (+7 more)

### Community 23 - "Employee Self-Profile API"
Cohesion: 0.19
Nodes (18): PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus(), getMyEmployeeProfile() (+10 more)

### Community 24 - "Form Field Validation Schemas"
Cohesion: 0.07
Nodes (43): addressLabelSchema, AddressParts, addressPartsSchema, barangaySchema, boundedText(), buildingNoSchema, citySchema, deliveryNoteSchema (+35 more)

### Community 25 - "Login, Signup & Password Reset"
Cohesion: 0.08
Nodes (37): requestPasswordReset(), resetPassword(), LoginFormInner(), FIELD_LABELS, readSignupForm(), SignupFormInner(), handleFormChange(), EmployeeLoginFormInner() (+29 more)

### Community 26 - "Data Analyst Persona"
Cohesion: 0.17
Nodes (11): Customer Analytics, Data Exports, Data Quality, Date Boundaries, Key Files to Check, Payment Method Split, Persona: Data Analyst — "Carla, builds the weekly report for the owner", Red Flags (+3 more)

### Community 27 - "Employee Form Modal"
Cohesion: 0.18
Nodes (18): employeeFormSchema(), EmployeeModal(), EmployeeModalProps, FormSnapshot, inputClass(), ROLES, SHIFTS, snapshotFields() (+10 more)

### Community 28 - "Categories API"
Cohesion: 0.21
Nodes (12): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+4 more)

### Community 29 - "Cart Summary Components"
Cohesion: 0.12
Nodes (16): CartContents(), CartEmptyState(), CartTotalsSummary(), DesktopCartRail(), OrderSummaryRows(), 1. Store hours are only checked in the browser, calculateDeliveryFee(), CartLine (+8 more)

### Community 30 - "Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+15 more)

### Community 31 - "App Navigation & Pages"
Cohesion: 0.12
Nodes (23): revalidate, Window, ResolvedMobileProfile(), NAV_LINKS, NavSection, ResolvedProfileActions(), SiteNavBar(), AvatarButton() (+15 more)

### Community 32 - "Customer Page Loading States"
Cohesion: 0.14
Nodes (16): CartPage(), CheckoutPage(), OrderDetailPage(), OrdersPage(), ProfilePage(), MenuPage(), BottomTab, BottomTabBar() (+8 more)

### Community 33 - "Menu Grid & Modals"
Cohesion: 0.12
Nodes (23): FilterDropdown(), MenuGrid(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema, ConfirmationModalProps (+15 more)

### Community 34 - "Delivery ETA Engine"
Cohesion: 0.16
Nodes (19): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+11 more)

### Community 35 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "Kitchen Display & Order Cards"
Cohesion: 0.20
Nodes (20): KdsInner(), ManageOrdersInner(), KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal() (+12 more)

### Community 37 - "NCR Address Geocoding"
Cohesion: 0.22
Nodes (12): POST, validateAddress(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult, OUT_OF_NCR_PATTERN (+4 more)

### Community 38 - "Product Add-ons API"
Cohesion: 0.16
Nodes (16): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+8 more)

### Community 39 - "Transactions API"
Cohesion: 0.19
Nodes (13): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+5 more)

### Community 40 - "Menu Action Test Mocks"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 41 - "Admin Validation Schemas"
Cohesion: 0.13
Nodes (22): ChangePasswordInput, changePasswordSchema, ChangeRoleInput, changeRoleSchema, CreateEmployeeInput, createEmployeeSchema, UpdateCustomerInput, updateCustomerSchema (+14 more)

### Community 42 - "Panel Feature Requests"
Cohesion: 0.09
Nodes (23): Details, F10. Bulk orders page, 1–2 days in advance — ❌, F11. High demand: pause, auto-reopen, smart restriction — ❌ (repeated by Ma'am, so treat as high priority), F12. Unavailable items: grey picture — ◐, F13. Fake accounts: CAPTCHA — ❌, F14. Food not delivered — ❌, F15. All riders busy → pickup only — ❌, F16. Sign-up: redirect, password strength, remove birthday — ◐ (+15 more)

### Community 43 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, lucide-react, next (+8 more)

### Community 44 - "UI Hard-Question Scenarios"
Cohesion: 0.13
Nodes (15): Part 2 — Hard questions answered through the UI, not SQL, Patterns, Q10. Owner: "Compare this September to last September.", Q11. Manager: "Show me every order over ₱2,000 paid with cash on delivery this month." (fraud check, L6/L18), Q1. Staff, on the phone: "I paid with GCash around 3 PM yesterday, but I don't see my order.", Q2. Manager: "How many GCash orders were cancelled last week, and why?", Q4. Accountant: "September totals split by cash on delivery, GCash/Maya and pay in store.", Q5. Manager: "Which dish do people order most between 3 and 6 PM on weekdays?" (+7 more)

### Community 45 - "Auth Pages & Error Boundaries"
Cohesion: 0.06
Nodes (38): metadata, AuthShell(), BrandPanel(), ErrorScreen(), FOOTER_LINKS, SiteFooter(), NOT_OFFICIAL_RECEIPT, OrderReceipt() (+30 more)

### Community 46 - "Validation Utilities & Tests"
Cohesion: 0.15
Nodes (9): CustomerLoginForm(), CustomerSignupForm(), shortAddressLabel(), DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), AddressInput, addressSchema, @testing-library/react (+1 more)

### Community 47 - "Order Issue Reporting"
Cohesion: 0.16
Nodes (19): OpenIssuesPanel(), resolve(), ActionResult, first(), getOpenOrderIssues(), OpenOrderIssue, requireStaff(), resolveOrderIssue() (+11 more)

### Community 48 - "Customer Notifications"
Cohesion: 0.37
Nodes (10): NotificationBell(), badgeLabel(), CustomerNotification, formatNotificationTime(), NOTIFICATION_COLUMNS, NOTIFICATION_LIST_LIMIT, NotificationRow, toNotification() (+2 more)

### Community 49 - "Order Actions & Logout Controls"
Cohesion: 0.09
Nodes (23): logout(), LogOutControl(), handleLogOut(), OrderRatingDisplay(), SCORE_WORDS, AccountActions(), Button(), ButtonProps (+15 more)

### Community 50 - "Staff Orders API"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "Date of Birth Validation"
Cohesion: 0.19
Nodes (15): dateOfBirthSchema, dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate() (+7 more)

### Community 52 - "Order Queries & Payment Lookup"
Cohesion: 0.11
Nodes (24): ActionResult, attachOrderAddOns(), getOrderDetail(), Order, OrderStats, OrderSummary, OrderWithDetails, findAwaitingPaymentOrder() (+16 more)

### Community 53 - "Quantity Stepper"
Cohesion: 0.35
Nodes (8): QuantityInput(), handleChange(), QuantityStepper(), StepButton(), F7. Stepper: type the quantity — ❌, clampQuantity(), MAX_QUANTITY, MIN_QUANTITY

### Community 54 - "Known Limitations List"
Cohesion: 0.10
Nodes (21): 10. Notifications table exists but nothing writes to it, 11. (Removed), 12. No printable receipt, 13. No separate privacy notice or business details, 14. No "Best seller" labels on the menu, 17. KDS has no late-order warning or new-order sound, 18. Nothing stops repeat pickup no-shows, 19. No end-of-day cash summary at the counter (+13 more)

### Community 55 - "Problem Reports & Image Compression"
Cohesion: 0.16
Nodes (17): EmployeeAvatarCard(), ReportProblem(), ReportProblemDialog(), pickPhoto(), submit(), reportOrderIssue(), compressImage(), first() (+9 more)

### Community 56 - "Order Review & Rating"
Cohesion: 0.22
Nodes (6): POST(), RouteParams, RateOrderButton(), RateOrderDialog(), submitReview(), refresh

### Community 57 - "Maintenance & Webhook Scripts"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "Checkout & Order Placement UI"
Cohesion: 0.09
Nodes (31): CheckoutScreen(), OrderPlacedScreen(), PaymentMethodPicker(), WALLET_LABEL, formatOrderTime(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER (+23 more)

### Community 59 - "Menu Browsing Page"
Cohesion: 0.09
Nodes (20): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), MenuEmptyState(), MenuPageBody(), MenuScreen(), ResolvedBottomTabBar() (+12 more)

### Community 60 - "Cart Actions & Validation"
Cohesion: 0.19
Nodes (13): ActionResult, ActiveCart, CartItemDetail, replaceLineAddOns(), AddCartItemInput, addCartItemSchema, CancelOrderInput, cancelOrderSchema (+5 more)

### Community 61 - "Track Order Screen Tests"
Cohesion: 0.17
Nodes (7): TrackedOrder, getOrderEtaAction, Handler, handlers, renderScreen(), router, routerRefresh

### Community 62 - "Wallet Payment Confirmation"
Cohesion: 0.25
Nodes (10): CheckoutConfirmationPage(), WalletTabCloser(), walletFromParam(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal (+2 more)

### Community 63 - "Order Status Sidebar"
Cohesion: 0.33
Nodes (5): OrderSidebar(), OrderSidebarProps, OrderStatus, statuses, TAB_LABELS

### Community 64 - "Delivery Arrival Window"
Cohesion: 0.47
Nodes (3): ARRIVAL_UNKNOWN, arrivalLineFor(), arrivalWindowFrom()

### Community 65 - "NPM Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "Employee Login Page"
Cohesion: 0.32
Nodes (3): EmployeeAuthShell(), EmployeeBrandPanel(), EmployeeLoginForm()

### Community 67 - "Notifications API"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "PayMongo Payment Flow"
Cohesion: 0.12
Nodes (20): OrderSummaryCard(), handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), orderTypeFor(), createPaymentIntent(), isOnlinePaymentConfigured() (+12 more)

### Community 69 - "Security Testing Report"
Cohesion: 0.05
Nodes (39): A. Input Validation Test, Application-level checks after the migration, Authentication evidence, Authorization evidence, B. SQL Injection Test, C. Authentication Test, D1 — Page access by role, D2 — Management actions by role (+31 more)

### Community 70 - "Order Submission & Panel Feedback"
Cohesion: 0.15
Nodes (15): POST(), F5. Minimum purchase total — ❌, F9. Bulk orders: cap by capacity — ◐, Panel feedback — verified against the code and docs, Recommended plan for the panel's points, Summary, 15. Placing an order is not atomic, 16. A customer can delete their account before picking up (+7 more)

### Community 71 - "Report Date Grouping"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "Senior/PWD ID Uploads"
Cohesion: 0.27
Nodes (9): EXTENSION_BY_TYPE, isSeniorPwdIdPath(), SENIOR_PWD_ID_BUCKET, SENIOR_PWD_ID_MAX_BYTES, SENIOR_PWD_ID_TYPES, SENIOR_PWD_ID_URL_TTL_SECONDS, seniorPwdIdPath(), seniorPwdIdUploadProblem() (+1 more)

### Community 73 - "Reports Page Controls"
Cohesion: 0.15
Nodes (22): getDefaultStartDate(), getToday(), ReportsContent(), DateInputProps, ReportDateFilters(), ReportDateFiltersProps, ReportTypeSelect(), ReportsCharts() (+14 more)

### Community 76 - "Accountant Persona"
Cohesion: 0.17
Nodes (11): Key Files to Check, Payment Accuracy, Persona: Finance / Accountant — "Mrs. Santos, closes the books every month", Reconciliation, Red Flags, Reporting, Review Checklist, Senior/PWD Discounts (+3 more)

### Community 77 - "Security Analyst Persona"
Cohesion: 0.12
Nodes (16): Key Files to Check, Persona: Cybersecurity Analyst — "Dana, assesses the system before launch", Red Flags, Review Checklist, S11: Secret management (🟡 Low), S12: API exposure (🟢 Info), S1: RLS on employee and rider (🔴 Critical), S2: Live database up to date (🔴 Critical) (+8 more)

### Community 78 - "Cart API & Recheck"
Cohesion: 0.23
Nodes (11): DELETE(), POST(), DELETE(), GET(), handleAddToCart(), 2. Cart is not re-checked at checkout, addCartItem(), addOnProblem() (+3 more)

### Community 79 - "Image Storage Helpers"
Cohesion: 0.27
Nodes (9): uploadProfileImage(), removeStoredImages(), ALLOWED_IMAGE_TYPES, EXTENSION_BY_TYPE, ImageBucket, imageExtensionFor(), imageUploadProblem(), MAX_IMAGE_UPLOAD_BYTES (+1 more)

### Community 80 - "Staff Order Mapping"
Cohesion: 0.17
Nodes (16): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+8 more)

### Community 81 - "ESLint Configuration"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

### Community 85 - "Supabase Backend Overview"
Cohesion: 0.22
Nodes (9): Audit log, Database functions (RPC), Edge functions, Other tables worth knowing, Realtime, Row Level Security, Storage buckets, Supabase (+1 more)

### Community 91 - "Legal Compliance Persona"
Cohesion: 0.12
Nodes (15): J10: Evidence for Disputes (🟡), J1: Personal Data Exposure (🔴 — Data Privacy Act), J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754), J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act), J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025), J5: Privacy Notice (🟠 — Data Privacy Act), J6: Minors (🟠 — Civil Code), J7: Delivery Photos (🟠 — Data Privacy Act) (+7 more)

### Community 92 - "Database Admin Persona"
Cohesion: 0.17
Nodes (11): Cleanup Jobs (pg_cron), Constraints & Data Quality, Data Integrity Checks, Indexes, Key Files to Check, Migration Hygiene, Persona: Database Admin — "Rica, keeps Supabase healthy", Red Flags (+3 more)

### Community 93 - "System Analyst Persona"
Cohesion: 0.15
Nodes (12): Business Rules — Single Source of Truth, Documentation Accuracy, Key Files to Check, Order Lifecycle, Persona: System Analyst — "Paolo, documents the system for the final paper", Red Flags, Requirements Traceability, Review Checklist (+4 more)

### Community 94 - "UI/UX Designer Persona"
Cohesion: 0.15
Nodes (12): Copy Consistency, Flow Friction, Fonts & Dark Mode, Key Files to Check, Mobile & Accessibility, Persona: UI/UX Designer — "Mika, polishes the product before the defense", Red Flags, Review Checklist (+4 more)

### Community 95 - "PayMongo Webhook Security"
Cohesion: 0.29
Nodes (5): S10: Webhook security (🟡 Low), ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 96 - "Kitchen Staff Persona"
Cohesion: 0.17
Nodes (11): Counter Pickup, KDS Controls, KDS Display, Key Files to Check, Order Workflow, Persona: Kitchen Staff — "Jun, kitchen and counter", Price Protection, Red Flags (+3 more)

### Community 97 - "Restaurant Owner Persona"
Cohesion: 0.17
Nodes (11): Business Intelligence, Cash Management, Key Files to Check, Persona: Restaurant Owner — "Mr. Yang", Red Flags, Revenue Accuracy, Review Checklist, Staff Accountability (+3 more)

### Community 98 - "QA Tester Persona"
Cohesion: 0.17
Nodes (11): Direct Database Writes (Critical — L21), Double-Submit Race (L15), Input Boundary Testing, Key Files to Check, Persona: QA Tester — "Paolo, tries to break things", Red Flags, Review Checklist, RLS Verification (+3 more)

### Community 99 - "Market Research Findings"
Cohesion: 0.17
Nodes (12): Business logic from ordering platforms, Features still lacking, Lacking — compared with current restaurant ordering apps, Philippine market insights (for the paper), Real-world scenarios still not handled, Round 3 — web articles, app reviews and social media, Security measures still lacking, Sources (+4 more)

### Community 100 - "Password Strength Meter"
Cohesion: 0.48
Nodes (4): PasswordStrengthMeter(), passwordStrength, PasswordStrengthLabel, scoreOf()

### Community 101 - "Employee Action Audit Logging"
Cohesion: 0.33
Nodes (3): AppAuditAction, EmployeeActionEntry, SessionClient

### Community 102 - "New Customer Persona"
Cohesion: 0.18
Nodes (10): After Ordering, Browsing & Discovery, First Order, Guest Add-to-Cart, Key Files to Check, Persona: New Customer — "Ana, 27, found the shop on Facebook", Red Flags, Review Checklist (+2 more)

### Community 103 - "Senior Customer Persona"
Cohesion: 0.18
Nodes (10): Cash Payment Flow, Contact & Help, Key Files to Check, Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID", Readability & Accessibility, Red Flags, Review Checklist, Senior Citizen / PWD Discount (RA 9994, RA 10754) (+2 more)

### Community 104 - "Finance and Payment Findings"
Cohesion: 0.29
Nodes (7): 26. Live database is missing 5 migrations — RLS is off on `employee` (P0), 27. Pay-in-store sales never marked paid; payment values in 5 spellings (P1), 29. Terms promise card payments and refunds that don't exist; map credits hidden (P1), Found by the security and finance walkthroughs (26 Sep 2026), 14. Finance / accountant — "Mrs. Santos, closes the books every month", Top findings across all personas, paymongo()

### Community 105 - "Order ETA & Kitchen Queue"
Cohesion: 0.23
Nodes (9): GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, readArrivalQuote(), Coordinates, EtaResult, ACTIVE_KITCHEN_STATUSES (+1 more)

### Community 106 - "User Simulation Personas"
Cohesion: 0.17
Nodes (12): 10. Database admin — "Rica, keeps Supabase healthy", 11. Data analyst — "Carla, builds the weekly report for the owner", 12. Data scientist — "Miguel, wants to predict demand and improve the ETA", 1. New customer — "Ana, 27, found the shop on Facebook", 2. Regular customer — "Mark, orders lunch to the office 3× a week", 3. QA tester — "Paolo, tries to break things", 4. Developer — "Kai, joins the team next sprint", 5. Young customer — "Bea, 15, orders with her own GCash" (+4 more)

### Community 107 - "Design & Analysis Roles"
Cohesion: 0.13
Nodes (15): 16. UI/UX designer — "Mika, joins to polish the product before the defense", 17. System analyst — "Paolo, documents the system for the final paper", Business rules in more than one place, Context: actors and external systems, Copy and terminology, Flow review, Mobile and accessibility, Order lifecycle as built (`VALID_TRANSITIONS`, `lib/validation/orders.ts:75`) (+7 more)

### Community 108 - "Order Cancellation Control"
Cohesion: 0.22
Nodes (10): CancelOrderControl(), withdrawnMessage(), isCancellable(), OrderProgress, ACCEPTED, confirmCancel(), openDialog(), PREPARING (+2 more)

### Community 109 - "Customer Address Management"
Cohesion: 0.12
Nodes (30): GET(), POST(), registerCustomer(), AddressFormDialog(), handleFormChange(), fieldErrorsFrom(), UpsertAddressInput, UpsertAddressResult (+22 more)

### Community 111 - "Access Control Security Findings"
Cohesion: 0.53
Nodes (6): Authentication Bypass, S4: Disabled account lockout (🟠 High), 28. Disabled accounts stay signed in; senior/PWD ID photos are public (P1), 13. Cybersecurity analyst — "Dana, hired to assess the system before launch", requireManageAccess(), requireReportAccess()

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

### Community 118 - "Customer Order Cancellation"
Cohesion: 0.50
Nodes (4): POST(), RouteParams, cancelCustomerOrder(), getCancellationErrorMessage()

### Community 119 - "Cart Line Item Editing"
Cohesion: 0.14
Nodes (17): DELETE(), PATCH(), RouteParams, CartLineRow(), AddOnsSection(), CartLineEdit, ItemDetailModal(), handleSaveEdit() (+9 more)

### Community 120 - "Switch to Cash on Delivery"
Cohesion: 0.83
Nodes (3): SwitchToCodButton(), handleSwitch(), switchOrderToCashOnDelivery()

### Community 122 - "Legal Review Findings"
Cohesion: 0.40
Nodes (5): 15. Lawyer — "Atty. Reyes, reviews the system before the shop goes live", Findings, Queries she'd ask the team to run, Risk summary, What she'd want before launch

### Community 123 - "Competitor Comparison Analysis"
Cohesion: 0.20
Nodes (10): 1. Summary, 2. Customer ordering, 3. Payment and pricing, 4. Tracking and communication, 5. Customer accounts and retention, 6. Back office — compared with open-source systems, 7. Security, 8. Where we stand (+2 more)

### Community 124 - "Requirements Audit"
Cohesion: 0.20
Nodes (10): 🟡 Browsing and Ordering, 🟡 Menu Management, 🟢 Order History and Feedback, 🟢 Order Tracking and Management, 🟡 Payment Processing, Requirements Audit, 🟢 Search, Filters, and Recommendations, 🟡 System Administration and Support (+2 more)

### Community 125 - "Project README"
Cohesion: 0.20
Nodes (10): Business rules, Commands, Docs, External services, Folder structure, Local development setup, Tech stack, User roles (+2 more)

### Community 126 - "Injection & XSS Tests"
Cohesion: 0.21
Nodes (7): ReviewSubmission, reviewSubmissionSchema, ref_node_path, INJECTION_PAYLOADS, sourceFiles(), sourceFiles(), XSS_PAYLOADS

### Community 129 - "Rider Queue Handoff"
Cohesion: 0.29
Nodes (6): Also check (RLS), Done when, Handoff: put dispatched orders in the rider queue, The problem, What to build, Where

## Knowledge Gaps
- **779 isolated node(s):** `OnValidResult`, `ShowToast`, `Toast`, `LoginGate`, `RouteParams` (+774 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 969 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `App Navigation & Pages` to `Employee Profile Cards`, `Authentication API Routes`, `Session & Login Actions`, `Menu Management Actions`, `Management Sidebar Shell`, `Audit Log Viewer`, `Shared UI Components`, `Admin Customer & Employee API`, `Profile & Address API`, `Order Tracking Timeline`, `Root Layout and Errors`, `Products API`, `Reports API Routes`, `Regular Customer Persona`, `Role-Based Access Rules`, `Package Manifest`, `Sales Dashboard`, `Customer Order History API`, `Employee Self-Profile API`, `Login, Signup & Password Reset`, `Categories API`, `Cart Summary Components`, `Customer Page Loading States`, `Kitchen Display & Order Cards`, `NCR Address Geocoding`, `Product Add-ons API`, `Transactions API`, `Menu Action Test Mocks`, `Auth Pages & Error Boundaries`, `Validation Utilities & Tests`, `Order Issue Reporting`, `Customer Notifications`, `Order Actions & Logout Controls`, `Staff Orders API`, `Problem Reports & Image Compression`, `Order Review & Rating`, `Checkout & Order Placement UI`, `Wallet Payment Confirmation`, `Employee Login Page`, `Notifications API`, `PayMongo Payment Flow`, `Order Submission & Panel Feedback`, `Reports Page Controls`, `Placeholder Manage Pages`, `Cart API & Recheck`, `Order ETA & Kitchen Queue`, `Customer Address Management`, `Customer Order Cancellation`, `Cart Line Item Editing`, `Switch to Cash on Delivery`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Menu Management Actions` to `Authentication API Routes`, `Session & Login Actions`, `Management Sidebar Shell`, `Audit Log Viewer`, `Admin Customer & Employee API`, `Profile & Address API`, `PDF Report Generation`, `Products API`, `Reports API Routes`, `Regular Customer Persona`, `Customer & Employee Admin`, `Sales Dashboard`, `Customer Order History API`, `Employee Self-Profile API`, `Login, Signup & Password Reset`, `Categories API`, `App Navigation & Pages`, `Customer Page Loading States`, `Kitchen Display & Order Cards`, `Product Add-ons API`, `Transactions API`, `Auth Pages & Error Boundaries`, `Order Issue Reporting`, `Order Actions & Logout Controls`, `Staff Orders API`, `Order Queries & Payment Lookup`, `Problem Reports & Image Compression`, `Order Review & Rating`, `Checkout & Order Placement UI`, `Menu Browsing Page`, `Cart Actions & Validation`, `Notifications API`, `Order Submission & Panel Feedback`, `Reports Page Controls`, `Cart API & Recheck`, `Image Storage Helpers`, `Employee Action Audit Logging`, `Order ETA & Kitchen Queue`, `Customer Address Management`, `Access Control Security Findings`, `Customer Order Cancellation`, `Cart Line Item Editing`, `Switch to Cash on Delivery`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `vitest` connect `Validation Utilities & Tests` to `Employee Profile Cards`, `Authentication API Routes`, `Session & Login Actions`, `Vitest Configuration`, `Audit Log Viewer`, `Auth & Audit Tests`, `Order Tracking Timeline`, `PDF Report Generation`, `Regular Customer Persona`, `Role-Based Access Rules`, `Package Manifest`, `Menu Validation Schemas`, `Form Field Validation Schemas`, `Login, Signup & Password Reset`, `Employee Form Modal`, `Cart Summary Components`, `App Navigation & Pages`, `Customer Page Loading States`, `Menu Grid & Modals`, `Delivery ETA Engine`, `Kitchen Display & Order Cards`, `NCR Address Geocoding`, `Menu Action Test Mocks`, `Admin Validation Schemas`, `Auth Pages & Error Boundaries`, `Order Issue Reporting`, `Customer Notifications`, `Order Actions & Logout Controls`, `Date of Birth Validation`, `Order Queries & Payment Lookup`, `Quantity Stepper`, `Order Review & Rating`, `Checkout & Order Placement UI`, `Menu Browsing Page`, `Cart Actions & Validation`, `Track Order Screen Tests`, `Wallet Payment Confirmation`, `Delivery Arrival Window`, `PayMongo Payment Flow`, `Report Date Grouping`, `Senior/PWD ID Uploads`, `Image Storage Helpers`, `Staff Order Mapping`, `Password Strength Meter`, `Employee Action Audit Logging`, `Order ETA & Kitchen Queue`, `Order Cancellation Control`, `Customer Address Management`, `Injection & XSS Tests`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **What connects `OnValidResult`, `ShowToast`, `Toast` to the rest of the system?**
  _779 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Employee Profile Cards` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Authentication API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Should `Session & Login Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.1053763440860215 - nodes in this community are weakly interconnected._