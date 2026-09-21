/**
 * What an order actually costs, for the staff and rider screens.
 *
 * The number they need is items + order-level add-ons + delivery fee. It is
 * NOT `transaction.total_paid`: that column is what has been *collected*, so
 * it is 0 for any cash-on-delivery order until the money changes hands — which
 * is exactly why staff kept seeing ₱0.00.
 *
 * Summed in integer centavos so repeated addition can't drift (see
 * `lib/menu/cart-totals.ts` for the same reasoning on the customer side).
 */

const toCentavos = (pesos: number | null | undefined) =>
  Math.round((pesos ?? 0) * 100);

export function computeOrderTotal({
  itemSubtotals,
  orderAddOnPrices = [],
  deliveryFee = 0,
}: {
  /** `order_item.subtotal` per line — already includes that line's add-ons. */
  itemSubtotals: (number | null | undefined)[];
  /** `order_add_on.price` — add-ons attached to the whole order. */
  orderAddOnPrices?: (number | null | undefined)[];
  deliveryFee?: number | null;
}): number {
  const centavos =
    itemSubtotals.reduce<number>((sum, value) => sum + toCentavos(value), 0) +
    orderAddOnPrices.reduce<number>((sum, value) => sum + toCentavos(value), 0) +
    toCentavos(deliveryFee);

  return centavos / 100;
}
