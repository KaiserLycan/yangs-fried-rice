import { createClient } from "@/lib/supabase/server";

export type CashHistory = { completedCashOrders: number; noShows: number };

/**
 * The signed-in customer's pay-in-store record: how many cash orders they
 * have collected and paid for, and how many ready orders they never picked
 * up (FINALE L18, F14). Read with the customer's own session, so RLS limits
 * it to their orders. `submit_cart_to_order` counts the same rows.
 *
 * On a failed read it assumes a good record: the database still refuses at
 * checkout, and a customer is never shown a block that isn't real.
 */
export async function readCashHistory(): Promise<CashHistory> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { completedCashOrders: 1, noShows: 0 };

  const cashOrders = () =>
    supabase
      .from("order")
      .select("order_id, transaction!inner(payment_method)", { count: "exact", head: true })
      .eq("customer_id", user.id)
      .eq("transaction.payment_method", "pay_in_store");

  const [completed, noShows] = await Promise.all([
    cashOrders().eq("order_status", "completed"),
    cashOrders().not("no_show_reason", "is", null),
  ]);

  if (completed.error || noShows.error) return { completedCashOrders: 1, noShows: 0 };
  return { completedCashOrders: completed.count ?? 0, noShows: noShows.count ?? 0 };
}
