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
 * — it is "ready for pickup" and then "picked up".
 */
export type Fulfilment = "delivery" | "pickup";

export function fulfilmentOf(orderType: string | null | undefined): Fulfilment {
  return isPickupOrder(orderType) ? "pickup" : "delivery";
}

const PICKUP_STAGE_LABELS: Record<OrderStage, string> = {
  ...STAGE_LABELS,
  out_for_delivery: "Ready for pickup",
  delivered: "Picked up",
};

const PICKUP_STAGE_HEADLINES: Record<OrderStage, string> = {
  ...STAGE_HEADLINES,
  out_for_delivery: "READY FOR PICKUP",
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
  /** When the order reached this stage (ISO), or null if unknown / not yet. */
  reachedAt: string | null;
};

/** One `order_status_log` row, narrowed to what the timeline needs. */
export type StatusChange = { toStatus: string | null; changedAt: string };

/**
 * When the order first reached each stage, from `order_status_log` (#116).
 * Each row's status is resolved the same way as the live status, so every
 * spelling lands on the same stage. Unpaid and cancelled rows have no stage
 * and are skipped. Orders placed before the log existed have no rows, so
 * their stages have no time.
 */
export function stageReachedAt(
  log: StatusChange[],
  orderType?: string | null,
): Partial<Record<OrderStage, string>> {
  const reached: Partial<Record<OrderStage, string>> = {};
  for (const row of log) {
    const progress = resolveOrderProgress({
      orderStatus: row.toStatus,
      cancelledAt: null,
      deliveryStatus: null,
      orderType,
    });
    if (progress.kind !== "stage") continue;
    const earlier = reached[progress.stage];
    if (!earlier || Date.parse(row.changedAt) < Date.parse(earlier)) {
      reached[progress.stage] = row.changedAt;
    }
  }
  return reached;
}

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
  // lib/validation/orders.ts — the vocabulary the back office writes today,
  // plus `received`, retired in issue #118 but still read for old rows.
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
  // get it — the stage the timeline calls "Ready for pickup".
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
 * Older spellings (`received`, `pending_confirmation`) also resolve to the
 * "Order received" stage, but the backend only cancels `pending` — nothing
 * writes `received` any more (issue #118). Offering the button on the others
 * would show it and then fail, so the rule reads the status the stage was
 * resolved from, not the stage.
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
  reachedAt: Partial<Record<OrderStage, string>> = {},
): TimelineStage[] {
  const currentIndex =
    progress.kind === "stage" ? ORDER_STAGES.indexOf(progress.stage) : -1;
  const labels = fulfilment === "pickup" ? PICKUP_STAGE_LABELS : STAGE_LABELS;

  return ORDER_STAGES.map((stage, index) => {
    const state: StageState =
      index < currentIndex ? "done" : index === currentIndex ? "now" : "pending";
    return {
      stage,
      label: labels[stage],
      state,
      // A pending stage shows no time even if the log has one — the order
      // may have been moved back.
      reachedAt: state === "pending" ? null : (reachedAt[stage] ?? null),
    };
  });
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

/**
 * What a cancelled order shows its customer (P28, P50). A customer's own
 * cancel always writes the default reason below; anything else came from
 * staff, who are asked for a reason. Older kitchen cancels have none.
 *
 * The reason comes back separately so the screen can put it on its own line
 * (P54) — run into the sentence, it was hard to tell where it started.
 */
const CUSTOMER_CANCEL_REASON = "Customer requested cancellation";

/**
 * The reason an unpaid wallet order is cancelled with once its payment
 * window closes (issue #115) — by `expireAbandonedOrders` and by the
 * `expire_abandoned_orders()` sweep, which writes the same words. Not the
 * restaurant's doing, so it is not introduced as one.
 */
export const ABANDONED_PAYMENT_REASON =
  "Payment wasn't completed, so this order was cancelled. Nothing was charged.";

export function cancellationNoticeFor(reason: string | null): {
  message: string;
  reason: string | null;
} {
  const trimmed = reason?.trim();
  // The reason `cancelOrderSchema` writes when the customer cancels.
  if (trimmed === CUSTOMER_CANCEL_REASON) {
    return { message: "You cancelled this order.", reason: null };
  }
  if (trimmed === ABANDONED_PAYMENT_REASON) {
    return {
      message:
        "Payment wasn't completed in time, so this order was cancelled. Nothing was charged.",
      reason: null,
    };
  }
  if (!trimmed) {
    return {
      message:
        "The restaurant cancelled this order. Sorry about that — you can place a new order from the menu.",
      reason: null,
    };
  }
  return { message: "The restaurant cancelled this order.", reason: trimmed };
}

// ---------------------------------------------------------------------------
// Waiting for the store to accept (issue #115)
// ---------------------------------------------------------------------------

/**
 * How long an order may sit at `pending` — placed, not yet confirmed by
 * staff — before each thing happens. Counted from `order.pending_at`, when it
 * entered the kitchen queue (a wallet order only gets there once paid).
 *
 * The 20 is enforced by `expire_unaccepted_orders()` in the database
 * (20260928000009, run by pg_cron every 5 minutes); change both together.
 */
export const PENDING_FLASH_MINUTES = 5;
export const PENDING_WARN_MINUTES = 10;
export const PENDING_TIMEOUT_MINUTES = 20;

/** Whole minutes since `since`, or null when there is no timestamp. */
export function minutesSince(
  since: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!since) return null;
  const then = new Date(since).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, (now.getTime() - then) / 60_000);
}

