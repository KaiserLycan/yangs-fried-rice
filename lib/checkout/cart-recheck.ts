/**
 * What changed in a cart between the customer reading checkout and pressing
 * Place order (FINALE 9.1, 9.10).
 *
 * `submit_cart_to_order` refuses with ITEM_UNAVAILABLE or PRICE_CHANGED and
 * names the dishes in one sentence. That is enough for a toast, not for
 * pointing at the lines — so after such a refusal checkout asks the server
 * for each line's live state (`recheckCart`) and this compares it with the
 * prices the customer was shown.
 */

/** One cart line as the menu has it now. */
export type LiveCartLine = {
  id: string;
  name: string;
  /** Pesos for one, add-ons included — priced the way the RPC prices it. */
  unitPrice: number;
  /** False when the dish was deleted, archived or switched off. */
  available: boolean;
};

export type PriceChange = { id: string; name: string; was: number; now: number };

export type CartRecheck = {
  unavailable: { id: string; name: string }[];
  priceChanges: PriceChange[];
};

/** Line id → what is wrong with it, for highlighting the summary rows. */
export type LineFlags = Record<
  string,
  { kind: "unavailable" } | { kind: "price"; was: number; now: number }
>;

/** Half a centavo, the same tolerance `submit_cart_to_order` uses. */
const TOLERANCE = 0.005;

export function compareCart(
  shownPrices: Record<string, number>,
  live: LiveCartLine[],
): CartRecheck {
  const unavailable: CartRecheck["unavailable"] = [];
  const priceChanges: PriceChange[] = [];

  for (const line of live) {
    if (!line.available) {
      unavailable.push({ id: line.id, name: line.name });
      continue;
    }
    const was = shownPrices[line.id];
    if (typeof was === "number" && Math.abs(line.unitPrice - was) >= TOLERANCE) {
      priceChanges.push({ id: line.id, name: line.name, was, now: line.unitPrice });
    }
  }

  return { unavailable, priceChanges };
}

export function hasCartProblems(recheck: CartRecheck | null): boolean {
  return (
    recheck !== null &&
    (recheck.unavailable.length > 0 || recheck.priceChanges.length > 0)
  );
}

export function lineFlagsFor(recheck: CartRecheck | null): LineFlags {
  const flags: LineFlags = {};
  if (!recheck) return flags;
  for (const line of recheck.unavailable) flags[line.id] = { kind: "unavailable" };
  for (const change of recheck.priceChanges) {
    flags[change.id] = { kind: "price", was: change.was, now: change.now };
  }
  return flags;
}

/** The refusals worth re-checking the cart for. */
export const RECHECK_CODES = new Set(["ITEM_UNAVAILABLE", "PRICE_CHANGED"]);
