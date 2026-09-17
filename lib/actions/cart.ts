"use server";

import { createClient } from "@/lib/supabase/server";
import {
  addCartItemSchema,
  updateCartItemSchema,
  submitCartSchema,
  cancelOrderSchema,
  type AddCartItemInput,
  type UpdateCartItemInput,
  type SubmitCartInput,
  type CancelOrderInput,
} from "@/lib/validation/cart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; code?: string };

export type CartItemDetail = {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  special_instructions: string | null;
  subtotal: number;
};

export type ActiveCart = {
  cart_id: string;
  customer_id: string;
  is_final: boolean;
  status: string;
  order_id: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  items: CartItemDetail[];
  total_items: number;
  subtotal: number;
};

// ---------------------------------------------------------------------------
// Auth Helper
// ---------------------------------------------------------------------------

async function requireCustomer(): Promise<
  ActionResult<{ customer_id: string }>
> {
  const supabase = createClient();
  // Optimization: getSession reads from the cookie locally (0 network requests),
  // whereas getUser makes an HTTP request to the Supabase Auth API.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { data: null, error: "You must be signed in.", code: "UNAUTHORIZED" };
  }

  // Optimization: We skip checking the `customer` table explicitly because 
  // foreign key constraints on `cart` will prevent non-customers from creating carts anyway.
  return { data: { customer_id: session.user.id }, error: null };
}

// ---------------------------------------------------------------------------
// 1. Get Active Cart
// ---------------------------------------------------------------------------

