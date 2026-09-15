import { NextResponse } from "next/server";
import { submitCart } from "@/lib/actions/cart";

/**
 * POST /api/cart/submit
 *
 * Finalizes and locks the cart immediately (sets is_final = true, status = 'submitted'),
 * creating a new order with order_status = 'pending'.
 *
 * Rejects with 409 Conflict if the cart has already been submitted and locked.
 * Rejects with 400 Bad Request if the cart is empty.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body." },
      { status: 400 }
    );
  }

  const result = await submitCart(body as any);

  if (result.error || !result.data) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.code === "CART_LOCKED") status = 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(
    {
      message: "Order submitted successfully. Cart is now locked.",
      data: result.data,
    },
    { status: 201 }
  );
}
