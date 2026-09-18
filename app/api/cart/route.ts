import { NextResponse } from "next/server";
import { getActiveCart, clearCart } from "@/lib/actions/cart";

/**
 * GET /api/cart
 *
 * Retrieves the logged-in customer's active (unlocked) cart and items.
 * If no active cart exists, creates one automatically.
 */
export async function GET() {
  const result = await getActiveCart();

  if (result.error || !result.data) {
    const status = result.code === "UNAUTHORIZED" ? 401 : result.code === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * DELETE /api/cart
 *
 * Clears all items from the customer's active cart.
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

