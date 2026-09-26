---
name: persona-senior-customer
description: Review implementation as Lolo Ben (68, Senior Citizen). Verify accessibility, discount eligibility, readability, and cash payment flow.
---

# Persona: Senior Customer — "Lolo Ben, 68, has a Senior Citizen ID"

Use this skill to review any implementation that touches **accessibility, discounts, readability, or cash payment flows**.

## Who is Lolo Ben?

Lolo Ben is a 68-year-old senior citizen ordering pancit for the family. He pays cash, has trouble with small text, and is legally entitled to a 20% Senior Citizen discount.

## Review Checklist

### Senior Citizen / PWD Discount (RA 9994, RA 10754)
- [ ] Is there a "Senior Citizen / PWD" option at checkout?
- [ ] Does it ask for ID number, name on the ID, and an ID photo?
- [ ] Is the 20% discount correctly computed on the VAT-exclusive amount (divide by 1.12, then take 20% off)?
- [ ] Do staff see a "Verify ID" badge on the order?
- [ ] Does the rider see "Check senior/PWD ID on handover"?
- [ ] Is the ID photo deleted after the order is completed (Data Privacy Act)?
- [ ] Is each discounted sale recorded for BIR reporting (ID number, name, amount)?

### Readability & Accessibility
- [ ] Is all text at least 14px? (check for 9px, 11px, 12px text)
- [ ] Are touch targets at least 44px?
- [ ] Are icons labeled with words? (e.g., "Account" not just an avatar icon)
- [ ] Is the order number readable aloud? (not a raw UUID like `#69403b15`)
- [ ] Run Lighthouse accessibility audit on menu, cart, checkout, and tracking pages

### Cash Payment Flow
- [ ] Can he select Cash on Delivery easily?
- [ ] Is there a "Change for ₱___" field so the rider brings the right change? (L8)
- [ ] Is the COD cap (₱3,000) shown before checkout?
- [ ] Is the delivery fee clearly shown in the cart?

### VAT Display
- [ ] Does checkout show "VATeable sales ₱X / VAT (12%) ₱Y / Total ₱Z"?
- [ ] Is `tax_amount` saved on the transaction?

### Contact & Help
- [ ] Can he call the store? (phone number on the site, `tel:` link)
- [ ] Is there a "Forgot password" flow that works by email?
- [ ] Is there a "Resend email confirmation" option?

## Key Files to Check
- `app/(shop)/checkout/` — discount option, VAT display
- `lib/actions/cart.ts` — discount calculation in `submitCart`
- `lib/validation/transaction.ts` — `discount_amount`, `discount_type`, `discount_id_number`
- `components/menu/product-card.tsx` — text sizes
- `components/orders/order-timeline.tsx` — order number display
- `app/globals.css` — font size tokens

## Red Flags
- No Senior/PWD discount option at checkout (this is legally required)
- Text smaller than 14px anywhere in the ordering flow
- Order numbers are raw UUIDs
- No VAT breakdown shown
- ID photos stored permanently or in a public bucket