/** Staff screens: has this order waited long enough to flash? */
export function isPendingTooLong(
  pendingAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const waited = minutesSince(pendingAt, now);
  return waited !== null && waited >= PENDING_FLASH_MINUTES;
}

export type PendingPrompt = "none" | "waiting" | "cancel-free";

/**
 * Tracking page: what to tell a customer whose order is still `pending`.
 * Nothing for the first 5 minutes, "waiting for the store" from 5, and
 * "the store hasn't confirmed — you can cancel for free" from 10.
 */
export function pendingPromptFor(
  orderStatus: string | null | undefined,
  pendingAt: string | null | undefined,
  now: Date = new Date(),
): PendingPrompt {
  if (orderStatus !== "pending") return "none";
  const waited = minutesSince(pendingAt, now);
  if (waited === null) return "none";
  if (waited >= PENDING_WARN_MINUTES) return "cancel-free";
  if (waited >= PENDING_FLASH_MINUTES) return "waiting";
  return "none";
}

// ---------------------------------------------------------------------------
// Refunds on a cancelled paid order (issue #115)
// ---------------------------------------------------------------------------

/** What the tracking page knows about how the order was paid. */
export type OrderPaymentSummary = {
  /** Paid through PayMongo (GCash / Maya), as opposed to at the counter. */
  paidOnline: boolean;
  /** The transaction's payment_status: paid, refund_pending, refunded, … */
  status: string | null;
  /** Pesos PayMongo took, or null when unknown. */
  amount: number | null;
};

/**
 * The refund summary from the tracking page's payment row
 * (`TrackedOrder.payment`): paid online means a PayMongo transaction that
 * money was actually taken on — paid, or somewhere in being refunded.
 */
export function paymentSummaryFrom(
  payment: { method: string | null; status: string | null; totalPaid: number } | null | undefined,
): OrderPaymentSummary | null {
  if (!payment) return null;
  const moneyTaken = ["paid", "refund_pending", "refunded", "refund_failed"];
  return {
    paidOnline: payment.method === "paymongo" && moneyTaken.includes(payment.status ?? ""),
    status: payment.status,
    amount: payment.totalPaid > 0 ? payment.totalPaid : null,
  };
}

/**
 * The line under a cancelled order's notice about the customer's money, or
 * null when there is nothing to say (never paid online, or paid at the
 * counter, where cash goes back by hand).
 *
 * A cancel that arrives over the realtime subscription carries no payment
 * row, so a paid online order that has just been cancelled reads as "being
 * refunded" even before the refund flag is seen — which is what the
 * database's trigger does in the same moment.
 */
export function refundNoticeFor(payment: OrderPaymentSummary | null | undefined): string | null {
  if (!payment?.paidOnline) return null;
  const amount =
    payment.amount !== null && payment.amount > 0
      ? `₱${payment.amount.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} `
      : "";

  switch (payment.status) {
    case "refunded":
      return `Your ${amount}GCash / Maya payment has been refunded. It may take a few days to show in your wallet.`;
    case "refund_failed":
      return `We couldn't refund your ${amount}payment automatically. The store has been notified and will refund you.`;
    default:
      return `Your ${amount}GCash / Maya payment is being refunded. It may take a few days to show in your wallet.`;
  }
}
