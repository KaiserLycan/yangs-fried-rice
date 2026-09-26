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

/**
 * What a person typed into an order search, as bare lowercase hex — or null
 * when it cannot be part of an order id. "#6940", " 6940 " and "69403B15-"
 * all become "6940...". Searching matches from the start of the id, because
 * the start is the part printed on every card.
 */
export function normalizeOrderSearch(query: string): string | null {
  const hex = query.trim().replace(/^#/, "").replace(/-/g, "").toLowerCase();
  if (!hex || hex.length > 32 || !/^[0-9a-f]+$/.test(hex)) return null;
  return hex;
}

/** Does this order's id start with what was typed? Empty search matches all. */
export function orderMatchesSearch(orderId: string | null | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const hex = normalizeOrderSearch(query);
  if (!hex || !orderId) return false;
  return orderId.replace(/-/g, "").toLowerCase().startsWith(hex);
}

/**
 * The same prefix match as a range of UUIDs, so the database can do it on a
 * paginated list: every id starting "6940" sits between
 * 69400000-0000-… and 6940ffff-ffff-…. PostgREST cannot cast a uuid to text
 * for a LIKE, and comparing uuids compares their hex in order, so a range is
 * the one filter that needs no database change.
 */
export function orderIdRangeFor(query: string): { from: string; to: string } | null {
  const hex = normalizeOrderSearch(query);
  if (!hex) return null;
  const asUuid = (h: string) =>
    `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  return {
    from: asUuid(hex.padEnd(32, "0")),
    to: asUuid(hex.padEnd(32, "f")),
  };
}
