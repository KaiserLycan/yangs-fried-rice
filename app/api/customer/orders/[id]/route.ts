import { NextResponse } from "next/server";
import { getMyOrderDetail } from "@/lib/actions/customer-orders";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customer/orders/:id
 *
 * Returns a single order's full receipt detail: items with product
 * info, transaction/payment data, and review (if one exists).
 *
 * Auth: requires an authenticated customer session.
 * The customer can only access their own orders (enforced by RLS +
 * server action ownership check).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const result = await getMyOrderDetail(params.id);

  if (result.error || !result.data) {
    let status = 500;
    if (result.error?.includes("signed in")) status = 401;
    else if (result.error?.includes("not registered")) status = 403;
    else if (result.error?.includes("not found")) status = 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ data: result.data });
}
