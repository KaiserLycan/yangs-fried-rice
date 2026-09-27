import type { createClient } from "@/lib/supabase/server";

/**
 * How many orders are in each stage, for the manager's store panel
 * (issue #115 follow-up). The same columns the Orders page uses:
 *
 *   Queue        pending                 waiting to be cooked
 *   Prep         preparing               being cooked
 *   For pickup   ready (+ legacy out_for_delivery)
 *   Completed    completed today
 *   Cancelled    cancelled today
 *
 * Queue + Prep is what `get_store_status()` calls "active orders": what the
 * kitchen still has to cook, and what the busy limit is compared against.
 * Orders still waiting on an online payment are in none of these.
 */
export type OrderStatusCounts = {
  queue: number;
  prep: number;
  pickup: number;
  completedToday: number;
  cancelledToday: number;
};

export const EMPTY_STATUS_COUNTS: OrderStatusCounts = {
  queue: 0,
  prep: 0,
  pickup: 0,
  completedToday: 0,
  cancelledToday: 0,
};

/** Midnight today in Manila (UTC+8, no daylight saving), as an ISO instant. */
export function manilaDayStart(now: Date = new Date()): string {
  const manila = new Date(now.getTime() + 8 * 3_600_000);
  const midnightUtc = Date.UTC(
    manila.getUTCFullYear(),
    manila.getUTCMonth(),
    manila.getUTCDate(),
  );
  return new Date(midnightUtc - 8 * 3_600_000).toISOString();
}

/**
 * Reads the counts with the signed-in manager's client (staff may read every
 * order). Never throws: a failed count reads as 0, because the panel is a
 * summary and the Orders page holds the real list.
 */
export async function readOrderStatusCounts(
  supabase: ReturnType<typeof createClient>,
  now: Date = new Date(),
): Promise<OrderStatusCounts> {
  const since = manilaDayStart(now);

  const orders = () =>
    supabase.from("order").select("order_id", { count: "exact", head: true });
  const n = (res: { count: number | null; error: unknown }) =>
    res.error ? 0 : (res.count ?? 0);

  try {
    const [queue, prep, pickup, completedToday, cancelledToday] = await Promise.all([
      orders().eq("order_status", "pending").then(n),
      orders().eq("order_status", "preparing").then(n),
      orders().in("order_status", ["ready", "out_for_delivery"]).then(n),
      orders().eq("order_status", "completed").gte("completed_at", since).then(n),
      orders().eq("order_status", "cancelled").gte("cancelled_at", since).then(n),
    ]);
    return { queue, prep, pickup, completedToday, cancelledToday };
  } catch {
    return EMPTY_STATUS_COUNTS;
  }
}
