import type { TrackedOrder } from "@/lib/orders/read-tracked-order";

/**
 * Stand-in orders so the tracking screen renders before any order exists,
 * one per state the screen can be in.
 *
 * Nothing writes an `order` row yet — placing an order is still a stubbed
 * write — so `readTrackedOrder` returns null for every customer and the page
 * would 404 for everyone, including whoever opens the Vercel preview to
 * review it. This is the same treatment the employee screens already use
 * (`lib/mock-orders.ts`, `lib/mock-deliveries.ts`,
 * `components/manage/dashboard/mock-data.ts`): commit the fixture so the
 * screen demonstrates itself.
 *
 * These are *fallbacks*, not replacements. The real read runs first, so a
 * genuine order renders genuinely and no URL can override it — see
 * `app/(account)/orders/[orderId]/page.tsx`.
 *
 * ## Picking a state from the URL
 *
 * `/orders/1042?example=cancelled` renders the cancelled state. That exists
 * so the PM and the tester can see every state from the preview link without
 * running the project or asking for a code change — two of these states
 * (`cancelled`, `unknown`) have no frame at all and were otherwise
 * unreachable outside the tests.
 *
 * `docs/reference/preview-scenarios.md` is the version of this written for
 * them: the six URLs, what each should look like, and what is a placeholder
 * rather than a bug. Keep the two in step when a state is added or removed.
 *
 * ## Turning it off
 *
 * Delete this file. The page's `?? mockTrackedOrder(...)` then stops
 * compiling and TypeScript points at the one line to remove. There is no
 * runtime flag to remember, and nothing keeps working silently.
 *
 * TODO: do exactly that once placing an order writes a real row. Tracked as
 * the "Place an order" write in `docs/reference/ordering-flow-handoff.md`.
 */

export const EXAMPLE_STATES = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "unknown",
] as const;

export type ExampleState = (typeof EXAMPLE_STATES)[number];

export const DEFAULT_EXAMPLE_STATE: ExampleState = "received";

/**
 * The fields every example shares. Mirrors frame `132:481`: order #1042,
 * arriving in 35–45 minutes, going to 21 Mabini St, with Ariel S. riding —
 * the desktop frame names a rider even at the first stage, so these do too.
 */
const BASE = {
  orderNumber: "1042",
  orderStatus: null as string | null,
  cancelledAt: null as string | null,
  deliveryStatus: null as string | null,
  deliveryId: null as string | null,
  orderType: "Delivery",
  arrivalWindow: "12:35 PM–12:45 PM" as string | null,
  destination: "3239 Pearl Street, Unit 2B, Malate" as string | null,
  riderName: "Leo Torres" as string | null,
  items: [{ productId: "1", name: "Yangzhou Special" }],
};

/**
 * Only the status fields differ between examples, which is the point: they
 * are the only fields the screen resolves a stage from.
 *
 * The last three deserve a note, because they are not arbitrary. Both
 * `out_for_delivery` and `delivered` leave `orderStatus` on "preparing" on
 * purpose — `lib/actions/delivery.ts` deliberately does not touch
 * `order_status`, so a real order in those states genuinely looks like this,
 * and an example that tidied it up would hide the exact disagreement
 * `lib/orders/order-stage.ts` exists to resolve. `unknown` is a NULL status,
 * which a nullable free-text column produces for real.
 */
const EXAMPLES: Record<ExampleState, Partial<typeof BASE>> = {
  // `pending` is what `submitCart` writes, and the only status
  // `cancelCustomerOrder` accepts — so this is the one example that offers
  // Cancel order. The back office's `received` means staff have accepted,
  // which reads as the same stage but withdraws the control.
  received: { orderStatus: "pending" },
  preparing: { orderStatus: "preparing" },
  out_for_delivery: {
    orderStatus: "preparing",
    deliveryStatus: "out_for_delivery",
  },
  delivered: {
    orderStatus: "preparing",
    deliveryStatus: "delivered",
  },
  cancelled: {
    orderStatus: "cancelled",
    cancelledAt: "2026-09-13T02:00:00Z",
  },
  unknown: {
    orderStatus: null,
    // Nothing is known about this order, so the arrival line and the rider
    // are absent too — which is also the only place the "Arrival time to be
    // confirmed" fallback can be seen.
    arrivalWindow: null,
    destination: null,
    riderName: null,
    items: [],
  },
};

/**
 * Folded the same way `order-stage.ts` folds a status, so `?example=Out For
 * Delivery` and `?example=out-for-delivery` both land on the same example
 * rather than silently falling back.
 */
function normaliseExample(value: string | string[] | undefined): ExampleState {
  // A repeated query parameter (`?example=a&example=b`) arrives as an array.
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return DEFAULT_EXAMPLE_STATE;

  const folded = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (EXAMPLE_STATES as readonly string[]).includes(folded)
    ? (folded as ExampleState)
    : DEFAULT_EXAMPLE_STATE;
}

export function mockTrackedOrder(
  orderId: string,
  example?: string | string[],
): TrackedOrder {
  return {
    ...BASE,
    ...EXAMPLES[normaliseExample(example)],
    orderId,
  };
}
