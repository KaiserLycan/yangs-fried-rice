import { orderItemName } from "@/lib/orders/item-name";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";
import type { OrderIssueType } from "@/lib/validation/order-issue";
import type { StatusChange } from "@/lib/orders/order-stage";

/**
 * One customer's order, narrowed to what the tracking screen draws — the
 * timeline, the printable receipt and the "Report a problem" form.
 *
 * The raw status strings are carried through rather than resolved here. The
 * screen re-resolves them on every realtime event, and doing that means the
 * subscription can hand the component a changed row without this module
 * running again.
 */
export type TrackedOrderLine = {
  orderItemId: string;
  productId: string;
  name: string;
  quantity: number;
  /** Pesos for one, add-ons included — what the cart showed. */
  unitPrice: number;
  /** Pesos for the whole line. */
  subtotal: number;
  addOns: { name: string; price: number }[];
  specialInstructions: string | null;
};

export type TrackedOrderPayment = {
  /** `transaction.payment_method`, raw — see `paymentLabelFor`. */
  method: string | null;
  status: string | null;
  discountAmount: number;
  discountType: string | null;
  taxAmount: number;
  totalPaid: number;
};

export type TrackedOrderIssue = {
  issueType: OrderIssueType;
  createdAt: string;
  resolvedAt: string | null;
};

export type TrackedOrder = {
  orderId: string;
  /** The order's reference — see `lib/orders/order-number.ts`. */
  orderNumber: string;
  /** Fed to `resolveOrderProgress`; never read directly by a component. */
  orderStatus: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  /**
   * When the order started waiting for staff to accept it (issue #115). The
   * screen prompts from 5 minutes and offers a free cancel from 10.
   */
  pendingAt?: string | null;
  /**
   * Always null: the shop is pickup-only and the `delivery` table is gone
   * (issue #114). Kept on the type because `resolveOrderProgress` still
   * accepts it for legacy delivery orders.
   */
  deliveryStatus: string | null;
  orderType: string | null;
  /** ISO timestamps. */
  placedAt: string | null;
  completedAt: string | null;
  /**
   * "25–35 mins", or null when nothing has been estimated. Not read here:
   * the page fills it from `getOrderEtaAction`. See
   * `lib/orders/arrival-window.ts`.
   */
  arrivalWindow: string | null;
  /**
   * `order.promised_at` — the ready-by time quoted when the order was
   * placed. Never changes, even when the ETA does. Null on older orders.
   */
  promisedAt: string | null;
  /** `order_status_log`, oldest first. Stamps each timeline stage. */
  statusLog: StatusChange[];
  items: TrackedOrderLine[];
  /** Order-level add-ons (rice, drinks …), priced when the order was placed. */
  orderAddOns: { name: string; price: number }[];
  /** 0 for every pickup order; legacy delivery orders carry their fee. */
  fee: number;
  /** The order-wide note the customer left at checkout. */
  specialInstructions: string | null;
  payment: TrackedOrderPayment | null;
  /**
   * The order-level `review.rating`, or null when the customer has not rated
   * the order. Read so a rated order stops asking to be rated (P35, P37).
   */
  rating: number | null;
  /** The customer's problem report on this order, if they made one. */
  issue: TrackedOrderIssue | null;
};

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
    .select(
      "order_id, order_number, order_status, order_type, cancelled_at, cancellation_reason, created_at, completed_at, delivery_fee, special_instructions, pending_at, promised_at"
    )
    .eq("order_id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) return null;

  const [orderItems, orderAddOns, transaction, review, issue, statusLog] = await Promise.all([
    supabase
      .from("order_item")
      .select(
        "order_item_id, product_id, product_name, quantity, unit_price, subtotal, special_instructions, product(product_name), order_item_add_on ( add_on ( name, price ) )",
      )
      .eq("order_id", order.order_id)
      .then((res) => res.data),
    supabase
      .from("order_add_on")
      .select("price, add_on ( name )")
      .eq("order_id", order.order_id)
      .then((res) => res.data),
    supabase
      .from("transaction")
      .select("payment_method, payment_status, discount_amount, discount_type, tax_amount, total_paid, transaction_date")
      .eq("order_id", order.order_id)
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle()
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
    supabase
      .from("order_issue")
      .select("issue_type, created_at, resolved_at")
      .eq("order_id", order.order_id)
      .maybeSingle()
      .then((res) => res.data),
    supabase
      .from("order_status_log")
      .select("to_status, changed_at")
      .eq("order_id", order.order_id)
      .order("changed_at", { ascending: true })
      .then((res) => res.data),
  ]);

  return {
    orderId: order.order_id,
    orderNumber: formatOrderNumber(order.order_number, order.order_id),
    orderStatus: order.order_status,
    cancelledAt: order.cancelled_at,
    cancellationReason: order.cancellation_reason,
    // An order from before pending_at existed falls back to when it was made.
    pendingAt:
      order.order_status === "pending"
        ? (order.pending_at ?? order.created_at)
        : order.pending_at,
    deliveryStatus: null,
    orderType: order.order_type,
    placedAt: order.created_at,
    completedAt: order.completed_at,
    arrivalWindow: null,
    promisedAt: order.promised_at,
    statusLog: (statusLog ?? []).map((row) => ({
      toStatus: row.to_status,
      changedAt: row.changed_at,
    })),
    items: (orderItems ?? []).map((item) => {
      const addOns = (item.order_item_add_on ?? [])
        .map((row) => first(row.add_on))
        .filter((addOn): addOn is { name: string; price: number } => addOn !== null)
        .map(({ name, price }) => ({ name, price: Number(price) }));
      const subtotal = Number(item.subtotal);
      return {
        orderItemId: item.order_item_id,
        productId: item.product_id || "",
        name: orderItemName(item.product_name, first(item.product)?.product_name),
        quantity: item.quantity,
        // Rows written before the snapshot columns existed have no unit
        // price; the line subtotal over its quantity is the same number.
        unitPrice:
          item.unit_price !== null
            ? Number(item.unit_price)
            : item.quantity > 0
            ? subtotal / item.quantity
            : 0,
        subtotal,
        addOns,
        specialInstructions: item.special_instructions,
      };
    }),
    orderAddOns: (orderAddOns ?? []).map((row) => ({
      name: first(row.add_on)?.name ?? "Add-on",
      price: Number(row.price ?? 0),
    })),
    fee: Number(order.delivery_fee ?? 0),
    specialInstructions: order.special_instructions,
    payment: transaction
      ? {
          method: transaction.payment_method,
          status: transaction.payment_status,
          discountAmount: Number(transaction.discount_amount ?? 0),
          discountType: transaction.discount_type,
          taxAmount: Number(transaction.tax_amount ?? 0),
          totalPaid: Number(transaction.total_paid ?? 0),
        }
      : null,
    rating: review?.rating ?? null,
    issue: issue
      ? {
          issueType: issue.issue_type as OrderIssueType,
          createdAt: issue.created_at,
          resolvedAt: issue.resolved_at,
        }
      : null,
  };
}

/**
 * PostgREST returns an embedded row as an object, but the generated types
 * describe some embeds as arrays. Handling both keeps this working whichever
 * shape `npm run supabase:types` produces.
 */
function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
