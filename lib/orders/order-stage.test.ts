import { describe, expect, it } from "vitest";
import {
  CANCELLED_HEADLINE,
  UNKNOWN_HEADLINE,
  headlineFor,
  isCancellable,
  resolveOrderProgress,
  timelineStages,
  type OrderStageInput,
} from "./order-stage";

/**
 * These are the tests ticket 06 asks for, and the reason it asks is that this
 * module is the only thing standing between four disagreeing status
 * vocabularies and the screen. Every case below is a string some part of the
 * system either writes today or is documented as writing.
 */
function input(over: Partial<OrderStageInput> = {}): OrderStageInput {
  return {
    orderStatus: null,
    cancelledAt: null,
    deliveryStatus: null,
    ...over,
  };
}

describe("resolveOrderProgress", () => {
  it("reads the vocabulary the back office actually writes", () => {
    expect(resolveOrderProgress(input({ orderStatus: "received" }))).toEqual({
      kind: "stage",
      stage: "received",
      orderStatus: "received",
    });
    expect(resolveOrderProgress(input({ orderStatus: "preparing" }))).toEqual({
      kind: "stage",
      stage: "preparing",
      orderStatus: "preparing",
    });
    expect(
      resolveOrderProgress(input({ orderStatus: "out_for_delivery" })),
    ).toEqual({
      kind: "stage",
      stage: "out_for_delivery",
      orderStatus: "out_for_delivery",
    });
    expect(resolveOrderProgress(input({ orderStatus: "completed" }))).toEqual({
      kind: "stage",
      stage: "delivered",
      orderStatus: "completed",
    });
  });

  it("reads schema.sql's and storage_draft.md's spellings too", () => {
    expect(
      resolveOrderProgress(input({ orderStatus: "pending_confirmation" })),
    ).toEqual({
      kind: "stage",
      stage: "received",
      orderStatus: "pending_confirmation",
    });
    expect(resolveOrderProgress(input({ orderStatus: "Pending" }))).toEqual({
      kind: "stage",
      stage: "received",
      orderStatus: "pending",
    });
    expect(resolveOrderProgress(input({ orderStatus: "Confirmed" }))).toEqual({
      kind: "stage",
      stage: "preparing",
      orderStatus: "confirmed",
    });
    expect(resolveOrderProgress(input({ orderStatus: "Preparing" }))).toEqual({
      kind: "stage",
      stage: "preparing",
      orderStatus: "preparing",
    });
  });

  it("folds spacing and casing onto one stage", () => {
    for (const spelling of [
      "Out For Delivery",
      "out-for-delivery",
      "  OUT_FOR_DELIVERY  ",
    ]) {
      expect(resolveOrderProgress(input({ orderStatus: spelling }))).toEqual({
        kind: "stage",
        stage: "out_for_delivery",
        orderStatus: "out_for_delivery",
      });
    }
  });

  it("lets the delivery row carry the order past what order_status says", () => {
    // The normal case, not an edge one: completing a delivery deliberately
    // leaves order_status alone, so the two rows disagree by design.
    expect(
      resolveOrderProgress(
        input({ orderStatus: "preparing", deliveryStatus: "delivered" }),
      ),
    ).toEqual({ kind: "stage", stage: "delivered", orderStatus: "preparing" });
  });

  it("keeps the further-along of the two rows, whichever that is", () => {
    expect(
      resolveOrderProgress(
        input({ orderStatus: "completed", deliveryStatus: "in_transit" }),
      ),
    ).toEqual({ kind: "stage", stage: "delivered", orderStatus: "completed" });
  });

  it("treats a cancellation timestamp as outranking any status string", () => {
    expect(
      resolveOrderProgress(
        input({ orderStatus: "preparing", cancelledAt: "2026-09-13T02:00:00Z" }),
      ),
    ).toEqual({ kind: "cancelled" });
  });

  it("accepts both spellings of cancelled from the status column", () => {
    expect(resolveOrderProgress(input({ orderStatus: "cancelled" }))).toEqual({
      kind: "cancelled",
    });
    expect(resolveOrderProgress(input({ orderStatus: "canceled" }))).toEqual({
      kind: "cancelled",
    });
  });

  it("routes NULL, empty and unrecognised statuses to unknown", () => {
    expect(resolveOrderProgress(input())).toEqual({ kind: "unknown" });
    expect(resolveOrderProgress(input({ orderStatus: "   " }))).toEqual({
      kind: "unknown",
    });
    expect(
      resolveOrderProgress(input({ orderStatus: "awaiting_courier_pigeon" })),
    ).toEqual({ kind: "unknown" });
  });
});

