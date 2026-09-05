# Profile screen: backend handoff

For the backend developer (and any AI assistant reading this repo on their
behalf). Written by the frontend developer, last updated 2026-09-05. Read
`docs/reference/frontend-integration.md` first if you haven't — this file
assumes its conventions (Supabase clients, route map, `customer` vs.
`Employee` split) and doesn't repeat them.

The profile screen (`/profile`, `app/(account)/profile/page.tsx`) was built
to one deliberate rule: **the frontend builds every screen in full and stops
at the network boundary, even where it could write the server-side code
itself.** Every card on the screen reads real data. Almost none of them save
it — a control that can't yet persist says so with a toast rather than
failing silently or pretending it worked. Six of those controls are
implementable against the schema as it stands today; the rest are waiting on
a column. Nobody reading the component code later can tell a deliberate stub
from an unfinished one, which is what this document is for.

---

## 1. What already works — don't rebuild it

- **Log out** is wired to the real, shared sign-out action
  (`app/(auth)/actions.ts`'s `logout()`), the same one the employee side
  uses. It ends the session and returns the customer to `/login`.
- **Every card reads live data.** Name, mobile number, email, member-since
  date, order count, and every saved address come from
  `lib/profile/customer-profile.ts`'s `readCustomerProfile()`, which is the
  single place on the frontend that knows the `customer` and
  `customer_address` column names. If a column renames, that is the only
  file that needs to change.

## 2. The controls that raise a toast, and what each one needs

All six raise a toast reading roughly "isn't available yet. We're still
building it." and write nothing. For each, here's the action it's waiting on
and what a successful call should do from the customer's point of view.

| Control | Where | Needs | On success |
|---|---|---|---|
| Save personal details | `components/profile/personal-details-card.tsx` | Update `customer.name`, and `customer.date_of_birth` once §3 lands | Card closes, values on screen reflect the save (today they already do, since the page reads fresh on every load) |
| Save contact details | `components/profile/contact-details-card.tsx` | Update `customer.phone_number` | Same as above |
| Change photo (the avatar itself, everywhere it renders) | `components/profile/avatar-button.tsx` | An upload path plus `customer.profile_photo_url` (or equivalent) from §3 | Avatar swaps from initials to the uploaded image |
| Add / Edit a delivery address | `components/profile/delivery-addresses-card.tsx` (`AddressFormDialog`) | Insert or update a `customer_address` row (`label`, `address_details`, and `delivery_note` once it exists) | Dialog closes, the new/edited row appears in the list |
| Delete a delivery address | Same file, delete confirmation dialog | Delete the `customer_address` row — the confirmation dialog already gates this, nothing more to add on the frontend | Row disappears from the list, header count updates |
| Set a delivery address as default | Same file | Update `customer_address.is_default`, and unset it on whichever row currently holds it — see §3, this needs to be atomic per customer | The Default badge moves to the chosen row |
| Update password | `components/profile/password-card.tsx` | Verify `currentPassword` against the account, then update it via Supabase Auth. Whatever writes `customer.password_changed_at` (§3) should fire here too | Dialog/card closes, "Last changed" starts reading a real value |
| Delete account | `components/profile/account-actions.tsx` | See §4 — semantics are yours to decide, but the customer has already been told what it does | Session ends, customer returns to `/login` (matching what log out already does) |

Every one of these is gated the same way the design asks: the delete flows
sit behind a confirmation dialog (`components/ui/dialog.tsx`), and the new
password has to pass the same minimum-length rule login and sign-up already
share before it would even reach the network in a wired version.

## 3. Columns the design needs that don't exist yet

None of these block the rest of the schema — the frontend models each one
today and renders its empty state until the column lands.

- **`customer.date_of_birth`** — nullable date. Optional when it lands: a
  customer can save their personal details without ever filling it in.
- **`customer.profile_photo_url`** (or wherever a photo reference belongs) —
  nullable text pointing at wherever the photo is stored (Supabase Storage
  bucket, most likely). There is no upload path anywhere yet, frontend or
  backend — this is a new feature, not a missing wire-up.
- **`customer.password_changed_at`** — nullable timestamp, most likely
  maintained by a database trigger on whatever updates the password, rather
  than written from the client. Purpose: the "Last changed" line on the
  password card.
- **`customer_address.is_default`** — boolean, default `false`. Needs
  "exactly one default per customer, or none" enforced somewhere — a
  partial unique index or a trigger, your call. The frontend has no opinion
  on which; it just needs the flag to read from and a way to set it.
- **`customer_address.delivery_note`** — nullable free text. A note like
  "Beside the blue gate," separate from the address itself.
- **A creation-order column on `customer_address`** — `created_at`, or a
  sequence, anything that actually orders. The table's only ordering key
  today is `address_id`, a random UUID, so the frontend has no honest way to
  say which of a customer's addresses was saved first. That's invisible
  today because sign-up only ever writes one, but it stops being invisible
  the moment a second address exists: the "Deliver to" nav label and the
  addresses card's row order are both currently sorted by UUID, which is
  stable across page loads but not chronological, and not something the
  frontend can fix without a column to order by.

## 4. Decisions already made that constrain your side

- **Email is deliberately read-only on this screen.** It's the customer's
  sign-in identity as well as a stored column, so changing it is a write to
  two systems with an asynchronous verification step in between — that's its
  own ticket, not this screen's. Don't wire a save path for it here.
- **Account deletion's semantics are yours to decide** — cascade rules,
  whether anything is soft-deleted for order history, all of that is a
  database-side call. The one constraint: the customer has already been told,
  in the confirmation dialog's own copy, that deleting "permanently deletes
  your profile and saved addresses" and nothing more. If the real
  implementation does more than that (or less), the dialog's copy needs to
  change to match, not the other way around.

## 5. What was cut from the design, and why — please don't rebuild these

Four things the Figma frames draw that the frontend deliberately left out.
All four were cut for want of a requirement or a column, not by oversight —
if one of these becomes a real requirement later, it needs a column and a
ticket like everything else here, not a quiet reappearance.

- **The "Verified mobile" badge** on the sidebar summary — the only
  completeness-style indicator either frame draws. Nothing in the system
  verifies a phone number and none is planned.
- **A typo-detection helper** on the email field ("gmial.com looks like a
  typo"). No requirement asks for it, and it isn't the kind of thing a
  computer should be confidently telling a customer about their own address.
- **A per-address contact number.** No column exists, none is planned, and
  the customer already has one number on their contact details card.
- **The desktop "Change photo" / mobile "Photo" buttons** alongside the
  avatar. The avatar itself is the one control for changing a photo at both
  breakpoints — see the toast row in §2 above, not a second affordance.

## 6. The type-generation dependency

`types/database.types.ts` is generated from the **live** Supabase schema by
`npm run supabase:types` — it is not hand-maintained. Nothing on the frontend
that references any of the five columns in §3 will typecheck or build until:

1. The migration adding them lands, and
2. `npm run supabase:types` is re-run against it.

If you add these columns, ping the frontend side once the migration is in —
regenerating the types is a one-command, one-file change, but it has to
happen before any of the six controls in §2 can be wired up for real.
