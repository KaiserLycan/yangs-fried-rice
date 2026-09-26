import type { OrderData } from "@/lib/mock-orders";

/**
 * What staff see and can do with an order. The shop is pickup-only (issue
 * #114): every order is cooked, marked ready, and handed over at the counter
 * — to the customer or to the courier they sent. There are no riders, so
 * staff finish every order themselves, including the legacy delivery orders
 * still sitting at "out for delivery" from before the switch.
 *
 * Pure functions, shared by the order cards, the detail modal, the Orders page
 * and the KDS so the wording and the status each button writes can't drift.
 */

export type StaffAction = "Cancel" | "Confirm" | "Ready" | "Complete";

/** Header label for an order's card / modal. */
export function statusLabelFor(order: Pick<OrderData, "status" | "isDelivery">): string {
  switch (order.status) {
    case "QUEUE":
      return "QUEUE";
    case "PREP":
      return "PREP";
    case "DELIVERY":
      return order.isDelivery === false ? "READY FOR PICK UP" : "DELIVERING";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELED":
      return "CANCELED";
  }
}

/**
 * The one forward action for an order, or null when there is none.
 *   queue  -> Confirm
 *   prep   -> Ready for pick up
 *   ready for pick up / legacy out for delivery -> Picked up
 */
export function primaryActionFor(
  order: Pick<OrderData, "status" | "isDelivery">,
): { type: StaffAction; label: string } | null {
  switch (order.status) {
    case "QUEUE":
      return { type: "Confirm", label: "Confirm" };
    case "PREP":
      return { type: "Ready", label: "Ready" };
    case "DELIVERY":
      return { type: "Complete", label: "Picked Up" };
    default:
      return null;
  }
}

/** Can this order still be cancelled from the staff screens? */
export function canCancel(order: Pick<OrderData, "status">): boolean {
  return order.status === "QUEUE" || order.status === "PREP";
}

/** The `order.order_status` each action writes. All are legal transitions. */
export function dbStatusFor(action: StaffAction): string {
  switch (action) {
    case "Confirm":
      return "preparing";
    case "Ready":
      return "ready"; // preparing -> ready
    case "Complete":
      return "completed"; // ready (or legacy out_for_delivery) -> completed
    case "Cancel":
      return "cancelled";
  }
}

/** Copy for the confirmation dialog and the success toast. */
export function actionCopy(action: StaffAction, orderNumber: string) {
  switch (action) {
    case "Confirm":
      return {
        title: "Confirm order",
        description: `Confirm order #${orderNumber} and send it to the kitchen?`,
        confirm: "Yes, Confirm",
        done: `Order #${orderNumber} confirmed.`,
      };
    case "Ready":
      return {
        title: "Ready for pick up",
        description: `Mark order #${orderNumber} as ready for the customer to pick up?`,
        confirm: "Yes, It's Ready",
        done: `Order #${orderNumber} is ready for pick up.`,
      };
    case "Complete":
      return {
        title: "Mark as picked up",
        description: `Has order #${orderNumber} been picked up by the customer or their courier?`,
        confirm: "Yes, Picked Up",
        done: `Order #${orderNumber} completed.`,
      };
    case "Cancel":
      return {
        title: "Cancel this order?",
        description:
          "Canceling this order will notify the customer. Do you want to cancel this order?",
        confirm: "Confirm",
        done: `Order #${orderNumber} cancelled.`,
      };
  }
}
