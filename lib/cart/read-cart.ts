import { createClient } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/menu/cart-totals";
import { mapProductRow, type RawProductRow } from "@/lib/menu/product-listing";

export type CartRead = {
  /** `null` when the customer has never had a cart, or is signed out. */
  cartId: string | null;
  lines: CartLine[];
};

const EMPTY: CartRead = { cartId: null, lines: [] };

/**
 * The signed-in customer's active cart: its id and its rows, joined with
 * each line's product for its name and price — `cart_item` only stores
 * `product_id`, `quantity` and `special_instructions`, not what the dish is
 * called or costs.
 *
 * A customer has at most one cart (unique on `customer_id`): `submitCart`
 * deletes it when it becomes an order, and a fresh one is created the next
 * time the customer adds something.
 *
 * The id comes back alongside the lines because `submitCart` needs it, and
 * checkout is the one caller that does; the cart and menu screens ignore it.
 */
export async function readCart(): Promise<CartRead> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return EMPTY;

  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id")
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!cart) return EMPTY;

  const { data: items } = await supabase
    .from("cart_item")
    .select(
      `cart_item_id, quantity, special_instructions,
       product:product(product_id, product_name, product_price, product_details, is_available, image_url, categories(category_name), add_on(addon_id, name, price)),
       cart_item_add_on ( addon_id, add_on ( name, price ) )`
    )
    .eq("cart_id", cart.cart_id);

  const lines = (items ?? [])
    .filter(
      (item): item is typeof item & { product: NonNullable<typeof item.product> } =>
        item.product !== null,
    )
    .map((item) => {
      const addOns = (item.cart_item_add_on || []).map((addonRow: any) => ({
        addon_id: addonRow.addon_id,
        name: addonRow.add_on?.name ?? "Unknown Add-on",
        price: addonRow.add_on?.price ?? 0,
      }));
      const addOnsPrice = addOns.reduce((sum: number, a: any) => sum + a.price, 0);

      return {
        id: item.cart_item_id,
        name: item.product.product_name,
        unitPrice: item.product.product_price + addOnsPrice,
        quantity: item.quantity,
        specialInstructions: item.special_instructions,
        addOns,
        product: mapProductRow(item.product as unknown as RawProductRow),
      };
    });

  return { cartId: cart.cart_id, lines };
}
