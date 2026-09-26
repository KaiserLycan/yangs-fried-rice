import type { Fulfilment } from "@/lib/menu/cart-totals";

/**
 * Reads the fulfilment choice out of a URL, in the one place that knows how.
 *
 * The shop is pickup-only (issue #114): there are no riders and no delivery
 * table, and `submit_cart_to_order` refuses a delivery order. So whatever the
 * URL says — an old bookmark with `?fulfilment=delivery`, a typo, nothing —
 * the answer is pickup. The parameter is still read through here so the three
 * pages that used to parse it keep one definition of what it means.
 */
export function fulfilmentFromParam(_value: string | undefined): Fulfilment {
  return "pickup";
}

/**
 * What `submitCart` calls the same choice. The backend's `order.order_type`
 * vocabulary is `dine_in | take_out`; our "pickup" is its "take_out".
 */
export type OrderType = "take_out";

export function orderTypeFor(_fulfilment: Fulfilment): OrderType {
  return "take_out";
}
