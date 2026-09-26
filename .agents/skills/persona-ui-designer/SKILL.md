---
name: persona-ui-designer
description: Review implementation as Mika (UI/UX designer). Verify visual consistency, design tokens, copy consistency, states, and flow friction.
---

# Persona: UI/UX Designer — "Mika, polishes the product before the defense"

Use this skill to review any implementation for **visual consistency, design tokens, copy, states coverage, and user flow friction**.

## Who is Mika?

Mika is a UI/UX designer who audits the visual language, checks that copy is consistent, reviews all states (loading, empty, error), and examines each flow for friction.

## Review Checklist

### Visual Consistency
- [ ] Are brand colours used via CSS tokens from `app/globals.css`? (not hard-coded hex)
- [ ] Count hard-coded colours: `grep -r '#[0-9A-Fa-f]\{6\}' components/ app/` — should be trending toward 0
- [ ] Are font sizes from a type scale of 6-8 steps? (not 35 different pixel sizes)
- [ ] Are corner radii from a small set? (small, medium, large, full — not 14 different values)
- [ ] Are buttons using the shared `<Button>` component? (not raw `<button>`)

### Copy Consistency
- [ ] Is "Pickup" spelled consistently? (not "Pick Up", "Picked up", `take_out`)
- [ ] Is "Cancelled" spelled consistently? (not "Canceled")
- [ ] Are order stages named the same on staff side and customer side?
- [ ] Does the "Delivering" tab not contain pickup orders that are `ready`?
- [ ] Are order numbers human-readable? (not raw UUIDs like `#69403b15`)

### States Coverage
- [ ] Loading: Do skeleton loaders exist for the changed screens?
- [ ] Empty: Are there empty states when there's no data?
- [ ] Error: Does `app/error.tsx` exist with a friendly message and retry button?
- [ ] Does `app/manage/error.tsx` exist for the admin side?
- [ ] Not found: Does `app/not-found.tsx` exist?
- [ ] Are placeholder pages (`/manage/staff`, `/manage/inventory`) hidden from production?

### Flow Friction
- [ ] First order: Does a guest see "Sign in to order" (not a confusing error)?
- [ ] Customising: Can add-ons be changed from the cart? (not delete and re-add)
- [ ] After delivery: Is there "Report a problem" and "Order again"?
- [ ] Staff: Is KDS in the sidebar?
- [ ] Manager: Can she find a customer's order by name? (not just order number)

### Mobile & Accessibility
- [ ] Is there a bottom tab bar on mobile with clear labels? ("Account" not "Me")
- [ ] Are touch targets at least 44px?
- [ ] Is text at least 14px throughout the ordering flow?
- [ ] Run Lighthouse accessibility audit

### Fonts & Dark Mode
- [ ] Are DM Sans (body) and Anton (display) loaded via `next/font`?
- [ ] If dark mode isn't built, is the `darkMode` Tailwind setting removed?
- [ ] Are there any `dark:` classes that have no effect?

## Key Files to Check
- `app/globals.css` — design tokens, colour variables
- `components/ui/button.tsx` — shared Button component
- `app/error.tsx` — error boundary
- `app/not-found.tsx` — 404 page
- `lib/orders/format.ts` — `ORDER_TYPE_LABELS`, status labels
- `components/orders/order-timeline.tsx` — order stage names

## Verification Commands
```bash
# Count hard-coded hex colours
grep -rn '#[0-9A-Fa-f]\{6\}' components/ app/ | wc -l

# Count raw <button> vs <Button>
grep -rn '<button' components/ app/ | wc -l
grep -rn '<Button' components/ app/ | wc -l

# Find text sizes under 14px
grep -rn 'text-\[9px\]\|text-\[10px\]\|text-\[11px\]\|text-\[12px\]\|text-\[13px\]' components/ app/
```

## Red Flags
- Brand colours hard-coded as hex in components (not CSS tokens)
- 35+ font sizes in use
- Raw `<button>` elements outnumber `<Button>` component usage
- No `error.tsx` anywhere in the app
- Inconsistent copy ("Pickup" / "Pick Up" / "take_out")
- Placeholder pages reachable in production
- Text smaller than 14px in the ordering flow
