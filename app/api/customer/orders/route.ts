import { NextResponse } from "next/server";
import { getMyOrders } from "@/lib/actions/customer-orders";

/**
 * GET /api/customer/orders
 *
 * Returns the logged-in customer's full order history with itemised
 * receipts, payment info, and review status.
 *
 * Auth: requires an authenticated customer session.
 */
export async function GET() {
  const result = await getMyOrders();

  if (result.error || !result.data) {
    const status = result.error?.includes("signed in") ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    count: result.data.length,
    data: result.data,
  });
}
