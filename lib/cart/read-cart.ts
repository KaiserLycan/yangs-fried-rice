import { createClient } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/menu/cart-totals";

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
 * "Active" means `is_final = false`. `submitCart` in `lib/actions/cart.ts`
 * flips the flag on the cart it turns into an order and creates a fresh one
 * the next time the customer adds something, so a customer who has ordered
 * before has several `cart` rows. Reading without the filter would pick the
 * wrong one — or, with `maybeSingle`, none at all.
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

  // Newest first, one row: nothing in the schema stops two active carts
  // existing (there is no unique index on `customer_id where is_final =
  // false`, and `getActiveCart` does check-then-insert), and `maybeSingle`
  // would treat that as an error and read the cart as empty. Recorded in the
  // handoff doc as an index to add; until then, prefer the most recent.
  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id")
    .eq("customer_id", user.id)
    .eq("is_final", false)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (!cart) return EMPTY;

  const { data: items } = await supabase
    .from("cart_item")
    .select(
      `cart_item_id, quantity, special_instructions, product:product(product_id, product_name, product_price),
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
      };
    });

  return { cartId: cart.cart_id, lines };
}
