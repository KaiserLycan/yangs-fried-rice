import { describe, expect, it } from "vitest";
import { resolveOrderProgress } from "./order-stage";
import {
  DEFAULT_EXAMPLE_STATE,
  EXAMPLE_STATES,
  mockTrackedOrder,
} from "./mock-tracked-order";

/**
 * These examples are what the PM and the tester actually see on the preview
 * link, so it is worth knowing that each one reaches the state it claims to
 * — a fixture that quietly renders the wrong stage would send everyone
 * looking for a bug in the screen instead.
 */
describe("mockTrackedOrder", () => {
  it("puts every named example in the state its name promises", () => {
    const expected: Record<string, string> = {
      received: "received",
      preparing: "preparing",
      out_for_delivery: "out_for_delivery",
      delivered: "delivered",
    };

    for (const [example, stage] of Object.entries(expected)) {
      expect(resolveOrderProgress(mockTrackedOrder("id", example))).toEqual({
        kind: "stage",
        stage,
      });
    }

    expect(resolveOrderProgress(mockTrackedOrder("id", "cancelled"))).toEqual({
      kind: "cancelled",
    });
    expect(resolveOrderProgress(mockTrackedOrder("id", "unknown"))).toEqual({
      kind: "unknown",
    });
  });

  it("covers every state the switcher advertises", () => {
    for (const example of EXAMPLE_STATES) {
      expect(mockTrackedOrder("id", example)).toBeDefined();
    }
  });

  it("keeps the delivery stages disagreeing with order_status, as real rows do", () => {
    // Completing a delivery deliberately leaves order_status alone. An
    // example that tidied this up would hide the disagreement the adapter
    // exists to resolve.
    const delivered = mockTrackedOrder("id", "delivered");
    expect(delivered.orderStatus).toBe("preparing");
    expect(delivered.deliveryStatus).toBe("delivered");
  });

  it("falls back to the default for a missing, misspelled or repeated value", () => {
    const fallback = resolveOrderProgress(
      mockTrackedOrder("id", DEFAULT_EXAMPLE_STATE),
    );

    expect(resolveOrderProgress(mockTrackedOrder("id"))).toEqual(fallback);
    expect(resolveOrderProgress(mockTrackedOrder("id", "nonsense"))).toEqual(
      fallback,
    );
    // A repeated query parameter arrives as an array; the first wins.
    expect(
      resolveOrderProgress(mockTrackedOrder("id", ["preparing", "delivered"])),
    ).toEqual({ kind: "stage", stage: "preparing" });
  });

  it("accepts the spacings and casings someone would actually type", () => {
    for (const spelling of ["Out For Delivery", "out-for-delivery", " DELIVERED "]) {
      expect(
        resolveOrderProgress(mockTrackedOrder("id", spelling)),
      ).not.toEqual(resolveOrderProgress(mockTrackedOrder("id", "nonsense")));
    }
  });

  it("always carries through the order id it was given", () => {
    expect(mockTrackedOrder("abc-123", "delivered").orderId).toBe("abc-123");
  });
});
