import { createAdminClient } from "@/lib/supabase/admin";
import { UNPAID_ORDER_STATUSES } from "@/lib/validation/orders";
import { ABANDONED_PAYMENT_REASON } from "@/lib/orders/order-stage";

/**
 * Cancel orders whose payment was started and never finished.
 *
 * `submitCart` creates the `order` row before PayMongo is contacted, so a
 * customer who abandons the wallet page — closes the tab, lets the source
 * expire, gives up — leaves a row at `awaiting_payment` behind. P1 already
 * keeps those out of the kitchen, manage and rider queues, so nobody cooks
 * them; what they still do is accumulate, and go on offering "Complete
 * payment" on an order whose payment window closed hours ago (issue #106).
 *
 * This is the narrow half of that issue. The full fix — no `order` row at
 * all until PayMongo confirms — needs a `checkout_intent` table and order
 * creation moved into a Postgres function so the Deno webhook can call the
 * same logic. That rewrites the path *every* order takes, cash included, and
 * is its own piece of work. Expiring what was abandoned removes the harm
 * that is actually left without touching how orders are made.
 */

/**
 * How long a customer has to finish paying: 30 minutes (issue #115).
 *
 * The same hour `findAwaitingPaymentOrder` will still offer to send them
 * back to an unpaid order, and deliberately so: the moment checkout stops
 * recovering an order is the moment it should stop existing. Two different
 * numbers here would leave a window where the order is too old to be
 * offered and too young to be cleaned up — visible only as a "Complete
 * payment" button that goes nowhere useful.
 */
export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

/**
 * What the customer is told when they look at the cancelled order later.
 * Word for word the reason `expire_abandoned_orders()` writes
 * (20260926000002), so an order cancelled by the pg_cron sweep and one
 * cancelled here read the same, and `cancellationNoticeFor` recognises both.
 */
export const ABANDONED_REASON = ABANDONED_PAYMENT_REASON;

/**
 * Cancels this customer's expired unpaid orders. Returns the ids it
 * cancelled, so a caller holding those rows can correct them in place rather
 * than reading them back.
 *
 * Runs as the service role. It has to: `customer_cancel_own_orders`
 * (000_remote_schema.sql) only permits an update `USING (order_status =
 * 'pending')`, so a customer session cannot touch one of their own orders at
 * `awaiting_payment` — the update would match zero rows and report success,
 * the same silent failure that left every order without a transaction row.
 * `switchOrderToCashOnDelivery` escalates for the same reason.
 *
 * Every filter is in the statement rather than checked beforehand, so the
 * escalated client can only ever reach this customer's own orders, only
 * while unpaid, and only past the window.
 */
export async function expireAbandonedOrders(
  customerId: string,
  now: Date = new Date(),
): Promise<string[]> {
  const cutoff = new Date(now.getTime() - PAYMENT_WINDOW_MS).toISOString();
  const admin = createAdminClient();

  const { data: candidates, error: readError } = await admin
    .from("order")
    .select("order_id")
    .eq("customer_id", customerId)
    .in("order_status", [...UNPAID_ORDER_STATUSES])
    .lt("created_at", cutoff);

  if (readError || !candidates || candidates.length === 0) return [];

  const ids = candidates.map((row) => row.order_id);

  // A webhook that arrived late — or never — leaves an order whose money did
  // in fact change hands sitting at `awaiting_payment`. Cancelling one of
  // those would tell a customer who paid that their order is gone, which is
  // far worse than an orphan row. The transaction is the record of what
  // PayMongo said, so it decides.
  const { data: paidRows } = await admin
    .from("transaction")
    .select("order_id")
    .in("order_id", ids)
    .eq("payment_status", "paid");

  const paid = new Set((paidRows ?? []).map((row) => row.order_id));
  const toCancel = ids.filter((id) => !paid.has(id));
  if (toCancel.length === 0) return [];

  const { data: cancelled, error: writeError } = await admin
    .from("order")
    .update({
      order_status: "cancelled",
      cancelled_at: now.toISOString(),
      cancellation_reason: ABANDONED_REASON,
    })
    .in("order_id", toCancel)
    // Repeated rather than trusted from the read above: between the two
    // statements the webhook may have promoted one of these to `pending`,
    // and an order in the kitchen must not be cancelled from here.
    .in("order_status", [...UNPAID_ORDER_STATUSES])
    .select("order_id");

  if (writeError) {
    console.error("expireAbandonedOrders:", writeError);
    return [];
  }

  return (cancelled ?? []).map((row) => row.order_id);
}
