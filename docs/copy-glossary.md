# Copy glossary

One name for each thing, on every screen. From the UI/UX review (Mika, `docs/user-simulation.md` #16), which found the same stage called "Queue", "Order received" and "Received", and both "Cancelled" and "Canceled".

When a word here changes, change it here first, then everywhere it appears.

## Order stages

The customer's timeline, the staff Orders tabs, the staff order cards and the KDS all use these names. Staff card headers use the same words in capitals.

| `order.order_status` | Customer sees | Staff tab | Staff card header |
|---|---|---|---|
| `awaiting_payment` | Waiting for payment | (Orders only when paid) | — |
| `payment_failed` | Payment failed | — | — |
| `pending` | Order received | Received | RECEIVED |
| `preparing` | Preparing | Preparing | PREPARING |
| `ready` | Ready for pickup | Ready for pickup | READY FOR PICKUP |
| `completed` | Picked up | Picked up | PICKED UP |
| `cancelled` | Cancelled | Cancelled | CANCELLED |
| `out_for_delivery` (legacy only) | Ready for pickup | Ready for pickup | OUT FOR DELIVERY |

`received` is not a status any more (#118). Old rows that still have it read as "Order received".

The internal staff enum (`QUEUE`, `PREP`, `DELIVERY`, `COMPLETED`, `CANCELED` in `types/staff-order.ts`) is code, not copy. It is never shown on screen.

## Spelling and wording

| Use | Not | Notes |
|---|---|---|
| **pickup** (noun, adjective) | pick up, pick-up, Pick Up | "Ready for pickup", "a pickup order", "the pickup point" |
| **pick up** (verb) | pickup | "Pick up at Counter 1", "picked up" |
| **Cancelled**, **cancelling** | Canceled, canceling | British spelling, like the rest of the copy |
| **Counter 1** | the counter, Counter #1 | `PICKUP_COUNTER` in `lib/site/site-info.ts`; the notification trigger prints the same text |
| **Account** | Me, Profile | Bottom tab bar and nav bar |
| **Sign in to order** | Add (for guests), Log in to add | The guest's action on a dish |
| **Pay in store** (the checkout option) | Cash on delivery, COD, Cash | The shop is pickup-only (#114); stored as `pay_in_store`. In a sentence, "pay at the counter" is fine ("Pay at the counter instead"). |
| **GCash / Maya** | PayMongo, e-wallet | The wallet option; PayMongo is the processor, not what customers see. Stored as `gcash` / `paymaya` (#116). |
| **Report a problem** | Complaint, dispute | Missing / Wrong / Damaged, within 24 hours of pickup |

The database spells the order type `take_out` (`order.order_type`). On screen it is always "Pickup".

## Order numbers

An order is `#1042`: the `order.order_number` column (migration `20260928000007`), printed by `formatOrderNumber` in `lib/orders/order-number.ts`. Use the same number on the customer's screens, the staff screens, the KDS, the receipt, emails, notifications and the audit log.

Never show the UUID. The staff search still accepts the older 8-character reference (`#38206dc0`), for receipts printed before the change.

## Store hours

Hours are written `8:00 AM – 6:00 PM` (`STORE_HOURS_LABEL`). When the store is closed, say when it opens: "Opens today at 8:00 AM" or "Opens tomorrow at 8:00 AM" (`nextOpeningLabel` in `lib/store-hours.ts`).

## Capitalisation

- Buttons and labels use sentence case: "Yes, it's ready", "Picked up", "Order again".
- Staff card headers are the one place written in capitals, as the design has them.
- Headings drawn in Anton (`font-display`) are uppercase through CSS. Write them in sentence case in the code.

## Money (#116)

- Totals show **VATable sales / VAT (12%) / Total**. Menu prices already include VAT.
- With a Senior Citizen / PWD discount: **VAT exempt**, then **Discount**, then **Total**. The receipt names the kind: "Discount (Senior Citizen)" or "Discount (PWD)".
- Staff see a **Verify ID** badge on discounted orders.
- "Promised by 3:45 PM" is the ready-by time set at checkout. It never moves.
