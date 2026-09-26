import {
  DELIVERY_CAP_MESSAGE,
  isAtDeliveryCap,
} from "@/lib/orders/delivery-assignment";
import { formatMobileNumber } from "@/lib/validation/phone";
import { formatOrderNumber } from "@/lib/orders/order-number";
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
  /** When the order was placed — the tiebreak inside each group. */
  createdAt?: string | null;
};

export type QueueDetail = {
  deliveryId: string;
  orderId: string | null;
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

/**
 * Where a card sits: this rider's own first, then ones waiting for anyone,
 * then ones another rider holds, then finished. Other riders' cards are
 * there to explain where an order went, not to be worked on, so they go low.
 */
export function queueRank(summary: QueueSummary): number {
  const status = cardStatusOf(summary.deliveryStatus);
  if (status === "completed") return 3;
  if (summary.isMine) return 0;
  if (summary.takenBy) return 2;
  return 1;
}

/**
 * The queue's order: grouped by `queueRank`, newest first inside each group
 * (P53). The page and the sidebar both sort with this so they agree.
 */
export function compareQueue(a: QueueSummary, b: QueueSummary): number {
  const rank = queueRank(a) - queueRank(b);
  if (rank !== 0) return rank;
  return timeOf(b.createdAt) - timeOf(a.createdAt);
}

function timeOf(iso: string | null | undefined): number {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
}

export function toDeliveryCard(
  detail: QueueDetail,
  summary: QueueSummary | undefined,
  activeCount: number,
): DeliveryData {
  // A delivery this rider holds is theirs to deliver whatever its status
  // text says — some rows are assigned with a status other than
  // "delivering", and those used to show this rider an Accept button for
  // an order they already had.
  const status = cardStatusOf(detail.deliveryStatus);
  return {
    id: detail.deliveryId,
    // The order's reference, not the delivery's: staff and customers know the
    // order as #69403b15, and the card used to print the delivery id, so the
    // same order read differently here and could not be matched (P52).
    orderNumber: formatOrderNumber(detail.orderId),
    customer: detail.customer?.name || "Walk-in Customer",
    address: detail.customer?.address || "No address provided",
    phone: formatMobileNumber(detail.customer?.phone) || "No phone provided",
    notes: detail.deliveryNote ?? "",
    paymentMethod: detail.payment?.method ?? "cash_on_delivery",
    total: detail.payment?.total ?? 0,
    status: summary?.isMine && status === "ready" ? "delivering" : status,
    createdAt: detail.createdAt ?? new Date().toISOString(),
    items: detail.items.map((item) => ({
      qty: item.quantity,
      name: item.productName,
    })),
    takenBy: summary?.takenBy ?? null,
    acceptBlockedReason: isAtDeliveryCap(activeCount) ? DELIVERY_CAP_MESSAGE : null,
  };
}
