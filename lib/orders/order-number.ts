/**
 * The one reference an order is known by, everywhere.
 *
 * Before this, the same order read four different ways (issue #106):
 * two byte-identical helpers took the *last* four characters of the UUID for
 * the customer, `map-staff-order.ts` took the *first* four for the kitchen
 * and manage, and the rider's proof-of-delivery modal printed the
 * `delivery_id` — a different UUID entirely. A customer on the phone and the
 * person in the kitchen could not check they were talking about the same
 * food.
 *
 * Any four characters of a UUID also collide sooner than people expect: at
 * four hex characters there are 65,536 of them, so by a few hundred orders a
 * repeat is likelier than not. "#3F1A" was never a safe thing to act on.
 *
 * So the whole id is shown. It is not pretty, and it is deliberately the
 * value as stored — the same string that is in the database, in the URL of
 * the tracking page, and in anything staff paste into a search box. A short
 * readable code would need an `order_number` column with a sequence behind
 * it; until that exists, the honest reference is the real one.
 */
export function formatOrderNumber(orderId: string | null | undefined): string {
  return orderId?.trim() ?? "";
}

/**
 * The classes every screen renders the reference with: monospace so that
 * `0`/`O` and `1`/`l` are distinguishable when someone reads one out, and
 * breakable so 36 characters do not push a card header sideways. Each
 * caller adds its own colour and size.
 */
export const ORDER_NUMBER_CLASS = "font-mono break-all leading-tight";
