import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { orderItemName } from "@/lib/orders/item-name";
import { totalOf } from "@/lib/orders/past-order";

/**
 * The signed-in customer's last few completed orders, for the "Order again"
 * row at the top of the menu (limitations #20, issue #118). Reordering one
 * goes through the same `reorderPastOrder` My orders uses.
 *
 * Completed only: a cancelled order is not something to repeat, and one
 * still in the kitchen is not finished. Empty for a guest, and for a
 * customer who has never picked one up — the row then doesn't render.
 */
export const RECENT_ORDERS_LIMIT = 3;

export type RecentOrder = {
  orderId: string;
  orderNumber: string;
  /** When it was picked up (or placed, for an old row with no completion time). */
  completedAt: string | null;
  items: { name: string; quantity: number }[];
  total: number;
};

export async function readRecentCompletedOrders(
  limit: number = RECENT_ORDERS_LIMIT,
): Promise<RecentOrder[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 10);

  // Scoped to the caller as well as by RLS, the same belt-and-braces
  // `readPastOrders` gives.
  const { data: orders } = await supabase
    .from("order")
    .select("order_id, order_type, delivery_fee, completed_at, created_at")
    .eq("customer_id", user.id)
    .eq("order_status", "completed")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (!orders || orders.length === 0) return [];

  const { data: lines } = await supabase
    .from("order_item")
    .select("order_id, quantity, subtotal, product_name, product(product_name)")
    .in(
      "order_id",
      orders.map((order) => order.order_id),
    );

  return orders.map((order) => {
    const orderLines = (lines ?? []).filter((line) => line.order_id === order.order_id);
    return {
      orderId: order.order_id,
      orderNumber: formatOrderNumber(order.order_id),
      completedAt: order.completed_at ?? order.created_at,
      items: orderLines.map((line) => ({
        name: orderItemName(
          line.product_name,
          Array.isArray(line.product) ? line.product[0]?.product_name : line.product?.product_name,
        ),
        quantity: line.quantity,
      })),
      total: totalOf(orderLines, order.delivery_fee, order.order_type),
    };
  });
}
