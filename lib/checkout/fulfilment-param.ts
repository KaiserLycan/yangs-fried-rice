import type { Fulfilment } from "@/lib/menu/cart-totals";

/**
 * Reads the fulfilment choice out of a URL, in the one place that knows how.
 *
 * Delivery versus Pickup has nowhere to persist to — there is no fulfilment
 * column on `cart`, `cart_item`, or anywhere else (see `FulfilmentToggle`),
 * and it changes what the customer pays by ₱95. So the choice travels in the
 * query string between the cart and checkout, in both directions: forward so
 * checkout quotes the total the customer just agreed to, and back so someone
 * who returns to edit a line doesn't silently land on delivery again.
 *
 * Anything that isn't "pickup" reads as delivery — the default both frames
 * draw — so a typed, stale or truncated URL lands somewhere sensible rather
 * than on an error. Three pages parse this parameter; they parse it here so
 * they cannot disagree about what a missing or malformed value means.
 */
export function fulfilmentFromParam(value: string | undefined): Fulfilment {
  return value === "pickup" ? "pickup" : "delivery";
}

/**
 * What `submitCart` calls the same choice. The backend's `order.order_type`
 * vocabulary is `dine_in | take_out | delivery` (`lib/validation/cart.ts`),
 * and the frames only ever offer two of those: our "pickup" is its
 * "take_out". Mapped here, next to the parser, so the two names for one
 * idea are translated in exactly one place.
 */
export type OrderType = "take_out" | "delivery";

export function orderTypeFor(fulfilment: Fulfilment): OrderType {
  return fulfilment === "pickup" ? "take_out" : "delivery";
}
