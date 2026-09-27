# Handoff — final run, 29 September 2026

What the final run did and what is left. Branch: `development`. The item-by-item
status of `FINALE.md` is in its [final status table](../FINALE.md#final-status-29-sep-2026).

State at handoff: `tsc` 0 errors · `vitest` 1,384 / 1,384 passing · `next lint` 0 errors
(7 `<img>` warnings on uploaded-photo previews) · `next build` passes.
The live Supabase project is in sync with `supabase/migrations/` (8 files).

---

## Done — first pass

| Area | What changed |
|---|---|
| UI consistency | One palette: customer, auth and employee screens use the back-office red (`--primary` = #B8352A). 362 hard-coded colours, off-scale font sizes/radii and raw `<button>`s moved onto tokens (`__tests__/design-scale.test.ts` enforces it). Mobile overflow on the signed-in menu fixed. |
| Landing page | Rebuilt fast-food-chain style: promo carousel, open/closed strip, category tiles, best sellers, how-it-works, visit-us. `/menu?category=` deep links. |
| Database | 57 migrations squashed into `20260929100000_baseline.sql` + `20260929100001_platform_setup.sql`, verified with `supabase db diff` against live; history repaired. Pre-squash files are at commit `a9af4d1`. |
| Live bugs fixed | Customers page RPC read a dropped column; cancelling a paid GCash/Maya order failed (refund statuses missing from a CHECK); the Senior/PWD wallet discount was never deployed; storage let anyone upload menu photos / overwrite employee photos; email-change sync trigger never applied. |
| Lost merge work | PR #129's merge had dropped ~700 lines of `development` (readable order numbers, pending flash, Senior/PWD staff view, stage names). Re-merged. |
| FINALE items | 1.1, 1.3, 1.6, 1.7, 2.2/3.5, 2.4, 2.5, 2.8, 3.2, 3.4, 4.1, 4.2, 4.4, 4.5, 6.2, 6.3, 7.1, 9.7, 9.8, 9.9, 9.11, quick stats, menu/employee filters, tracking without signing in (`/track/<id>?t=<token>`). |

## Done — second pass (the handoff list)

| Item | What changed |
|---|---|
| 2.3 Ratings | The rating dialog asks for food (required) and service, with an optional per-dish list and "Rate all the same"; `submitOrderRatings` → `submit_order_ratings`. Reports and the PDF show the average service rating. |
| 9.1 / 9.10 Cart re-check | When `submit_cart_to_order` refuses with `ITEM_UNAVAILABLE` / `PRICE_CHANGED`, checkout calls `recheckCart`, highlights the lines ("Sold out", "Now ₱200 each (was ₱180)") and offers **Remove sold-out items** / **Accept new prices**; Place order waits until they are handled (`lib/checkout/cart-recheck.ts`). |
| 9.3 Reviews | Dashboard "Latest ratings": food/service stars, a follow-up mark at ≤ 2, tap-to-call phone, "Open order #…" (`/manage/orders?order=1042` opens it). The menu editor now loads reviews at all — its average and Rating sort had always seen zero — and lists them with the same links. |
| 9.4 Refunds | The order detail shows the refund state; a failed one gives PayMongo's reason and **Open in PayMongo**. The Refunds panel printed the order UUID as its number; fixed, and its reader now checks for a manager. |
| 7.2 / 7.3 | `received` / `confirmed` retired; `order_status_check` added (there was none — the trigger only guarded updates). Migration `20260929140000`. |
| Persona review | All 15 checklists walked: [`persona-review-final.md`](persona-review-final.md). Fixed along the way: resend confirmation email, KDS **Sold out** dialog, `/api-docs` and `/openapi.json` 404 in production, order **History** on the staff detail (L9), **Ready on time** rate in reports (4.3). |
| Docs check | `limitations.md`, `lacking.md`, `user-simulation.md` re-checked item by item and brought up to date. |
| Database clean-up | `db-cleanse.mjs` and `db-seed.mjs` rewritten for the current schema (both still referenced dropped tables). Live: 15 test / retired-role staff accounts, 1 test customer, the "Yang's Meaty Steak" test dish and the 16 orders holding it or nothing identifiable, "Uuu-la-lam" and an empty category removed; order types, missing, duplicate and contradictory payment rows repaired; demo data reseeded (30 days, timelines, ratings, no-shows). `archive` and `backup` schemas dropped and `order_type_check` added (migration `20260929150000`); `proof-of-delivery` bucket deleted. |
| Codebase clean-up | Root `fix-*.js`, `make-migration.js`, `resolve-conflicts.js`, both conflict patches, two UTF-16 stray files, `scratch/`, 39 one-off scripts in `scripts/`, and `docs/live-setup/` (hand-run SQL that would now overwrite current functions) removed. |

---

## Left for the owner

1. **CAPTCHA (F13)** — not started, by decision. Needs a Cloudflare Turnstile
   site key and secret, and CAPTCHA switched on in Supabase Auth. Then pass
   `captchaToken` in `signUp` / `signInWithPassword`
   (`components/auth/customer-*-form.tsx`, `app/(auth)/actions.ts`).
2. **Leaked-password protection** — Supabase dashboard → Authentication →
   Password security. Needs the Pro plan.
3. **DTI / SEC registration number** for the footer and `/store` (Internet
   Transactions Act). Only the owner has it.
4. **One account is both a customer and a manager** (`thiswaszehtih@gmail.com`).
   It is a team member's real account, so the clean-up left it. Split it if the
   security review's "no customer is also an employee" rule matters.

### Smaller gaps noted in the persona review

- Reports compare with the previous period only, not month-on-month or
  year-on-year.
- No dedicated Senior/PWD CSV for BIR (the data is in `transaction`).
- `order_item_add_on` has no price column; `order_item.unit_price` includes
  add-ons, which is enough for revenue but not per-add-on analysis.
- REST routers in `app/api/routers/` still sit beside the server actions.

### Future work (unchanged from FINALE §8)

Group orders, bulk / advance orders, vouchers & loyalty, card payments,
partial refunds, in-app chat, multiple branches, inventory, SMS OTP, push
notifications / PWA, dark mode, staff global search, dine-in QR ordering, BIR
e-invoicing.

### Things to know

- New migrations: `npx supabase migration new <name>` then
  `npx supabase db push`. Don't apply SQL through the dashboard or an MCP
  tool — it records a different version.
- `process-refunds` needs the Vault secrets `project_url` and
  `refund_cron_secret` on any new project.
- `EMPLOYEE_SESSION_SECRET` is required in production.
- Business-rule numbers live in both `lib/checkout/order-rules.ts` and
  `submit_cart_to_order`; `__tests__/order-rules.test.ts` fails if they drift.
- `npm run db:cleanse` is a dry run until `--apply`. It never marks a payment
  `refund_pending` (that would make the cron call PayMongo); a refund owed from
  old data becomes `refund_failed` for a manager to handle.
