import type { CartLine, Fulfilment } from "@/lib/menu/cart-totals";

/**
 * One order that has just been placed, narrowed to what the confirmation
 * screen draws.
 *
 * The lines are `CartLine`s rather than a new shape on purpose: the
 * confirmation shows the same summary as checkout, computed by the same
 * `computeCartTotals`. A separate order-line type here would be a second way
 * to add up the same money.
 */
export type PlacedOrder = {
  orderId: string;
  /** Human-facing reference, drawn as "#1042" — see `orderNumberFrom`. */
  orderNumber: string;
  customerName: string;
  /** Already formatted — see `formatOrderTime` on why not a Date. */
  placedAtLabel: string;
  /** Where it is going. Null for a pickup order, which has no destination. */
  address: string | null;
  fulfilment: Fulfilment;
  lines: CartLine[];
  /** "Cash on delivery" — what they chose, not what was charged. */
  paymentMethodLabel: string;
};

/**
 * `order_id` is a UUID and no human-facing order number column exists, so the
 * screen shows the last four characters of the id. The frames draw "#1042", a
 * four-digit sequence, which a UUID cannot produce.
 *
 * TODO (Backend): an `order_number` column — a short sequence customers can
 * read out over the phone.
 *
 * NOTE: the order tracking screen carries an identical helper on its own
 * branch. Whichever of the two merges second should delete its copy rather
 * than leave two definitions of what a customer's order number looks like.
 */
export function orderNumberFrom(orderId: string): string {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}
