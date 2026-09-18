import { describe, expect, it } from "vitest";
import { arrivalLineFor, arrivalWindowFrom } from "./arrival-window";

const eta = (arrivalWindow: string) => ({
  success: true,
  data: {
    orderId: "o",
    orderType: "delivery" as const,
    kitchenPrepMinutes: 15,
    transitMinutes: 15,
    totalEstimatedMinutes: 30,
    arrivalWindow,
    estimatedArrivalTimestamp: "2026-09-18T03:00:00.000Z",
    distanceKm: 2.4,
    activeOrdersAhead: 0,
    isDeliverable: true,
  },
});

describe("arrivalWindowFrom", () => {
  it("takes the engine's window", () => {
    expect(arrivalWindowFrom(eta("25–35 mins"))).toBe("25–35 mins");
  });

  it("is null when the call failed", () => {
    expect(arrivalWindowFrom({ success: false, error: "Order not found." })).toBeNull();
  });

  it("is null when the engine has nothing to estimate", () => {
    expect(arrivalWindowFrom(eta("None"))).toBeNull();
  });
});

describe("arrivalLineFor", () => {
  it("prefixes a bare delivery range", () => {
    expect(arrivalLineFor("25–35 mins")).toBe("Arriving 25–35 mins");
  });

  it("leaves a pickup sentence alone", () => {
    expect(arrivalLineFor("Ready in 20–30 mins")).toBe("Ready in 20–30 mins");
    expect(arrivalLineFor("Ready for pickup")).toBe("Ready for pickup");
  });

  it("falls back when there is no window", () => {
    expect(arrivalLineFor(null)).toBe("Arrival time to be confirmed");
  });
});
