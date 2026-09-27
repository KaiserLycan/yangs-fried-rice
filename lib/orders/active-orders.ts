import { createClient } from "@/lib/supabase/server";

/**
 * A customer's orders that are still going somewhere (issue #115).
 *
 * "Active" is anything not `completed` or `cancelled` — the issue's wording.
 * That includes the unpaid states (`awaiting_payment`, `payment_failed`):
 * an order the customer may still pay for, or be refunded on, is not one to
 * delete the account out from under.
 *
 * Read with the customer's own client: RLS lets them see their own orders,
 * and `.eq("customer_id", …)` keeps the count to them either way.
 */

/** Statuses an order is finished in. */
export const FINISHED_ORDER_STATUSES = ["completed", "cancelled"] as const;

export async function countActiveOrders(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("order")
    .select("order_id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .not("order_status", "in", `(${FINISHED_ORDER_STATUSES.join(",")})`);

  if (error) throw error;
  return count ?? 0;
}

/**
 * The signed-in customer's active-order count, for the profile screen's
 * warning. 0 when signed out or when the read fails: the warning is a
 * courtesy, and `deleteMyAccount` checks again and refuses on failure.
 */
export async function readMyActiveOrderCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  try {
    return await countActiveOrders(supabase, user.id);
  } catch {
    return 0;
  }
}