export async function getActiveCart(): Promise<ActionResult<ActiveCart>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();

  // Optimization: Fetch the cart AND its items in a single query to eliminate an extra roundtrip.
  let { data: cart } = await supabase
    .from("cart")
    .select(`
      *,
      items:cart_item(
        cart_item_id,
        cart_id,
        product_id,
        quantity,
        special_instructions,
        product (
          product_name,
          product_price
        )
      )
    `)
    .eq("customer_id", auth.data.customer_id)
    .eq("is_final", false)
    .maybeSingle();

  // If no active cart exists, create one
  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from("cart")
      .insert({
        customer_id: auth.data.customer_id,
        is_final: false,
        status: "active",
      })
      .select()
      .single();

    if (createError || !newCart) {
      return { data: null, error: createError?.message ?? "Failed to initialize cart." };
    }
    cart = { ...newCart, items: [] };
  }

  const rawItems = cart.items || [];
  const items: CartItemDetail[] = rawItems.map((row: any) => {
    const product = row.product as { product_name: string; product_price: number } | null;
    const price = product?.product_price ?? 0;
    const qty = row.quantity;
    return {
      cart_item_id: row.cart_item_id,
      cart_id: row.cart_id ?? cart!.cart_id,
      product_id: row.product_id ?? "",
      product_name: product?.product_name ?? "Unknown Item",
      product_price: price,
      quantity: qty,
      special_instructions: row.special_instructions,
      subtotal: price * qty,
    };
  });

  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total_items = items.reduce((acc, item) => acc + item.quantity, 0);

  return {
    data: {
      cart_id: cart.cart_id,
      customer_id: cart.customer_id ?? auth.data.customer_id,
      is_final: cart.is_final ?? false,
      status: cart.status ?? "active",
      order_id: cart.order_id ?? null,
      submitted_at: cart.submitted_at ?? null,
      updated_at: cart.updated_at ?? null,
      items,
      total_items,
      subtotal,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 2. Add Cart Item (Enforces Locking)
// ---------------------------------------------------------------------------
// Optimization: Replaced sequential DB calls and redundant `getActiveCart()` invocations
// with `Promise.all()` to fetch the active cart state and product details concurrently. 
// Similarly, inserting the new `cart_item` and updating the parent cart's `updated_at` 
// are now executed in parallel. This eliminates the "waterfall" effect, significantly 
// reducing the latency of the operation.
export async function addCartItem(
  rawInput: AddCartItemInput
): Promise<ActionResult<CartItemDetail>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const parsed = addCartItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid item input." };
  }

  const supabase = createClient();

  // Fetch cart and product concurrently to save time
  const [cartResult, productResult] = await Promise.all([
    supabase
      .from("cart")
      .select("cart_id, is_final")
      .eq("customer_id", auth.data.customer_id)
      .eq("is_final", false)
      .maybeSingle(),
    supabase
      .from("product")
      .select("product_id, product_name, product_price, is_available")
      .eq("product_id", parsed.data.product_id)
      .single(),
  ]);

  let cart = cartResult.data;
  if (!cart) {
    const { data: newCart, error: createError } = await supabase
      .from("cart")
      .insert({
        customer_id: auth.data.customer_id,
        is_final: false,
        status: "active",
      })
      .select("cart_id, is_final")
      .single();

    if (createError || !newCart) {
      return { data: null, error: createError?.message ?? "Failed to initialize cart." };
    }
    cart = newCart;
  } else if (cart.is_final) {
    return {
      data: null,
      error: "Cart is locked and cannot be modified.",
      code: "CART_LOCKED",
    };
  }

  const { data: product, error: prodError } = productResult;
  if (prodError || !product) {
    return { data: null, error: "Product not found." };
  }

  if (product.is_available === false) {
    return { data: null, error: `Product "${product.product_name}" is currently unavailable.` };
  }

  // Insert item and update cart concurrently
  const [insertResult] = await Promise.all([
    supabase
      .from("cart_item")
      .insert({
        cart_id: cart.cart_id,
        product_id: product.product_id,
        quantity: parsed.data.quantity,
        special_instructions: parsed.data.special_instructions ?? null,
      })
      .select()
      .single(),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", cart.cart_id),
  ]);

  const newItem = insertResult.data;
  const insertError = insertResult.error;

  if (insertError || !newItem) {
    return { data: null, error: insertError?.message ?? "Failed to add item to cart." };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: {
      cart_item_id: newItem.cart_item_id,
      cart_id: cart.cart_id,
      product_id: product.product_id,
      product_name: product.product_name,
      product_price: product.product_price,
      quantity: newItem.quantity,
      special_instructions: newItem.special_instructions,
      subtotal: product.product_price * newItem.quantity,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 3. Update Cart Item (Enforces Locking)
// ---------------------------------------------------------------------------
// Optimization: Updating the cart item and updating the parent cart's `updated_at` 
// timestamp are now executed concurrently via `Promise.all()` rather than sequentially, 
// cutting down on database roundtrips.
export async function updateCartItem(
  cartItemId: string,
  rawInput: UpdateCartItemInput
): Promise<ActionResult<CartItemDetail>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const parsed = updateCartItemSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid update input." };
  }

  const supabase = createClient();

  // Find item and verify parent cart belongs to customer
  const { data: item, error: itemError } = await supabase
    .from("cart_item")
    .select(`
      cart_item_id,
      cart_id,
      product_id,
      quantity,
      special_instructions,
      cart!inner (
        cart_id,
        customer_id,
        is_final
      ),
      product (
        product_name,
        product_price
      )
    `)
    .eq("cart_item_id", cartItemId)
    .single();

  if (itemError || !item) {
    return { data: null, error: "Cart item not found." };
  }

  const parentCart = item.cart as unknown as {
    cart_id: string;
    customer_id: string;
    is_final: boolean;
  };

  if (parentCart.customer_id !== auth.data.customer_id) {
    return { data: null, error: "Access denied.", code: "FORBIDDEN" };
  }

  // STRICT LOCKING ENFORCEMENT: reject if cart is final
  if (parentCart.is_final) {
    return {
      data: null,
      error: "Cart is locked and cannot be modified.",
      code: "CART_LOCKED",
    };
  }

  const updatePayload: { quantity?: number; special_instructions?: string | null } = {};
  if (parsed.data.quantity !== undefined) {
    updatePayload.quantity = parsed.data.quantity;
  }
  if (parsed.data.special_instructions !== undefined) {
    updatePayload.special_instructions = parsed.data.special_instructions;
  }

  const [updateResult] = await Promise.all([
    supabase
      .from("cart_item")
      .update(updatePayload)
      .eq("cart_item_id", cartItemId)
      .select()
      .single(),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", parentCart.cart_id),
  ]);

  const updated = updateResult.data;
  const updateError = updateResult.error;

  if (updateError || !updated) {
    return { data: null, error: updateError?.message ?? "Failed to update cart item." };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  const product = item.product as { product_name: string; product_price: number } | null;
  const price = product?.product_price ?? 0;

  return {
    data: {
      cart_item_id: updated.cart_item_id,
      cart_id: parentCart.cart_id,
      product_id: updated.product_id ?? "",
      product_name: product?.product_name ?? "Unknown Item",
      product_price: price,
      quantity: updated.quantity,
      special_instructions: updated.special_instructions,
      subtotal: price * updated.quantity,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 4. Remove Cart Item (Enforces Locking)
// ---------------------------------------------------------------------------
// Optimization: Deleting the cart item and updating the parent cart's `updated_at` 
// timestamp are now executed concurrently via `Promise.all()` rather than sequentially.
export async function removeCartItem(
  cartItemId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();

  const { data: item, error: itemError } = await supabase
    .from("cart_item")
    .select(`
      cart_item_id,
      cart_id,
      cart!inner (
        cart_id,
        customer_id,
        is_final
      )
    `)
    .eq("cart_item_id", cartItemId)
    .single();

  if (itemError || !item) {
    return { data: null, error: "Cart item not found." };
  }

  const parentCart = item.cart as unknown as {
    cart_id: string;
    customer_id: string;
    is_final: boolean;
  };

  if (parentCart.customer_id !== auth.data.customer_id) {
    return { data: null, error: "Access denied.", code: "FORBIDDEN" };
  }

  // STRICT LOCKING ENFORCEMENT
  if (parentCart.is_final) {
    return {
      data: null,
      error: "Cart is locked and cannot be modified.",
      code: "CART_LOCKED",
    };
  }

  const [deleteResult] = await Promise.all([
    supabase
      .from("cart_item")
      .delete()
      .eq("cart_item_id", cartItemId),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", parentCart.cart_id),
  ]);

  if (deleteResult.error) {
    return { data: null, error: deleteResult.error.message };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return { data: { success: true }, error: null };
}

// ---------------------------------------------------------------------------
// 4b. Clear All Items from Cart (Enforces Locking)
// ---------------------------------------------------------------------------
// Optimization: Avoids calling `getActiveCart()` which redundantly fetched all items 
// and performed an extra auth check. Instead, it queries the minimum required cart 
// info directly. Item deletion and cart `updated_at` modification are also executed 
// concurrently using `Promise.all()`.
export async function clearCart(): Promise<
  ActionResult<{ success: true; message: string }>
> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();

  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id, is_final")
    .eq("customer_id", auth.data.customer_id)
    .eq("is_final", false)
    .maybeSingle();

  if (!cart) {
    return {
      data: { success: true, message: "Cart is already empty." },
      error: null,
    };
  }

  // STRICT LOCKING ENFORCEMENT
  if (cart.is_final) {
    return {
      data: null,
      error: "Cart is locked and cannot be modified.",
      code: "CART_LOCKED",
    };
  }

  const [deleteResult] = await Promise.all([
    supabase
      .from("cart_item")
      .delete()
      .eq("cart_id", cart.cart_id),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", cart.cart_id),
  ]);

  if (deleteResult.error) {
    return { data: null, error: deleteResult.error.message };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: { success: true, message: "All items removed from cart successfully." },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 5. Submit Cart (Locks Cart Immediately & Generates Order)
// ---------------------------------------------------------------------------

export async function submitCart(
  rawInput: SubmitCartInput
): Promise<
  ActionResult<{
    order_id: string;
    order_status: string;
    cart_id: string;
    is_final: boolean;
  }>
> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const parsed = submitCartSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid submit input." };
  }

  const supabase = createClient();

  // Try RPC first (if installed in Supabase)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "submit_cart_to_order",
    {
      p_cart_id: parsed.data.cart_id,
      p_order_type: parsed.data.order_type,
      p_special_instructions: parsed.data.special_instructions ?? undefined,
      p_delivery_fee: parsed.data.delivery_fee,
    }
  );

  if (!rpcError && rpcData) {
    return {
      data: rpcData as {
        order_id: string;
        order_status: string;
        cart_id: string;
        is_final: boolean;
      },
      error: null,
    };
  }

  // Fallback to direct client orchestration if RPC is not yet executed in Supabase
  const { data: cart, error: cartError } = await supabase
    .from("cart")
    .select("cart_id, customer_id, is_final, status")
    .eq("cart_id", parsed.data.cart_id)
    .single();

  if (cartError || !cart) {
    return { data: null, error: "Cart not found." };
  }

  if (cart.customer_id !== auth.data.customer_id) {
    return { data: null, error: "Access denied.", code: "FORBIDDEN" };
  }

  if (cart.is_final) {
    return {
      data: null,
      error: "Cart is already submitted and locked.",
      code: "CART_LOCKED",
    };
  }

  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_item")
    .select(`
      product_id,
      quantity,
      special_instructions,
      product ( product_price )
    `)
    .eq("cart_id", cart.cart_id);

  if (itemsError || !cartItems || cartItems.length === 0) {
    return { data: null, error: "Cannot submit an empty cart." };
  }

  // 1. Create order with status 'pending'
  const { data: newOrder, error: orderError } = await supabase
    .from("order")
    .insert({
      customer_id: auth.data.customer_id,
      order_status: "pending",
      order_type: parsed.data.order_type,
      special_instructions: parsed.data.special_instructions ?? null,
      delivery_fee: parsed.data.delivery_fee ?? 0,
    })
    .select()
    .single();

  if (orderError || !newOrder) {
    return { data: null, error: orderError?.message ?? "Failed to create order." };
  }

  // 2. Transfer cart items to order_item
  const orderItemsToInsert = cartItems.map((item) => {
    const price = (item.product as { product_price: number } | null)?.product_price ?? 0;
    return {
      order_id: newOrder.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      subtotal: price * item.quantity,
      special_instructions: item.special_instructions,
    };
  });

  await supabase.from("order_item").insert(orderItemsToInsert);

  // 3. Lock cart immediately
  const now = new Date().toISOString();
  await supabase
    .from("cart")
    .update({
      is_final: true,
      status: "submitted",
      order_id: newOrder.order_id,
      submitted_at: now,
      updated_at: now,
    })
    .eq("cart_id", cart.cart_id);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: {
      order_id: newOrder.order_id,
      order_status: "pending",
      cart_id: cart.cart_id,
      is_final: true,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 6. Cancel Customer Order (Strictly Enforces Pre-Confirmation Rule)
// ---------------------------------------------------------------------------

/**
 * Maps each non-cancellable order status to a specific, human-readable explanation.
 */
function getCancellationErrorMessage(status: string | null): { message: string; code: string } {
  switch (status?.toLowerCase()) {
    case "cancelled":
      return {
        message: "Order is already cancelled.",
        code: "ALREADY_CANCELLED",
      };
    case "completed":
      return {
        message: "Cannot cancel order: this order has already been completed.",
        code: "ORDER_COMPLETED",
      };
    case "delivered":
      return {
        message: "Cannot cancel order: this order has already been delivered.",
        code: "ORDER_DELIVERED",
      };
    case "out_for_delivery":
      return {
        message: "Cannot cancel order: your order is already out for delivery.",
        code: "ORDER_IN_TRANSIT",
      };
    case "ready":
      return {
        message: "Cannot cancel order: your food is already prepared and ready for pickup.",
        code: "ORDER_READY",
      };
    case "preparing":
      return {
        message: "Cannot cancel order: the kitchen has already started preparing your food.",
        code: "ORDER_PREPARING",
      };
    case "received":
      return {
        message: "Cannot cancel order: restaurant staff has already received and accepted your order.",
        code: "ORDER_RECEIVED",
      };
    case "confirmed":
      return {
        message: "Cannot cancel order: your order has already been confirmed by restaurant staff.",
        code: "ORDER_CONFIRMED",
      };
    default:
      return {
        message: `Cannot cancel order: current order status is '${status ?? "unknown"}'. Only pending orders can be cancelled.`,
        code: "ORDER_NOT_CANCELLABLE",
      };
  }
}

export async function cancelCustomerOrder(
  orderId: string,
  rawInput?: CancelOrderInput
): Promise<
  ActionResult<{
    order_id: string;
    order_status: string;
    cancelled_at: string;
    cancellation_reason: string;
  }>
> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const parsed = cancelOrderSchema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Invalid cancellation input." };
  }

  const supabase = createClient();

  // Try RPC first (if installed in Supabase)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "cancel_customer_order",
    {
      p_order_id: orderId,
      p_reason: parsed.data.cancellation_reason,
    }
  );

  if (!rpcError && rpcData) {
    return {
      data: rpcData as {
        order_id: string;
        order_status: string;
        cancelled_at: string;
        cancellation_reason: string;
      },
      error: null,
    };
  }

  // Fallback to client orchestration
  const { data: order, error: orderError } = await supabase
    .from("order")
    .select("order_id, customer_id, order_status")
    .eq("order_id", orderId)
    .single();

  if (orderError || !order) {
    return { data: null, error: "Order not found." };
  }

  if (order.customer_id !== auth.data.customer_id) {
    return { data: null, error: "Access denied: this order does not belong to you.", code: "FORBIDDEN" };
  }

  // STRICT REQUIREMENT: Order can ONLY be cancelled before restaurant confirmation (when status is 'pending')
  if (order.order_status !== "pending") {
    const errorInfo = getCancellationErrorMessage(order.order_status);
    return {
      data: null,
      error: errorInfo.message,
      code: errorInfo.code,
    };
  }

  const now = new Date().toISOString();
  const { data: updatedOrder, error: updateError } = await supabase
    .from("order")
    .update({
      order_status: "cancelled",
      cancelled_at: now,
      cancellation_reason: parsed.data.cancellation_reason,
    })
    .eq("order_id", orderId)
    .select("order_id, order_status, cancelled_at, cancellation_reason")
    .maybeSingle();

  if (updateError) {
    return { data: null, error: updateError.message };
  }

  if (!updatedOrder) {
    return {
      data: null,
      error: "Permission denied or order update failed. Please ensure the customer_cancel_own_orders RLS policy or cancel_customer_order function is added in Supabase.",
    };
  }

  return {
    data: {
      order_id: updatedOrder.order_id,
      order_status: updatedOrder.order_status ?? "cancelled",
      cancelled_at: updatedOrder.cancelled_at ?? now,
      cancellation_reason: updatedOrder.cancellation_reason ?? parsed.data.cancellation_reason,
    },
    error: null,
  };
}
