import type { OrderData } from "@/types/staff-order";
import { formatOrderType, isDeliveryOrder } from "@/lib/orders/format";
import { orderItemName } from "@/lib/orders/item-name";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { computeOrderTotal } from "@/lib/orders/order-total";
import { formatMobileNumber } from "@/lib/validation/phone";

/**
 * One `getDetailedOrders` row → the card/modal shape the staff screens draw.
 *
 * The orders page and the KDS used to carry two copies of this mapping, and
 * both hard-coded `deliveryFee: 0` and read the total from
 * `transaction.total_paid` (0 until cash changes hands). One mapper means the
 * two screens cannot drift, and the money is computed the same way in both.
 */

type One<T> = T | T[] | null;

export type StaffOrderRow = {
  order_id: string;
  /** `#1042` — see lib/orders/order-number.ts. */
  order_number?: number | null;
  created_at: string | null;
  /** When it entered the kitchen queue (issue #115). */
  pending_at?: string | null;
  order_status: string | null;
  order_type: string | null;
  delivery_fee: number | null;
  /** The order-wide note from checkout, not any one line's. */
  special_instructions?: string | null;
  fulfillment_method?: string | null;
  /** When the kitchen marked it ready — the pick-up clock starts here. */
  ready_at?: string | null;
  customer: One<{
    name: string | null;
    email: string | null;
    phone_number?: string | null;
  }>;
  order_item: {
    quantity: number;
    subtotal: number | null;
    special_instructions: string | null;
    /** Snapshot taken when the order was placed — see `orderItemName`. */
    product_name?: string | null;
    unit_price?: number | null;
    product: One<{ product_name: string; product_price: number }>;
    order_item_add_on?: {
      add_on: One<{ name: string; price: number }>;
    }[] | null;
  }[];
  order_add_on?: { price: number | null }[] | null;
  /** The payment row: how it was paid, and any Senior Citizen / PWD discount. */
  transaction?: One<{
    payment_method?: string | null;
    subtotal?: number | null;
    discount_amount?: number | null;
    discount_type?: string | null;
    discount_id_number?: string | null;
    name_on_id?: string | null;
    discount_id_photo_path?: string | null;
  }>;
};

const first = <T,>(value: One<T> | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export function uiStatusFor(dbStatus: string | null): OrderData["status"] {
  switch (dbStatus) {
    case "preparing":
      return "PREP";
    case "ready":
    case "out_for_delivery":
      return "DELIVERY";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELED";
    case "awaiting_payment":
    case "payment_failed":
      return "UNPAID";
    case "pending":
    default:
      return "QUEUE";
  }
}

export function mapStaffOrder(order: StaffOrderRow): OrderData {
  const itemCount = order.order_item.reduce((acc, line) => acc + line.quantity, 0);
  const prepMinutes = Math.min(45, Math.max(5, itemCount * 5));
  const customer = first(order.customer);
  const delivery = isDeliveryOrder(order.order_type);

  const items = order.order_item.map((line) => {
    const product = first(line.product);
    const addOnNames = (line.order_item_add_on ?? [])
      .map((row) => first(row.add_on))
      .filter((addOn): addOn is { name: string; price: number } => addOn !== null)
      .map((addOn) => addOn.name);

    return {
      quantity: line.quantity,
      name: orderItemName(line.product_name, product?.product_name),
      // Unit price is only for the modal's per-line display.
      price: line.subtotal ?? (product?.product_price ?? 0) * line.quantity,
      // Kept apart (P30): an instruction is a request to the cook, an
      // add-on is something paid for, and joining them hid which was which.
      addons: addOnNames.length > 0 ? addOnNames.join(", ") : undefined,
      instructions: line.special_instructions?.trim() || undefined,
    };
  });

  const menuTotal = computeOrderTotal({
    itemSubtotals: order.order_item.map(
      (line) => line.subtotal ?? (first(line.product)?.product_price ?? 0) * line.quantity,
    ),
    orderAddOnPrices: (order.order_add_on ?? []).map((row) => row.price),
    deliveryFee: order.delivery_fee,
  });

  // Senior Citizen / PWD (issue #116): the order is owed at
  // subtotal - discount_amount, as checkout saved it, not at menu prices.
  const payments = Array.isArray(order.transaction)
    ? order.transaction
    : order.transaction
      ? [order.transaction]
      : [];
  const discounted = payments.find(
    (row) => row.discount_type === "senior_citizen" || row.discount_type === "pwd",
  );
  const total = discounted
    ? Math.round(
        ((discounted.subtotal ?? 0) - (discounted.discount_amount ?? 0)) * 100,
      ) /
        100 +
      (order.delivery_fee ?? 0)
    : menuTotal;

  return {
    id: order.order_id,
    rawCreatedAt: order.created_at,
    // Both were read by the KDS but never filled in, so the "Pay in store"
    // chip never showed and pick-up timers counted from the order time.
    rawReadyAt: order.ready_at ?? null,
    paymentMethod: first(order.transaction)?.payment_method ?? null,
    // Only a still-unaccepted order can be "waiting too long" (issue #115).
    // Falls back to created_at for an order from before pending_at existed.
    pendingAt:
      order.order_status === "pending"
        ? (order.pending_at ?? order.created_at)
        : null,
    // Was `substring(0, 4).toUpperCase()` while the customer was shown the
    // last four — the same order, two references, neither able to check the
    // other (issue #106).
    orderNumber: formatOrderNumber(order.order_number, order.order_id),
    time: order.created_at
      ? new Date(order.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown time",
    status: uiStatusFor(order.order_status),
    dbStatus: order.order_status,
    isDelivery: delivery,
    fulfillmentMethod: order.fulfillment_method || undefined,
    timer: `${prepMinutes}:00`,
    contactInfo: {
      name: customer?.name || "Walk-in Customer",
      // Same "+63 917 123 4567" grouping as every other screen (P27).
      phone:
        formatMobileNumber(customer?.phone_number) ||
        customer?.email ||
        "No contact",
    },
    orderInfo: {
      type: formatOrderType(order.order_type),
      // Was the first line's note, shown as if it covered the whole order
      // while every other line's note was dropped (P30).
      specialInstructions: order.special_instructions?.trim() || "",
    },
    deliveryFee: order.delivery_fee ?? 0,
    total,
    items,
    seniorPwd: discounted
      ? {
          type: discounted.discount_type as "senior_citizen" | "pwd",
          idNumber: discounted.discount_id_number ?? "",
          nameOnId: discounted.name_on_id ?? "",
          discount: discounted.discount_amount ?? 0,
          hasPhoto: Boolean(discounted.discount_id_photo_path),
        }
      : undefined,
  } as OrderData;
}
