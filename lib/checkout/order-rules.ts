/**
 * The checkout's money rules, as the customer and the counter see them.
 *
 * `submit_cart_to_order` (supabase/migrations/20260929110000_*) enforces
 * every one of these and has the final say; the copies here let the cart and
 * checkout explain a rule before the customer runs into it. Change both
 * together — `__tests__/order-rules.test.ts` compares them.
 */

/** Below this the kitchen loses money on the ticket (limitations L6). */
export const MIN_ORDER = 150;

/** Pay-in-store orders above this must be paid by wallet (L6). */
export const CASH_LIMIT = 2000;

/** A new account's first pay-in-store order (L18). */
export const FIRST_CASH_LIMIT = 1000;

/** Missed pick-ups on cash orders before pay in store is switched off (F14). */
export const NO_SHOW_CASH_BLOCK = 2;

/** Missed pick-ups before the manager is prompted to disable the account (F14). */
export const NO_SHOW_DISABLE_PROMPT = 3;

/** Tip buttons at checkout, in pesos (F19: amounts, never percentages). */
export const TIP_PRESETS = [0, 20, 50, 100] as const;
export const MAX_TIP = 5000;

/** "Customer didn't pick up" — why, as staff choose it. */
export const NO_SHOW_REASONS = {
  unreachable: "Couldn't reach the customer",
  wrong_info: "Wrong name or number on the order",
  refused: "Customer refused the order",
  no_show: "Customer never came",
} as const;
export type NoShowReason = keyof typeof NO_SHOW_REASONS;

/** How much more the cart needs to reach the minimum, or 0. */
export function amountToMinimum(subtotal: number): number {
  return Math.max(0, Math.round((MIN_ORDER - subtotal) * 100) / 100);
}

/**
 * Why pay in store can't be used for this order, or null when it can.
 * `completedCashOrders` and `noShows` are the customer's own history.
 */
export function payInStoreBlock({
  total,
  completedCashOrders,
  noShows,
}: {
  total: number;
  completedCashOrders: number;
  noShows: number;
}): string | null {
  if (noShows >= NO_SHOW_CASH_BLOCK) {
    return `Pay in store isn't available after ${noShows} missed pick-ups. Please pay with GCash or Maya.`;
  }
  if (total > CASH_LIMIT) {
    return `Orders over ₱${CASH_LIMIT.toLocaleString("en-PH")} are paid with GCash or Maya.`;
  }
  if (completedCashOrders === 0 && total > FIRST_CASH_LIMIT) {
    return `Your first pay-in-store order can be up to ₱${FIRST_CASH_LIMIT.toLocaleString("en-PH")}.`;
  }
  return null;
}

/** Change the counter must prepare, or null when none was asked for. */
export function changeDue(total: number, cashTendered: number | null | undefined): number | null {
  if (cashTendered == null || !Number.isFinite(cashTendered)) return null;
  return Math.max(0, Math.round((cashTendered - total) * 100) / 100);
}
