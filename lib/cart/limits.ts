import { MAX_QUANTITY } from "@/lib/menu/quantity";

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

/** The always-visible cart note, a link to the contact page. */
export const BULK_ORDER_NOTE = "Please contact us for a bulk order or catering.";

/**
 * One dish over 20 across all its cart lines — notes and add-ons included.
 * Worded and coded exactly as `submit_cart_to_order` refuses it
 * (20260928000008), so the message a customer sees while adding matches the
 * one checkout would give.
 */
export const DISH_LIMIT_CODE = "ITEM_LIMIT_EXCEEDED";

export function dishLimitMessage(dishName: string): string {
  return `You can only order up to ${MAX_QUANTITY} of each dish (${dishName}).`;
}

/** How many more items fit in a cart holding `totalItems`. Never negative. */
export function remainingItems(totalItems: number): number {
  return Math.max(0, MAX_ITEMS_PER_ORDER - totalItems);
}

/**
 * How many of one dish a stepper may be set to, and which limit stops it.
 *
 * `cartTotalItems` and `dishItems` are what the cart holds now; `baseline`
 * is the quantity of the line being edited (0 when adding a new one), which
 * is already inside both totals and is given back before measuring. `room`
 * is the most this stepper may show; `limitedBy` says which cap is the
 * tighter one — or none, when the per-line 20 is all that applies.
 */
export function quantityRoom({
  cartTotalItems,
  dishItems,
  baseline = 0,
}: {
  cartTotalItems: number;
  dishItems: number;
  baseline?: number;
}): { room: number; limitedBy: "order" | "dish" | null } {
  const orderRoom = MAX_ITEMS_PER_ORDER - (cartTotalItems - baseline);
  const dishRoom = MAX_QUANTITY - (dishItems - baseline);
  const room = Math.max(0, Math.min(orderRoom, dishRoom, MAX_QUANTITY));
  if (room >= MAX_QUANTITY) return { room, limitedBy: null };
  return { room, limitedBy: orderRoom <= dishRoom ? "order" : "dish" };
}

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
