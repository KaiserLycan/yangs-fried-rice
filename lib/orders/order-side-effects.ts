import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Follow-up write that must happen when an order changes state, but that the
 * signed-in employee's own RLS-scoped client is not allowed to make.
 *
 * Runs with the service role and is only called from a server action that has
 * already checked who the caller is (`updateOrderStatus` requires a
 * manager/staff). It never throws: a failure is logged and must not undo the
 * status change that triggered it.
 *
 * The same delivery-row creation is also offered as a database trigger in
 * supabase/migrations/20260921000003_*.sql. This copy is what keeps the rider
 * queue working when that trigger hasn't been applied; both are idempotent.
 */

/** Delivery orders need a `delivery` row before a rider can see or accept them. */
export async function ensureDeliveryRow(orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: order } = await admin
      .from("order")
      .select("order_id, order_type")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!order || (order.order_type ?? "").toLowerCase() !== "delivery") return;

    const { data: existing } = await admin
      .from("delivery")
      .select("delivery_id")
      .eq("order_id", orderId)
      .limit(1)
      .maybeSingle();

    if (existing) return;

    const { error } = await admin
      .from("delivery")
      .insert({ order_id: orderId, delivery_status: "pending" });

    if (error) console.error("ensureDeliveryRow: insert failed:", error);
  } catch (err) {
    console.error("ensureDeliveryRow failed:", err);
  }
}
