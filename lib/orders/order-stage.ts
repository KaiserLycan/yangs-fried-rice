/**
 * The one place that turns stored status strings into the four stages the
 * tracking screen draws. Nothing outside this module reads a raw status —
 * that is the rule ticket 06 sets, and the reason is that there is no single
 * agreed vocabulary to read.
 *
 * FOUR written-down vocabularies exist and none of them agree:
 *
 *   - `lib/validation/orders.ts` — received, preparing, out_for_delivery,
 *     completed, cancelled. This is the one the back office actually writes
 *     (`lib/actions/orders.ts` validates against it), so it is treated as
 *     primary here. Ticket 06 predates it and does not mention it.
 *   - `supabase/schema.sql` — pending_confirmation, confirmed, cancelled.
 *     CLAUDE.md says not to trust this file.
 *   - `docs/reference/storage_draft.md` — Pending, Confirmed, Preparing,
 *     Completed. Draft status.
 *   - The live database — `order_status` is nullable free text with no
 *     constraint, so any string, including NULL, can arrive.
 *
 * Every spelling any of them uses is accepted below. Anything else, and NULL,
 * resolves to `unknown` rather than to a guessed stage — with a free-text
 * nullable column that is a value which will genuinely show up, not a
 * defensive edge case.
 *
 * The stages are not all read from one column. `lib/actions/delivery.ts`
 * says so directly where it marks a delivery delivered: it "deliberately does
 * NOT touch order.order_status — that field is shared." So stages 1 and 2
 * come from the order row and stages 3 and 4 from its delivery row, and
 * whichever of the two is further along wins.
 */

import { isPickupOrder } from "@/lib/orders/format";
import { isUnpaidStatus } from "@/lib/validation/orders";

export const ORDER_STAGES = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
] as const;

export type OrderStage = (typeof ORDER_STAGES)[number];

