import { createClient } from "@/lib/supabase/server";
import { UNPAID_ORDER_STATUSES } from "@/lib/validation/orders";

/**
 * How far back to look for an order the customer still owes money on.
 *
 * A window, not "ever": an order abandoned last week is history, and
 * bouncing someone into its receipt every time they open checkout would be
 * worse than the empty screen. An hour comfortably covers a customer who
 * got stuck at the wallet and came straight back.
 */
const RECOVERY_WINDOW_MS = 60 * 60 * 1000;

/**
 * The signed-in customer's most recent unpaid order, if one is recent enough
 * to still be what they are trying to do.
 *
 * This exists because of how a wallet payment can end. `submitCart` locks
 * the cart and creates the order *before* PayMongo is contacted, then
 * `location.assign` sends the browser to the wallet's own page. If the
 * payment never completes there — the source expires, the customer backs
 * out, or PayMongo answers with its own dead-end error page rather than
 * honouring `return_url` — the customer's way back is the browser's Back
 * button, which lands them on `/checkout` with a fresh, empty cart. The
 * order they just placed is sitting at `awaiting_payment` with no link to it
 * anywhere on screen.
 *
 * Returns the order id so the caller can send them to its confirmation
 * screen instead, which is where the retry and "switch to cash on delivery"
 * controls live.
 */
export async function findAwaitingPaymentOrder(): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const since = new Date(Date.now() - RECOVERY_WINDOW_MS).toISOString();

  const { data } = await supabase
    .from("order")
    .select("order_id")
    .eq("customer_id", user.id)
    .in("order_status", UNPAID_ORDER_STATUSES as unknown as string[])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.order_id ?? null;
}
