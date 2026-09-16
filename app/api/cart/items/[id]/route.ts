import { NextResponse } from "next/server";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/cart/items/:id
 *
 * Updates quantity and/or special instructions for a specific item instance.
 * Rejects with 409 Conflict if cart is locked.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body." },
      { status: 400 }
    );
  }

  const result = await updateCartItem(params.id, body as any);

  if (result.error || !result.data) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.code === "CART_LOCKED") status = 409;
    else if (result.error.includes("not found")) status = 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "Cart item updated successfully.",
    data: result.data,
  });
}

/**
 * DELETE /api/cart/items/:id
 *
 * Removes a specific item instance from the cart.
 * Rejects with 409 Conflict if cart is locked.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const result = await removeCartItem(params.id);

  if (result.error) {
    let status = 400;
    if (result.code === "UNAUTHORIZED") status = 401;
    else if (result.code === "FORBIDDEN") status = 403;
    else if (result.code === "CART_LOCKED") status = 409;
    else if (result.error.includes("not found")) status = 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "Cart item removed successfully.",
  });
}
