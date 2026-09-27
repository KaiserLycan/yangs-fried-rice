/**
 * The one reference an order is known by, everywhere.
 *
 * Issue #106 made every screen agree on one reference — the first eight
 * characters of the UUID, `#38206dc0` — after the same order had read four
 * different ways. Consistent, but not something to say across a counter:
 * "three-eight-two-zero-six-D-C-zero" (UI/UX review, docs/user-simulation.md
 * #16).
 *
 * Now it is `order.order_number` (migration 20260928000007): `#1042`, handed
 * out by the database in order, never reused and never editable. The UUID is
 * still the key for URLs and foreign keys; this is only what people see and
 * say. The notification trigger and the audit log print the same number.
 *
 * `orderId` is the fallback for a row read without the number (a realtime
 * payload, or anything selected before the column existed), so a screen
 * never shows an empty reference.
 */
export function formatOrderNumber(
  orderNumber: number | string | null | undefined,
  orderId?: string | null,
): string {
  const number = orderNumber === null || orderNumber === undefined ? "" : String(orderNumber).trim();
  if (number) return number;
  return orderId?.trim().slice(0, 8) ?? "";
}

/**
 * The order number a search is asking for — "1042", "#1042", " 1042 " — or
 * null when it is not one. All digits means an order number; anything with a
 * letter in it is the older id prefix (`orderIdRangeFor`), which still works
 * for a reference printed before the change.
 */
export function orderNumberSearch(query: string): number | null {
  const digits = query.trim().replace(/^#/, "");
  if (!/^[0-9]{1,12}$/.test(digits)) return null;
  return Number(digits);
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
