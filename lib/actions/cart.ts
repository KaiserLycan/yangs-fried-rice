"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  SENIOR_PWD_ID_BUCKET,
  discardSeniorPwdIdPhoto,
  isSeniorPwdIdPath,
} from "@/lib/storage/senior-pwd-ids";
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
import {
  ACCOUNT_DISABLED_CODE,
  ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";
import { notifyOrderCancelled } from "@/lib/email/notify-order-cancelled";
import { readStoreStatus } from "@/lib/store/read-store-status";
import { storeBlockFor } from "@/lib/store/store-status";
import { MAX_QUANTITY } from "@/lib/menu/quantity";
import {
  BIG_ORDER_MESSAGE,
  DISH_LIMIT_CODE,
  ORDER_TOO_LARGE_CODE,
  dishLimitMessage,
  wouldExceedOrderCap,
} from "@/lib/cart/limits";
import { z } from "zod";
import { promoCodeSchema, type AppliedPromo } from "@/lib/validation/promo-code";
import {
  compareCart,
  type CartRecheck,
  type LiveCartLine,
} from "@/lib/checkout/cart-recheck";

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
  // getUser, not getSession: getSession only decodes the cookie, so a token
  // that was revoked, or forged, would still read as signed in. getUser asks
  // Supabase Auth to verify it — the one extra request is the price of the
  // check actually meaning something (issue #114).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in.", code: "UNAUTHORIZED" };
  }

  // Read for the disabled flag. RLS lets a customer see only their own row,
  // so no row also means "not a customer".
  const { data: customer } = await supabase
    .from("customer")
    .select("customer_id, is_account_disabled")
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!customer) {
    return {
      data: null,
      error: "You are not registered as a customer.",
      code: "FORBIDDEN",
    };
  }

  if (customer.is_account_disabled) {
    return {
      data: null,
      error: ACCOUNT_DISABLED_MESSAGE,
      code: ACCOUNT_DISABLED_CODE,
    };
  }

  return { data: { customer_id: user.id }, error: null };
}

/**
 * Why these add-ons can't go on this dish, or null when they can. Add-ons
 * are per product (`add_on.product_id`); nothing used to stop a direct call
 * attaching another dish's add-on to a line. Order-level extras (rice,
 * drinks) are `cart_add_on`, not this.
 */
async function addOnProblem(
  supabase: ReturnType<typeof createClient>,
  productId: string | null,
  addOnIds: string[],
): Promise<string | null> {
  if (addOnIds.length === 0) return null;
  const { data, error } = await supabase
    .from("add_on")
    .select("addon_id, product_id")
    .in("addon_id", addOnIds);
  if (error) return "Couldn't check the selected add-ons. Please try again.";
  const valid = new Set(
    (data ?? []).filter((row) => row.product_id === productId).map((row) => row.addon_id),
  );
  return addOnIds.every((id) => valid.has(id))
    ? null
    : "One of the selected add-ons isn't available for this dish. Please choose again.";
}

/**
 * Makes a cart line's add-ons exactly `addOnIds` (limitations #23). Only the
 * difference is written, and the new rows go in before the old ones come
 * out, so a failure part-way never leaves a line missing an add-on the
 * customer still wanted — at worst it keeps one they removed, which the
 * refreshed cart then shows.
 */
