# Phase 4 — Security & Testing Report

**Project:** Yang's Fried Rice — Ordering & Restaurant Management System
**Stack:** Next.js 14 (App Router), React 18, TypeScript, Supabase (PostgreSQL, Auth, Storage)
**Branch tested:** `QAbugFix`
**Test command:** `npm test` (Vitest)

> **Update, 27 Sep 2026 (issue #114):** this report describes the system as tested at the time. Since then the shop is
> pickup-only: the rider role, the `/deliver` area, `/api/riders`, `/api/deliveries` and the `rider` / `delivery`
> tables are gone, so every rider row below is historical. The rest was tightened further: RLS is on for every public
> table including `employee`, customers can only place orders through `submit_cart_to_order`, disabled accounts are
> refused by every guard and by the database, and the tests for it are in `__tests__/security/`.

---

## How this report was produced, and what it does not cover

Every result marked **PASS** below was produced by an automated test that runs from
the command line and can be re-run by the reader with `npm test`. Nothing in the
PASS column was filled in by hand.

Three things in the brief could **not** be produced this way, and are marked
**TO DO (manual)** rather than being claimed as done:

| Requirement | Status | Why |
|---|---|---|
| Screenshots / visual evidence | **TO DO (manual)** | Produced by running the app in a browser. Section H lists exactly which screens to capture. |
| Usability testing with real testers | **TO DO (manual)** | Requires people using the system. Section G is a ready-to-use feedback form. |
| Live-database penetration testing | **PARTIAL** | The Supabase project is not reachable from the test environment. Database-layer findings were confirmed by reading the migrations and grants; section L gives the queries to confirm them against the live database. |

Treat this document as complete for A–F and for the bug log, and as a
worked template for G and H.

---

## Test totals

| | Count |
|---|---|
| Automated test cases | **877** |
| Passed | **877** |
| Failed | **0** |
| Test files | 58 |
| — of which security-specific | 210 cases across 5 files |
| — functional / unit | 667 cases across 53 files |

Security cases by area:

| Suite | Cases | File |
|---|---|---|
| Input validation | 58 | `__tests__/security/input-validation.test.ts` |
| SQL / query injection | 63 | `__tests__/security/injection.test.ts` |
| Authentication | 15 | `__tests__/security/authentication.test.ts` |
| Authorization | 37 | `__tests__/security/authorization.test.ts` |
| XSS | 37 | `__tests__/security/xss.test.tsx` |

---

## A. Input Validation Test

Validation is defined once per field in `lib/validation/` and enforced twice —
in the form and again in the server action — so a request that skips the form
is checked the same way.

| # | Test Case | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| A1 | Empty required field (first name) | `""` | "Enter your name." | Same message returned | PASS |
| A2 | Whitespace-only name | `"   "` | "Enter your name." | Same message returned | PASS |
| A3 | Empty building/house no. | `""` | "Enter building/house number." | Same message returned | PASS |
| A4 | Empty street / barangay / city / ZIP | `""` | Field-specific message each | Each field's own message | PASS |
| A5 | Invalid email | `abc` | "Enter a valid email address." | Rejected | PASS |
| A6 | Invalid email variants | `abc@`, `@example.com`, `abc example.com`, `abc@example` | Rejected | All rejected | PASS |
| A7 | Valid email | `liza@example.com` | Accepted | Accepted | PASS |
| A8 | Mobile — too short | `917123456` (9 digits) | Rejected | Rejected | PASS |
| A9 | Mobile — too long | `91712345678` (11 digits) | Rejected | Rejected | PASS |
| A10 | Mobile — landline | `0288123456` | Rejected (must be a mobile) | Rejected | PASS |
| A11 | Mobile — letters | `abcdefghij` | Rejected | Rejected | PASS |
| A12 | Mobile — valid forms | `09171234567`, `+63 917 123 4567`, `9171234567` | All accepted, stored as `+639171234567` | Accepted and normalised | PASS |
| A13 | Password under minimum | `1234567` (7 chars) | Rejected | Rejected | PASS |
| A14 | Password at minimum | `12345678` | Accepted | Accepted | PASS |
| A15 | Manager sets employee password | `short` | Rejected, same rule | Rejected | PASS |
| A16 | Date of birth in the future | tomorrow's date | "Date of birth can't be in the future." | Message returned | PASS |
| A17 | Impossible calendar date | `2001-02-30` | Rejected | Rejected | PASS |
| A18 | Date of birth blank | `""` | Accepted (optional field) | Accepted | PASS |
| A19 | Cart quantity out of range | `0`, `-1`, `100`, `1.5` | Rejected | All rejected | PASS |
| A20 | Cart quantity in range | `1`, `99` | Accepted | Accepted | PASS |
| A21 | Review rating out of range | `0`, `6`, `-3`, `2.5` | Rejected | All rejected | PASS |
| A22 | Review rating in range | `1`–`5` | Accepted | Accepted | PASS |
| A23 | Negative money on a transaction | `subtotal: -1` | Rejected | Rejected | PASS |
| A24 | Special instructions over limit | 501 characters | Rejected (max 500) | Rejected | PASS |
| A25 | Review comment over limit | 1001 characters | Rejected (max 1000) | Rejected | PASS |
| A26 | Cancellation reason over limit | 301 characters | Rejected (max 300) | Rejected | PASS |
| A27 | Update with no fields changed | `{}` | Rejected | Rejected | PASS |
| A28 | Unknown order status | `shipped` | Rejected | Rejected | PASS |
| A29 | Illegal status jump | `pending` → `completed` | Rejected | Rejected | PASS |
| A30 | Legal status step | `preparing` → `ready` | Accepted | Accepted | PASS |
| A31 | Address missing a required part | blank street | Rejected | Rejected | PASS |
| A32 | Address optional parts blank | blank label & note | Accepted | Accepted | PASS |
| A33 | Contact details, one field invalid | valid mobile + `abc` email | Rejected | Rejected | PASS |

**Evidence:** `npx vitest run __tests__/security/input-validation.test.ts` — 58 passed.

---

## B. SQL Injection Test

### How the application was verified

The application **never builds SQL**. Every read and write goes through the
Supabase client, which sends values as parameters over PostgREST. A value such
as `' OR 1=1 --` therefore travels as data and is only ever compared as text —
it cannot become part of a statement.

Verification had three parts:

1. **Payload testing.** Eight standard injection strings were pushed through
   every validated field.
2. **Behavioural check.** Fields with a defined shape (email, phone, UUID,
   rating, quantity, status) reject the payloads outright; free-text fields
   (review comments, delivery notes) accept them **unchanged**, which is
   correct — they are stored as text and escaped when displayed.
3. **Structural scan.** An automated scan of all 209 source files fails the
   test run if anyone ever reintroduces string-built SQL or a string-built
   PostgREST filter. The scan includes a control case proving it can fail.

### Payloads used

`' OR '1'='1` · `' OR 1=1 --` · `admin'--` · `'; DROP TABLE customer; --` ·
`1' UNION SELECT NULL, email, NULL FROM auth.users --` ·
`\'; DELETE FROM "order"; --` · `) or true --` · `*/ UNION ALL SELECT 1 /*`

### Results

| # | Test Case | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| B1 | Injection in login/sign-up email | all 8 payloads | Rejected by validation | All rejected | PASS |
| B2 | Injection in mobile number | all 8 payloads | Rejected | All rejected | PASS |
| B3 | Injection where an ID is expected | all 8 payloads | Rejected (must be a UUID) | All rejected | PASS |
| B4 | Injection in order status / role | all 8 payloads | Rejected (fixed vocabulary) | All rejected | PASS |
| B5 | Injection where a number is expected | all 8 payloads | Rejected | All rejected | PASS |
| B6 | Injection in a review comment | all 8 payloads | Stored as literal text, unchanged | Stored byte-for-byte | PASS |
| B7 | Injection in special instructions | all 8 payloads | Stored as literal text, unchanged | Stored byte-for-byte | PASS |
| B8 | LIKE wildcards in a value | `100% beef`, `a_b` | Escaped so they match literally | Escaped | PASS |
| B9 | Source scan — PostgREST filter built by concatenation | whole codebase | None found | None found | PASS |
| B10 | Source scan — SQL built by concatenation | whole codebase | None found | None found | PASS |
| B11 | Source scan — raw-SQL escape hatches | whole codebase | None found | None found | PASS |
| B12 | Control: scan detects a planted injection | `` `SELECT * FROM customer WHERE email = ${email}` `` | Detected | Detected | PASS |

### Issue found and fixed

One genuine injection-class defect was found during this testing, in the menu
search endpoint:

```ts
// BEFORE — app/api/routers/products.ts
const orClause = categoryFilters.map((c) => `category_name.ilike.%${c}%`).join(",");
query = query.or(orClause, { referencedTable: "categories" });
```

`.or()` takes a **filter expression**, not a value, so a crafted
`?category=` parameter could add conditions of its own — the PostgREST
equivalent of SQL injection. It now resolves category names to IDs and matches
with `.in()`, where values are encoded by the client and cannot change the
query's shape. The B9 scan prevents this pattern returning.

**Evidence:** `npx vitest run __tests__/security/injection.test.ts` — 63 passed.

---

## C. Authentication Test

Customer accounts use Supabase Auth. Employees additionally receive a signed
session cookie (`yfr_employee_session`, a JWT) which `middleware.ts` trusts to
admit a request to `/manage` and `/deliver` — so forging that cookie was
tested directly.

| # | Test Case | Input | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| C1 | Valid login format | valid email + password | Accepted | Accepted | PASS |
| C2 | Empty login fields | `""` / `""` | Rejected | Rejected | PASS |
| C3 | Empty password only | valid email, `""` | Rejected | Rejected | PASS |
| C4 | Invalid username/password format | `abc` as email | Rejected | Rejected | PASS |
| C5 | Password requirement | under 8 characters | Rejected | Rejected | PASS |
| C6 | Employee login needs both fields | `""` / `""` | Rejected | Rejected | PASS |
| C7 | Session round-trip | valid session issued by the app | Read back correctly | Read back correctly | PASS |
| C8 | **Forged cookie** — signed with another key | attacker JWT, `role: MANAGER` | Rejected | Rejected (null) | PASS |
| C9 | **Tampered cookie** — role edited after signing | `RIDER` → `MANAGER` | Rejected | Rejected (null) | PASS |
| C10 | **Unsigned token** — `alg: none` | header `{"alg":"none"}` | Rejected | Rejected (null) | PASS |
| C11 | Expired session | exp 24h in the past | Rejected | Rejected (null) | PASS |
| C12 | Malformed cookie | `""`, `not-a-token`, `a.b.c` | Rejected | Rejected (null) | PASS |
| C13 | Valid signature, wrong payload shape | `{hello: "world"}` | Rejected | Rejected (null) | PASS |
| C14 | No signing secret configured | secret unset | Fail closed — refuse to issue or read | Throws on issue, null on read | PASS |
| C15 | Signing secret too short | `"short"` | Rejected | Rejected | PASS |
| C16 | Protected page without logging in | request to `/manage/*`, `/deliver/*`, `/cart`, `/checkout`, `/orders`, `/profile` | Redirect to login | Redirect (middleware) | **TO DO (manual)** — see H |
| C17 | Logout ends the session | click Log out | Session cleared, protected pages redirect | — | **TO DO (manual)** — see H |

### Issue found and fixed — HIGH

```ts
// BEFORE — lib/auth/session.ts
const SECRET_KEY = new TextEncoder().encode(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||   // ← public value
  "fallback_secret_for_dev_only"                  // ← public value
);
```

The employee session cookie fell back to being signed with the **anon key**,
which is published inside the browser bundle, and then with a hard-coded
string. On any deployment without a service-role key set, anyone could mint
themselves a cookie saying `role: "MANAGER"` and open the admin area.

It now requires `EMPLOYEE_SESSION_SECRET` (≥32 characters, server-side only)
and **fails closed** if it is absent. Tests C14 and C15 lock that in.

> **Action required before deploying:** add `EMPLOYEE_SESSION_SECRET` to
> `.env.local` and to the hosting environment. Any long random string, e.g.
> `openssl rand -base64 48`.

**Evidence:** `npx vitest run __tests__/security/authentication.test.ts` — 15 passed.

---

## D. Authorization Test

Three layers are tested, because each can be reached independently: the page
guard in `middleware.ts`, the REST routes under `/api` (which middleware
deliberately does **not** run on), and the server actions.

### D1 — Page access by role

| User | Page/Feature | Expected Access | Actual Access | Status |
|---|---|---|---|---|
| Manager | `/manage/dashboard` | Allowed | Allowed | PASS |
| Staff | `/manage/dashboard` | Denied | Denied | PASS |
| Rider | `/manage/dashboard` | Denied | Denied | PASS |
| Signed-out | `/manage/dashboard` | Denied | Denied | PASS |
| Manager | `/manage/reports` | Allowed | Allowed | PASS |
| Staff | `/manage/reports` | Denied | Denied | PASS |
| Manager | `/manage/customers` (Manage Users) | Allowed | Allowed | PASS |
| Staff | `/manage/customers` | Denied | Denied | PASS |
| Manager | `/manage/employee` (Manage Users) | Allowed | Allowed | PASS |
| Staff | `/manage/employee` | Denied | Denied | PASS |
| Manager / Staff | `/manage/orders`, `/manage/menu`, `/manage/kds` | Allowed | Allowed | PASS |
| Rider | `/manage/orders` | Denied | Denied | PASS |
| Any | `/manage/orders-secret` (look-alike path) | Denied | Denied | PASS |
| Manager stored as `"Manager"` / `"manager"` | `/manage/reports` | Allowed (case-insensitive) | Allowed | PASS |
| Legacy role `"Cashier"` | `/manage/orders` / `/manage/reports` | Allowed / Denied | As expected | PASS |

### D2 — Management actions by role

| User | Function | Expected | Actual | Status |
|---|---|---|---|---|
| Manager | Change another employee's role | Allowed | Allowed | PASS |
| Staff | Change a role | Denied | Denied | PASS |
| Rider | Change a role | Denied | Denied | PASS |
| Manager | Disable own account | Denied | Denied | PASS |
| Manager | Change own role | Denied | Denied | PASS |
| Manager | Disable another manager | Denied | Denied | PASS |
| Manager | Disable staff / rider | Allowed | Allowed | PASS |
| Staff / Rider | Disable anyone | Denied | Denied | PASS |
| Any user | Change own password | Allowed | Allowed | PASS |
| Staff | Change another's password | Denied | Denied | PASS |
| Manager | Change staff/rider password | Allowed | Allowed | PASS |
| Rider | Hand back **another rider's** delivery | Denied | Denied | PASS |
| Rider | Hand back **own** delivery | Allowed | Allowed | PASS |
| Rider | Edit own role or shift | Denied | Denied (read-only + server refuses) | PASS |

### D3 — API route protection

| Route group | Expected | Actual | Status |
|---|---|---|---|
| Menu reads (`GET /api/menu/*`) | Public | Public | PASS |
| Menu writes (`POST/PATCH/DELETE`) | Manager or Staff only | Guarded | PASS |
| `/api/transactions` (all) | Manager or Staff only | Guarded | PASS |
| `/api/deliveries` read | Employees only | Guarded | PASS |
| `/api/deliveries` update | Manager or Staff | Guarded | PASS |
| `/api/riders` create/update/delete | Manager only | Guarded | PASS |
| `/api/admin/*` | Manager only | Guarded (server actions) | PASS |
| Every handler in 14 router files | Guarded unless deliberately public | No unguarded handler | PASS |

### Issues found and fixed

**CRITICAL — unauthenticated write access to the API.** `middleware.ts`
excludes `/api` from its matcher, and the menu, add-on, transaction, delivery
and rider route handlers had **no authorization check of their own**. An
unauthenticated `DELETE /api/menu/products/{id}` would have deleted a product.
All such handlers now begin with `requireApiEmployee(...)`
(`lib/auth/api-guard.ts`), and test D3 fails the build if a new unguarded
handler is added.

**MEDIUM — infinite redirect loop.** An employee whose stored role was NULL or
unrecognised produced a session that passed the gate but was allowed nowhere,
so the redirect target itself redirected — the browser looped until it gave up.
Found by test D1 ("sends each role somewhere it is allowed to be"). Middleware
now treats an unresolvable role as "not an employee session" and sends the user
to the login page.

**Evidence:** `npx vitest run __tests__/security/authorization.test.ts` — 37 passed.

---

## E. XSS Test

### How the application was verified

React escapes every value interpolated into JSX, so user input is rendered as
text by default. The risk is therefore not "did we escape this string" but
"did we anywhere step outside that guarantee". Testing had two parts:
**real components were rendered with real payloads** and inspected for
executable nodes, and the source was scanned for every escape hatch.

### Payloads used

`<script>alert("xss")</script>` · `<img src=x onerror="alert(1)">` ·
`"><script>alert(String.fromCharCode(88,83,83))</script>` · `<svg/onload=alert(1)>` ·
`javascript:alert(1)` · `<iframe src='javascript:alert(1)'></iframe>` ·
`<body onload=alert(1)>` · `{{constructor.constructor('alert(1)')()}}`

### Results

| # | Test Case | Where | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| E1 | Stored profile value | customer profile card | Rendered as text; no `<script>`, `<iframe>`, `onerror`, `onload` | Text only, payload visible verbatim | PASS |
| E2 | Customer name, address, phone, special instructions, item name | staff order card | Rendered as text | Text only | PASS |
| E3 | Product name | customer order history card | Rendered as text | Text only | PASS |
| E4 | Payload survives validation unchanged | review comment, special instructions | Stored byte-for-byte (no silent stripping) | Unchanged | PASS |
| E5 | `dangerouslySetInnerHTML` anywhere | whole codebase | None | None | PASS |
| E6 | `innerHTML` / `outerHTML` assignment | whole codebase | None | None | PASS |
| E7 | `eval()` / `new Function()` | whole codebase | None | None | PASS |
| E8 | `href` bound to a user-supplied value | whole codebase | Only hard-coded routes | Only hard-coded routes | PASS |
| E9 | `src` bound to a non-image value | whole codebase | Only image URLs/previews | Only image URLs/previews | PASS |

**Note on E4.** The payload is deliberately **not** stripped or rewritten on
save. Silently editing user input corrupts legitimate text (a customer writing
`<3` or `5 > 3`) and gives false confidence; the defence is escaping at render,
which E1–E3 demonstrate.

**Note on E9.** Image sources come from our own Supabase Storage bucket. A
`javascript:` URL in an `<img src>` is not executed by any current browser.

**Evidence:** `npx vitest run __tests__/security/xss.test.tsx` — 37 passed.

---

## F. Functional Testing

656 automated cases cover the major features. The table lists each feature, how
it is tested, and the file holding the evidence.

| Feature | Test Procedure | Expected Result | Actual Result | Status | Evidence |
|---|---|---|---|---|---|
| Customer sign-up | Submit the form with valid data | Account created, redirected | Action called with normalised values; redirect issued | PASS | `__tests__/customer-signup-form.test.tsx` |
| Sign-up — server error | Duplicate email | Error shown on the form | Error displayed | PASS | same |
| Customer login | Submit valid credentials | Logged in | Submitted and redirected | PASS | `__tests__/customer-login-form.test.tsx` |
| Login validation | Bad email / empty fields | Rejected with message | Rejected | PASS | `lib/validation/login.test.ts` |
| Employee login | Identifier + password rules | Enforced | Enforced | PASS | `lib/validation/employee-login.test.ts` |
| Menu browsing | Render the menu screen | Dishes listed | Listed | PASS | `__tests__/menu-screen.test.tsx` |
| Menu search & filter | Enter a keyword / pick a category | Matching results only | Matching results | PASS | `__tests__/search-and-filter.test.ts` |
| Product listing mapping | Map a DB row to the screen shape | All fields mapped | Mapped | PASS | `lib/menu/product-listing.test.ts` |
| Add to cart | Add a dish, set quantity, add-ons | Line added / quantity merged | As expected | PASS | `__tests__/menu-actions.test.ts`, `lib/validation/cart.test.ts` |
| Cart contents | Render the cart | Lines, add-ons and totals shown | Shown | PASS | `__tests__/cart-contents.test.tsx` |
| Cart totals | Compute subtotal, delivery fee, total | Exact to the centavo | Exact, no float drift | PASS | `lib/menu/cart-totals.test.ts` |
| Quantity stepper | Increase / decrease | Clamped to 1–99 | Clamped | PASS | `lib/menu/quantity.test.ts` |
| Checkout review | Render checkout | Name, address, items, fee, total shown | Shown | PASS | `__tests__/checkout-screen.test.tsx` |
| Fulfilment choice | Pickup vs delivery | Fee applied only for delivery | Applied correctly | PASS | `lib/checkout/fulfilment-param.test.ts` |
| Place order | Submit the cart | Order created, cart locked | As expected | PASS | `__tests__/order-placed-screen.test.tsx` |
| Payment method | Choose COD / wallet / card | Correct handling per method | Correct | PASS | `__tests__/payment-status.test.ts`, `__tests__/paymongo.test.ts` |
| Order tracking | Render the tracking screen | Correct stage and headline | Correct | PASS | `__tests__/track-order-screen.test.tsx` |
| Order stages | Map stored statuses to stages | Correct stage per status | Correct | PASS | `lib/orders/order-stage.test.ts` (27 cases) |
| Take-out wording | Take-out order at "ready" | "Ready for Pick Up", never "Delivering" | Correct | PASS | `lib/orders/order-stage.test.ts` |
| Cancel order | Cancel before confirmation | Allowed; refused after | As expected | PASS | `__tests__/cancel-order-control.test.tsx` |
| Order history | List past orders | Finished orders only, correct totals | Correct | PASS | `lib/orders/past-order.test.ts` (26 cases) |
| Submit a review | Rate and comment | Saved; 1–5 enforced | Enforced | PASS | `__tests__/order-rating.test.tsx`, `lib/validation/reviews.test.ts` |
| ETA calculation | Kitchen queue + distance | Range produced; capped | Correct | PASS | `lib/eta/engine.test.ts` (21 cases) |
| Address validation | NCR / radius check | Outside area rejected | Rejected | PASS | `lib/address/validate-ncr.test.ts` |
| Delivery fee | Distance-based | Never ₱0 for delivery | Correct | PASS | `lib/menu/cart-totals.test.ts` |
| Customer profile | Edit name, DOB, contact | Saved; validated | Validated | PASS | `lib/validation/profile.test.ts` (24 cases) |
| Phone normalisation | Any typed form | Stored as `+63XXXXXXXXXX` | Normalised | PASS | `lib/validation/phone.test.ts`, `lib/profile/mobile-number.test.ts` |
| Delete account | Confirm and delete | Requires confirmation | Required | PASS | `lib/profile/delete-confirmation.test.ts` |
| Staff order queue | Map orders to cards | Real totals, formatted type | Correct | PASS | `lib/orders/order-total.test.ts`, `lib/orders/staff-actions.test.ts` |
| Staff order actions | Confirm → Ready/Deliver → Complete | Only legal transitions offered | Correct | PASS | `lib/orders/staff-actions.test.ts` |
| Order status rules | Attempt every transition | Illegal jumps refused | Refused | PASS | `lib/validation/orders.test.ts` (48 cases) |
| Menu management | Create / edit / delete dishes | Validated | Validated | PASS | `lib/validation/menu.test.ts` (38 cases) |
| Employee management | Create / edit employees | Validated; roles enforced | Enforced | PASS | `lib/validation/admin.test.ts` (22 cases) |
| Rider queue | Accept multiple deliveries | All accepted | Allowed | PASS | `lib/orders/delivery-assignment.test.ts` |
| Hand back a delivery | Release an accepted delivery | Returns to queue for any rider | Correct | PASS | `lib/orders/delivery-assignment.test.ts` (21 cases) |
| Rider profile | Role/shift read-only | Not editable | Not editable | PASS | `__tests__/rider-profile-cards.test.tsx` |
| Reports | Sales and performance figures | Correct aggregation | Correct | PASS | `lib/actions/reports.test.ts` |
| Navigation | Nav bar and sidebar | Correct links per role | Correct | PASS | `__tests__/site-nav-bar.test.tsx`, `__tests__/manage-sidebar.test.tsx` |

**Evidence:** `npm test` — 877 passed, 0 failed.

---

## G. Usability Testing — **TO DO (manual)**

This section requires real people using the system and cannot be produced
automatically. Below is the form to use. Aim for **3–5 testers**, ideally one
per role (customer, staff, rider, manager).

### Tasks to set each tester

1. **Customer:** sign up → browse the menu → add two dishes with add-ons →
   check out for delivery → track the order → leave a review.
2. **Staff:** log in → open Order Management → confirm an order → mark it
   ready → complete a take-out order → use the KDS.
3. **Rider:** log in → accept two deliveries → hand one back → upload proof for
   the other.
4. **Manager:** add an employee → edit their details → view Reports → export a PDF.

### Feedback form (one per tester)

| Aspect | Rating (1–5) | Comments |
|---|---|---|
| Ease of navigation | | |
| Readability (text size, contrast) | | |
| Interface design | | |
| Button / link placement | | |
| Error messages — clear and helpful? | | |
| Mobile responsiveness | | |
| Overall ease of use | | |

**Tester details:** name/role · device · browser · date

### Summary table to complete

| Tester | Role | Overall (1–5) | Main positive | Main problem reported | Action taken |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

---

## H. Test Evidence / Screenshots — **TO DO (manual)**

Run `npm run dev`, then capture each screen below. Suggested filename in
`docs/evidence/`.

### Validation evidence
| # | What to capture | Filename |
|---|---|---|
| 1 | Sign-up with all fields blank → field errors | `01-validation-empty.png` |
| 2 | Sign-up with email `abc` → email error | `02-validation-email.png` |
| 3 | Mobile `12345` → mobile error | `03-validation-phone.png` |
| 4 | Future date of birth → date error | `04-validation-dob.png` |
| 5 | Address outside NCR → Save disabled + reason | `05-validation-address.png` |

### Authentication evidence
| # | What to capture | Filename |
|---|---|---|
| 6 | Login with wrong password → "Incorrect email or password." | `06-auth-invalid.png` |
| 7 | Login with empty fields → button disabled / errors | `07-auth-empty.png` |
| 8 | Successful login landing page | `08-auth-success.png` |
| 9 | Log out, then browser Back → redirected to login | `09-auth-logout.png` |
| 10 | Visit `/profile` signed out → redirected to `/login` | `10-auth-protected.png` |

### Authorization evidence
| # | What to capture | Filename |
|---|---|---|
| 11 | Staff account: sidebar shows no Dashboard/Reports/Customers/Employees | `11-authz-staff-sidebar.png` |
| 12 | Staff types `/manage/dashboard` → redirected to `/manage/orders` | `12-authz-staff-blocked.png` |
| 13 | Manager sees the full sidebar | `13-authz-manager.png` |
| 14 | Rider visits `/manage/orders` → redirected to `/deliver` | `14-authz-rider-blocked.png` |

### Security evidence
| # | What to capture | Filename |
|---|---|---|
| 15 | Terminal: `npx vitest run __tests__/security/injection.test.ts` | `15-sql-injection.png` |
| 16 | Terminal: `npx vitest run __tests__/security/xss.test.tsx` | `16-xss.png` |
| 17 | Review comment containing `<script>alert(1)</script>` displayed as text | `17-xss-stored.png` |
| 18 | `curl -X DELETE http://localhost:3000/api/menu/products/<id>` → `401` | `18-api-guard.png` |
| 19 | Terminal: full `npm test` showing 877 passed | `19-all-tests.png` |

Command for #18:

```bash
curl -i -X DELETE http://localhost:3000/api/menu/products/00000000-0000-0000-0000-000000000000
# expected: HTTP/1.1 401 Unauthorized  {"error":"You must be signed in."}
```

---

## I. Bug / Issue Log

Issues found during Phase 4 testing and during the QA pass that preceded it.

### Security issues found by this phase's testing

| # | Bug/Issue | Description | Severity | Action Taken | Status |
|---|---|---|---|---|---|
| S1 | Unauthenticated API writes | Menu, add-on, transaction, delivery and rider API routes had no authorization check, and middleware skips `/api`. An anonymous `DELETE` could remove a product. | **Critical** | Added `requireApiEmployee` guard to every mutating and staff-only handler; automated test fails the build if a new handler is left unguarded | Resolved |
| S2 | Tables open to the public key | `product`, `categories`, `add_on`, `delivery`, `notification`, `reports`, `customer_address` had no row-level security and full write grants to `anon`. Reachable directly via Supabase's REST API with the published anon key, bypassing the app entirely. | **Critical** | Migration `20260921000004` enables RLS with per-role policies and revokes the anon write grants | **Fixed in code — migration must be run** |
| S3 | Forgeable employee session | Session cookie fell back to being signed with the public anon key, then a hard-coded string. Anyone could mint a `role: MANAGER` cookie. | **High** | Requires `EMPLOYEE_SESSION_SECRET` (≥32 chars) and fails closed; payload shape validated; algorithm pinned | Resolved — **set the env var** |
| S4 | PostgREST filter injection | `?category=` was pasted into an `.or()` filter expression, letting a caller add conditions. | **Medium** | Resolves names to IDs and matches with `.in()`; source scan prevents recurrence | Resolved |
| S5 | Infinite redirect loop | An employee with a NULL/unrecognised role was redirected to a page that redirected again, forever. | **Medium** | Unresolvable role now treated as "not an employee"; sent to login | Resolved |
| S6 | Unvalidated phone input | The employee-profile and customer-update endpoints accepted any text as a phone number. | **Medium** | One shared rule (`+63` + 10 digits) on client and server | Resolved |
| S7 | Unescaped LIKE wildcards | `%`/`_` in an address widened the duplicate check. | **Low** | Wildcards escaped | Resolved |
| S8 | Public menu endpoint exposed reviewer identities | `GET /api/menu/products` embedded `review(*, customer(name, profileImage_URL))`, publishing reviewers' names and profile photos on an unauthenticated endpoint. After S2's fix it would also have failed outright for signed-out visitors, because `anon` can no longer read `customer` — breaking menu search and category filtering for guests. Nothing on the menu screen used the data. | **Medium** | Embed removed; a test now fails the build if any public route reads a table `anon` cannot | Resolved |

### Functional issues found earlier in the QA pass

| # | Bug/Issue | Description | Severity | Action Taken | Status |
|---|---|---|---|---|---|
| F1 | Schema drift | Columns the app used (`order.delivery_address`, `product.image_url`, dates of birth, employee phone) existed in no migration, so a fresh database broke. | High | Migration `20260921000002` adds them | Resolved |
| F2 | Ambiguous review RPC | Two overloads of `submit_order_review` made the call ambiguous and blocked product reviews. | High | Stale overload dropped | Resolved |
| F3 | Orders list crash | Staff Orders failed with "Could not find a relationship between 'order' and 'order_add_on'". | High | Add-ons loaded separately; list no longer depends on that table | Resolved |
| F4 | Empty rider queue | Nothing ever created a `delivery` row, so riders saw nothing. | High | Trigger + back-fill, plus app-side creation | Resolved |
| F5 | Accept sent a shortened ID | Rider "Accept" passed a truncated ID that matched nothing; cards linked to the wrong order. | High | Full ID kept throughout | Resolved |
| F6 | ₱0.00 totals for staff | Totals read `total_paid`, which is 0 until cash is collected. | Medium | Totals computed from items + add-ons + delivery fee | Resolved |
| F7 | Add-ons not billed | Add-ons appeared in the cart price but never reached the order total. | Medium | Billed into the line subtotal | Resolved |
| F8 | Two disagreeing address validators | The form said "Address validated" and then sign-up refused the same address. | High | One validator for every screen; building number excluded from the lookup | Resolved |
| F9 | Take-out shown as "Delivering" | Take-out orders showed delivery wording and could never be completed. | Medium | "Ready for Pick Up" / "Picked Up" + a Picked Up action | Resolved |
| F10 | Sample data in My Orders | The screen showed invented orders when a customer had none. | Medium | Fallback removed | Resolved |
| F11 | Admin could not edit employees | Name, email, rider details and active state were shown but never saved. | Medium | All fields now saved | Resolved |
| F12 | Role casing broke permissions | A role stored as `"Manager"` failed exact-match checks. | Medium | Roles normalised everywhere | Resolved |
| F13 | Staff could open the dashboard | Only the data was hidden, not the page. | Medium | Hidden in the sidebar, blocked in middleware and on the page | Resolved |
| F14 | Add Employee form cleared itself | Fields wiped while the manager was still filling them in. | Medium | Validates first; only resets when reopened | Resolved |
| F15 | Mobile pagination overflowed | The "next" arrow was cut off. | Medium | Compact "Page 1 of 5" on small screens | Resolved |
| F16 | Sidebar covered the page | Opening it hid the content. | Medium | Pushes content; full-screen on phones | Resolved |
| F17 | Report dropdown resized | Box changed width with the selected option. | Low | Fixed width | Resolved |
| F18 | Loading skeleton mismatch | 3 placeholder cards became 4 real ones. | Low | Skeleton matches the loaded layout | Resolved |
| F19 | Test suite failed after 18:00 | Two cart tests asserted the checkout link, which `isRestaurantOpen()` disables outside 08:00–18:00 Manila. They passed during the day and failed every evening — including during this testing session. | Medium | Clock pinned in the cart tests; added `lib/store-hours.test.ts` covering the hours rule against a controlled clock | Resolved |

---

## J. Actions required before this is production-ready

1. **Run the migrations** in the Supabase SQL editor, in order:
   - `supabase/migrations/20260921000002_schema_drift_and_review_rpc_cleanup.sql`
   - `supabase/migrations/20260921000003_qa_fixes_rls_delivery_roles.sql`
   - `supabase/migrations/20260921000004_lock_down_public_tables.sql` ← closes S2

   **Reported as applied by the project owner.** Confirm with the queries in
   section L, which read the live grants and policies back.

2. **Set a session secret** in `.env.local` and in the hosting environment:
   ```bash
   EMPLOYEE_SESSION_SECRET="<output of: openssl rand -base64 48>"
   ```
   Employee login will refuse to issue a session until this exists — which is
   the intended behaviour, not a bug.

After the migration, confirm the fix by attempting an anonymous write with the
anon key:

```bash
curl -i -X POST "https://<project>.supabase.co/rest/v1/product" \
  -H "apikey: <anon key>" -H "Content-Type: application/json" \
  -d '{"product_name":"hacked","product_price":1}'
# expected: 401/403 — permission denied for table product
```

---

## L. Verifying the migration on the live database

Run these in the Supabase SQL editor. Each states what a correct result looks
like, so the output can be pasted into the report as evidence.

```sql
-- L1. Row-level security is on for every table that holds data.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('product','categories','add_on','delivery','notification',
                    'reports','customer_address','customer','employee','rider',
                    'order','order_item','transaction','review','cart','cart_item')
ORDER BY tablename;
-- expected: rowsecurity = true for every row
```

```sql
-- L2. The public anon role can no longer write anywhere.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
  AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')
ORDER BY table_name;
-- expected: 0 rows
```

```sql
-- L3. The anon role cannot read the sensitive tables.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
  AND table_name IN ('customer','customer_address','employee','rider','reports','notification')
  AND privilege_type = 'SELECT';
-- expected: 0 rows
```

```sql
-- L4. The menu is still publicly readable (the app depends on this).
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
  AND table_name IN ('product','categories','add_on')
  AND privilege_type = 'SELECT';
-- expected: 3 rows, one per table
```

```sql
-- L5. Policies and helper functions exist.
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;

SELECT proname FROM pg_proc
WHERE proname IN ('current_employee_role','is_menu_manager');
-- expected: both functions listed
```

### End-to-end checks against the live API

```bash
# L6. An anonymous write must be refused (this is the S2 fix).
curl -i -X POST "https://<project>.supabase.co/rest/v1/product" \
  -H "apikey: <anon key>" -H "Content-Type: application/json" \
  -d '{"product_name":"hacked","product_price":1}'
# expected: 401 or 403 — permission denied for table product

# L7. An anonymous read of customer data must be refused.
curl -i "https://<project>.supabase.co/rest/v1/customer?select=*" -H "apikey: <anon key>"
# expected: 401 or 403 — permission denied for table customer

# L8. The public menu must still work.
curl -i "https://<project>.supabase.co/rest/v1/product?select=product_name" -H "apikey: <anon key>"
# expected: 200 with the product list
```

### Application-level checks after the migration

| # | Check | Expected |
|---|---|---|
| L9 | Browse the menu **signed out**, then use search and a category filter | Dishes load and filter normally (this is what S8 fixed) |
| L10 | Sign up a new customer | Account and address are created |
| L11 | Sign in as a manager, edit the menu | Changes save |
| L12 | Sign in as a rider, accept and hand back a delivery | Both work |
| L13 | Customer tracking screen | Stage and ETA shown; rider's *name* may be blank — see the note below |

> **Known limitation (pre-existing, not introduced here).** Migration
> `004_employee_profile_rls.sql` limits reads of `employee` and `rider` to the
> employee themselves or a manager. A customer tracking an order therefore
> cannot read the rider's name, and the screen shows none. It degrades quietly
> rather than erroring. If the rider's first name should appear to customers,
> it needs a policy or a view that exposes just that field.

---

## K. Testing Summary

- **Total test cases:** 877 automated (+ 17 manual cases listed in sections G and H)
- **Passed:** 877
- **Failed:** 0
- **Bugs found during Phase 4 security testing:** 8 (2 critical, 1 high, 4 medium, 1 low)
- **Bugs found during the preceding QA pass:** 19
- **Fixed:** 27 of 27 in code
- **Remaining issues:**
  - Migration `…000004` reported as applied by the project owner; confirm with the queries in section L.
  - `EMPLOYEE_SESSION_SECRET` must be set in `.env.local` and in the hosting environment, or employee login will refuse to issue a session.
  - One pre-existing limitation, not a defect introduced here: a customer cannot see the rider's name on the tracking screen (section L, L13).
  - Usability testing (section G) and screenshot evidence (section H) require a human and a browser.
  - No known unresolved defect in the application code.

### Phase 4 checklist

| Item | Status |
|---|---|
| Input validation tested | ✅ 58 automated cases |
| SQL injection testing performed | ✅ 63 automated cases |
| Authentication tested | ✅ 15 automated cases (+2 manual) |
| Authorization tested | ✅ 37 automated cases |
| XSS testing performed | ✅ 37 automated cases |
| Functional testing completed | ✅ 667 automated cases |
| Usability testing completed | ⬜ Section G — needs testers |
| Test cases documented | ✅ This report |
| Screenshots / evidence included | ⬜ Section H — needs a browser |
| Bugs / issues documented | ✅ 27 logged |
| Fixes implemented | ✅ 27 fixed in code; migration applied, session secret still to set |
| Updated project / source code submitted | ✅ Branch `QAbugFix` |
| Final testing summary included | ✅ This section |
