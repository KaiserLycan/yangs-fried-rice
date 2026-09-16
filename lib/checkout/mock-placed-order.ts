import type { PlacedOrder } from "@/lib/checkout/placed-order";

/**
 * A stand-in placed order so the confirmation screen renders before any order
 * exists, one per fulfilment type.
 *
 * Nothing writes an `order` row yet — placing an order is still a stubbed
 * write — so the screen would have nothing to show and could not be reviewed
 * at all. This is the same treatment the rest of the flow uses; committing a
 * fixture is what lets a Vercel preview link demonstrate the screen.
 *
 * **"Place order" deliberately does not navigate here.** Sending a customer
 * to a receipt for an order that was never created, with their cart still
 * full behind it, would be a worse lie than the toast it raises instead. So
 * the only way to reach this screen today is to type the URL:
 *
 *     /checkout/confirmation?example=delivery
 *     /checkout/confirmation?example=pickup
 *
 * Delivery is the default, matching every other screen in the flow.
 *
 * These are *fallbacks*, not replacements. A real order id in the URL is read
 * first and wins — see `app/(account)/checkout/confirmation/page.tsx`.
 *
 * ## Turning it off
 *
 * Delete this file. The page's `?? mockPlacedOrder(...)` then stops compiling
 * and TypeScript points at the one line to remove.
 *
 * TODO: do exactly that once placing an order writes a real row, and add
 * these URLs to `docs/reference/preview-scenarios.md` — that file is created
 * on the order-tracking branch and does not exist here yet.
 */

export const EXAMPLE_ORDERS = ["delivery", "pickup"] as const;

export type ExampleOrder = (typeof EXAMPLE_ORDERS)[number];

export const DEFAULT_EXAMPLE_ORDER: ExampleOrder = "delivery";

/**
 * The order the checkout frames draw — Liza Reyes, 21 Mabini St, two
 * Yangzhou Specials and one Lumpia, paying cash on delivery. Keeping the same
 * basket as checkout's own frame means the two screens can be compared
 * side by side.
 */
const BASE: PlacedOrder = {
  orderId: "example-1042",
  orderNumber: "1042",
  customerName: "Liza Reyes",
  placedAtLabel: "Aug 30, 6:40 PM",
  address: "21 Mabini St, Malate, Manila",
  fulfilment: "delivery",
  paymentMethodLabel: "Cash on delivery",
  lines: [
    {
      id: "1",
      name: "Yangzhou Special",
      unitPrice: 180,
      quantity: 2,
      specialInstructions: null,
    },
    {
      id: "2",
      name: "Lumpia (5pc)",
      unitPrice: 90,
      quantity: 1,
      specialInstructions: null,
    },
  ],
};

const EXAMPLES: Record<ExampleOrder, PlacedOrder> = {
  delivery: BASE,
  pickup: {
    ...BASE,
    fulfilment: "pickup",
    // A pickup order has no destination at all. Leaving the address in place
    // would let a bug hide: the screen must not show it either way.
    address: null,
    paymentMethodLabel: "Pay in store",
  },
};

/**
 * Folded the same way the rest of the flow folds an `?example=` value, so
 * `?example=Pickup` and `?example=pickup` land on the same order rather than
 * silently falling back.
 */
function normaliseExample(value: string | string[] | undefined): ExampleOrder {
  // A repeated query parameter (`?example=a&example=b`) arrives as an array.
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return DEFAULT_EXAMPLE_ORDER;

  const folded = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (EXAMPLE_ORDERS as readonly string[]).includes(folded)
    ? (folded as ExampleOrder)
    : DEFAULT_EXAMPLE_ORDER;
}

export function mockPlacedOrder(example?: string | string[]): PlacedOrder {
  return EXAMPLES[normaliseExample(example)];
}
