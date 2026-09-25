/**
 * The rules the past-orders list draws itself from — how an order that is
 * over gets described, what its one action is, and how its money and its
 * date are written out.
 *
 * Colocated with tests the way `lib/menu/cart-totals.ts` and `lib/profile/`
 * are: everything here is a pure function of a row, which is exactly the
 * shape worth testing and the shape that survives the backend still being
 * unbuilt.
 *
 * Nothing in this module reads a raw status string. `lib/orders/order-stage.ts`
 * is the only place allowed to do that — see its header for why four
 * disagreeing vocabularies exist — and this module asks it questions instead.
 */

import { isPickupOrder } from "@/lib/orders/format";
import { formatPeso } from "@/lib/menu/product-listing";
import {
  resolveOrderProgress,
  type OrderProgress,
} from "@/lib/orders/order-stage";

export type PastOrderItem = {
  productId: string | null;
  name: string;
  quantity: number;
};

/**
 * One finished order, narrowed to what a card draws. The three status fields
 * are carried raw for the same reason `TrackedOrder` carries them raw: only
 * `order-stage.ts` interprets them.
 */
export type PastOrder = {
  orderId: string;
  /** Human-facing reference — `orderNumberFrom` in `read-tracked-order.ts`. */
  orderNumber: string;
  /** ISO timestamp, from `order.created_at`. */
  placedAt: string | null;
  orderStatus: string | null;
  cancelledAt: string | null;
  deliveryStatus: string | null;
  /** "Delivery" or "Pickup" — decides Delivered vs Picked up, not the status. */
  orderType: string | null;
  items: PastOrderItem[];
  /** Pesos. Summed from `order_item`, because `order` has no total column. */
  total: number;
  /** 1–5 from `review.rating`, or null when the customer hasn't rated it. */
  rating: number | null;
  /** Product-level ratings, keyed by productId */
  productRatings: Record<string, number>;
};

/** How the card describes the end of the order, and how that reads. */
export type OrderOutcome = {
  label: string;
  /** `success` is the green the frames use; `muted` is for everything else. */
  tone: "success" | "muted";
};

export const MAX_RATING = 5;

/**
 * Pickup is the narrower case and the one that has to be recognised
 * explicitly; anything else — including a NULL type — is treated as a
 * delivery, matching the frames, where two of the three cards say
 * "Delivered".
 */
export function isPickup(orderType: string | null): boolean {
  return isPickupOrder(orderType);
}

export function progressOf(order: PastOrder): OrderProgress {
  return resolveOrderProgress({
    orderStatus: order.orderStatus,
    cancelledAt: order.cancelledAt,
    deliveryStatus: order.deliveryStatus,
    orderType: order.orderType,
  });
}

/**
 * An order belongs in the history once it can no longer move: it was
 * delivered/collected, or it was cancelled. Anything still in flight belongs
 * on the tracking screen instead, and an order whose status nobody can read
 * is not claimed to be finished.
 */
export function isPast(order: PastOrder): boolean {
  const progress = progressOf(order);
  if (progress.kind === "cancelled") return true;
  return progress.kind === "stage" && progress.stage === "delivered";
}

/**
 * "Delivered" and "Picked up" are the same stage wearing different words —
 * the difference is `order_type`, not anything in the status columns. The
 * frames only draw those two; "Cancelled" and the two fallbacks below are
 * derived, since a cancelled order plainly belongs in a history and a
 * free-text status column plainly produces values nobody wrote down.
 */