describe("isCancellable", () => {
  /** A stage with the normalised status that put it there. */
  function stage(orderStatus: string | null, stageName: "received" | "preparing" | "out_for_delivery" | "delivered" = "received") {
    return { kind: "stage", stage: stageName, orderStatus } as const;
  }

  it("allows cancelling only while the order is still pending", () => {
    expect(isCancellable(stage("pending"))).toBe(true);
  });

  it("does not offer it for schema.sql's pending_confirmation, which the backend rejects", () => {
    // Same stage on the timeline, but `cancelCustomerOrder` accepts exactly
    // `pending`. Offering the button here would show it and then fail.
    expect(isCancellable(stage("pending_confirmation"))).toBe(false);
  });

  it("does not offer it once the delivery row has carried the order past received", () => {
    // The two rows disagree by design. An order row still reading pending
    // with a delivery already out must not be cancellable from the screen.
    expect(isCancellable(stage("pending", "out_for_delivery"))).toBe(false);
    expect(isCancellable(stage("pending", "delivered"))).toBe(false);
  });

  it("does not offer it once staff have accepted, even though the stage is still received", () => {
    // Ticket 15, decision A. `received` is the back office's "accepted"
    // status, and the backend rejects a cancel for it — so the button would
    // show and then fail.
    expect(isCancellable(stage("received"))).toBe(false);
  });

  it("does not offer it past the received stage", () => {
    expect(isCancellable(stage("preparing", "preparing"))).toBe(false);
    expect(isCancellable(stage("confirmed", "preparing"))).toBe(false);
    expect(isCancellable(stage("preparing", "out_for_delivery"))).toBe(false);
    expect(isCancellable(stage("completed", "delivered"))).toBe(false);
  });

  it("offers no cancel control for a cancelled or unreadable order", () => {
    expect(isCancellable({ kind: "cancelled" })).toBe(false);
    expect(isCancellable({ kind: "unknown" })).toBe(false);
    // A stage read from the delivery row alone has no order status to check.
    expect(isCancellable(stage(null, "delivered"))).toBe(false);
  });
});

describe("timelineStages", () => {
  it("marks earlier stages done, the current one now, and the rest pending", () => {
    expect(
      timelineStages({ kind: "stage", stage: "preparing", orderStatus: "preparing" }).map((s) => s.state),
    ).toEqual(["done", "now", "pending", "pending"]);
  });

  it("marks the first stage now when the order has just been received", () => {
    expect(
      timelineStages({ kind: "stage", stage: "received", orderStatus: "pending" }).map((s) => s.state),
    ).toEqual(["now", "pending", "pending", "pending"]);
  });

  it("marks everything done but the last when the order has been delivered", () => {
    expect(
      timelineStages({ kind: "stage", stage: "delivered", orderStatus: "completed" }).map((s) => s.state),
    ).toEqual(["done", "done", "done", "now"]);
  });

  it("still renders four pending stages for cancelled and unknown orders", () => {
    for (const progress of [{ kind: "cancelled" }, { kind: "unknown" }] as const) {
      const states = timelineStages(progress).map((s) => s.state);
      expect(states).toEqual(["pending", "pending", "pending", "pending"]);
    }
  });

  it("always names all four stages in order", () => {
    expect(
      timelineStages({ kind: "unknown" }).map((s) => s.label),
    ).toEqual([
      "Order received",
      "Preparing in kitchen",
      "Out for delivery",
      "Delivered",
    ]);
  });
});

describe("headlineFor", () => {
  it("uses the copy the frames draw for the two stages they draw", () => {
    expect(headlineFor({ kind: "stage", stage: "received", orderStatus: "pending" })).toBe(
      "WAITING FOR THE KITCHEN",
    );
    expect(headlineFor({ kind: "stage", stage: "preparing", orderStatus: "preparing" })).toBe(
      "IN THE WOK NOW",
    );
  });

  it("has a headline for every state, including the two siblings", () => {
    expect(headlineFor({ kind: "cancelled" })).toBe(CANCELLED_HEADLINE);
    expect(headlineFor({ kind: "unknown" })).toBe(UNKNOWN_HEADLINE);
    expect(headlineFor({ kind: "stage", stage: "delivered", orderStatus: "completed" })).not.toBe("");
  });
});