async function replaceLineAddOns(
  supabase: ReturnType<typeof createClient>,
  cartItemId: string,
  addOnIds: string[],
): Promise<string | null> {
  const failed = "Couldn't update the add-ons. Please try again.";
  const { data: existing, error } = await supabase
    .from("cart_item_add_on")
    .select("addon_id")
    .eq("cart_item_id", cartItemId);
  if (error) return failed;

  const current = new Set(
    (existing ?? []).map((row) => row.addon_id).filter((id): id is string => Boolean(id)),
  );
  const wanted = new Set(addOnIds);
  const toAdd = addOnIds.filter((id) => !current.has(id));
  const toRemove = Array.from(current).filter((id) => !wanted.has(id));

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from("cart_item_add_on")
      .insert(toAdd.map((addonId) => ({ cart_item_id: cartItemId, addon_id: addonId })));
    if (insertError) return failed;
  }
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("cart_item_add_on")
      .delete()
      .eq("cart_item_id", cartItemId)
      .in("addon_id", toRemove);
    if (deleteError) return failed;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Order size (issue #115)
// ---------------------------------------------------------------------------

/**
 * Every line of a cart, reduced to what the order limits need: which dish,
 * and how many (issue #115).
 *
 * Every path that grows a cart — adding a dish, the stepper, reorder — checks
 * these against the two limits, so the customer hears about them while
 * building the cart rather than at checkout:
 *   - 30 items per order (MAX_ITEMS_PER_ORDER), and
 *   - 20 of one dish across ALL its lines (MAX_QUANTITY): a line with a note
 *     or different add-ons is still the same dish.
 * `submit_cart_to_order` checks both again (20260928000014).
 */
type CartLineQuantity = { cart_item_id: string; product_id: string | null; quantity: number };

async function readCartQuantities(
  supabase: ReturnType<typeof createClient>,
  cartId: string,
): Promise<CartLineQuantity[]> {
  const { data } = await supabase
    .from("cart_item")
    .select("cart_item_id, product_id, quantity")
    .eq("cart_id", cartId);
  return (data ?? []).map((row) => ({
    cart_item_id: row.cart_item_id,
    product_id: row.product_id,
    quantity: row.quantity ?? 0,
  }));
}

/** Items in the cart, leaving out one line (the one being changed). */
function itemsIn(lines: CartLineQuantity[], excludeCartItemId?: string): number {
  return lines
    .filter((line) => line.cart_item_id !== excludeCartItemId)
    .reduce((sum, line) => sum + line.quantity, 0);
}

/** Of one dish across all its lines, leaving out one line. */
function dishItemsIn(
  lines: CartLineQuantity[],
  productId: string,
  excludeCartItemId?: string,
): number {
  return itemsIn(
    lines.filter((line) => line.product_id === productId),
    excludeCartItemId,
  );
}

const TOO_LARGE = {
  data: null,
  error: BIG_ORDER_MESSAGE,
  code: ORDER_TOO_LARGE_CODE,
} as const;

function dishLimit(dishName: string) {
  return { data: null, error: dishLimitMessage(dishName), code: DISH_LIMIT_CODE } as const;
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

  const addOnError = await addOnProblem(supabase, product.product_id, addOnIds);
  if (addOnError) return { data: null, error: addOnError };

  // Merged into an existing line or added as a new one, the cart grows by
  // the same number of items — and so does this dish, whichever line it
  // lands on (a note makes a new line, not a new dish).
  const cartLines = await readCartQuantities(supabase, cart.cart_id);
  if (wouldExceedOrderCap(itemsIn(cartLines), parsed.data.quantity)) {
    return TOO_LARGE;
  }
  if (dishItemsIn(cartLines, product.product_id) + parsed.data.quantity > MAX_QUANTITY) {
    return dishLimit(product.product_name);
  }

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
      // Within 20: the dish total, which includes this line, was checked
      // above. (It used to clamp silently at 99.)
      const mergedQuantity = match.quantity + parsed.data.quantity;
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

  // Raising a line's quantity grows the cart; lowering it is always allowed.
  if (
    parsed.data.quantity !== undefined &&
    parsed.data.quantity > item.quantity
  ) {
    const cartLines = await readCartQuantities(supabase, parentCart.cart_id);
    const otherLines = itemsIn(cartLines, item.cart_item_id);
    if (
      wouldExceedOrderCap(
        otherLines + item.quantity,
        parsed.data.quantity - item.quantity,
      )
    ) {
      return TOO_LARGE;
    }
    if (
      item.product_id &&
      dishItemsIn(cartLines, item.product_id, item.cart_item_id) + parsed.data.quantity >
        MAX_QUANTITY
    ) {
      const dish = item.product as { product_name: string } | null;
      return dishLimit(dish?.product_name ?? "this dish");
    }
  }

  const updatePayload: { quantity?: number; special_instructions?: string | null } = {};
  if (parsed.data.quantity !== undefined) {
    updatePayload.quantity = parsed.data.quantity;
  }
  if (parsed.data.special_instructions !== undefined) {
    // Blank means "no note", stored as null like addCartItem does.
    updatePayload.special_instructions = parsed.data.special_instructions?.trim() || null;
  }

  // The "Edit" dialog sends the line's whole add-on set (limitations #23).
  if (parsed.data.add_on_ids !== undefined) {
    const addOnIds = Array.from(new Set(parsed.data.add_on_ids)).sort();
    const addOnError =
      (await addOnProblem(supabase, item.product_id, addOnIds)) ??
      (await replaceLineAddOns(supabase, cartItemId, addOnIds));
    if (addOnError) return { data: null, error: addOnError };
  }

  // Only add-ons changed: the line row itself has nothing to write.
  const hasLineChange = Object.keys(updatePayload).length > 0;

  const [updateResult] = await Promise.all([
    hasLineChange
      ? supabase
          .from("cart_item")
          .update(updatePayload)
          .eq("cart_item_id", cartItemId)
          .select()
          .single()
      : Promise.resolve({
          data: {
            cart_item_id: item.cart_item_id,
            product_id: item.product_id,
            quantity: item.quantity,
            special_instructions: item.special_instructions,
          },
          error: null,
        }),
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
// 5. Submit Cart (one atomic database call)
// ---------------------------------------------------------------------------

/**
 * Places the cart as a pickup order.
 *
 * All of it happens inside `submit_cart_to_order`
 * (supabase/migrations/20260927000001_*.sql): the cart row is locked, checked
 * for `is_final`, every line is priced from the menu, and the order, its
 * lines, add-ons, payment row and the cart's lock are written in one
 * transaction. There is deliberately no fallback. The old one did the same
 * steps as separate requests — two taps made two orders, and a failure part
 * way left an order with no lines — and it relied on customers being allowed
 * to insert into the order tables directly, which they no longer are.
 *
 * The browser's `delivery_fee` is not sent on: the shop is pickup-only, and
 * the function charges no fee.
 *
 * Closed, paused or busy (issue #115) is checked here first, so the
 * customer gets the same wording the menu banner uses without a trip to the
 * database, and `FORCE_STORE_OPEN` applies. The function checks again from
 * `store_setting` — the env flag cannot reach it — so this is the friendly
 * first line, not the only one.
 */
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

  const block = storeBlockFor(await readStoreStatus());
  if (block) {
    return { data: null, error: block.message, code: block.code };
  }

  const supabase = createClient();

  // The generated database types predate `p_fulfillment_method`
  // (20260928000010), hence the widened call signature.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: "submit_cart_to_order",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string; hint?: string } | null }>;
  const { data, error } = await rpc("submit_cart_to_order", {
    p_cart_id: parsed.data.cart_id,
    p_order_type: parsed.data.order_type,
    p_special_instructions: parsed.data.special_instructions ?? undefined,
    p_payment_method:
      parsed.data.payment_method === "wallet"
        ? parsed.data.wallet
        : "pay-in-store",
    p_fulfillment_method: parsed.data.fulfillment_method,
    // Senior Citizen / PWD (issue #116). The function re-checks all of it,
    // including that the photo is in this customer's own folder.
    p_discount: parsed.data.discount ?? undefined,
    // The prices the customer was shown; the function refuses with
    // PRICE_CHANGED, naming the dishes, if the menu has moved since.
    p_expected_prices: parsed.data.expected_prices,
    p_tip: parsed.data.tip,
    // Only meaningful for pay in store; the function refuses it otherwise.
    p_cash_tendered:
      parsed.data.payment_method === "pay-in-store" ? (parsed.data.cash_tendered ?? undefined) : undefined,
    // Priced again by the database; refused with PROMO_CHANGED if it no
    // longer gives the discount the customer was shown.
    p_promo_code: parsed.data.promo_code ?? undefined,
    p_expected_promo_discount: parsed.data.promo_code
      ? (parsed.data.expected_promo_discount ?? undefined)
      : undefined,
  });

  if (error || !data) {
    // No order was made, so the ID photo uploaded for it is not needed.
    // The customer can't delete from the bucket (staff-only), so the
    // service role does — only inside this customer's own folder.
    const photoPath = parsed.data.discount?.photo_path;
    if (
      photoPath &&
      isSeniorPwdIdPath(photoPath) &&
      photoPath.startsWith(`${auth.data.customer_id}/`)
    ) {
      await createAdminClient()
        .storage.from(SENIOR_PWD_ID_BUCKET)
        .remove([photoPath])
        .catch(() => undefined);
    }

    // The function raises with a customer-facing message and a stable code
    // in `hint` (CART_LOCKED, ITEM_UNAVAILABLE, ACCOUNT_DISABLED, …). Anything
    // without a hint is unexpected, so its raw text is logged, not shown.
    if (error?.hint) {
      return { data: null, error: error.message, code: error.hint };
    }
    console.error("submitCart: submit_cart_to_order failed:", error);
    return {
      data: null,
      error: "We couldn't place your order. Please try again.",
    };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: data as {
      order_id: string;
      order_status: string;
      cart_id: string;
      is_final: boolean;
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 5a. Promo code: what it takes off this cart
// ---------------------------------------------------------------------------

/**
 * Checkout's "Apply". Asks `promo_quote`, which runs the same
 * `promo_code_discount()` that `submit_cart_to_order` runs when the order is
 * placed, so the discount shown is the discount charged. Read-only: the code
 * is only taken when the order is placed.
 */
export async function checkPromoCode(
  cartId: string,
  rawCode: string,
): Promise<ActionResult<AppliedPromo>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const code = promoCodeSchema.safeParse(rawCode);
  if (!code.success) {
    return { data: null, error: code.error.issues[0]?.message ?? "Enter a promo code.", code: "PROMO_INVALID" };
  }
  if (!z.string().uuid().safeParse(cartId).success) {
    return { data: null, error: "Cart not found.", code: "NOT_FOUND" };
  }

  const supabase = createClient();
  // Not in the generated types until they are regenerated after
  // 20260929160000_promo_codes.sql.
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: "promo_quote",
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string; hint?: string } | null }>;
  const { data, error } = await rpc("promo_quote", { p_cart_id: cartId, p_code: code.data });

  if (error || !data) {
    if (error?.hint) return { data: null, error: error.message, code: error.hint };
    console.error("checkPromoCode: promo_quote failed:", error);
    return { data: null, error: "We couldn't check that code. Please try again." };
  }

  const quote = data as { code: string; title: string; discount: number | string };
  return {
    data: { code: quote.code, title: quote.title, discount: Number(quote.discount) },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// 5b. Re-check the cart after checkout was refused (FINALE 9.1, 9.10)
// ---------------------------------------------------------------------------

/**
 * Each line of the customer's open cart against the menu as it is now:
 * which dishes can no longer be ordered, and which cost something other
 * than the price checkout showed. Called after `submitCart` comes back with
 * ITEM_UNAVAILABLE or PRICE_CHANGED, so checkout can point at the lines.
 *
 * Read-only. Priced the way `submit_cart_to_order` prices a line: the dish
 * plus its add-ons.
 */
export async function recheckCart(
  cartId: string,
  shownPrices: Record<string, number>,
): Promise<ActionResult<CartRecheck>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();
  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id")
    .eq("cart_id", cartId)
    .eq("customer_id", auth.data.customer_id)
    .eq("is_final", false)
    .maybeSingle();
  if (!cart) return { data: null, error: "Cart not found." };

  const { data: rows, error } = await supabase
    .from("cart_item")
    .select(
      `cart_item_id,
       product ( product_name, product_price, is_available, archived_at ),
       cart_item_add_on ( add_on ( price ) )`,
    )
    .eq("cart_id", cartId);
  if (error) return { data: null, error: "We couldn't check your cart. Please try again." };

  const live: LiveCartLine[] = (rows ?? []).map((row: any) => {
    const product = (Array.isArray(row.product) ? row.product[0] : row.product) as {
      product_name: string;
      product_price: number;
      is_available: boolean | null;
      archived_at: string | null;
    } | null;
    const addOns = (row.cart_item_add_on ?? []).reduce(
      (sum: number, link: any) => sum + Number(link.add_on?.price ?? 0),
      0,
    );
    return {
      id: row.cart_item_id,
      name: product?.product_name ?? "An item that was removed from the menu",
      unitPrice: Number(product?.product_price ?? 0) + addOns,
      available:
        product !== null && product.archived_at === null && product.is_available !== false,
    };
  });

  return { data: compareCart(shownPrices, live), error: null };
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
        "This order isn't waiting on a payment, so it can't be switched to paying at the counter.",
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

  // Point the payment at the counter. Clearing the provider reference means a late
  // webhook for the abandoned wallet intent no longer matches this row and
  // cannot mark a cash order as failed.
  const { error: paymentError } = await admin
    .from("transaction")
    .update({
      // Pickup-only (issue #114): the fallback is paying at the counter, the
      // same spelling submit_cart_to_order writes for it.
      payment_method: "pay_in_store",
      payment_status: "pending",
      provider_reference_id: null,
    })
    .eq("order_id", orderId)
    .neq("payment_status", "paid");

  if (paymentError) {
    return {
      data: null,
      error: "Couldn't switch this order to paying at the counter.",
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
      error: "Couldn't switch this order to paying at the counter.",
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
    await notifyOrderCancelled(supabase, orderId, "customer");
    // The RPC only cancels the customer's own order. They can't delete from
    // the ID bucket (staff-only), so the service role does (issue #116).
    await discardSeniorPwdIdPhoto(createAdminClient(), orderId);
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

  // A confirmation, and for a paid order what happens to the money (F23).
  await notifyOrderCancelled(supabase, orderId, "customer");
  // Ownership was checked above (issue #116).
  await discardSeniorPwdIdPhoto(createAdminClient(), orderId);

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

/**
 * Puts a past order's dishes back in the cart — My orders' "Reorder" and the
 * menu's "Order again" row (issue #118). Each line comes back with the same
 * quantity, note and add-ons; a dish that is sold out or off the menu, and an
 * add-on that no longer exists for it, are left out and counted, so the
 * caller can say so.
 */

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
        product_name,
        is_available,
        archived_at
      ),
      order_item_add_on ( addon_id )
    `)
    .eq("order_id", orderId);

  if (itemsError || !items || items.length === 0) {
    return { data: null, error: "No items found in this order." };
  }

  // 3. Filter available products
  // Archived dishes are off the menu even if their flag still says available.
  const availableItems = items.filter((item) => {
    const p = (Array.isArray(item.product) ? item.product[0] : item.product) as unknown as { is_available: boolean; product_id: string; archived_at: string | null } | null;
    return p?.is_available === true && !p.archived_at;
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

  // 5. Insert available items into cart, as they were ordered: same
  // quantities and notes. Ids are chosen here so each line's add-ons can be
  // attached to it below.
  const cartItemsToInsert = availableItems.map((item) => {
    const p = (Array.isArray(item.product) ? item.product[0] : item.product) as unknown as { product_id: string };
    return {
      cart_item_id: crypto.randomUUID(),
      cart_id: cart!.cart_id,
      product_id: p.product_id,
      quantity: item.quantity,
      special_instructions: item.special_instructions,
    };
  });

  // The same list or nothing (issue #115): if the order would not fit the
  // cart — 30 items, or 20 of a dish counting what is already there — say
  // so, rather than quietly adding a smaller order than the one asked for.
  const cartLines = await readCartQuantities(supabase, cart.cart_id);
  const reorderedItems = cartItemsToInsert.reduce((sum, line) => sum + line.quantity, 0);
  if (wouldExceedOrderCap(itemsIn(cartLines), reorderedItems)) {
    return TOO_LARGE;
  }
  const dishNames = new Map(
    availableItems.map((item) => {
      const p = (Array.isArray(item.product) ? item.product[0] : item.product) as unknown as {
        product_id: string;
        product_name: string;
      };
      return [p.product_id, p.product_name] as const;
    }),
  );
  for (const [productId, name] of dishNames) {
    const reorderedOfDish = cartItemsToInsert
      .filter((line) => line.product_id === productId)
      .reduce((sum, line) => sum + line.quantity, 0);
    if (dishItemsIn(cartLines, productId) + reorderedOfDish > MAX_QUANTITY) {
      return dishLimit(name);
    }
  }

  // Add-ons still offered for each dish. One that was deleted since, or
  // that belongs to another dish, is dropped rather than failing the reorder.
  const wantedAddOnIds = Array.from(
    new Set(
      availableItems.flatMap((item) =>
        (item.order_item_add_on ?? [])
          .map((row: { addon_id: string | null }) => row.addon_id)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    ),
  );
  const { data: liveAddOns } = wantedAddOnIds.length
    ? await supabase.from("add_on").select("addon_id, product_id").in("addon_id", wantedAddOnIds)
    : { data: [] as { addon_id: string; product_id: string | null }[] };
  const addOnProduct = new Map((liveAddOns ?? []).map((row) => [row.addon_id, row.product_id] as const));

  const addOnsToInsert = availableItems.flatMap((item, index) => {
    const line = cartItemsToInsert[index];
    return (item.order_item_add_on ?? [])
      .map((row: { addon_id: string | null }) => row.addon_id)
      .filter(
        (id: string | null): id is string =>
          Boolean(id) && addOnProduct.get(id as string) === line.product_id,
      )
      .map((addonId: string) => ({ cart_item_id: line.cart_item_id, addon_id: addonId }));
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

  if (addOnsToInsert.length > 0) {
    const { error: addOnError } = await supabase.from("cart_item_add_on").insert(addOnsToInsert);
    if (addOnError) {
      // A dish without the add-ons the customer had is not the order they
      // asked to repeat; take the lines back out rather than leave it half-done.
      await supabase
        .from("cart_item")
        .delete()
        .in("cart_item_id", cartItemsToInsert.map((line) => line.cart_item_id));
      return { data: null, error: "Couldn't add the add-ons from that order. Please try again." };
    }
  }

  // Order-wide add-ons (rice, drinks …) come back too (issue #115), so the
  // cart holds the same list as the order. One since removed from the menu
  // is skipped, the same as a dish's own add-ons above.
  const { data: orderAddOns } = await supabase
    .from("order_add_on")
    .select("addon_id")
    .eq("order_id", orderId);
  const orderAddOnIds = (orderAddOns ?? [])
    .map((row) => row.addon_id)
    .filter((id): id is string => Boolean(id));
  if (orderAddOnIds.length > 0) {
    const { data: stillOffered } = await supabase
      .from("add_on")
      .select("addon_id")
      .in("addon_id", Array.from(new Set(orderAddOnIds)));
    const offered = new Set((stillOffered ?? []).map((row) => row.addon_id));
    const cartAddOns = orderAddOnIds
      .filter((id) => offered.has(id))
      .map((addonId) => ({ cart_id: cart!.cart_id, addon_id: addonId }));
    if (cartAddOns.length > 0) {
      const { error: cartAddOnError } = await supabase.from("cart_add_on").insert(cartAddOns);
      if (cartAddOnError) {
        // The dishes are in; the rice and drinks are not. Say so rather than
        // let the customer check out believing they are.
        console.error("reorderPastOrder: order add-ons not copied:", cartAddOnError);
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/", "layout");
        return {
          data: null,
          error:
            "The dishes were added, but not the rice and drinks from that order. Please add them again.",
        };
      }
    }
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/", "layout");

  return {
    data: { addedCount, unavailableCount },
    error: null,
  };
}
