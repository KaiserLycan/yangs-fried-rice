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
 * Now everyone gets the first eight characters: the UUID's leading group,
 * `#38206dc0` of `38206dc0-b033-4453-864c-b7c487862c7c`.
 *
 * Eight rather than four, because four was not safe to act on — 65,536
 * possibilities means a repeat is likelier than not by a few hundred orders.
 * Eight gives 4.3 billion, which for one restaurant is never. Not the whole
 * id, because 36 characters does not fit the card headers and nobody reads
 * that out over a phone.
 *
 * Case is left exactly as stored, so the string on screen is one that can be
 * pasted into a search and match.
 *
 * TODO (Backend): an `order_number` column with a sequence behind it, so the
 * reference is something a person can say out loud without spelling it.
 */
export function formatOrderNumber(orderId: string | null | undefined): string {
  return orderId?.trim().slice(0, 8) ?? "";
}
