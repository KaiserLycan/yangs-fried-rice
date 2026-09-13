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
 *
 * TODO (PM): the four marked below need real copy in the same voice as the
 * two that are drawn. They are all in this one map so replacing them is a
 * one-file change.
 */
export const STAGE_HEADLINES: Record<OrderStage, string> = {
  received: "WAITING FOR THE KITCHEN",
  preparing: "IN THE WOK NOW",
  out_for_delivery: "OUT FOR DELIVERY", // TODO (PM): needs real copy
  delivered: "DELIVERED", // TODO (PM): needs real copy
};

/** TODO (PM): needs real copy. */
export const CANCELLED_HEADLINE = "ORDER CANCELLED";

/** TODO (PM): needs real copy. */
export const UNKNOWN_HEADLINE = "CHECKING THIS ORDER";

/**
 * Where an order is right now. `cancelled` and `unknown` are siblings of the
 * four stages rather than stages themselves: neither appears on the timeline,
 * and both change what the rest of the screen may show.
 */
export type OrderProgress =
  | { kind: "stage"; stage: OrderStage }
  | { kind: "cancelled" }
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
 *
 * TODO (Backend): confirm which string marks a delivery as on its way. If it
 * is none of these, the screen will sit on "Preparing in kitchen" until the
 * delivery completes.
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

  const fromOrder = ORDER_STATUS_STAGES[normaliseStatus(input.orderStatus) ?? ""];
  if (fromOrder === "cancelled") return { kind: "cancelled" };

  const fromDelivery =
    DELIVERY_STATUS_STAGES[normaliseStatus(input.deliveryStatus) ?? ""];

  const stage = furtherAlong(fromOrder ?? null, fromDelivery ?? null);
  return stage === null ? { kind: "unknown" } : { kind: "stage", stage };
}

/**
 * The boundary the mobile frames draw: Cancel order is present while "Order
 * received" is current, and is replaced — not disabled — the moment the
 * kitchen confirms. An unknown or cancelled order offers no cancel control,
 * for different reasons: one is already cancelled, and the other is a state
 * we cannot reason about.
 */
export function isCancellable(progress: OrderProgress): boolean {
  return progress.kind === "stage" && progress.stage === "received";
}

/**
 * The four rows of the timeline with their Done / Now / — state.
 *
 * A cancelled or unknown order still renders all four, all pending: the
 * design has no cancelled timeline, and blanking the list would leave the
 * screen with nothing where its main content belongs.
 */
export function timelineStages(progress: OrderProgress): TimelineStage[] {
  const currentIndex =
    progress.kind === "stage" ? ORDER_STAGES.indexOf(progress.stage) : -1;

  return ORDER_STAGES.map((stage, index) => ({
    stage,
    label: STAGE_LABELS[stage],
    state:
      index < currentIndex ? "done" : index === currentIndex ? "now" : "pending",
  }));
}

export function headlineFor(progress: OrderProgress): string {
  if (progress.kind === "cancelled") return CANCELLED_HEADLINE;
  if (progress.kind === "unknown") return UNKNOWN_HEADLINE;
  return STAGE_HEADLINES[progress.stage];
}
