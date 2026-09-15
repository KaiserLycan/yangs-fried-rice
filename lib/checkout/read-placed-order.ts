import { createClient } from "@/lib/supabase/server";
import { orderNumberFrom, type PlacedOrder } from "@/lib/checkout/placed-order";
import { PAYMENT_METHODS } from "@/lib/checkout/payment-methods";
import { formatOrderTime } from "@/lib/checkout/order-time";
import type { Fulfilment } from "@/lib/menu/cart-totals";

/**
 * One order the customer has just placed, read back for its confirmation.
 *
 * This returns null for every customer today, and that is correct rather than
 * a bug to work around: nothing writes an `order` row yet — placing an order
 * is still a stubbed write (see `docs/reference/ordering-flow-handoff.md`).
 * The read is built for real regardless, the same reasoning
 * `lib/cart/read-cart.ts` gives, so the moment the write lands this starts
 * working with no frontend change.
 *
 * NOTE: the order history screen on its own branch reads the same three
 * tables for its own purposes. Whichever merges second is worth a pass to see
 * whether one module can serve both, rather than leaving two places that know
 * how an order's lines and totals are assembled.
 */
export async function readPlacedOrder(
  orderId: string,
): Promise<PlacedOrder | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Scoped to the signed-in customer. Middleware guards /checkout/*, but
  // nothing in the URL stops one customer asking for another's order id, so
  // this filter is what actually prevents that.
  const { data: order } = await supabase
    .from("order")
    .select("order_id, order_type, created_at")
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return null;

  const [items, transaction, customer] = await Promise.all([
    supabase
      .from("order_item")
      .select("order_item_id, quantity, subtotal, product(product_name)")
      .eq("order_id", order.order_id),
    supabase
      .from("transaction")
      .select("payment_method")
      .eq("order_id", order.order_id)
      .maybeSingle(),
    supabase
      .from("customer")
      .select("name")
      .eq("customer_id", user.id)
      .maybeSingle(),
  ]);

  const fulfilment = fulfilmentFromOrderType(order.order_type);
  const address = fulfilment === "delivery"
    ? await readDestination(supabase, user.id)
    : null;

  return {
    orderId: order.order_id,
    orderNumber: orderNumberFrom(order.order_id),
    customerName: customer.data?.name ?? "",
    placedAtLabel: formatOrderTime(
      order.created_at ? new Date(order.created_at) : new Date(),
    ),
    address,
    fulfilment,
    lines: (items.data ?? []).map((row) => ({
      id: row.order_item_id,
      name: productNameOf(row.product) ?? "Item no longer on the menu",
      // `order_item` stores the line's subtotal, not its unit price, and
      // `CartLine` wants a unit price so `lineTotal` can multiply it back
      // out. Dividing recovers what the customer was charged per item, which
      // is the honest figure — today's `product_price` may have moved since.
      unitPrice: row.quantity > 0 ? row.subtotal / row.quantity : row.subtotal,
      quantity: row.quantity,
      specialInstructions: null,
    })),
    paymentMethodLabel: paymentLabelFor(transaction.data?.payment_method),
  };
}

/**
 * `order_type` is nullable free text, so the plausible spellings of pickup
 * are all recognised rather than only the exact one the picker writes. This
 * matters in pesos, not in wording: an order stored as "Pick up" that read as
 * a delivery would add a ₱95 fee to a receipt for food the customer collected
 * themselves. Anything unrecognised reads as delivery, the default every
 * frame draws.
 */
function fulfilmentFromOrderType(orderType: string | null): Fulfilment {
  const folded = orderType?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return folded === "pickup" || folded === "pick_up" || folded === "take_out"
    ? "pickup"
    : "delivery";
}

/**
 * `order` has no address column, so the destination comes from the customer's
 * default address — the same compromise the tracking screen makes.
 *
 * TODO (Backend): orders need their own delivery address. Reading the
 * customer's current default is wrong the moment they change it.
 */
async function readDestination(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("customer_address")
    .select("address_details, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.address_details ?? null;
}

/**
 * `transaction.payment_method` is free text, so a stored value is matched
 * against the four the picker offers and otherwise shown as written. Saying
 * "Payment method not recorded" when the customer definitely chose one would
 * be worse than echoing an unfamiliar string.
 */
function paymentLabelFor(stored: string | null | undefined): string {
  if (!stored) return "Not recorded";
  const folded = stored.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const known = PAYMENT_METHODS.find(
    (method) =>
      method.id === folded || method.label.toLowerCase() === stored.trim().toLowerCase(),
  );
  return known?.label ?? stored;
}

/**
 * PostgREST returns an embedded row as an object, but the generated types
 * describe some embeds as arrays. Handling both keeps this working whichever
 * shape `npm run supabase:types` produces after the schema settles.
 */
function productNameOf(
  product: { product_name: string } | { product_name: string }[] | null,
): string | null {
  if (!product) return null;
  if (Array.isArray(product)) return product[0]?.product_name ?? null;
  return product.product_name;
}