/** Neutral, fixed labels — these are what the timeline draws. */
export const STAGE_LABELS: Record<OrderStage, string> = {
  received: "Order received",
  preparing: "Preparing in kitchen",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

/**
 * The headline is editorial copy in the restaurant's voice, and it is NOT the
 * timeline label — the frames deliberately use different words in the two
 * places.
 *
 * Only two of the six are drawn: `received` (frame 132:481) and `preparing`
 * (frame 132:543). The rest fall back to the neutral stage wording rather
 * than to invented restaurant-voice copy, because inventing it silently is
 * exactly what ticket 06 rules out.
 */
export const STAGE_HEADLINES: Record<OrderStage, string> = {
  received: "WAITING FOR THE KITCHEN",
  preparing: "IN THE WOK NOW",
  out_for_delivery: "OUT FOR DELIVERY",
  delivered: "DELIVERED",
};


/**
 * How the order reaches the customer. The four stages are the same; only the
 * words for the last two change. A take-out order is never "out for delivery"
 * — it is "ready for pick up" and then "picked up".
 */
export type Fulfilment = "delivery" | "pickup";

export function fulfilmentOf(orderType: string | null | undefined): Fulfilment {
  return isPickupOrder(orderType) ? "pickup" : "delivery";
}

const PICKUP_STAGE_LABELS: Record<OrderStage, string> = {
  ...STAGE_LABELS,
  out_for_delivery: "Ready for pick up",
  delivered: "Picked up",
};

const PICKUP_STAGE_HEADLINES: Record<OrderStage, string> = {
  ...STAGE_HEADLINES,
  out_for_delivery: "READY FOR PICK UP",
  delivered: "PICKED UP",
};

export const CANCELLED_HEADLINE = "ORDER CANCELLED";


export const UNKNOWN_HEADLINE = "CHECKING THIS ORDER";

export const UNPAID_HEADLINE = "WAITING FOR PAYMENT";

/**
 * Where an order is right now. `cancelled` and `unknown` are siblings of the
 * four stages rather than stages themselves: neither appears on the timeline,
 * and both change what the rest of the screen may show.
 */
export type OrderProgress =
  | {
      kind: "stage";
      stage: OrderStage;
      /**
       * The order row's status after folding, or null when the stage came
       * from the delivery row alone. Carried because one rule — whether the
       * order can still be cancelled — is drawn at a line finer than the
       * four stages, and the timeline must not move to accommodate it. It
       * is a value for `isCancellable`, not for components to switch on.
       */
      orderStatus: string | null;
    }
  | { kind: "cancelled" }
  /**
   * Placed, but nobody has paid for it yet — a wallet order whose payment
   * was abandoned or refused. Its own kind rather than a stage, because it
   * is not on the timeline and it is not `unknown`: we know exactly what is
   * wrong with it and exactly what the customer can do about it.
   *
   * `orderStatus` is carried so the card can tell "waiting" from "failed",
   * the only place that distinction is worth words.
   */
  | { kind: "unpaid"; orderStatus: string }
  | { kind: "unknown" };

/** Done, current, or not yet reached. Drawn as "Done" / "Now" / "—". */
export type StageState = "done" | "now" | "pending";

export type TimelineStage = {
  stage: OrderStage;
  label: string;
  state: StageState;
};

/**
 * The two rows this screen reads, narrowed to the columns it uses. Taking the
 * fields rather than the whole `Tables<"order">` keeps the module callable
 * from tests without standing up a full row.
 */
export type OrderStageInput = {
  orderStatus: string | null;
  cancelledAt: string | null;
  deliveryStatus: string | null;
  /**
   * `order.order_type`. Optional: without it the order is read as a delivery,
   * which is what every caller did before take-out had a stage of its own.
   */
  orderType?: string | null;
};

/**
 * Statuses are compared after being folded to a single spelling: trimmed,
 * lowercased, and with spaces and hyphens turned into underscores. That is
 * what lets "Out For Delivery", "out-for-delivery" and "out_for_delivery" all
 * land on the same stage without listing each spelling separately.
 */
function normaliseStatus(value: string | null): string | null {
  if (value === null) return null;
  const folded = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return folded === "" ? null : folded;
}

const ORDER_STATUS_STAGES: Record<string, OrderStage | "cancelled"> = {
  // lib/validation/orders.ts — the vocabulary the back office writes today.
  received: "received",
  preparing: "preparing",
  ready: "preparing", // Ready for pickup/dispatch is functionally still 'preparing' in the 4-step UI
  out_for_delivery: "out_for_delivery",
  completed: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled", // one-l spelling, seen in components/manage
  // supabase/schema.sql.
  pending_confirmation: "received",
  confirmed: "preparing",
  // docs/reference/storage_draft.md. "Preparing" and "Completed" fold onto
  // the entries above once lowercased.
  pending: "received",
};

/**
 * Only `delivered` is confirmed — `lib/actions/delivery.ts` writes that exact
 * string when a rider completes a delivery. The in-flight spellings below are
 * accepted on the same reasoning as the order vocabulary: the column is free
 * text, so tolerating the plausible spellings costs nothing, and anything
 * unrecognised still falls through to `unknown`.
 */
const DELIVERY_STATUS_STAGES: Record<string, OrderStage> = {
  delivered: "delivered",
  completed: "delivered",
  out_for_delivery: "out_for_delivery",
  in_transit: "out_for_delivery",
  picked_up: "out_for_delivery",
  on_the_way: "out_for_delivery",
};

/**
 * Which of the two rows is further along. Stage order is the array order, so
 * a delivery marked delivered beats an order row still reading "preparing" —
 * which is the normal state of affairs, since completing a delivery
 * deliberately leaves `order_status` alone.
 */
function furtherAlong(a: OrderStage | null, b: OrderStage | null) {
  if (a === null) return b;
  if (b === null) return a;
  return ORDER_STAGES.indexOf(a) >= ORDER_STAGES.indexOf(b) ? a : b;
}

export function resolveOrderProgress(input: OrderStageInput): OrderProgress {
  // A cancellation timestamp outranks every status string. The column is
  // written when the cancellation happens, so its presence is a fact rather
  // than a vocabulary question.
  if (input.cancelledAt !== null) return { kind: "cancelled" };

  const orderStatus = normaliseStatus(input.orderStatus);

  // Checked before any stage lookup, and deliberately not in
  // ORDER_STATUS_STAGES: an unpaid order has no stage. The kitchen has not
  // seen it, so calling it "received" would be a lie, and letting it fall
  // through to `unknown` would offer the customer a Track link for food
  // nobody has paid for (issue #106).
  if (isUnpaidStatus(orderStatus)) {
    return { kind: "unpaid", orderStatus: orderStatus as string };
  }

  let fromOrder = ORDER_STATUS_STAGES[orderStatus ?? ""];
  if (fromOrder === "cancelled") return { kind: "cancelled" };

  // For a delivery, "ready" is still the kitchen's business (see the table
  // above). For a take-out order it is the moment the customer can come and
  // get it — the stage the timeline calls "Ready for pick up".
  if (orderStatus === "ready" && isPickupOrder(input.orderType)) {
    fromOrder = "out_for_delivery";
  }

  const fromDelivery =
    DELIVERY_STATUS_STAGES[normaliseStatus(input.deliveryStatus) ?? ""];

  const stage = furtherAlong(fromOrder ?? null, fromDelivery ?? null);
  return stage === null
    ? { kind: "unknown" }
    : { kind: "stage", stage, orderStatus };
}

/**
 * The one status `cancelCustomerOrder` (`lib/actions/cart.ts`) will accept.
 * schema.sql's `pending_confirmation` folds onto the same stage above but is
 * deliberately not here: the backend rejects it, and offering a button that
 * then fails is the exact thing this rule exists to prevent.
 */
const CANCELLABLE_STATUS = "pending";

/**
 * The boundary the mobile frames draw: Cancel order is present while "Order
 * received" is current, and is replaced — not disabled — the moment the
 * kitchen confirms. An unknown or cancelled order offers no cancel control,
 * for different reasons: one is already cancelled, and the other is a state
 * we cannot reason about.
 *
 * The line is drawn one notch finer than the stage (ticket 15, decision A).
 * The back office writes `received` when staff accept an order, and the
 * timeline shows that as "Order received" still — but the backend refuses to
 * cancel it. Offering the button there would show it and then fail, so the
 * rule reads the status the stage was resolved from, not the stage.
 */
export function isCancellable(progress: OrderProgress): boolean {
  // Both checks are needed. The delivery row can carry the stage past
  // "received" while the order row still says pending — and a dispatched
  // order must not be offered for cancelling just because the backend's
  // status check would let it through.
  return (
    progress.kind === "stage" &&
    progress.stage === "received" &&
    progress.orderStatus === CANCELLABLE_STATUS
  );
}

/**
 * The four rows of the timeline with their Done / Now / — state.
 *
 * A cancelled or unknown order still renders all four, all pending: the
 * design has no cancelled timeline, and blanking the list would leave the
 * screen with nothing where its main content belongs.
 */
export function timelineStages(
  progress: OrderProgress,
  fulfilment: Fulfilment = "delivery",
): TimelineStage[] {
  const currentIndex =
    progress.kind === "stage" ? ORDER_STAGES.indexOf(progress.stage) : -1;
  const labels = fulfilment === "pickup" ? PICKUP_STAGE_LABELS : STAGE_LABELS;

  return ORDER_STAGES.map((stage, index) => ({
    stage,
    label: labels[stage],
    state:
      index < currentIndex ? "done" : index === currentIndex ? "now" : "pending",
  }));
}

export function headlineFor(
  progress: OrderProgress,
  fulfilment: Fulfilment = "delivery",
): string {
  if (progress.kind === "cancelled") return CANCELLED_HEADLINE;
  if (progress.kind === "unpaid") return UNPAID_HEADLINE;
  if (progress.kind === "unknown") return UNKNOWN_HEADLINE;
  const headlines =
    fulfilment === "pickup" ? PICKUP_STAGE_HEADLINES : STAGE_HEADLINES;
  return headlines[progress.stage];
}
