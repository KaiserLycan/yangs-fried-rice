import { createClient } from "@/lib/supabase/server";

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
  /** Human-facing order reference — see `orderNumberFrom` on why. */
  orderNumber: string;
  /** Fed to `resolveOrderProgress`; never read directly by a component. */
  orderStatus: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  deliveryStatus: string | null;
  /** `delivery.delivery_id`, so the screen can subscribe to the right row. */
  deliveryId: string | null;
  orderType: string | null;
  /** "35–45 min", or null when nothing has been estimated yet. */
  arrivalWindow: string | null;
  /** The address the order is going to, or null for a non-delivery order. */
  destination: string | null;
  riderName: string | null;
  items: { productId: string; name: string }[];
};

/**
 * `order_id` is a UUID and no human-facing order number column exists, so the
 * screen shows the last four characters of the id. The frames draw "#1042",
 * a four-digit sequence, which a UUID cannot produce.
 *
 * TODO (Backend): an `order_number` column — a short sequence customers can
 * read out over the phone. Until then this is stable and unique enough to
 * identify an order on screen, but it is not what the design asks for.
 */
export function orderNumberFrom(orderId: string): string {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}

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
    .select("order_id, order_status, order_type, cancelled_at, cancellation_reason")
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return null;

  const { data: delivery } = await supabase
    .from("delivery")
    .select("delivery_id, delivery_status, estimated_time, rider_id")
    .eq("order_id", order.order_id)
    .maybeSingle();

  const [riderName, destination, orderItems] = await Promise.all([
    readRiderName(supabase, delivery?.rider_id ?? null),
    readDestination(supabase, user.id),
    supabase
      .from("order_item")
      .select("product_id, product(product_name)")
      .eq("order_id", order.order_id)
      .then((res) => res.data),
  ]);

  return {
    orderId: order.order_id,
    orderNumber: orderNumberFrom(order.order_id),
    orderStatus: order.order_status,
    cancelledAt: order.cancelled_at,
    cancellationReason: order.cancellation_reason,
    deliveryStatus: delivery?.delivery_status ?? null,
    deliveryId: delivery?.delivery_id ?? null,
    orderType: order.order_type,
    arrivalWindow: delivery?.estimated_time ?? null,
    destination,
    riderName,
    items: (orderItems || []).map((item) => ({
      productId: item.product_id || "",
      name: Array.isArray(item.product) ? item.product[0]?.product_name || "Unknown Item" : item.product?.product_name || "Unknown Item",
    })),
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

  const { data: rider } = await supabase
    .from("rider")
    .select("employee_id")
    .eq("rider_id", riderId)
    .maybeSingle();

  if (!rider?.employee_id) return null;

  const { data: employee } = await supabase
    .from("employee")
    .select("name")
    .eq("employee_id", rider.employee_id)
    .maybeSingle();

  return employee?.name ?? null;
}

/**
 * The order's destination is read from the customer's default address rather
 * than from the order, because `order` has no address column at all.
 *
 * TODO (Backend): orders need their own delivery address. Reading the
 * customer's current default is wrong the moment they change it — a delivered
 * order would retroactively claim it went somewhere it did not.
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
