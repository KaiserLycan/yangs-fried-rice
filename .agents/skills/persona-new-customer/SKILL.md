---
name: persona-new-customer
description: Review implementation as Ana (27, new customer who found the shop on Facebook). Verify the first-time ordering experience from browsing to delivery.
---

# Persona: New Customer — "Ana, 27, found the shop on Facebook"

Use this skill to review any implementation that touches the **customer-facing ordering flow**, especially first-time user experience.

## Who is Ana?

Ana is a 27-year-old who discovered the shop on social media. She has never ordered before. She opens the site, browses the menu, tries to add an item, signs up, and places her first order.

## Review Checklist

When reviewing an implementation, walk through these checks as Ana:

### Browsing & Discovery
- [ ] Can she browse the menu without signing in?
- [ ] Does the menu show clear product names, prices, and photos?
- [ ] Is the delivery fee visible before checkout? ("₱50 + ₱10/km" or similar shown on the menu)
- [ ] Can she tell if the store delivers to her area before adding items?
- [ ] Are store hours clearly shown? If the store is closed, does she see when it reopens?
- [ ] Is there a phone number or email to contact the store? (footer, `/store` page)

### Guest Add-to-Cart
- [ ] When she taps "Add" as a guest, does she see **"Sign in to order"** (not a confusing error toast)?
- [ ] Does the "Sign in to order" button link to `/login?next=/menu` so she returns to the menu after login?
- [ ] Is her menu position preserved after signing in?

### Sign-Up Flow
- [ ] Is the sign-up form reasonable? (not too many fields)
- [ ] Does the password strength meter appear on sign-up (not just profile)?
- [ ] Is there an age checkbox ("I am at least 18, or have a parent's permission") instead of a birthday field?
- [ ] After email confirmation, does she land back on the menu (not a dead-end page)?
- [ ] Is there a "Resend confirmation" option if she misses the email?

### First Order
- [ ] Can she add items, customise add-ons, and set special instructions?
- [ ] Does the cart show a clear total including delivery fee?
- [ ] Are sold-out items greyed out with `grayscale opacity-60`?
- [ ] Does checkout clearly show payment options (GCash/Maya, Cash on Delivery, Pay in Store)?
- [ ] If she opens the site at 6:30 PM (after hours), is she blocked from ordering on the server side too?

### After Ordering
- [ ] Can she track her order in real time?
- [ ] Does she receive a notification when the order status changes?
- [ ] Is the order number readable (not a raw UUID)?

## Key Files to Check
- `components/menu/menu-screen.tsx` — menu rendering, guest experience
- `components/menu/product-card.tsx` — sold-out styling
- `lib/actions/cart.ts` — `submitCart`, guest check at line ~71
- `app/(auth)/actions.ts` — post-signup redirect
- `components/auth/customer-signup-form.tsx` — signup form
- `lib/store-hours.ts` — store hours check
- `lib/site/site-info.ts` — contact details

## Red Flags
- Guest sees a raw error toast instead of a guided sign-in prompt
- Sign-up flow has more than 4-5 fields
- No server-side store hours enforcement
- Sold-out items still have full-colour photos and an "Add" button
- No contact information anywhere on the site
