"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireManager } from "@/lib/auth/require-manager";
import { formatOrderNumber } from "@/lib/orders/order-number";

/**
 * Refunds for paid wallet orders that were cancelled (issue #115), as the
 * manager dashboard shows them.
 *
 * The refunds themselves are sent by the `process-refunds` edge function
 * every 5 minutes. What a manager needs is the ones still in flight, and
 * above all the ones PayMongo refused: those have to be refunded by hand in
 * the PayMongo dashboard, then marked done here.
 */

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type RefundRow = {
  transactionId: string;
  orderId: string | null;
  orderNumber: string;
  amount: number;
  status: "refund_pending" | "refund_failed" | "refunded";
  error: string | null;
  /** PayMongo's `pay_…` id, for "Open in PayMongo" (FINALE 9.4). */
  paymentId: string | null;
  /** When it was refunded, for the recent ones. */
  refundedAt: string | null;
  cancelledAt: string | null;
};

/** How far back "recently refunded" reaches on the dashboard. */
const RECENT_REFUNDS_DAYS = 7;

export async function getRefundQueue(): Promise<RefundRow[]> {
  const supabase = createClient();
  // A server action is its own endpoint; the dashboard's redirect does not
  // cover a direct call.
  if (await requireManager(supabase)) return [];
  const since = new Date(Date.now() - RECENT_REFUNDS_DAYS * 86_400_000).toISOString();

  const columns =
    "transaction_id, order_id, total_paid, subtotal, payment_status, refund_error, refunded_at, provider_payment_id, order:order_id ( cancelled_at, order_number )";

  // Two plain queries rather than one `.or()` string: no filter here is
  // assembled from text (see __tests__/security/injection.test.ts, B4).
  const [open, recent] = await Promise.all([
    supabase
      .from("transaction")
      .select(columns)
      .in("payment_status", ["refund_pending", "refund_failed"])
      .order("transaction_date", { ascending: false })
      .limit(50),
    supabase
      .from("transaction")
      .select(columns)
      .eq("payment_status", "refunded")
      .gte("refunded_at", since)
      .order("refunded_at", { ascending: false })
      .limit(20),
  ]);

  if (open.error || recent.error) {
    console.error("getRefundQueue:", open.error ?? recent.error);
    return [];
  }
  const data = [...(open.data ?? []), ...(recent.data ?? [])];

  // Failed first (they need a person), then in flight, then done.
  const rank = { refund_failed: 0, refund_pending: 1, refunded: 2 } as const;

  return data
    .map((row) => {
      const order = Array.isArray(row.order) ? row.order[0] : row.order;
      return {
        transactionId: row.transaction_id,
        orderId: row.order_id,
        // Was formatOrderNumber(row.order_id): the id where the number goes,
        // so the panel printed a whole UUID.
        orderNumber: row.order_id
          ? formatOrderNumber(
              (order as { order_number: number | null } | null)?.order_number,
              row.order_id,
            )
          : "—",
        paymentId: row.provider_payment_id ?? null,
        amount: Number(row.total_paid) > 0 ? Number(row.total_paid) : Number(row.subtotal ?? 0),
        status: row.payment_status as RefundRow["status"],
        error: row.refund_error,
        refundedAt: row.refunded_at,
        cancelledAt: (order as { cancelled_at: string | null } | null)?.cancelled_at ?? null,
      };
    })
    .sort((a, b) => rank[a.status] - rank[b.status]);
}

const transactionIdSchema = z.string().uuid({ message: "Invalid transaction." });

/**
 * A manager refunded a failed one by hand in PayMongo: record it, so it
 * leaves the "needs attention" list. Only a `refund_failed` row can be
 * marked, so this cannot pretend an untouched payment was refunded.
 */
export async function markRefundedByHand(
  transactionId: string,
): Promise<ActionResult<true>> {
  const parsed = transactionIdSchema.safeParse(transactionId);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const denied = await requireManager(supabase);
  if (denied) return { data: null, error: denied };

  const { data, error } = await supabase
    .from("transaction")
    .update({
      payment_status: "refunded",
      refunded_at: new Date().toISOString(),
      refund_error: null,
    })
    .eq("transaction_id", parsed.data)
    .eq("payment_status", "refund_failed")
    .select("transaction_id");

  if (error || !data || data.length === 0) {
    if (error) console.error("markRefundedByHand:", error);
    return { data: null, error: "Couldn't mark this refund as done. Please refresh and try again." };
  }

  revalidatePath("/manage/dashboard");
  return { data: true, error: null };
}
