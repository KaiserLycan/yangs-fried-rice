import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readRecentCompletedOrders, RECENT_ORDERS_LIMIT } from "@/lib/orders/read-recent-orders";

/**
 * GET /api/customer/orders/recent?limit=3
 *
 * The signed-in customer's most recent completed orders — what the menu's
 * "Order again" row shows (issue #118). `limit` defaults to 3, at most 10.
 * Reorder with the `reorderPastOrder` server action.
 *
 * Auth: requires a signed-in customer; 401 otherwise.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in as a customer." }, { status: 401 });
  }

  const raw = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? raw : RECENT_ORDERS_LIMIT;

  const data = await readRecentCompletedOrders(limit);
  return NextResponse.json({ count: data.length, data });
}
