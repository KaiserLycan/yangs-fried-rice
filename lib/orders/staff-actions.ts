import type { OrderData } from "@/lib/mock-orders";

/**
 * What staff see and can do with an order, which depends on how it leaves the
 * building. A delivery order goes out with a rider ("Delivering"); a take-out
 * or dine-in order waits for the customer ("Ready for Pick Up"). Showing
 * "Delivering" on a take-out order — and offering no way to finish it — was the
 * bug this module exists to prevent.
 *
 * Pure functions, shared by the order cards, the detail modal, the Orders page
 * and the KDS so the wording and the status each button writes can't drift.
 */

export type StaffAction = "Cancel" | "Confirm" | "Deliver" | "Ready" | "Complete";

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
 *   prep   -> Deliver (delivery) / Ready for pick up (take-out, dine-in)
 *   ready for pick up -> Picked up
 * A delivery that is out with a rider is finished by the rider, not by staff.
 */
export function primaryActionFor(
  order: Pick<OrderData, "status" | "isDelivery">,
): { type: StaffAction; label: string } | null {
  const delivery = order.isDelivery !== false;
  switch (order.status) {
    case "QUEUE":
      return { type: "Confirm", label: "Confirm" };
    case "PREP":
      return delivery
        ? { type: "Deliver", label: "Deliver" }
        : { type: "Ready", label: "Ready" };
    case "DELIVERY":
      return delivery ? null : { type: "Complete", label: "Picked Up" };
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
    case "Deliver":
      return "out_for_delivery";
    case "Ready":
      return "ready"; // preparing -> ready
    case "Complete":
      return "completed"; // ready -> completed
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
    case "Deliver":
      return {
        title: "Send out for delivery",
        description: `Mark order #${orderNumber} as out for delivery? A rider will be able to pick it up.`,
        confirm: "Yes, Send Out",
        done: `Order #${orderNumber} sent for delivery.`,
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
        description: `Has the customer picked up order #${orderNumber}?`,
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
