import type { OrderData } from "@/lib/mock-orders";
import { formatOrderType, isDeliveryOrder } from "@/lib/orders/format";
import { computeOrderTotal } from "@/lib/orders/order-total";

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
  created_at: string | null;
  order_status: string | null;
  order_type: string | null;
  delivery_fee: number | null;
  delivery_address: string | null;
  customer: One<{
    name: string | null;
    email: string | null;
    phone_number?: string | null;
  }>;
  order_item: {
    quantity: number;
    subtotal: number | null;
    special_instructions: string | null;
    product: One<{ product_name: string; product_price: number }>;
    order_item_add_on?: {
      add_on: One<{ name: string; price: number }>;
    }[] | null;
  }[];
  order_add_on?: { price: number | null }[] | null;
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
    case "pending":
    case "received":
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

    const notes = [
      addOnNames.length > 0 ? `Add-ons: ${addOnNames.join(", ")}` : null,
      line.special_instructions,
    ].filter(Boolean);

    return {
      quantity: line.quantity,
      name: product?.product_name || "Unknown Item",
      // Unit price is only for the modal's per-line display.
      price: line.subtotal ?? (product?.product_price ?? 0) * line.quantity,
      addons: notes.length > 0 ? notes.join(" · ") : undefined,
    };
  });

  const total = computeOrderTotal({
    itemSubtotals: order.order_item.map(
      (line) => line.subtotal ?? (first(line.product)?.product_price ?? 0) * line.quantity,
    ),
    orderAddOnPrices: (order.order_add_on ?? []).map((row) => row.price),
    deliveryFee: order.delivery_fee,
  });

  return {
    id: order.order_id,
    rawCreatedAt: order.created_at,
    orderNumber: order.order_id.substring(0, 4).toUpperCase(),
    time: order.created_at
      ? new Date(order.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Unknown time",
    status: uiStatusFor(order.order_status),
    isDelivery: delivery,
    timer: `${prepMinutes}:00`,
    contactInfo: {
      name: customer?.name || "Walk-in Customer",
      address:
        order.delivery_address ||
        (delivery ? "No delivery address on file" : "Not applicable (no delivery)"),
      phone: customer?.phone_number || customer?.email || "No contact",
    },
    orderInfo: {
      type: formatOrderType(order.order_type),
      specialInstructions: order.order_item?.[0]?.special_instructions || "",
    },
    deliveryFee: order.delivery_fee ?? 0,
    total,
    items,
  } as OrderData;
}
