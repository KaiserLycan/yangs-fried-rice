import { createClient } from "@/lib/supabase/server";

/**
 * The number the bottom tab bar's "Cart (3)" label shows — the desktop cart
 * frame (`133:945`) uses the same number for its own "3 items" line, and
 * that frame's two rows carry quantities 2 and 1, so it is a sum of
 * quantities, not a count of distinct lines.
 *
 * Reading it is real, even though nothing can add to a cart yet (see
 * `.scratch/ordering-flow/issues/03-item-detail.md`): a signed-in customer
 * with an empty cart today should see 0, not a number the frontend made up.
 * A guest has no cart at all, which is the other reason this reads 0.
 */
export async function readCartItemCount(): Promise<number> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: cart } = await supabase
    .from("cart")
    .select("cart_id")
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!cart) return 0;

  const { data: items } = await supabase
    .from("cart_item")
    .select("quantity")
    .eq("cart_id", cart.cart_id);

  return (items ?? []).reduce((total, item) => total + item.quantity, 0);
}
