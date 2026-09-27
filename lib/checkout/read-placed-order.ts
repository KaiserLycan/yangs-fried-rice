import { createClient } from "@/lib/supabase/server";
import { type PlacedOrder } from "@/lib/checkout/placed-order";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { isWalletMethod, paymentLabelFor } from "@/lib/orders/payment";
import { foldPaymentStatus } from "@/lib/checkout/payment-status";
import { orderItemName, orderItemUnitPrice } from "@/lib/orders/item-name";
import { formatOrderTime } from "@/lib/checkout/order-time";
import type { Fulfilment } from "@/lib/menu/cart-totals";

/**
 * One order the customer has just placed, read back for its confirmation.
 *
 * Null when the id is not one of this customer's orders, which the page
 * turns into a 404.
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
    .select("order_id, order_number, order_type, order_status, created_at, delivery_address")
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return null;

  const [items, transaction, customer] = await Promise.all([
    supabase
      .from("order_item")
      .select("order_item_id, quantity, subtotal, product_name, unit_price, product(product_name)")
      .eq("order_id", order.order_id),
    // Every row, not one: a retried online payment leaves a failed row next
    // to a pending one. `foldPaymentStatus` decides what they add up to.
    supabase
      .from("transaction")
      .select("payment_method, payment_status")
      .eq("order_id", order.order_id)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("customer")
      .select("name")
      .eq("customer_id", user.id)
      .maybeSingle(),
  ]);

  const fulfilment = fulfilmentFromOrderType(order.order_type);
  const address =
    fulfilment === "delivery" ? order.delivery_address : null;

  return {
    orderId: order.order_id,
    orderNumber: formatOrderNumber(order.order_number, order.order_id),
    customerName: customer.data?.name ?? "",
    placedAtLabel: formatOrderTime(
      order.created_at ? new Date(order.created_at) : new Date(),
    ),
    address,
    fulfilment,
    lines: (items.data ?? []).map((row) => ({
      id: row.order_item_id,
      name: orderItemName(row.product_name, productNameOf(row.product)),
      // `order_item` stores the line's subtotal, not its unit price, and
      // `CartLine` wants a unit price so `lineTotal` can multiply it back
      // out. Dividing recovers what the customer was charged per item, which
      // is the honest figure — today's `product_price` may have moved since.
      unitPrice: orderItemUnitPrice(
        row.unit_price,
        row.subtotal,
        row.quantity,
        null,
      ),
      quantity: row.quantity,
      specialInstructions: null,
    })),
    paymentMethodLabel: paymentLabelFor(transaction.data?.[0]?.payment_method),
    paymentStatus: foldPaymentStatus(transaction.data ?? []),
    isWalletOrder: isWalletMethod(transaction.data?.[0]?.payment_method),
    orderStatus: order.order_status,
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
  const folded = orderType
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return folded === "pickup" || folded === "pick_up" || folded === "take_out"
    ? "pickup"
    : "delivery";
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
