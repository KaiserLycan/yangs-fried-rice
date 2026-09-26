import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * How many orders the kitchen is already working through.
 *
 * Extracted from `lib/actions/eta.ts`, which had this query inline. Checkout
 * now needs the same number to quote an arrival window before the order
 * exists (issue #106), and two copies of this status list would let the
 * estimate a customer agrees to disagree with the one they are shown a
 * moment later on tracking.
 */

/**
 * The statuses that mean "this is still cooking or waiting to".
 *
 * `order_status` is plain nullable text with no CHECK constraint, so this is
 * a list of the values the app actually writes rather than an enum anything
 * enforces. `awaiting_payment` and `payment_failed` are deliberately absent:
 * an unpaid order is not in the kitchen and must not lengthen anyone's wait.
 */
export const ACTIVE_KITCHEN_STATUSES = [
  "pending",
  "received",
  "confirmed",
  "preparing",
] as const;

/**
 * @param before Count only what was placed before this timestamp — the queue
 *   *ahead of* a specific order. Omit it to count the whole live queue, which
 *   is what a customer who has not ordered yet is about to join the back of.
 */
export async function countActiveKitchenOrders(
  supabase: SupabaseClient<any, any, any>,
  before?: string | null,
): Promise<number> {
  let query = supabase
    .from("order")
    .select("order_id", { count: "exact", head: true })
    .in("order_status", ACTIVE_KITCHEN_STATUSES as unknown as string[]);

  if (before) query = query.lt("created_at", before);

  const { count } = await query;
  // A failed count reads as an empty kitchen, which quotes the shortest
  // honest wait rather than refusing to quote one at all.
  return count ?? 0;
}
