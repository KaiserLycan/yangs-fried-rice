# Handoff — final run, 29 September 2026

What the final run did, and everything it did not finish. Read this before
picking up `FINALE.md`. Branch: `development`.

State at handoff: `tsc` 0 errors · `vitest` 1,357 / 1,357 passing · `next lint`
0 errors (7 `<img>` warnings on uploaded-photo previews) · `next build` passes.
The live Supabase project is in sync with `supabase/migrations/`.

---

## Done in this run

| Area | What changed |
|---|---|
| UI consistency | One palette: customer, auth and employee screens use the back-office red (`--primary` = #B8352A). 362 hard-coded colours, off-scale font sizes/radii and raw `<button>`s moved onto tokens (`__tests__/design-scale.test.ts` enforces it). Mobile overflow on the signed-in menu fixed. |
| Landing page | Rebuilt fast-food-chain style: promo carousel, open/closed strip, category tiles, best sellers, how-it-works, visit-us. `/menu?category=` deep links. |
| Database | 57 migrations squashed into `20260929100000_baseline.sql` + `20260929100001_platform_setup.sql`, verified with `supabase db diff` against live; history repaired. Pre-squash files are at commit `a9af4d1`. |
| Live bugs fixed | Customers page RPC read a dropped column; cancelling a paid GCash/Maya order failed (refund statuses missing from a CHECK); the Senior/PWD wallet discount was never deployed; storage let anyone upload menu photos / overwrite employee photos; email-change sync trigger never applied. |
| Lost merge work | PR #129's merge had dropped ~700 lines of `development` (readable order numbers, pending flash, Senior/PWD staff view, stage names). Re-merged. |
| FINALE items | 1.1 last-order cut-off · 1.3 ₱150 minimum, ₱2,000 cash cap, ₱1,000 first cash order · 1.6/1.7 privacy & terms current · 2.2/3.5 no-show with reasons + strikes + manager prompt · 2.4 `/store` page · 2.5 prep-time promise · 2.8 tips · 3.2 change for ₱___ · 3.4 best-seller badges · 4.1 GCash vs Maya recorded · 4.2 Manila-time reports · 4.4 webhook replay window · 4.5 no session-secret fallback in production · 6.2 nightly retention purge · 6.3 deletion clears free text · 7.1/7.2 status & payment constraints, state machine trigger · 9.7 audit search by order · 9.8 My Orders search + older orders · 9.9 undo "Picked up" (10 min) · 9.11 disabled account told at password reset · quick stats on Orders and Menu · menu/employee filters · order tracking without signing in (`/track/<id>?t=<token>`). |

---

## Not completed — for the next developer

### Started, not finished

1. **Food / service / per-dish ratings (FINALE 2.3).** The database side is
   live: `review.service_rating` and `submit_order_ratings(order, food,
   service, comment, items[])` (migration `20260929130000`). **Nothing calls
   it yet.** To finish: add `items` to `RateOrderButton`
   (`components/orders/order-rating.tsx`; both callers already have
   `productId` + `name` per line), show Food and Service star rows, an
   optional "Rate each dish" list with a "Rate all the same" toggle, and a
   server action in `lib/actions/customer-orders.ts` that calls the new RPC.
   Show `service_rating` on the dashboard / reports.

### Not started

2. **CAPTCHA on sign-up and login (F13).** Needs a Cloudflare Turnstile site
   key + secret, and CAPTCHA switched on in Supabase Auth settings. Then pass
   `captchaToken` in `signUp` / `signInWithPassword`
   (`components/auth/customer-*-form.tsx`, `app/(auth)/actions.ts`).
3. **Cart re-check UI (9.1, 9.10).** The database already names the sold-out
   dishes (`ITEM_UNAVAILABLE`) and the old → new prices (`PRICE_CHANGED`), and
   checkout shows that message. Still missing: highlighting the affected cart
   lines and an "Accept new prices" / "Remove sold-out items" button.
4. **Reviews link to the order and the customer's phone (9.3).** Reviews on
   the menu editor show a name only.
5. **Refund reminder for staff (9.4).** Refunds are automatic
   (`process-refunds` cron), but a failed refund only shows on the dashboard
   panel; there is no link into PayMongo from the order itself.
6. **`received` status (7.3).** Treated as legacy everywhere (the trigger
   allows it out, the app never writes it). Remove it from the vocabulary
   once no rows use it.
7. **Persona-skill review and the docs verification pass** (steps 5b–5c of
   the brief): run the `.agents/skills/persona-*` reviews against this
   build and re-check `docs/limitations.md`, `docs/user-simulation.md`,
   `docs/lacking.md` item by item. Not done.
8. **Database clean-up and re-seed** (final step of the brief). Not done.
   Known junk on live: test employees (`*@test.local`, `test_staff_*`,
   RIDER accounts), a category named "Uuu-la-lam", a 20 × ₱1,267
   "Yang's Meaty Steak" order, legacy `out_for_delivery` orders, paid
   cash payments on cancelled orders, orders with a non-pickup
   `order_type` (they show "Delivered" in My Orders). Use
   `npm run db:cleanse` (dry run first) then `npm run db:seed -- --reset`,
   and check `scripts/db-seed.mjs` writes `order_type = 'take_out'`.
   The `archive` and `backup` schemas on live hold retention data; decide
   with the owner before dropping them. The `proof-of-delivery` bucket
   (22 old files) is unused.
9. **Codebase clean-up.** Throwaway scripts at the repo root and in
   `scripts/` (`fix-*.js`, `patch-*.js`, `resolve-conflicts.js`,
   `make-migration.js`, `conflicts*.patch`, `current_orders_page.tsx`,
   `test.txt`, `test_rpc.mjs`, `scratch/`) were left in place — review and
   delete. `graphify-out/` is committed build output.
10. **Docs update.** `README.md`'s database section is current; the rest of
    `docs/` (limitations, lacking, user-simulation, FINALE.md statuses)
    still describes the pre-run state and should be updated from the table
    above.

### Future work (unchanged from FINALE §8)

Group orders, bulk / advance orders, vouchers & loyalty, card payments,
PayMongo refund-API partial refunds, in-app chat, multiple branches,
inventory, SMS OTP, push notifications / PWA, dark mode, staff global
search, dine-in QR ordering, BIR e-invoicing.

### Things to know

- New migrations: `npx supabase migration new <name>` then
  `npx supabase db push --linked`. Don't apply SQL through the dashboard or
  an MCP tool — it records a different version.
- `process-refunds` needs the Vault secrets `project_url` and
  `refund_cron_secret` on any new project.
- `EMPLOYEE_SESSION_SECRET` is now required in production (it is set on
  Vercel for Production and Preview).
- Business-rule numbers live in both `lib/checkout/order-rules.ts` and
  `submit_cart_to_order`; `__tests__/order-rules.test.ts` fails if they drift.
