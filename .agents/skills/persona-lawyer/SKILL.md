---
name: persona-lawyer
description: Review implementation as Atty. Reyes (lawyer). Verify legal compliance with Philippine laws — Data Privacy Act, Senior/PWD discounts, Internet Transactions Act, consumer protection.
---

# Persona: Lawyer — "Atty. Reyes, reviews the system before the shop goes live"

Use this skill to review any implementation for **legal compliance with Philippine laws**.

> **Not legal advice.** This is a simulated review for a school project based on the laws a lawyer would check.

## Who is Atty. Reyes?

Atty. Reyes reviews the system before launch. She checks the Terms page, sign-up consent, personal data handling, payments, discounts, and third-party licences.

## Review Checklist

### J1: Personal Data Exposure (🔴 — Data Privacy Act)
- [ ] Is RLS enabled on `employee` and `rider`? (names, emails, birth dates, phone numbers, licence numbers)
- [ ] Can any signed-in customer read employee personal data?
- [ ] If personal data was exposed, has the team checked API logs?

### J2: Senior Citizen / PWD Discount (🔴 — RA 9994, RA 10754)
- [ ] Is the 20% discount + VAT exemption available at checkout?
- [ ] Is there an ID upload flow?
- [ ] Is the ID photo deleted after order completion?
- [ ] Are discounted sales recorded per transaction for BIR?

### J3: Terms Page Accuracy (🟠 — Consumer Act, Internet Transactions Act)
- [ ] Does the Terms page NOT promise card payments (they're disabled)?
- [ ] Does it NOT promise automatic refunds (no refund process exists)?
- [ ] Does it state what happens when the store cancels a paid order?
- [ ] Does it cover missing/wrong item reporting?
- [ ] Does it have a "last updated" date, governing law, and complaints contact?

### J4: Seller Identity (🟠 — Internet Transactions Act, enforced June 2025)
- [ ] Are business name, address, and contact details visible on the site?
- [ ] Is there a DTI or SEC registration number?
- [ ] Is there a phone number and email?

### J5: Privacy Notice (🟠 — Data Privacy Act)
- [ ] Is there a `/privacy` page?
- [ ] Does it list: who the data controller is, purpose and legal basis, who receives data (Supabase, PayMongo, LocationIQ), cross-border transfers, retention periods, customer rights (access, correction, erasure, portability, complaint to NPC)?
- [ ] Does account deletion also remove delivery addresses, photos, and review comments?

### J6: Minors (🟠 — Civil Code)
- [ ] Is the minimum age 18, or is there a parental consent checkbox?
- [ ] Is birthday replaced with an age checkbox?

### J7: Delivery Photos (🟠 — Data Privacy Act)
- [ ] Is the `proof-of-delivery` bucket private?
- [ ] Are photos served with signed URLs?
- [ ] Is there a retention period (e.g., 90 days)?
- [ ] Are Senior/PWD ID photos deleted within 24 hours?

### J8: Invoices (🟡 — NIRC / Ease of Paying Taxes Act)
- [ ] Does the receipt say "This is not an official receipt"?

### J9: Map Licences (🟡 — OpenStreetMap ODbL, LocationIQ terms)
- [ ] Is `attributionControl` turned on (not `false`)?
- [ ] Does the map show the correct credit for whichever tiles are loaded?
- [ ] Is OSRM demo server usage acknowledged as non-production?

### J10: Evidence for Disputes (🟡)
- [ ] Is there an `order_status_log` with timestamps for each status change?
- [ ] Is the first ETA saved as `promised_at` (not overwritten)?

## Key Files to Check
- `app/terms/page.tsx` — Terms page
- `app/privacy/page.tsx` — Privacy notice (may not exist yet)
- `lib/site/site-info.ts` — business details
- `components/deliver/map-content.tsx` — map attribution
- `lib/actions/profile.ts` — account deletion
- `lib/validation/date-of-birth.ts` — minimum age
- `supabase/migrations/` — RLS, storage policies

## Red Flags
- Terms promise features that don't exist (cards, refunds)
- No privacy notice page
- No seller identity on the site (legally required since June 2025)
- Proof-of-delivery photos in a public bucket
- No Senior/PWD discount (legally required)
- Map credits hidden
- ID photos stored permanently
