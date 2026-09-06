import { createClient } from "@/lib/supabase/server";
import type { CartLine } from "@/lib/menu/cart-totals";

/**
 * The signed-in customer's real cart rows, joined with each line's product
 * for its name and price — `cart_item` only stores `product_id`, `quantity`
 * and `special_instructions`, not what the dish is called or costs.
 *
 * This will read empty for every customer today, and that's correct rather
 * than a bug to work around: nothing writes a `cart_item` row yet (adding to
 * cart is stubbed with a toast — see `.scratch/ordering-flow/issues/
 * 03-item-detail.md`), so there is no honest way for this to return
 * anything else. The read is built for real regardless, the same reasoning
 * `lib/cart/cart-count.ts` gives, so the moment the write lands, this starts
 * working with no frontend change.
 */
export async function readCart(): Promise<CartLine[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id")
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!cart) return [];

  const { data: items } = await supabase
    .from("cart_item")
    .select(
      "cart_item_id, quantity, special_instructions, product:product(product_id, product_name, product_price)",
    )
    .eq("cart_id", cart.cart_id);

  return (items ?? [])
    .filter(
      (item): item is typeof item & { product: NonNullable<typeof item.product> } =>
        item.product !== null,
    )
    .map((item) => ({
      id: item.cart_item_id,
      name: item.product.product_name,
      unitPrice: item.product.product_price,
      quantity: item.quantity,
      specialInstructions: item.special_instructions,
    }));
}
