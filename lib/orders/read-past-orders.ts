import { orderItemName } from "@/lib/orders/item-name";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { isPast, totalOf, type PastOrder } from "@/lib/orders/past-order";
import { isUnpaidStatus } from "@/lib/validation/orders";
import {
  PAYMENT_WINDOW_MS,
  expireAbandonedOrders,
} from "@/lib/checkout/expire-abandoned-orders";

/**
 * One customer's finished orders, most recent first.
 *
 * This returns an empty list for every customer today, and that is correct
 * rather than a bug to work around: nothing writes an `order` row yet —
 * placing an order is still a stubbed write (see
 * `docs/reference/ordering-flow-handoff.md`). The read is built for real
 * regardless, the same reasoning `read-tracked-order.ts` and
 * `lib/cart/read-cart.ts` both give, so the moment the write lands this
 * starts working with no frontend change.
 *
 * Four reads rather than one join. `order_item` has no foreign key to
 * `product` that PostgREST will embed through in a single hop here, the
 * `review` table is unrelated to either, and the delivery row lives on its
 * own — so the orders are fetched first and the rest are fetched for that
 * page of ids. Fanning out per order would be N+1; this is a fixed four.
 */

/** A page's worth of history. Deep paging isn't drawn, so there's no cursor. */
const HISTORY_LIMIT = 30;

export async function readPastOrders(): Promise<PastOrder[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Scoped to the signed-in customer, the same reasoning
  // `readTrackedOrder` gives: middleware guards /orders, but only this
  // filter stops one customer reading another's history.
  const { data: orders } = await supabase
    .from("order")
    .select(
      "order_id, order_number, order_status, order_type, cancelled_at, created_at, delivery_fee",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (!orders || orders.length === 0) return [];

  // An order whose payment was never finished goes on offering "Complete
  // payment" forever, long after the wallet source expired (issue #106).
  // Cancel the ones past the window on the way past.
  //
  // Done from what was just read rather than with a query of its own: the
  // rows are already here, so the common case — nothing stale — costs
  // nothing, and only a customer who actually abandoned a payment triggers
  // a write. It is a read doing a write, which is the price of having no
  // scheduler; `supabase/migrations/20260926000003_expire_abandoned_orders.sql`
  // carries the same rule for a sweep that does not need the customer to
  // come back.
  const staleCutoff = Date.now() - PAYMENT_WINDOW_MS;
  const hasStale = orders.some(
    (row) =>
      isUnpaidStatus(row.order_status) &&
      row.created_at !== null &&
      new Date(row.created_at).getTime() < staleCutoff,
  );

  if (hasStale) {
    try {
      const expired = new Set(await expireAbandonedOrders(user.id));
      for (const row of orders) {
        if (!expired.has(row.order_id)) continue;
        // Corrected in place so this page renders what the database now
        // holds, rather than the unpaid state it held a moment ago.
        row.order_status = "cancelled";
        row.cancelled_at = new Date().toISOString();
      }
    } catch (error) {
      // The history is still worth showing; a stale "Complete payment" on
      // one row is better than an empty Orders page.
      console.error("readPastOrders: could not expire abandoned orders:", error);
    }
  }

  const orderIds = orders.map((row) => row.order_id);

  const [items, reviews] = await Promise.all([
    supabase
      .from("order_item")
      .select("order_id, quantity, subtotal, product_id, product_name, product(product_name)")
      .in("order_id", orderIds),
    supabase
      .from("review")
      .select("order_id, rating, product_id")
      .eq("customer_id", user.id)
      .in("order_id", orderIds),
  ]);

  const ratingByOrder = new Map<string, number | null>();
  const productRatingsByOrder = new Map<string, Record<string, number>>();
  for (const row of reviews.data ?? []) {
    if (row.order_id) {
      if (row.product_id === null) {
        ratingByOrder.set(row.order_id, row.rating);
      } else {
        const pr = productRatingsByOrder.get(row.order_id) ?? {};
        pr[row.product_id] = row.rating ?? 0;
        productRatingsByOrder.set(row.order_id, pr);
      }
    }
  }

  type ItemRow = { quantity: number; subtotal: number; name: string; productId: string | null };
  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const row of items.data ?? []) {
    if (!row.order_id) continue;
    const list = itemsByOrder.get(row.order_id) ?? [];
    list.push({
      quantity: row.quantity,
      subtotal: row.subtotal,
      productId: (row as any).product_id ?? null,
      // A deleted product leaves the line in the order with nothing to name
      // it. Saying so beats rendering "2× " with a hole after it.
      name: orderItemName(row.product_name, productNameOf(row.product)),
    });
    itemsByOrder.set(row.order_id, list);
  }

  return orders
    .map((row): PastOrder => {
      const orderItems = itemsByOrder.get(row.order_id) ?? [];
      return {
        orderId: row.order_id,
        orderNumber: formatOrderNumber(row.order_number, row.order_id),
        placedAt: row.created_at,
        orderStatus: row.order_status,
        cancelledAt: row.cancelled_at,
        // Pickup-only (issue #114): no delivery table, so no delivery status.
        deliveryStatus: null,
        orderType: row.order_type,
        items: orderItems.map(({ name, quantity, productId }) => ({ name, quantity, productId })),
        total: totalOf(orderItems, row.delivery_fee, row.order_type),
        rating: ratingByOrder.get(row.order_id) ?? null,
        productRatings: productRatingsByOrder.get(row.order_id) ?? {},
      };
    });
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
