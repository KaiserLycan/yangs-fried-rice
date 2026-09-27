/**
 * How big one order may be (issue #115).
 *
 * Counted in items, the sum of every line's quantity — three Chow Fan and
 * two Siomai is five. Order-level add-ons (rice, drinks) are not counted:
 * they ride along with the dishes rather than being dishes themselves.
 *
 * Past this, the kitchen wants a phone call, not a surprise in the queue.
 * The same 30 is enforced by `submit_cart_to_order`
 * (20260928000004_checkout_business_rules.sql) — change both together.
 * The per-dish cap is separate: `MAX_QUANTITY` in `lib/menu/quantity.ts`.
 */
export const MAX_ITEMS_PER_ORDER = 30;

export const BIG_ORDER_MESSAGE =
  "That's a big order! Please contact us for a bulk order or catering.";

export const ORDER_TOO_LARGE_CODE = "ORDER_TOO_LARGE";

/**
 * Would changing the cart by `delta` items take it over the cap? A negative
 * or zero delta never does — removing items is always allowed, even from a
 * cart that is already over (one filled before the cap existed).
 */
export function wouldExceedOrderCap(currentTotal: number, delta: number): boolean {
  if (delta <= 0) return false;
  return currentTotal + delta > MAX_ITEMS_PER_ORDER;
}

/** Is this many items over the cap? */
export function isOverOrderCap(totalItems: number): boolean {
  return totalItems > MAX_ITEMS_PER_ORDER;
}
