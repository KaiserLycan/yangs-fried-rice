import { NextResponse } from "next/server";
import { cancelCustomerOrder } from "@/lib/actions/cart";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/customer/orders/:id/cancel
 *
 * Cancels a customer order before it is officially confirmed by restaurant staff.
 *
 * Rejects with 409 Conflict if the order has already been confirmed, is preparing,
 * is ready, or has completed.
 */
export async function POST(request: Request, { params }: RouteParams) {
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body." },
      { status: 400 }
    );
  }

  const result = await cancelCustomerOrder(params.id, body as any);

  if (result.error || !result.data) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.error.includes("not found")) status = 404;
    else if (result.code && (result.code.startsWith("ORDER_") || result.code === "ALREADY_CANCELLED")) status = 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "Order cancelled successfully.",
    data: result.data,
  });
}
