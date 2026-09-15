import { NextResponse } from "next/server";
import { addCartItem, clearCart } from "@/lib/actions/cart";

/**
 * POST /api/cart/items
 *
 * Adds a product instance with custom instructions to the customer's active cart.
 * Rejects with 409 Conflict if the cart has already been finalized/locked.
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

  const result = await addCartItem(body as any);

  if (result.error || !result.data) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.code === "CART_LOCKED") status = 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(
    {
      message: "Item added to cart successfully.",
      data: result.data,
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/cart/items
 *
 * Removes all items from the customer's active cart.
 * Rejects with 409 Conflict if the cart is locked.
 */
export async function DELETE() {
  const result = await clearCart();

  if (result.error) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.code === "CART_LOCKED") status = 409;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: result.data?.message ?? "All items removed from cart successfully.",
  });
}

