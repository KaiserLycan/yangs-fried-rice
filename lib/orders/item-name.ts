/**
 * What to call a line on an order.
 *
 * Every view of an order used to resolve the name by joining `product` live,
 * with its own fallback string when the join came back empty — four mappers,
 * three different strings ("Unknown Item", "Unknown item", "Item no longer on
 * the menu"). Deleting a menu item nulled `order_item.product_id` on every
 * historical line, so KDS, the rider queue and order tracking all started
 * printing the fallback for food that had definitely been ordered and paid
 * for (issue #106).
 *
 * Orders now carry a snapshot of the name as it was when placed. The rules,
 * in order:
 *
 *   1. the snapshot — what the customer actually ordered, immune to later
 *      renames, repricing or removal;
 *   2. the live product name — for rows placed before the snapshot column
 *      existed;
 *   3. `ITEM_GONE_LABEL` — genuinely unrecoverable, and worded so a rider
 *      reading it knows the item existed rather than suspecting a bug.
 */

export const ITEM_GONE_LABEL = "Item no longer on the menu";

export function orderItemName(
  snapshot: string | null | undefined,
  liveName: string | null | undefined,
): string {
  return snapshot?.trim() || liveName?.trim() || ITEM_GONE_LABEL;
}

/**
 * Per-unit price for a line.
 *
 * Prefers the snapshot, then divides the stored line total, and only then
 * falls back to today's product price — which may have moved since, and so
 * is the least honest of the three.
 */
export function orderItemUnitPrice(
  snapshotUnitPrice: number | null | undefined,
  subtotal: number | null | undefined,
  quantity: number,
  liveProductPrice: number | null | undefined,
): number {
  if (typeof snapshotUnitPrice === "number") return snapshotUnitPrice;
  if (typeof subtotal === "number" && quantity > 0) return subtotal / quantity;
  return liveProductPrice ?? 0;
}
