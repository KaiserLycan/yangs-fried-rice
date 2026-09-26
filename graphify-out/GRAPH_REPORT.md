# Graph Report - Yangs-fried-rice  (2026-09-27)

## Corpus Check
- Large corpus: 496 files · ~575,065 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1986 nodes · 5988 edges · 91 communities (79 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Auth Actions Requestpasswordreset
- App Api Auth Change Password Route
- App Api Customer Addresses Route
- Scripts Db Cleanse
- App Manage Menu Page
- App Manage Layout
- Lib Validation Date Of Birth Dateofbirth
- Components Menu Category Chips
- App Deliver Page
- App Api Admin Customers Id Route
- App Auth Actions Logout
- Components Orders Cancel Order Control C
- App Manage Orders Page
- Lib Actions Reports
- App Account Orders Orderid Loading
- App Api Reports Pdf Route
- App Manage Reports Page
- Components Deliver Proof Of Delivery Mod
- Components Manage Menu Menu Sidebar
- Package
- App Manage Dashboard Page
- Lib Actions Menu
- App Api Customer Orders Id Review Route
- App Api Employee Profile Deactivate Rout
- Lib Validation Date Of Birth Employeedat
- App Api Cart Submit Route
- Components Orders Order Rating Orderrati
- App Account Checkout Page
- App Api Menu Categories Id Route
- Components Cart Cart Contents
- Package Devdependencies
- App Account Profile Page
- App Account Checkout Confirmation Page
- Lib Actions Admin
- Lib Checkout Arrival Estimate
- Tsconfig
- Components Manage Kds Kds Order Card
- Lib Profile Delete Confirmation
- App Api Menu Addons Id Route
- App Api Riders Id Route
- App Manage Customers Page
- Components Ui Toast Toastprovider
- Lib Orders Format
- Package Dependencies
- App Api Routers Transactions
- App Auth Forgot Password Page
- App Manage Kds Page
- Components Deliver Delivery Map
- App Account Layout
- App Api Cart Items Id Route
- App Api Orders Id Route
- Lib Validation Date Of Birth
- Lib Validation Orders
- App Account Cart Page
- App Api Menu Products Id Route
- App Deliver Deliveryid Page
- Components Checkout Checkout Screen
- Ref Crypto
- Components Checkout Order Placed Screen
- App Api Deliveries Id Route
- App Api Cart Items Route
- App Api Docs Page
- Components Checkout Wallet Tab Closer
- Lib Checkout Read Placed Order
- Components Checkout Order Summary Card O
- Package Scripts
- Tests Menu Actions Test
- App Api Customer Notifications Id Route
- Lib Checkout Payment Methods Walletprovi
- App Account Cart Loading
- Tests Checkout Screen Test
- Lib Actions Reports Test
- Lib Orders Order Stage Orderprogress
- App Api Address Validate Route
- App Manage Dashboard Loading
- App Manage Inventory Page
- Components Cart Cart Totals Summary
- Ref Https
- App Globals
- Components Deliver Delivery Status
- Lib Orders Order Number
- Eslintrc
- Next
- Postcss Config
- Prettierrc
- Ref Node Url
- Ref Tailwindcss
- Ref Testing Library Jest Dom

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
- `start()` --calls--> `startWalletPayment()`  [EXTRACTED]
  __tests__/paymongo.test.ts → lib/checkout/paymongo.ts
- `renderScreen()` --indirect_call--> `ToastProvider()`  [INFERRED]
  __tests__/track-order-screen.test.tsx → components/ui/toast.tsx
- `handleLogout()` --calls--> `logout()`  [EXTRACTED]
  components/manage/sidebar.tsx → app/(auth)/actions.ts
- `Tab()` --calls--> `cn()`  [EXTRACTED]
  components/auth/auth-tabs.tsx → lib/utils.ts
- `ToggleOption()` --calls--> `cn()`  [EXTRACTED]
  components/cart/fulfilment-toggle.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (91 total, 12 thin omitted)

### Community 0 - "App Auth Actions Requestpasswordreset"
Cohesion: 0.05
Nodes (83): requestPasswordReset(), revalidate, RiderProfilePage(), ProfilePage(), revalidate, AuthTabs(), Tab(), CustomerLoginForm() (+75 more)

### Community 1 - "App Api Auth Change Password Route"
Cohesion: 0.05
Nodes (57): POST, POST, POST, POST, GET, changeOwnPassword(), customerLogin(), employeeLogin() (+49 more)

### Community 2 - "App Api Customer Addresses Route"
Cohesion: 0.07
Nodes (55): POST(), PATCH, DELETE, PATCH, POST, PATCH, DELETE, GET (+47 more)

### Community 3 - "Scripts Db Cleanse"
Cohesion: 0.06
Nodes (44): addressProblem(), APPLY, customerIds, db, employeeIds, itemsByCart, keptByCustomer, managers (+36 more)

### Community 4 - "App Manage Menu Page"
Cohesion: 0.09
Nodes (42): ManageMenuInner(), uploadMenuImage(), MenuGrid(), MenuGridProps, MenuItemDetailModal(), MenuItemDetailModalProps, WHY: To implement the Figma design (node 2102-5252) which requires full editing…, addOnFormSchema (+34 more)

### Community 5 - "App Manage Layout"
Cohesion: 0.08
Nodes (30): ManageLayout(), ManageShell(), DEFAULT_SIDEBAR_USER, initialsFromName(), NAV_ITEMS, NavItem, TODO: BACKEND INTEGRATION, Sidebar() (+22 more)

### Community 6 - "Lib Validation Date Of Birth Dateofbirth"
Cohesion: 0.07
Nodes (37): dateOfBirthSchema, employeeProfileUpdateSchema, addressLabelSchema, deliveryNoteSchema, emailSchema, passwordSchema, customerEmailSchema, customerPasswordSchema (+29 more)

### Community 7 - "Components Menu Category Chips"
Cohesion: 0.09
Nodes (20): CategoryChips(), ChipButton(), CategoryButton(), CategorySidebar(), AddOnsSection(), ItemSummary(), MenuEmptyState(), MenuScreen() (+12 more)

### Community 8 - "App Deliver Page"
Cohesion: 0.11
Nodes (35): DeliverHomePage(), DeliverSidebar(), fetchPageDetails(), loadSidebarQueue(), ALLOWED_PROOF_TYPES, DeliveryDetail, DeliverySummary, getAssignedDeliveries() (+27 more)

### Community 9 - "App Api Admin Customers Id Route"
Cohesion: 0.10
Nodes (32): DELETE, PATCH, GET, PATCH, PATCH, PATCH, DELETE, GET (+24 more)

### Community 10 - "App Auth Actions Logout"
Cohesion: 0.10
Nodes (22): logout(), DeliverLayout(), handleLogout(), LogOutControl(), handleLogOut(), OrderSummaryCard(), AccountActions(), DeliveryAddressesCard() (+14 more)

### Community 11 - "Components Orders Cancel Order Control C"
Cohesion: 0.10
Nodes (32): CancelOrderControl(), withdrawnMessage(), OrderTimeline(), StageMarker(), STATE_LABELS, isCollectedInStore(), TrackOrderScreen(), isPickupOrder() (+24 more)

### Community 12 - "App Manage Orders Page"
Cohesion: 0.12
Nodes (22): AcceptDeliveryModal(), AcceptDeliveryModalProps, DeliveryDetailsClientProps, DeliveryDetailsPanel(), DeliveryData, DeliveryOverviewCard(), DeliveryOverviewCardProps, DeliveryOverviewSkeleton() (+14 more)

### Community 13 - "Lib Actions Reports"
Cohesion: 0.12
Nodes (28): ActionResult, compactAmount(), CustomerSatisfaction, DailySalesRow, drawKeyValueGrid(), drawReportHeader(), formatPeso(), generatePerformancePDF() (+20 more)

### Community 14 - "App Account Orders Orderid Loading"
Cohesion: 0.11
Nodes (19): EmployeeData, ManageEmployeeInner(), ROLES, EmployeeRoleDetailsCard(), reverseRoleMap, roleDetailsSchema, roleMap, ROLES (+11 more)

### Community 15 - "App Api Reports Pdf Route"
Cohesion: 0.13
Nodes (22): GET, GET, GET, GET, POST, GET, GET, GET (+14 more)

### Community 16 - "App Manage Reports Page"
Cohesion: 0.11
Nodes (25): getDefaultStartDate(), getToday(), ReportsContent(), StatCard(), StatCardProps, SUBTITLE_COLORS, ReportDateFilters(), ReportsCharts() (+17 more)

### Community 17 - "Components Deliver Proof Of Delivery Mod"
Cohesion: 0.15
Nodes (23): ProofOfDeliveryModal(), ProofOfDeliveryModalProps, employeeFormSchema(), EmployeeModal(), EMPTY_RIDER, FormSnapshot, inputClass(), ROLES (+15 more)

### Community 18 - "Components Manage Menu Menu Sidebar"
Cohesion: 0.12
Nodes (18): MenuSidebar(), MenuSidebarProps, WHY: Allows the user to rename categories directly in the sidebar without a…, SearchField(), NAV_LINKS, NavSection, SiteNavBar(), AssignedRiderCard() (+10 more)

### Community 19 - "Package"
Cohesion: 0.06
Nodes (30): prettier, name, private, version, autoprefixer, class-variance-authority, clsx, eslint (+22 more)

### Community 20 - "App Manage Dashboard Page"
Cohesion: 0.15
Nodes (20): DashboardPage(), metadata, DashboardContent(), DashboardContentProps, ProductRanking(), ProductRankingProps, SalesChart(), SalesChartProps (+12 more)

### Community 21 - "Lib Actions Menu"
Cohesion: 0.10
Nodes (24): ActionResult, Category, getProductsByCategory(), Product, ProductWithCategory, toggleAvailability(), updateAddOn(), CategoryInput (+16 more)

### Community 22 - "App Api Customer Orders Id Review Route"
Cohesion: 0.11
Nodes (17): POST(), RouteParams, GET(), RouteParams, GET(), ActionResult, getMyOrderDetail(), getMyOrders() (+9 more)

### Community 23 - "App Api Employee Profile Deactivate Rout"
Cohesion: 0.14
Nodes (22): PATCH, PATCH, DELETE, GET, PATCH, deactivateMyEmployeeAccount(), deleteMyEmployeeAccount(), errorToStatus() (+14 more)

### Community 24 - "Lib Validation Date Of Birth Employeedat"
Cohesion: 0.11
Nodes (25): employeeDateOfBirthSchema, employeePersonalDetailsSchema, EmployeeProfileUpdateInput, RiderDetailsUpdateInput, riderDetailsUpdateSchema, AddressParts, addressPartsSchema, barangaySchema (+17 more)

### Community 25 - "App Api Cart Submit Route"
Cohesion: 0.13
Nodes (21): POST(), POST(), RouteParams, ActionResult, ActiveCart, cancelCustomerOrder(), CartItemDetail, getCancellationErrorMessage() (+13 more)

### Community 26 - "Components Orders Order Rating Orderrati"
Cohesion: 0.18
Nodes (21): OrderRatingDisplay(), PastOrderCard(), PastOrdersScreen(), reorderPastOrder(), canRate(), formatPlacedAt(), formatTotal(), isPast() (+13 more)

### Community 27 - "App Account Checkout Page"
Cohesion: 0.15
Nodes (13): CheckoutPage(), MenuPage(), MenuPageBody(), getCategories(), getProducts(), fulfilmentFromParam(), OrderType, orderTypeFor() (+5 more)

### Community 28 - "App Api Menu Categories Id Route"
Cohesion: 0.14
Nodes (17): DELETE, GET, PUT, GET, POST, createCategory(), deleteCategory(), getCategories() (+9 more)

### Community 29 - "Components Cart Cart Contents"
Cohesion: 0.16
Nodes (15): CartContents(), CartEmptyState(), FulfilmentToggle(), ToggleOption(), OrderSummaryRows(), calculateDeliveryFee(), CartLine, CartTotals (+7 more)

### Community 30 - "Package Devdependencies"
Cohesion: 0.08
Nodes (25): devDependencies, autoprefixer, eslint, eslint-config-next, eslint-config-prettier, jest, jest-environment-jsdom, jsdom (+17 more)

### Community 31 - "App Account Profile Page"
Cohesion: 0.18
Nodes (14): revalidate, MobileMenuHeader(), ResolvedMobileProfile(), ResolvedProfileActions(), ProfileAvatarCard(), ProfileHeader(), ProfileSummaryCard(), shortAddressLabel() (+6 more)

### Community 32 - "App Account Checkout Confirmation Page"
Cohesion: 0.18
Nodes (14): CheckoutConfirmationPage(), OrderDetailPage(), GET(), GET(), POST(), getOrderEtaAction(), GetOrderEtaResult, walletFromParam() (+6 more)

### Community 33 - "Lib Actions Admin"
Cohesion: 0.16
Nodes (19): ActionResult, changeOwnPassword(), Customer, Employee, EmployeeEditInput, getCurrentEmployee(), discardUnsavedMenuImage(), EmployeeRole (+11 more)

### Community 34 - "Lib Checkout Arrival Estimate"
Cohesion: 0.18
Nodes (17): quoteArrivalWindow(), arrivalWindowBounds(), BASE_DELIVERY_FEE_PHP, BASE_KITCHEN_PREP_MINUTES, CalculateEtaParams, calculateKitchenPrepMinutes(), calculateOrderEta(), calculateTransitMinutes() (+9 more)

### Community 35 - "Tsconfig"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, baseUrl, esModuleInterop, ignoreDeprecations, incremental, isolatedModules, jsx (+13 more)

### Community 36 - "Components Manage Kds Kds Order Card"
Cohesion: 0.25
Nodes (15): KdsOrderCard(), KdsOrderCardProps, OrderCard(), OrderCardProps, statusConfig, OrderDetailModal(), OrderDetailModalProps, statusConfig (+7 more)

### Community 37 - "Lib Profile Delete Confirmation"
Cohesion: 0.12
Nodes (11): DELETE_CONFIRMATION_WORD, isDeleteConfirmed(), contactDetailsSchema, signupSchema, VALID, ref_node_path, vitest, INJECTION_PAYLOADS (+3 more)

### Community 38 - "App Api Menu Addons Id Route"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createProductAddon(), deleteAddon(), getAddonById() (+7 more)

### Community 39 - "App Api Riders Id Route"
Cohesion: 0.18
Nodes (15): DELETE(), GET(), PUT(), GET(), POST(), createRider(), deleteRider(), getRiderById() (+7 more)

### Community 40 - "App Manage Customers Page"
Cohesion: 0.15
Nodes (10): CustomerData, CustomerModal(), CustomerModalProps, SortableHeader(), SortableHeaderProps, SortDirection, DialogDismiss(), DialogRequestCloseContext (+2 more)

### Community 41 - "Components Ui Toast Toastprovider"
Cohesion: 0.13
Nodes (13): ToastProvider(), AssignedRider, geocode(), readAssignedRider(), readTrackedOrder(), TrackedOrder, getOrderEtaAction, Handler (+5 more)

### Community 42 - "Lib Orders Format"
Cohesion: 0.22
Nodes (12): formatOrderType(), isDeliveryOrder(), ORDER_TYPE_LABELS, PICKUP_TYPES, first(), mapStaffOrder(), One, StaffOrderRow (+4 more)

### Community 43 - "Package Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, class-variance-authority, clsx, jose, jspdf, jspdf-autotable, leaflet, leaflet-routing-machine (+11 more)

### Community 44 - "App Api Routers Transactions"
Cohesion: 0.20
Nodes (14): createTransaction(), getTransactionById(), getTransactions(), RouteParams, updateTransactionStatus(), GET(), PATCH(), GET() (+6 more)

### Community 45 - "App Auth Forgot Password Page"
Cohesion: 0.22
Nodes (3): metadata, AuthShell(), BrandPanel()

### Community 46 - "App Manage Kds Page"
Cohesion: 0.21
Nodes (15): KdsInner(), ManageOrdersInner(), ActionResult, attachOrderAddOns(), getDetailedOrders(), getOrderDetail(), Order, OrderStats (+7 more)

### Community 47 - "Components Deliver Delivery Map"
Cohesion: 0.16
Nodes (11): DeliveryMap(), MapContent, LiveMapPanel(), DeliveryData, DeliveryItem, DeliveryLocation, MOCK_DELIVERIES, OrderStatus (+3 more)

### Community 48 - "App Account Layout"
Cohesion: 0.21
Nodes (10): FOOTER_LINKS, SiteFooter(), copyrightYears(), SITE_BRANCH, SITE_FOUNDED_YEAR, SITE_NAME, SOCIAL_LINKS, SocialLink (+2 more)

### Community 49 - "App Api Cart Items Id Route"
Cohesion: 0.24
Nodes (11): DELETE(), PATCH(), RouteParams, CartLineRow(), QuantityStepper(), StepButton(), removeCartItem(), updateCartItem() (+3 more)

### Community 50 - "App Api Orders Id Route"
Cohesion: 0.19
Nodes (12): GET, PATCH, GET, GET, errorToStatus(), getOrderDetail(), getOrders(), getOrderStats() (+4 more)

### Community 51 - "Lib Validation Date Of Birth"
Cohesion: 0.21
Nodes (14): dateOfBirthSchemaFor(), DOB_FUTURE_MESSAGE, DOB_INVALID_MESSAGE, DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_DOB_TOO_YOUNG_MESSAGE, EMPLOYEE_MIN_AGE_YEARS, latestBirthdate(), MAX_AGE_YEARS (+6 more)

### Community 52 - "Lib Validation Orders"
Cohesion: 0.18
Nodes (15): isValidTransition(), ORDER_STATUSES, OrderFilters, orderFilterSchema, OrderStatus, orderStatusSchema, PerformanceReportQuery, performanceReportQuerySchema (+7 more)

### Community 53 - "App Account Cart Page"
Cohesion: 0.24
Nodes (12): CartPage(), OrdersPage(), ProfilePage(), DesktopCartRail(), ResolvedBottomTabBar(), CartRead, EMPTY, readCart() (+4 more)

### Community 54 - "App Api Menu Products Id Route"
Cohesion: 0.18
Nodes (12): DELETE, GET, PUT, GET, POST, createProduct(), deleteProduct(), getProductById() (+4 more)

### Community 55 - "App Deliver Deliveryid Page"
Cohesion: 0.22
Nodes (13): DeliveryDetailsPage(), DeliveryDetailsClient(), getDeliveryDetail(), geocodeCandidates(), geocodeOnce(), NCR_CITY_CENTERS, NcrRejection, NcrValidationResult (+5 more)

### Community 56 - "Components Checkout Checkout Screen"
Cohesion: 0.21
Nodes (12): CheckoutScreen(), PaymentMethodPicker(), DEFAULT_BY_FULFILMENT, DEFAULT_PAYMENT_METHOD, DEFAULT_WALLET_PROVIDER, defaultPaymentMethodFor(), METHODS_BY_FULFILMENT, PAYMENT_METHODS (+4 more)

### Community 57 - "Ref Crypto"
Cohesion: 0.12
Nodes (12): ref_crypto, ref_fs, { createClient }, crypto, env, fs, supabase, crypto (+4 more)

### Community 58 - "Components Checkout Order Placed Screen"
Cohesion: 0.21
Nodes (10): OrderPlacedScreen(), SwitchToCodButton(), handleSwitch(), switchOrderToCashOnDelivery(), PlacedOrder, order(), profile, refresh (+2 more)

### Community 59 - "App Api Deliveries Id Route"
Cohesion: 0.22
Nodes (10): GET(), PATCH(), GET(), getDeliveries(), getDeliveryById(), RouteParams, updateDelivery(), DeliveryUpdateInput (+2 more)

### Community 60 - "App Api Cart Items Route"
Cohesion: 0.24
Nodes (10): DELETE(), POST(), DELETE(), GET(), ItemDetailModal(), handleAddToCart(), addCartItem(), clearCart() (+2 more)

### Community 61 - "App Api Docs Page"
Cohesion: 0.19
Nodes (4): Window, EmployeeAuthShell(), EmployeeBrandPanel(), next

### Community 62 - "Components Checkout Wallet Tab Closer"
Cohesion: 0.33
Nodes (7): WalletTabCloser(), anotherTabIsWatching(), answerAsWatcher(), hasLiveOpener(), openChannel(), Signal, WalletTab

### Community 63 - "Lib Checkout Read Placed Order"
Cohesion: 0.31
Nodes (9): fulfilmentFromOrderType(), isWalletMethod(), paymentLabelFor(), productNameOf(), NOTE: the order history screen on its own branch reads the same three, readPlacedOrder(), ITEM_GONE_LABEL, orderItemName() (+1 more)

### Community 64 - "Components Checkout Order Summary Card O"
Cohesion: 0.32
Nodes (9): handlePlaceOrder(), note(), PaymentStatusCard(), payWith(), WALLET_LABEL, foldPaymentStatus(), PaymentStatus, startWalletPayment() (+1 more)

### Community 65 - "Package Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:cleanse, db:seed, dev, format, format:check, lint (+4 more)

### Community 66 - "Tests Menu Actions Test"
Cohesion: 0.17
Nodes (11): mockDelete, mockEqForDelete, mockEqForUpdate, mockFrom, mockInsert, mockMaybeSingle, mockReadSelect, mockRemoveStoredImage (+3 more)

### Community 67 - "App Api Customer Notifications Id Route"
Cohesion: 0.35
Nodes (8): DELETE(), PATCH(), GET(), deleteNotification(), getNotifications(), markNotificationRead(), requireCustomer(), RouteParams

### Community 68 - "Lib Checkout Payment Methods Walletprovi"
Cohesion: 0.20
Nodes (7): WalletProvider, createPaymentIntent(), PaymentStart, @supabase/supabase-js, fetchMock, invoke, start()

### Community 69 - "App Account Cart Loading"
Cohesion: 0.27
Nodes (3): BottomTab, BottomTabBar(), TABS

### Community 70 - "Tests Checkout Screen Test"
Cohesion: 0.20
Nodes (5): lines, profile, push, refresh, replace

### Community 71 - "Lib Actions Reports Test"
Cohesion: 0.36
Nodes (7): SAMPLE_DAILY_ROWS, dateToPeriod(), getISOWeek(), getISOWeekYear(), groupByFrequency(), SalesRow, ReportFrequency

### Community 72 - "Lib Orders Order Stage Orderprogress"
Cohesion: 0.25
Nodes (7): OrderProgress, ACCEPTED, confirmCancel(), openDialog(), PREPARING, RECEIVED, refresh

### Community 73 - "App Api Address Validate Route"
Cohesion: 0.36
Nodes (4): POST, validateAddress(), AddressInput, addressSchema

### Community 77 - "Ref Https"
Cohesion: 0.33
Nodes (4): ref_https, CORS_HEADERS, timingSafeEqual(), verifyPaymongoSignature()

### Community 78 - "App Globals"
Cohesion: 0.33
Nodes (4): app_globals, anton, dmSans, metadata

### Community 79 - "Components Deliver Delivery Status"
Cohesion: 0.70
Nodes (3): DeliveryTab, matchesDeliveryTab(), resolveDeliveryTab()

### Community 80 - "Lib Orders Order Number"
Cohesion: 0.90
Nodes (3): normalizeOrderSearch(), orderIdRangeFor(), orderMatchesSearch()

### Community 81 - "Eslintrc"
Cohesion: 0.50
Nodes (3): extends, prettier, next/core-web-vitals

## Knowledge Gaps
- **484 isolated node(s):** `next/core-web-vitals`, `prettier`, `plugins`, `tailwindFunctions`, `refresh` (+479 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 643 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `App Api Docs Page` to `App Auth Actions Requestpasswordreset`, `App Api Auth Change Password Route`, `App Api Customer Addresses Route`, `App Manage Menu Page`, `App Manage Layout`, `App Deliver Page`, `App Api Admin Customers Id Route`, `App Auth Actions Logout`, `Components Orders Cancel Order Control C`, `App Manage Orders Page`, `App Account Orders Orderid Loading`, `App Api Reports Pdf Route`, `App Manage Reports Page`, `Components Deliver Proof Of Delivery Mod`, `Components Manage Menu Menu Sidebar`, `Package`, `App Manage Dashboard Page`, `Lib Actions Menu`, `App Api Customer Orders Id Review Route`, `App Api Employee Profile Deactivate Rout`, `App Api Cart Submit Route`, `Components Orders Order Rating Orderrati`, `App Account Checkout Page`, `App Api Menu Categories Id Route`, `Components Cart Cart Contents`, `App Account Profile Page`, `App Account Checkout Confirmation Page`, `App Api Menu Addons Id Route`, `App Api Riders Id Route`, `App Api Routers Transactions`, `App Auth Forgot Password Page`, `App Manage Kds Page`, `Components Deliver Delivery Map`, `App Account Layout`, `App Api Cart Items Id Route`, `App Api Orders Id Route`, `App Account Cart Page`, `App Api Menu Products Id Route`, `App Deliver Deliveryid Page`, `Components Checkout Checkout Screen`, `Components Checkout Order Placed Screen`, `App Api Deliveries Id Route`, `App Api Cart Items Route`, `Components Checkout Order Summary Card O`, `Tests Menu Actions Test`, `App Api Customer Notifications Id Route`, `App Account Cart Loading`, `App Api Address Validate Route`, `Components Cart Cart Totals Summary`, `App Globals`?**
  _High betweenness centrality (0.292) - this node is a cross-community bridge._
- **Why does `createClient()` connect `App Api Menu Categories Id Route` to `App Auth Actions Requestpasswordreset`, `App Api Auth Change Password Route`, `App Api Customer Addresses Route`, `App Manage Menu Page`, `App Deliver Page`, `App Api Admin Customers Id Route`, `App Auth Actions Logout`, `App Manage Orders Page`, `Lib Actions Reports`, `App Api Reports Pdf Route`, `App Manage Reports Page`, `Components Deliver Proof Of Delivery Mod`, `App Manage Dashboard Page`, `Lib Actions Menu`, `App Api Customer Orders Id Review Route`, `App Api Employee Profile Deactivate Rout`, `App Api Cart Submit Route`, `Components Orders Order Rating Orderrati`, `App Account Checkout Page`, `App Account Checkout Confirmation Page`, `Lib Actions Admin`, `App Api Menu Addons Id Route`, `App Api Riders Id Route`, `Components Ui Toast Toastprovider`, `App Api Routers Transactions`, `App Manage Kds Page`, `App Api Cart Items Id Route`, `App Api Orders Id Route`, `App Account Cart Page`, `App Api Menu Products Id Route`, `App Deliver Deliveryid Page`, `Components Checkout Order Placed Screen`, `App Api Deliveries Id Route`, `App Api Cart Items Route`, `Lib Checkout Read Placed Order`, `App Api Customer Notifications Id Route`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `vitest` connect `Lib Profile Delete Confirmation` to `App Auth Actions Requestpasswordreset`, `App Api Auth Change Password Route`, `App Manage Menu Page`, `App Manage Layout`, `Lib Validation Date Of Birth Dateofbirth`, `Components Menu Category Chips`, `App Deliver Page`, `App Auth Actions Logout`, `Components Orders Cancel Order Control C`, `Lib Actions Reports`, `App Account Orders Orderid Loading`, `Components Deliver Proof Of Delivery Mod`, `Components Manage Menu Menu Sidebar`, `Package`, `Lib Actions Menu`, `App Api Customer Orders Id Review Route`, `Lib Validation Date Of Birth Employeedat`, `App Api Cart Submit Route`, `Components Orders Order Rating Orderrati`, `App Account Checkout Page`, `App Api Menu Categories Id Route`, `Components Cart Cart Contents`, `App Account Profile Page`, `App Account Checkout Confirmation Page`, `Lib Actions Admin`, `Lib Checkout Arrival Estimate`, `Components Manage Kds Kds Order Card`, `App Manage Customers Page`, `Components Ui Toast Toastprovider`, `Lib Orders Format`, `App Account Layout`, `App Api Cart Items Id Route`, `Lib Validation Date Of Birth`, `Lib Validation Orders`, `App Deliver Deliveryid Page`, `Components Checkout Order Placed Screen`, `Components Checkout Wallet Tab Closer`, `Lib Checkout Read Placed Order`, `Components Checkout Order Summary Card O`, `Tests Menu Actions Test`, `Lib Checkout Payment Methods Walletprovi`, `Tests Checkout Screen Test`, `Lib Actions Reports Test`, `Lib Orders Order Stage Orderprogress`, `App Api Address Validate Route`, `Components Cart Cart Totals Summary`, `Components Deliver Delivery Status`, `Lib Orders Order Number`, `Ref Node Url`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `next/core-web-vitals`, `prettier`, `plugins` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Auth Actions Requestpasswordreset` be split into smaller, more focused modules?**
  _Cohesion score 0.05167322834645669 - nodes in this community are weakly interconnected._
- **Should `App Api Auth Change Password Route` be split into smaller, more focused modules?**
  _Cohesion score 0.052982456140350874 - nodes in this community are weakly interconnected._
- **Should `App Api Customer Addresses Route` be split into smaller, more focused modules?**
  _Cohesion score 0.07155399473222125 - nodes in this community are weakly interconnected._