export function outcomeOf(order: PastOrder): OrderOutcome {
  const progress = progressOf(order);

  if (progress.kind === "cancelled") {
    return { label: "Cancelled", tone: "muted" };
  }
  if (progress.kind === "unpaid") {
    // The two unpaid statuses read differently to a customer: one is a
    // payment they never finished, the other one the wallet refused. Both
    // lead to the same screen, so this is the only place they differ.
    return {
      label:
        progress.orderStatus === "payment_failed"
          ? "Payment failed"
          : "Waiting for payment",
      tone: "muted",
    };
  }
  if (progress.kind === "unknown") {
    return { label: "Status unavailable", tone: "muted" };
  }
  if (progress.stage !== "delivered") {
    // Only reachable if an in-flight order slips past `isPast`. Saying "In
    // progress" is honest; calling it delivered would not be.
    return { label: "In progress", tone: "muted" };
  }

  return {
    label: isPickup(order.orderType) ? "Picked up" : "Delivered",
    tone: "success",
  };
}

/**
 * A cancelled order has nothing to rate, and a rating is given once —
 * changing one is not drawn anywhere and is not in scope (ticket 12).
 */
export function canRate(order: PastOrder): boolean {
  if (order.rating !== null) return false;
  const progress = progressOf(order);
  return progress.kind === "stage" && progress.stage === "delivered";
}

/**
 * The single action the card offers.
 *
 * The frames draw three different actions across three cards and nothing in
 * the data tells them apart — card 1 (rated, delivery) says Reorder and card
 * 3 (rated, pickup) says View receipt, which would only be a rule if pickup
 * orders could not be reordered. Ticket 11 records the decision: rate what
 * has not been rated, otherwise reorder, and reach the receipt through the
 * card's own link to the order.
 */
export function primaryActionOf(
  order: PastOrder,
): "rate" | "reorder" | "track" | "pay" {
  // Checked before the others: an unpaid order is not past, but offering it
  // a Track link would point at a timeline for food the kitchen has not been
  // told about. Paying for it is the only move that makes sense.
  if (progressOf(order).kind === "unpaid") return "pay";
  if (!isPast(order)) return "track";
  return canRate(order) ? "rate" : "reorder";
}

/**
 * Where the card sends a customer who still owes money on an order — the
 * receipt they were shown when they placed it, which is already the screen
 * that watches the payment settle and offers both ways out of a failed one.
 * One payment surface, reached from two places.
 */
export function payUrlFor(order: PastOrder): string {
  return `/checkout/confirmation?order=${order.orderId}`;
}

/** True while an order still needs paying for. */
export function isUnpaid(order: PastOrder): boolean {
  return progressOf(order).kind === "unpaid";
}

/**
 * "2× Yangzhou Special, 1× Lumpia (5pc)" — one line, in the order the items
 * come back in.
 *
 * The multiplication sign is U+00D7, not the letter x, because that is what
 * the frames draw.
 */
export function summariseItems(items: PastOrderItem[]): string {
  if (items.length === 0) return "No items recorded";
  return items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
}

/**
 * "Aug 24, 7:12 PM".
 *
 * Pinned to Asia/Manila and to en-US on purpose. A restaurant in Malate
 * serves one timezone, and letting the formatter follow the runtime would
 * make the server and the browser disagree about which day an evening order
 * was placed — a hydration mismatch that only shows up for customers in
 * another timezone, which is the worst way to find it.
 */
const PLACED_AT_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});

export function formatPlacedAt(placedAt: string | null): string {
  if (placedAt === null) return "Date unavailable";
  const date = new Date(placedAt);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return PLACED_AT_FORMAT.format(date);
}

/**
 * The card's total. `order` has no total column, so this is summed from the
 * order's items — in whole centavos, the same rule `lib/menu/cart-totals.ts`
 * gives, so that repeated addition cannot drift.
 *
 * The delivery fee is added only for a delivery, which is the rule the cart
 * already applies to a live basket.
 */
export function totalOf(
  items: { quantity: number; subtotal: number }[],
  deliveryFee: number | null,
  orderType: string | null,
): number {
  const centavos = items.reduce(
    (sum, item) => sum + Math.round(item.subtotal * 100),
    0,
  );
  const feeCentavos = isPickup(orderType)
    ? 0
    : Math.round((deliveryFee ?? 0) * 100);
  return (centavos + feeCentavos) / 100;
}

export function formatTotal(total: number): string {
  return formatPeso(total);
}
