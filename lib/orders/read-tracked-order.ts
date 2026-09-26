import { orderItemName } from "@/lib/orders/item-name";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

/**
 * One customer's order, narrowed to what the tracking screen draws.
 *
 * This will read `null` for every customer today, and that is correct rather
 * than a bug to work around: nothing writes an `order` row yet — placing an
 * order is still a stubbed write (see `docs/reference/ordering-flow-
 * handoff.md`) — so there is no honest way for this to return anything else.
 * The read is built for real regardless, the same reasoning
 * `lib/cart/read-cart.ts` gives, so the moment the write lands this starts
 * working with no frontend change.
 *
 * The raw status strings are carried through rather than resolved here. The
 * screen re-resolves them on every realtime event, and doing that means the
 * subscription can hand the component a changed row without this module
 * running again.
 */
export type TrackedOrder = {
  orderId: string;
  /** The order's reference — see `lib/orders/order-number.ts`. */
  orderNumber: string;
  /** Fed to `resolveOrderProgress`; never read directly by a component. */
  orderStatus: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  /**
   * Always null: the shop is pickup-only and the `delivery` table is gone
   * (issue #114). Kept on the type because `resolveOrderProgress` still
   * accepts it for legacy delivery orders.
   */
  deliveryStatus: string | null;
  orderType: string | null;
  /**
   * "25–35 mins", or null when nothing has been estimated. Not read here:
   * the page fills it from `getOrderEtaAction`. See
   * `lib/orders/arrival-window.ts`.
   */
  arrivalWindow: string | null;
  /** The address the order is going to, or null for a non-delivery order. */
  destination: string | null;
  /** Geocoded coordinates of the destination */
  destinationCoordinates: { lat: number; lng: number } | null;
  items: { productId: string; name: string }[];
  /**
   * The order-level `review.rating`, or null when the customer has not rated
   * the order. Read so a rated order stops asking to be rated (P35, P37).
   */
  rating: number | null;
};

// This file used to carry a second, byte-identical copy of the customer's
// order-number helper. Both are gone; see `lib/orders/order-number.ts`.

export async function readTrackedOrder(
  orderId: string,
): Promise<TrackedOrder | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Scoped to the signed-in customer on purpose. Middleware guards /orders,
  // but nothing in the URL stops one customer asking for another's order id,
  // so the filter is what actually prevents that.
  const { data: order } = await supabase
    .from("order")
    .select("order_id, order_status, order_type, cancelled_at, cancellation_reason, delivery_address")
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return null;

  const [orderItems, review] = await Promise.all([
    supabase
      .from("order_item")
      .select("product_id, product_name, product(product_name)")
      .eq("order_id", order.order_id)
      .then((res) => res.data),
    // Order-level only: a per-item row (product_id set) is not a rating of
    // the order.
    supabase
      .from("review")
      .select("rating")
      .eq("order_id", order.order_id)
      .is("product_id", null)
      .maybeSingle()
      .then((res) => res.data),
  ]);

  return {
    orderId: order.order_id,
    orderNumber: formatOrderNumber(order.order_id),
    orderStatus: order.order_status,
    cancelledAt: order.cancelled_at,
    cancellationReason: order.cancellation_reason,
    deliveryStatus: null,
    orderType: order.order_type,
    arrivalWindow: null,
    destination: order.delivery_address,
    destinationCoordinates: await geocode(order.delivery_address),
    items: (orderItems || []).map((item) => ({
      productId: item.product_id || "",
      name: orderItemName(
        item.product_name,
        Array.isArray(item.product)
          ? item.product[0]?.product_name
          : item.product?.product_name,
      ),
    })),
    rating: review?.rating ?? null,
  };
}

async function geocode(address: string | null) {
  if (!address) return null;
  const result = await validateNcrAddress(address);
  if (result.latitude && result.longitude) {
    return { lat: result.latitude, lng: result.longitude };
  }
  return null;
}
