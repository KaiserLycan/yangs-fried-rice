import { orderItemName } from "@/lib/orders/item-name";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

/**
 * One customer's order and its delivery record, narrowed to what the tracking
 * screen draws.
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
  deliveryStatus: string | null;
  /** `delivery.delivery_id`, so the screen can subscribe to the right row. */
  deliveryId: string | null;
  orderType: string | null;
  /**
   * "25–35 mins", or null when nothing has been estimated. Not read here:
   * the page fills it from `getOrderEtaAction`, because `delivery.
   * estimated_time` is a timestamp the ETA engine writes as a side effect,
   * not the range the design shows. See `lib/orders/arrival-window.ts`.
   */
  arrivalWindow: string | null;
  /** The address the order is going to, or null for a non-delivery order. */
  destination: string | null;
  /** Geocoded coordinates of the destination */
  destinationCoordinates: { lat: number; lng: number } | null;
  riderName: string | null;
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

  const { data: delivery } = await supabase
    .from("delivery")
    .select("delivery_id, delivery_status, rider_id")
    .eq("order_id", order.order_id)
    .maybeSingle();

  const [riderName, orderItems, review] = await Promise.all([
    readRiderName(supabase, delivery?.rider_id ?? null),
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
    deliveryStatus: delivery?.delivery_status ?? null,
    deliveryId: delivery?.delivery_id ?? null,
    orderType: order.order_type,
    arrivalWindow: null,
    destination: order.delivery_address,
    destinationCoordinates: await geocode(order.delivery_address),
    riderName,
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

/**
 * A rider's name lives on `employee`, not on `rider` — the `rider` table only
 * carries licence and vehicle details, and points at the employee record.
 */
async function readRiderName(
  supabase: ReturnType<typeof createClient>,
  riderId: string | null,
): Promise<string | null> {
  if (!riderId) return null;

  // Read with the service role, not the caller's session.
  //
  // This runs on the *customer's* tracking screen, and both rows belong to
  // somebody else. `employee` and `rider` are RLS-protected so that customers
  // and anonymous visitors cannot read staff records, which means a
  // session-scoped read here matches zero rows and the rider's name silently
  // disappears from tracking.
  //
  // Only the name is selected, and only for the rider already assigned to
  // this delivery, so nothing else about the employee is exposed. The
  // alternative — a policy letting a customer read staff rows by joining
  // delivery to order — widens the table's exposure to express a rule that
  // belongs here.
  const admin = createAdminClient();

  const { data: rider } = await admin
    .from("rider")
    .select("employee_id")
    .eq("rider_id", riderId)
    .maybeSingle();

  if (!rider?.employee_id) return null;

  const { data: employee } = await admin
    .from("employee")
    .select("name")
    .eq("employee_id", rider.employee_id)
    .maybeSingle();

  return employee?.name ?? null;
}

async function geocode(address: string | null) {
  if (!address) return null;
  const result = await validateNcrAddress(address);
  if (result.latitude && result.longitude) {
    return { lat: result.latitude, lng: result.longitude };
  }
  return null;
}
