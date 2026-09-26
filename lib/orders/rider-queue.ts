import {
  DELIVERY_CAP_MESSAGE,
  isAtDeliveryCap,
} from "@/lib/orders/delivery-assignment";
import { formatMobileNumber } from "@/lib/validation/phone";
import type { DeliveryData } from "@/components/deliver/delivery-overview-card";

/**
 * Turns the queue's summaries and details into the cards a rider sees.
 *
 * `/deliver` and the sidebar used to map these separately, with different
 * fallbacks ("No address provided" vs "Address details protected"), so two
 * riders — or one rider on two screens — saw different queues (P45). Both
 * now go through here.
 */

export type QueueSummary = {
  deliveryId: string;
  deliveryStatus: string | null;
  isMine: boolean;
  takenBy: string | null;
};

export type QueueDetail = {
  deliveryId: string;
  deliveryStatus: string | null;
  createdAt: string | null;
  customer: { name: string; address: string | null; phone: string | null } | null;
  payment: { method: string; total: number } | null;
  items: { productName: string; quantity: number }[];
  deliveryNote: string | null;
};

export function cardStatusOf(
  deliveryStatus: string | null,
): DeliveryData["status"] {
  if (deliveryStatus === "delivered") return "completed";
  if (deliveryStatus === "delivering" || deliveryStatus === "out_for_delivery") {
    return "delivering";
  }
  return "ready";
}

/** This rider's deliveries that are not finished yet — what the cap counts. */
export function activeCountOf(summaries: QueueSummary[]): number {
  return summaries.filter(
    (s) => s.isMine && cardStatusOf(s.deliveryStatus) !== "completed",
  ).length;
}

export function toDeliveryCard(
  detail: QueueDetail,
  summary: QueueSummary | undefined,
  activeCount: number,
): DeliveryData {
  return {
    id: detail.deliveryId,
    customer: detail.customer?.name || "Walk-in Customer",
    address: detail.customer?.address || "No address provided",
    phone: formatMobileNumber(detail.customer?.phone) || "No phone provided",
    notes: detail.deliveryNote ?? "",
    paymentMethod: detail.payment?.method ?? "cash_on_delivery",
    total: detail.payment?.total ?? 0,
    status: cardStatusOf(detail.deliveryStatus),
    createdAt: detail.createdAt ?? new Date().toISOString(),
    items: detail.items.map((item) => ({
      qty: item.quantity,
      name: item.productName,
    })),
    takenBy: summary?.takenBy ?? null,
    acceptBlockedReason: isAtDeliveryCap(activeCount) ? DELIVERY_CAP_MESSAGE : null,
  };
}
