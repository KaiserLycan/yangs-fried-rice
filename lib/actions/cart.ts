"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateNcrAddress } from "@/lib/address/validate-ncr";
import { MAX_DELIVERY_RADIUS_KM, MIN_DELIVERY_FEE_PHP } from "@/lib/eta/engine";
import { calculateDeliveryFee } from "@/lib/menu/cart-totals";
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
import {
  UNPAID_ORDER_STATUSES,
  isUnpaidStatus,
} from "@/lib/validation/orders";

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
  add_ons: { addon_id: string; name: string; price: number }[];
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
// Delivery fee (server-side)
// ---------------------------------------------------------------------------

/**
 * The fee an order is actually charged.
 *
 * - Pickup / dine-in: none.
 * - Delivery: base + per-km, from the distance to the delivery address. If the
 *   address can't be geocoded (no API key, service down) the fee falls back to
 *   whatever the browser quoted, but never below the minimum — a delivery order
 *   must not go out at ₱0.
 * - An address that geocodes beyond the delivery radius is refused.
 */
async function resolveDeliveryFee({
  orderType,
  address,
  clientFee,
}: {
  orderType: string;
  address: string | null;
  clientFee: number;
}): Promise<{ fee: number; error: null } | { fee: 0; error: string }> {
  if (orderType !== "delivery") return { fee: 0, error: null };

  if (address && address.trim().length >= 5) {
    const check = await validateNcrAddress(address);
    if (Number.isFinite(check.distanceKm)) {
      if (!check.valid) {
        return {
          fee: 0,
          error:
            check.message ??
            `Delivery is limited to ${MAX_DELIVERY_RADIUS_KM} km from the store.`,
        };
      }
      return { fee: calculateDeliveryFee(check.distanceKm), error: null };
    }
  }

  return { fee: Math.max(clientFee, MIN_DELIVERY_FEE_PHP), error: null };
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
        ),
        cart_item_add_on (
          addon_id,
          add_on (
            name,
            price
          )
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
    
    // Map add-ons
    const addOns = (row.cart_item_add_on || []).map((addonRow: any) => ({
      addon_id: addonRow.addon_id,
      name: addonRow.add_on?.name ?? "Unknown Add-on",
      price: addonRow.add_on?.price ?? 0,
    }));
    
    // Calculate total add-on price
    const addOnsPrice = addOns.reduce((sum: number, addon: any) => sum + addon.price, 0);

    return {
      cart_item_id: row.cart_item_id,
      cart_id: row.cart_id ?? cart!.cart_id,
      product_id: row.product_id ?? "",
      product_name: product?.product_name ?? "Unknown Item",
      product_price: price,
      quantity: qty,
      special_instructions: row.special_instructions,
      subtotal: (price + addOnsPrice) * qty,
      add_ons: addOns,
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

  const notes = parsed.data.special_instructions?.trim() || null;
  const addOnIds = Array.from(new Set(parsed.data.add_on_ids ?? [])).sort();

  // Adding a dish that is already in the cart raises its quantity instead of
  // creating a second identical line — unless the customer attached special
  // notes, in which case they mean this portion to be different. "Identical"
  // means: same product, no notes on either line, and the same add-ons.
  if (!notes) {
    const { data: existingLines } = await supabase
      .from("cart_item")
      .select("cart_item_id, quantity, special_instructions, cart_item_add_on ( addon_id )")
      .eq("cart_id", cart.cart_id)
      .eq("product_id", product.product_id);

    const match = (existingLines ?? []).find((line) => {
      if ((line.special_instructions ?? "").trim()) return false;
      const lineAddOns = (line.cart_item_add_on ?? [])
        .map((row: { addon_id: string | null }) => row.addon_id)
        .filter((id: string | null): id is string => Boolean(id))
        .sort();
      return (
        lineAddOns.length === addOnIds.length &&
        lineAddOns.every((id: string, index: number) => id === addOnIds[index])
      );
    });

    if (match) {
      const mergedQuantity = Math.min(99, match.quantity + parsed.data.quantity);
      const now = new Date().toISOString();

      const [mergeResult] = await Promise.all([
        supabase
          .from("cart_item")
          .update({ quantity: mergedQuantity })
          .eq("cart_item_id", match.cart_item_id)
          .select()
          .single(),
        supabase.from("cart").update({ updated_at: now }).eq("cart_id", cart.cart_id),
      ]);

      if (mergeResult.error || !mergeResult.data) {
        return { data: null, error: mergeResult.error?.message ?? "Failed to update cart." };
      }

      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");

      return {
        data: {
          cart_item_id: match.cart_item_id,
          cart_id: cart.cart_id,
          product_id: product.product_id,
          product_name: product.product_name,
          product_price: product.product_price,
          quantity: mergedQuantity,
          special_instructions: null,
          subtotal: product.product_price * mergedQuantity,
          add_ons: [],
        },
        error: null,
      };
    }
  }

  const cartItemId = crypto.randomUUID();

  // The line must exist before its add-ons: cart_item_add_on has a foreign key
  // to cart_item. They used to be inserted concurrently, so the add-on insert
  // could reach the database first, fail the FK, and (its error unchecked) the
  // add-ons would silently vanish.
  const insertResult = await supabase
    .from("cart_item")
    .insert({
      cart_item_id: cartItemId,
      cart_id: cart.cart_id,
      product_id: product.product_id,
      quantity: parsed.data.quantity,
      special_instructions: notes,
    })
    .select()
    .single();

  const newItem = insertResult.data;
  const insertError = insertResult.error;

  if (insertError || !newItem) {
    return { data: null, error: insertError?.message ?? "Failed to add item to cart." };
  }

  const [addOnResult] = await Promise.all([
    addOnIds.length > 0
      ? supabase
          .from("cart_item_add_on")
          .insert(addOnIds.map((addonId) => ({ cart_item_id: cartItemId, addon_id: addonId })))
      : Promise.resolve({ error: null }),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", cart.cart_id),
  ]);

  if (addOnResult.error) {
    // Don't leave a line the customer didn't ask for (a dish without its add-ons).
    await supabase.from("cart_item").delete().eq("cart_item_id", cartItemId);
    return { data: null, error: "Couldn't add the selected add-ons. Please try again." };
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
      quantity: parsed.data.quantity,
      special_instructions: notes,
      subtotal: product.product_price * parsed.data.quantity, // Optimistic base subtotal
      add_ons: [], // Add-ons not populated yet in add response
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
      add_ons: [], // Add-ons not populated in update response
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

  // The delivery fee is decided here, not taken on trust from the browser:
  // a delivery order pays a distance-based fee (never ₱0), a pickup order pays
  // none, and an address beyond the delivery radius is refused outright.
  const feeResult = await resolveDeliveryFee({
    orderType: parsed.data.order_type,
    address: parsed.data.delivery_address ?? null,
    clientFee: parsed.data.delivery_fee ?? 0,
  });
  if (feeResult.error !== null) {
    return { data: null, error: feeResult.error };
  }
  const deliveryFee = feeResult.fee;

  // Try RPC first (if installed in Supabase). The RPC is optional in this
  // codebase, so the generated types may not include it for every schema snapshot.
  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
    "submit_cart_to_order",
    {
      p_cart_id: parsed.data.cart_id,
      p_order_type: parsed.data.order_type,
      p_special_instructions: parsed.data.special_instructions ?? undefined,
      p_delivery_fee: deliveryFee,
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
      cart_item_id,
      product_id,
      quantity,
      special_instructions,
      product ( product_name, product_price ),
      cart_item_add_on ( addon_id, add_on ( price ) )
    `)
    .eq("cart_id", cart.cart_id);

  const { data: cartAddOns } = await supabase
    .from("cart_add_on")
    .select("addon_id, add_on ( price )")
    .eq("cart_id", cart.cart_id);

  if (itemsError || !cartItems || cartItems.length === 0) {
    return { data: null, error: "Cannot submit an empty cart." };
  }

  // A wallet order is not fit to cook until PayMongo says the money arrived,
  // so it is parked at `awaiting_payment` and the webhook promotes it to
  // `pending`. Cash on delivery and pay in store are `pending` immediately —
  // those are collected later by design, not unpaid by accident. Before this
  // every order was born `pending`, so an abandoned wallet payment went
  // straight to the kitchen and the rider queue (issue #106).
  const isWalletOrder = parsed.data.payment_method === "wallet";
  const initialOrderStatus = isWalletOrder ? "awaiting_payment" : "pending";

  // 1. Create the order, held or live depending on how it is being paid for
  const { data: newOrder, error: orderError } = await supabase
    .from("order")
    .insert({
      customer_id: auth.data.customer_id,
      order_status: initialOrderStatus,
      order_type: parsed.data.order_type,
      special_instructions: parsed.data.special_instructions ?? null,
      delivery_fee: deliveryFee,
      delivery_address: parsed.data.delivery_address ?? null,
    })
    .select()
    .single();

  if (orderError || !newOrder) {
    return { data: null, error: orderError?.message ?? "Failed to create order." };
  }

  // 2. Transfer cart items and their add-ons
  const orderItemsToInsert = cartItems.map((item) => {
    const product = item.product as
      | { product_name: string; product_price: number }
      | null;
    const price = product?.product_price ?? 0;
    const addOnTotal = (
      (item.cart_item_add_on as { add_on: { price: number } | null }[] | null) ?? []
    ).reduce((sum, row) => sum + (row.add_on?.price ?? 0), 0);
    return {
      order_item_id: crypto.randomUUID(),
      order_id: newOrder.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      // Add-ons are billed: the line is (dish + its add-ons) x quantity, the
      // same figure the cart showed the customer.
      subtotal: (price + addOnTotal) * item.quantity,
      special_instructions: item.special_instructions,
      // What was bought, written down at the moment of buying. Renaming,
      // repricing or removing the product afterwards no longer rewrites
      // history or turns the line into "Unknown item" (issue #106).
      product_name: product?.product_name ?? null,
      unit_price: price + addOnTotal,
    };
  });

  const orderItemAddOnsToInsert = cartItems.flatMap((item, index) => {
    const addOns = item.cart_item_add_on as { addon_id: string; add_on: { price: number } }[] | null;
    if (!addOns) return [];
    return addOns.map(addon => ({
      order_item_id: orderItemsToInsert[index].order_item_id,
      addon_id: addon.addon_id,
    }));
  });

  const orderAddOnsToInsert = (cartAddOns || []).map(addon => ({
    order_id: newOrder.order_id,
    addon_id: addon.addon_id,
    price: (addon.add_on as any)?.price ?? 0,
  }));

  const subtotal = orderItemsToInsert.reduce((acc, curr) => acc + curr.subtotal, 0)
    + orderAddOnsToInsert.reduce((acc, curr) => acc + curr.price, 0);

  // Record what the customer actually chose. This used to say
  // "cash_on_delivery" for every order including wallet ones, which made the
  // receipt mislabel a GCash order until `create-payment-intent` overwrote
  // the row, and left no way to tell an unpaid wallet order from a cash one.
  // "paymongo" is the gateway rather than the wallet because the intent
  // allows either — the same value `create-payment-intent` writes.
  const transactionMethod = isWalletOrder
    ? "paymongo"
    : parsed.data.payment_method === "pay-in-store"
      ? "pay_in_store"
      : "cash_on_delivery";

  const transactionToInsert = {
    transaction_id: crypto.randomUUID(),
    order_id: newOrder.order_id,
    payment_method: transactionMethod,
    payment_status: "pending",
    subtotal: subtotal,
    tax_amount: 0,
    discount_amount: 0,
    total_paid: 0,
    transaction_date: new Date().toISOString(),
  };

  // `transaction` carries only SELECT policies (000_remote_schema.sql), so a
  // customer-session insert here matched zero rows and failed silently —
  // every order was left with no payment row at all, which is why the
  // receipt could say "Not recorded" and why `create-payment-intent` had
  // nothing to reuse. The service role is what actually writes it; the row
  // is pinned to the order just created above.
  const [, , , transactionResult] = await Promise.all([
    supabase.from("order_item").insert(orderItemsToInsert),
    orderItemAddOnsToInsert.length > 0 ? supabase.from("order_item_add_on").insert(orderItemAddOnsToInsert) : Promise.resolve(),
    orderAddOnsToInsert.length > 0 ? supabase.from("order_add_on").insert(orderAddOnsToInsert) : Promise.resolve(),
    createAdminClient().from("transaction").insert(transactionToInsert),
  ]);

  // Surfaced rather than discarded: a wallet order with no payment row can
  // never be paid, and the customer would be told it was placed regardless.
  if (transactionResult?.error) {
    console.error(
      "submitCart: could not record the transaction:",
      transactionResult.error,
    );
  }

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
      order_status: initialOrderStatus,
      cart_id: cart.cart_id,
      is_final: true,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 5b. Switch a stalled wallet order to cash on delivery
// ---------------------------------------------------------------------------

/**
 * Give up on an online payment and pay in cash instead.
 *
 * A wallet order waits at `awaiting_payment`, or `payment_failed` once
 * PayMongo refuses it, and stays out of the kitchen's sight either way. That
 * would strand the customer whenever the wallet will not co-operate, so the
 * receipt offers this as the way out: issue #106 asks for the order to go no
 * further "until payment becomes successful or is switched to CoD".
 *
 * Points the transaction at cash and releases the order into the kitchen
 * queue. An order that has already been paid for is refused — switching it
 * would send the rider to collect money the customer has handed over once.
 */
export async function switchOrderToCashOnDelivery(
  orderId: string,
): Promise<ActionResult<{ order_id: string; order_status: string }>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from("order")
    .select("order_id, customer_id, order_status")
    .eq("order_id", orderId)
    .single();

  if (orderError || !order) {
    return { data: null, error: "Order not found." };
  }

  // Nothing in the URL stops one customer naming another's order id, so this
  // is what actually prevents it.
  if (order.customer_id !== auth.data.customer_id) {
    return { data: null, error: "Access denied.", code: "FORBIDDEN" };
  }

  if (!isUnpaidStatus(order.order_status)) {
    return {
      data: null,
      error:
        "This order isn't waiting on a payment, so it can't be switched to cash on delivery.",
    };
  }

  // The status check above can lag a webhook that has just landed, so the
  // money itself is checked too.
  const { data: transactions } = await supabase
    .from("transaction")
    .select("transaction_id, payment_status")
    .eq("order_id", orderId);

  if ((transactions ?? []).some((row) => row.payment_status === "paid")) {
    return { data: null, error: "This order has already been paid for." };
  }

  // Both writes below need the service role, and neither would work without
  // it:
  //
  //   - `transaction` has only SELECT policies (000_remote_schema.sql), so a
  //     customer-session update silently matches zero rows.
  //   - the one customer UPDATE policy on `order` is
  //     `customer_cancel_own_orders`, which allows `pending` → `cancelled`
  //     and nothing else. This goes `awaiting_payment` → `pending`, failing
  //     both its USING and its WITH CHECK.
  //
  // Ownership was verified against `auth.uid()` above, and the two updates
  // are pinned to that one order, so this escalation is scoped the same way
  // `markDelivered` scopes its own.
  const admin = createAdminClient();

  // Point the payment at cash. Clearing the provider reference means a late
  // webhook for the abandoned wallet intent no longer matches this row and
  // cannot mark a cash order as failed.
  const { error: paymentError } = await admin
    .from("transaction")
    .update({
      payment_method: "cash_on_delivery",
      payment_status: "pending",
      provider_reference_id: null,
    })
    .eq("order_id", orderId)
    .neq("payment_status", "paid");

  if (paymentError) {
    return {
      data: null,
      error: "Couldn't switch this order to cash on delivery.",
    };
  }

  // Release it into the kitchen queue. Scoped to the unpaid statuses so two
  // taps on the button cannot move an order that is already on its way.
  const { data: updated, error: updateError } = await admin
    .from("order")
    .update({ order_status: "pending" })
    .eq("order_id", orderId)
    .in("order_status", [...UNPAID_ORDER_STATUSES])
    .select("order_id, order_status")
    .single();

  if (updateError || !updated) {
    return {
      data: null,
      error: "Couldn't switch this order to cash on delivery.",
    };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: {
      order_id: updated.order_id,
      order_status: updated.order_status ?? "pending",
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

  // Try RPC first (if installed in Supabase). Some generated snapshots do not
  // include this helper RPC even though the runtime function may exist.
  const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
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

// ---------------------------------------------------------------------------
// 7. Reorder Past Order
// ---------------------------------------------------------------------------

export async function reorderPastOrder(
  orderId: string
): Promise<ActionResult<{ addedCount: number; unavailableCount: number }>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();

  // 1. Verify order belongs to customer
  const { data: order, error: orderError } = await supabase
    .from("order")
    .select("order_id")
    .eq("order_id", orderId)
    .eq("customer_id", auth.data.customer_id)
    .single();

  if (orderError || !order) {
    return { data: null, error: "Order not found or access denied.", code: "FORBIDDEN" };
  }

  // 2. Fetch order items and their products
  const { data: items, error: itemsError } = await supabase
    .from("order_item")
    .select(`
      quantity,
      special_instructions,
      product!inner (
        product_id,
        is_available
      )
    `)
    .eq("order_id", orderId);

  if (itemsError || !items || items.length === 0) {
    return { data: null, error: "No items found in this order." };
  }

  // 3. Filter available products
  const availableItems = items.filter((item) => {
    const p = (Array.isArray(item.product) ? item.product[0] : item.product) as unknown as { is_available: boolean; product_id: string } | null;
    return p?.is_available === true;
  });

  const addedCount = availableItems.length;
  const unavailableCount = items.length - addedCount;

  if (addedCount === 0) {
    return { data: null, error: "None of the items from this order are currently available." };
  }

  // 4. Get active cart
  let { data: cart } = await supabase
    .from("cart")
    .select("cart_id, is_final")
    .eq("customer_id", auth.data.customer_id)
    .eq("is_final", false)
    .maybeSingle();

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

  // 5. Insert available items into cart
  const cartItemsToInsert = availableItems.map((item) => {
    const p = (Array.isArray(item.product) ? item.product[0] : item.product) as unknown as { product_id: string };
    return {
      cart_id: cart!.cart_id,
      product_id: p.product_id,
      quantity: item.quantity,
      special_instructions: item.special_instructions,
    };
  });

  const [insertResult] = await Promise.all([
    supabase.from("cart_item").insert(cartItemsToInsert),
    supabase
      .from("cart")
      .update({ updated_at: new Date().toISOString() })
      .eq("cart_id", cart.cart_id),
  ]);

  if (insertResult.error) {
    return { data: null, error: insertResult.error.message ?? "Failed to add items to cart." };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: { addedCount, unavailableCount },
    error: null,
  };
}
