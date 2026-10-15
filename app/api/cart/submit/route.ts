import { NextResponse } from "next/server";
import { submitCart } from "@/lib/actions/cart";

/**
 * POST /api/cart/submit
 *
 * Turns the cart into an order and deletes the cart. A repeat submit of the
 * same cart finds nothing and is rejected.
 *
 * Rejects with 404 Not Found if the cart does not exist (including one that
 * was already submitted).
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
    else if (result.code === "NOT_FOUND") status = 404;
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
