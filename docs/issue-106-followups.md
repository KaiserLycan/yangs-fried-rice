# Issue #106 — follow-up issues to file

Issue #106 bundles roughly fifty separate asks. Eight were fixed on
`fix/more-bugs-and-ux-problems` (P1–P8: failed-payment handling, the cash
checkbox, forgot password, the dashboard, employee age, the account toggle,
and order-item snapshots). Everything below is the remainder — nothing here
is covered by that branch.

These are grouped into eight issues rather than fifty so each one is a
reviewable piece of work. Every bullet cites where it actually lives in the
code; all of it was verified against the branch, not taken on trust from the
report.

**Once these are filed, #106 can close.**

---

## A. Customer signup and form copy cleanup

> "Things to remove/revise in the signup form to make it look cleaner."

- Remove the duplicated phone example. It renders twice on one field:
  `customer-signup-form.tsx:227` (`PH_MOBILE_EXAMPLE`) and again inside the
  input at `components/ui/phone-input.tsx:117`.
- Move the DOB hint at `customer-signup-form.tsx:244` into the field label,
  as "(Optional). Must be 13 and above."
- "Address must be at least 5 characters" is a validation message
  (`lib/validation/address.ts:9`), not helper text. Note the signup form has
  no single address input — `AddressFields` renders five — so it can only
  surface via the `/api/address/validate` round trip.
- Rewrite "Save your address once and reorder in two taps."
  (`customer-signup-form.tsx:160`) into real instructions, and show it on
  mobile — it is currently `hidden md:flex`, desktop only.
- Debounce validation. `lib/forms/use-live-validation.ts:77-84` re-parses the
  whole form on every keystroke. A `useDebounce` hook already exists at
  `lib/hooks/use-debounce.ts` and is used on three manage screens.
- Add a "Clear form" control to the signup form and the employee modal.
- Suppress the browser's "save password?" prompt when a manager edits an
  *employee's* password, and make "save address" work everywhere it should.
- Login/signup switching: `components/auth/auth-tabs.tsx` uses real links, so
  keyboard switching already works. What is missing is `role="tablist"`,
  arrow-key navigation, and a visible focus ring.

## B. Cart and checkout correctness

- **Quantity can go negative.** `components/cart/cart-line-row.tsx:59-77`
  clamps only the upper bound, and the `disabled` state arrives after a 600 ms
  debounce, so fast clicks render −1, −2… and drive the line total negative.
  `clampQuantity` already exists at `lib/menu/quantity.ts:15-17` and is used
  by the other stepper.
- **"Pay in store" is offered on delivery orders** (and cash on delivery on
  pickup orders). `PAYMENT_METHODS` is mapped unfiltered in
  `payment-method-picker.tsx:46`, and the component never receives the
  fulfilment type even though the caller has it in scope.
- **The checkout ETA is fake.** `ARRIVAL_ESTIMATE = "35–45 min"`
  (`lib/checkout/arrival-estimate.ts:15`), plus a hardcoded copy at
  `cart-totals-summary.tsx:56`. A real ETA engine already exists at
  `lib/eta/engine.ts` and is used one screen later on tracking — so the
  customer sees an invented range at checkout and a computed one after.
- The menu button should stay disabled while cart items load.
- A long menu stretches the cart; give it a fixed height with sticky
  positioning, or paginate.
- No visible spinner when cancelling an order: `pending` is wired at
  `cancel-order-control.tsx:79,106,152` but nothing renders from it, and the
  dialog closes before the result is known.

## C. Order identity and terminology

- **The same order reads three different ways.** There is no shared
  `formatOrderId`. Two byte-identical `orderNumberFrom` helpers take the
  *last* four characters (`lib/checkout/placed-order.ts:44`,
  `lib/orders/read-tracked-order.ts:55`), `map-staff-order.ts:99` takes the
  *first* four, and `proof-of-delivery-modal.tsx:121` prints a raw
  `delivery_id`. Customer, kitchen and rider cannot quote a shared reference.
- **Backend says `take_out`, the UI says "Pickup"**, and manage says
  "Delivering / Pick Up" (`order-sidebar.tsx:21`). Note `order_type` is plain
  nullable text with **no CHECK constraint or enum**, which is why readers
  defensively accept every spelling — there is no enum to change.
- `order.employee_id` is null on every row and never written. Use it or drop
  it; it has no FK constraint either.
- The delivery map pin disagrees with the address because
  `components/orders/live-map-panel.tsx:3` imports its origin from
  `lib/mock-deliveries.ts` rather than `STORE_LOCATION` in `lib/eta/engine.ts`.

## D. Manager reports and modal behaviour

- **Every non-sales PDF is titled "Platform Performance Report."**
  `generatePerformancePDF` hardcodes it at `lib/actions/reports.ts:805`, and
  `normalizeReportType` collapses any unrecognised type into Menu &
  Satisfaction. The downloaded filename is type-agnostic too (line 130 of
  `report-controls.tsx`).
- PDFs contain no charts — only `jsPDF` and `jspdf-autotable` are imported,
  and `addImage` appears nowhere in the file.
- **Closing a modal discards edits silently.** `components/ui/dialog.tsx:51-58`
  calls `onClose` unconditionally on backdrop click and Escape. Worst case:
  `menu-item-detail-modal.tsx:95` already computes `isDirty` and then throws
  it away at line 208.
- `/` opens search only on the customer menu (`search-field.tsx:31`). The
  globally-mounted `ShortcutsHelp` advertises it on manage routes where it
  does nothing.
