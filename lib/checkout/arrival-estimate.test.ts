import { describe, it, expect } from "vitest";
import { quoteArrivalWindow } from "./arrival-estimate";
import {
  BASE_KITCHEN_PREP_MINUTES,
  DEFAULT_TRANSIT_MINUTES,
  MAX_KITCHEN_PREP_MINUTES,
  arrivalWindowBounds,
  calculateOrderEta,
} from "@/lib/eta/engine";

/**
 * Issue #106: checkout printed `ARRIVAL_ESTIMATE = "35–45 min"`, a figure
 * nothing computed, one screen away from a real ETA engine that was
 * computing a genuine window for the very same order.
 */
describe("quoteArrivalWindow", () => {
  it("gets longer as the kitchen gets busier", () => {
    const quiet = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 0,
      distanceKm: 3,
    });
    const busy = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 8,
      distanceKm: 3,
    });

    expect(quiet).not.toBe(busy);
    expect(minutesIn(busy)[0]).toBeGreaterThan(minutesIn(quiet)[0]);
  });

  it("gets longer the further the food has to travel", () => {
    const near = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 2,
      distanceKm: 1,
    });
    const far = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 2,
      distanceKm: 12,
    });

    expect(minutesIn(far)[0]).toBeGreaterThan(minutesIn(near)[0]);
  });

  it("drops the travel time entirely for a pickup", () => {
    const pickup = quoteArrivalWindow({
      fulfilment: "pickup",
      activeOrdersAhead: 0,
      distanceKm: 12,
    });

    const { lower, upper } = arrivalWindowBounds(BASE_KITCHEN_PREP_MINUTES);
    expect(pickup).toBe(`${lower}–${upper} min`);
  });

  /**
   * The cart rail on `/menu` has geocoded nothing — there is no address on
   * that screen. A missing distance falls back to the engine's default
   * rather than refusing to quote.
   */
  it("still quotes when the distance is unknown", () => {
    const quote = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 0,
      distanceKm: null,
    });

    const { lower, upper } = arrivalWindowBounds(
      BASE_KITCHEN_PREP_MINUTES + DEFAULT_TRANSIT_MINUTES,
    );
    expect(quote).toBe(`${lower}–${upper} min`);
  });

  it("inherits the engine's cap, so a backed-up kitchen cannot quote hours", () => {
    const swamped = quoteArrivalWindow({
      fulfilment: "pickup",
      activeOrdersAhead: 500,
    });

    expect(minutesIn(swamped)[1]).toBeLessThanOrEqual(
      MAX_KITCHEN_PREP_MINUTES + 5,
    );
  });

  /**
   * The whole point of the change: the number a customer agrees to at
   * checkout and the number they are shown on tracking a moment later are
   * produced by the same arithmetic, on the same inputs.
   */
  it("agrees with the tracking engine given the same queue and distance", () => {
    const quote = quoteArrivalWindow({
      fulfilment: "delivery",
      activeOrdersAhead: 4,
      distanceKm: null,
    });

    const tracked = calculateOrderEta({
      orderId: "order-1",
      orderType: "delivery",
      activeOrdersAhead: 4,
      // Unknown on both sides, so the two calls are working from the same
      // journey. A known distance is not comparable here: the engine takes
      // coordinates and derives the distance itself.
      customerCoordinates: null,
      orderStatus: "pending",
    });

    // The engine says "mins" and prefixes nothing for a delivery; the quote
    // says "min" because it sits inside the checkout frames' own sentence.
    expect(minutesIn(quote)).toEqual(minutesIn(tracked.arrivalWindow));
  });
});

/** The two numbers in "25–35 min" / "25–35 mins" / "Ready in 25–35 mins". */
function minutesIn(window: string): [number, number] {
  const match = window.match(/(\d+)\s*–\s*(\d+)/);
  if (!match) throw new Error(`No range in "${window}"`);
  return [Number(match[1]), Number(match[2])];
}
