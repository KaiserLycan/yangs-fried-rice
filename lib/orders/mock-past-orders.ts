import type { PastOrder } from "@/lib/orders/past-order";

/**
 * Stand-in history so `/orders` renders before any order exists, one list per
 * state the screen can be in.
 *
 * Same position `lib/orders/mock-tracked-order.ts` is in, and the same
 * reasoning: nothing writes an `order` row yet, so `readPastOrders` returns
 * an empty list for every customer and an empty history is indistinguishable
 * from a broken screen on a preview link. The employee side already does
 * this (`lib/mock-orders.ts`, `lib/mock-deliveries.ts`).
 *
 * These are *fallbacks*, not replacements. The real read runs first, so a
 * genuine history renders genuinely and no URL can override it — see
 * `app/(account)/orders/page.tsx`.
 *
 * ## Picking a state from the URL
 *
 * `/orders?example=empty` renders the empty history. Two of these states have
 * no frame drawn at all — a history containing a cancelled order, and an
 * empty one — and were otherwise unreachable outside the tests.
 * `docs/reference/preview-scenarios.md` is the version of this written for
 * the PM and the tester. Keep the two in step.
 *
 * ## Turning it off
 *
 * Delete this file. The page's `?? mockPastOrders(...)` then stops compiling
 * and TypeScript points at the one line to remove.
 */

export const EXAMPLE_HISTORIES = ["populated", "cancelled", "empty"] as const;

export type ExampleHistory = (typeof EXAMPLE_HISTORIES)[number];

export const DEFAULT_EXAMPLE_HISTORY: ExampleHistory = "populated";

/**
 * The three cards the frames draw, in the frames' own order. Timestamps are
 * the drawn times read as Manila time — "Aug 24, 7:12 PM" is 11:12 UTC — so
 * the screen reproduces the frame rather than whatever the reviewer's clock
 * says. The year is the project's current one; the frames show none.
 *
 * `orderStatus: "completed"` is the vocabulary `lib/validation/orders.ts`
 * uses, which is what the back office actually writes today.
 */
const DRAWN: PastOrder[] = [
  {
    orderId: "example-1042",
    orderNumber: "1042",
    placedAt: "2026-08-24T11:12:00Z",
    orderStatus: "completed",
    cancelledAt: null,
    deliveryStatus: "delivered",
    orderType: "Delivery",
    items: [
      { name: "Yangzhou Special", quantity: 2 },
      { name: "Lumpia (5pc)", quantity: 1 },
    ],
    total: 545,
    rating: 5,
  },
  {
    orderId: "example-1039",
    orderNumber: "1039",
    placedAt: "2026-08-17T04:30:00Z",
    orderStatus: "completed",
    cancelledAt: null,
    deliveryStatus: "delivered",
    orderType: "Delivery",
    items: [
      { name: "Beef Tapa Fried Rice", quantity: 1 },
      { name: "Calamansi Soda", quantity: 1 },
    ],
    total: 255,
    // The only unrated card in the frames, and therefore the only one showing
    // the hollow star row ticket 12 makes pressable.
    rating: null,
  },
  {
    orderId: "example-1031",
    orderNumber: "1031",
    placedAt: "2026-08-09T12:04:00Z",
    orderStatus: "completed",
    cancelledAt: null,
    // A pickup order has no delivery row at all, which is also why its
    // outcome has to come from `order_type`.
    deliveryStatus: null,
    orderType: "Pickup",
    items: [
      { name: "Fried Chicken (3pc)", quantity: 1 },
      { name: "Iced Tea Pitcher", quantity: 1 },
    ],
    total: 340,
    rating: 4,
  },
];

/**
 * A cancelled order at the top of the same history. Nothing draws this, and
 * it is not an invented edge case — ticket 07 built cancelling an order, so a
 * cancelled order in the history is the ordinary consequence of using it.
 */
const CANCELLED: PastOrder = {
  orderId: "example-1044",
  orderNumber: "1044",
  placedAt: "2026-09-02T09:40:00Z",
  orderStatus: "cancelled",
  cancelledAt: "2026-09-02T09:47:00Z",
  deliveryStatus: null,
  orderType: "Delivery",
  items: [{ name: "Chili Garlic Fried Rice", quantity: 1 }],
  total: 260,
  rating: null,
};

const EXAMPLES: Record<ExampleHistory, PastOrder[]> = {
  populated: DRAWN,
  cancelled: [CANCELLED, ...DRAWN],
  empty: [],
};

/**
 * Folded the same way `order-stage.ts` folds a status, so `?example=Empty`
 * and `?example=empty` land on the same list rather than silently falling
 * back.
 */
function normaliseExample(value: string | string[] | undefined): ExampleHistory {
  // A repeated query parameter (`?example=a&example=b`) arrives as an array.
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return DEFAULT_EXAMPLE_HISTORY;

  const folded = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (EXAMPLE_HISTORIES as readonly string[]).includes(folded)
    ? (folded as ExampleHistory)
    : DEFAULT_EXAMPLE_HISTORY;
}

export function mockPastOrders(example?: string | string[]): PastOrder[] {
  return EXAMPLES[normaliseExample(example)];
}