- Filter dropdowns: the triggers *are* real `<button>`s and Tab-reachable.
  The actual defects are bare-div dismiss overlays with no Escape handler
  (e.g. `app/manage/employee/page.tsx:286`), missing `aria-expanded` /
  `role="listbox"`, and `outline-none` with no replacement focus ring at
  `report-controls.tsx:53`.
- Console error on `/employee/login`: "A listener indicated an asynchronous
  response by returning true, but the message channel closed…"

## E. Site-wide UX polish

- **Toasts are invisible.** `components/ui/toast.tsx:82` uses `bg-card`
  (`#FFFCF6`) on a cream background. Positioning is bottom-centre on mobile,
  bottom-right from `md` up. `showToast(message: string)` has no tone or
  icon — widen it and copy the glyph pattern from
  `components/ui/alert.tsx:28-30`.
- **Order cards disagree.** Manage Orders uses `border-gray-200/50`
  (`order-card.tsx:53`), KDS uses `border-[#3a2e2c]` (`kds-order-card.tsx:30`).
  Neither uses the house `field-border` token (`#DDCDB8`), which is the app's
  most-used border. Align both to the token.
- Hide data labels on the 7-day chart at mobile width — it is a shared
  component, so this covers the dashboard as well as reports.
- Audit price colours: reddish in menu management, black on the customer menu.
- Standardise "Save" vs "Save changes" across all forms.
- The checkout column drops to the bottom of the page at extreme zoom-out —
  needs a `max-width` on the container, or sticky positioning.
- Clicking the profile nav link does nothing, but Ctrl+click works.
- **Add a logout button on the customer side.** Manage and deliver already
  have one — the issue asks for the same thing, not for all three.
- Tooltips on icon-only buttons. `components/ui/tooltip.tsx` already exists
  and takes a `shortcut` prop.
- **No site footer exists anywhere** (copyright, social links, contact).
- Ctrl+Z / Ctrl+Shift+Z in inputs, and page-navigation shortcuts via the
  existing `useShortcut` hook.

## F. Image handling

- **Storage leak: nothing in the codebase calls `storage.remove()`.** Four
  buckets accumulate orphans — `menu-images`, `avatars`, `emp-pfp`,
  `proof-of-delivery`. Every menu edit writes a new `${Date.now()}.webp` at
  the bucket root, and deleting a product never touches its image.
- `upsert: true` never fires on avatars because the path is unique per upload
  (`lib/actions/profile.ts:593-607`).
- **Extension/content mismatch:** `fileExt` is taken from the *original*
  filename while `compressImage` always emits WebP, so a JPEG is stored as
  `.jpg` containing WebP bytes (`employee-avatar-card.tsx:51`).
- No client-side type or size validation on any product or profile upload —
  `accept="image/*"` is only a picker hint, and the handlers catch a
  compression failure and upload the raw file anyway
  (`menu-modals.tsx:160-173`). Copy the proof-of-delivery pattern, which is
  validated properly at `lib/actions/delivery.ts:20-21,439-450`.
- Show accepted formats and max size near the upload control.
- **A manager cannot set an employee's photo** — `employee-modal.tsx:317-334`
  is display-only.
- Optional: let users crop before uploading.

## G. New features

- Discounts and promos.
- Live order-status updates with push notifications.
- Merge Yuan's rider-details branch.
- Show ETA and distance on the map panel — `live-map-panel.tsx:59-67` has a
  comment describing "Rider Ariel S. · 2.4 km away" but renders neither.

## H. Security and architecture

- **✅ Done in #114.** RLS is on for `employee` (and `rider` was dropped with pickup-only); add-on line tables have
  policies and RLS; login attempts are rate limited. The original note follows.
- **Re-enable RLS on `employee` and `rider`.** Migration
  `004_employee_profile_rls.sql:20-21` enables it and is recorded as applied,
  but it is **off** on the live database — someone disabled it since. The
  policies still exist, so re-enabling should be low-risk. While off, anyone
  with the public anon key can read staff PII and write `employee.role`.
- `cart_item_add_on` and `order_item_add_on` have RLS disabled and **no
  policies**. These need policies written before RLS is enabled, or add-ons
  break.
- No limit on failed login attempts, and no documented recovery if an account
  is locked. Forgot-password (shipped in P3) is the recovery path.
- **Rider queue visibility.** The queue is `mine ∪ unclaimed`
  (`lib/actions/delivery.ts:116-122`), which is exactly why two riders see
  different lists. Showing another rider's accepted orders with a "taken by"
  badge is a display change — the authorization half already exists in two
  layers (app check at `delivery.ts:425` and an RLS policy), so a second
  rider already cannot complete someone else's delivery.
- A per-rider cap on concurrent deliveries is **explicitly absent by design**
  (`lib/orders/delivery-assignment.ts:3-8,42-48`). Adding one is a behaviour
  change, not a bug fix.
- Multi-device session limits — recommend deferring, noted as acknowledged.
- **Move order creation behind payment confirmation.** Scoped out of P1: the
  shipped fix holds unpaid wallet orders at `awaiting_payment` so the kitchen
  never sees them, but the order row still exists before payment. Doing it
  properly needs a `checkout_intent` table and `create_order_from_cart()` as
  a Postgres function so the Deno webhook can call the same logic as
  `submitCart`. Also folds in the missing `submit_cart_to_order` RPC, which
  `lib/actions/cart.ts:704` calls and no migration defines.
