import { describe, expect, it } from "vitest";
import {
  canRate,
  formatPlacedAt,
  formatTotal,
  isPast,
  isPickup,
  outcomeOf,
  primaryActionOf,
  summariseItems,
  totalOf,
  type PastOrder,
} from "./past-order";

const order = (overrides: Partial<PastOrder> = {}): PastOrder => ({
  orderId: "00000000-0000-0000-0000-000000001042",
  orderNumber: "1042",
  placedAt: "2026-08-24T11:12:00Z",
  orderStatus: "completed",
  cancelledAt: null,
  deliveryStatus: "delivered",
  orderType: "Delivery",
  items: [{ name: "Yangzhou Special", quantity: 2, productId: "1" }],
  total: 545,
  rating: 5,
  productRatings: {},
  ...overrides,
});

describe("isPickup", () => {
  it("recognises the spellings a free-text column can produce", () => {
    expect(isPickup("Pickup")).toBe(true);
    expect(isPickup("pick up")).toBe(true);
    expect(isPickup("PICK-UP")).toBe(true);
    expect(isPickup("take out")).toBe(true);
  });

  it("treats a delivery, an unknown type and NULL as not pickup", () => {
    expect(isPickup("Delivery")).toBe(false);
    expect(isPickup("courier")).toBe(false);
    expect(isPickup(null)).toBe(false);
  });
});

describe("isPast", () => {
  it("keeps a delivered order", () => {
    expect(isPast(order())).toBe(true);
  });

  it("keeps a cancelled order, which still belongs in a history", () => {
    expect(
      isPast(
        order({ orderStatus: "cancelled", cancelledAt: "2026-08-24T12:00:00Z" }),
      ),
    ).toBe(true);
  });

  it("drops an order still in flight — that is the tracking screen's job", () => {
    expect(
      isPast(order({ orderStatus: "preparing", deliveryStatus: null })),
    ).toBe(false);
  });

  it("drops an order nobody can read a status from", () => {
    expect(
      isPast(order({ orderStatus: null, deliveryStatus: null })),
    ).toBe(false);
  });
});

describe("outcomeOf", () => {
  it("says Delivered for a completed delivery", () => {
    expect(outcomeOf(order())).toEqual({ label: "Delivered", tone: "success" });
  });

  it("says Picked up for a completed pickup — the difference is the type, not the status", () => {
    expect(outcomeOf(order({ orderType: "Pickup" }))).toEqual({
      label: "Picked up",
      tone: "success",
    });
  });

  it("says Cancelled, and not in the green reserved for a good outcome", () => {
    expect(
      outcomeOf(
        order({ orderStatus: "cancelled", cancelledAt: "2026-08-24T12:00:00Z" }),
      ),
    ).toEqual({ label: "Cancelled", tone: "muted" });
  });

  it("does not claim an unreadable status was delivered", () => {
    expect(
      outcomeOf(order({ orderStatus: "sizzling", deliveryStatus: null })),
    ).toEqual({ label: "Status unavailable", tone: "muted" });
  });
});

describe("canRate", () => {
  it("offers a rating on a delivered order that has none", () => {
    expect(canRate(order({ rating: null }))).toBe(true);
  });

  it("does not offer a second rating once one exists", () => {
    expect(canRate(order({ rating: 4 }))).toBe(false);
  });

  it("does not offer a rating on a cancelled order — there is nothing to rate", () => {
    expect(
      canRate(
        order({
          rating: null,
          orderStatus: "cancelled",
          cancelledAt: "2026-08-24T12:00:00Z",
        }),
      ),
    ).toBe(false);
  });
});

describe("primaryActionOf", () => {
  it("asks for a rating when one is missing", () => {
    expect(primaryActionOf(order({ rating: null }))).toBe("rate");
  });

  it("offers a reorder once the order has been rated", () => {
    expect(primaryActionOf(order({ rating: 5 }))).toBe("reorder");
  });

  it("offers a reorder on a pickup order — pickup does not withhold it", () => {
    expect(primaryActionOf(order({ orderType: "Pickup", rating: 4 }))).toBe(
      "reorder",
    );
  });

  it("offers a reorder on a cancelled order", () => {
    expect(
      primaryActionOf(
        order({
          rating: null,
          orderStatus: "cancelled",
          cancelledAt: "2026-08-24T12:00:00Z",
        }),
      ),
    ).toBe("reorder");
  });
});

describe("summariseItems", () => {
  it("writes the line the frames draw", () => {
    expect(
      summariseItems([
        { name: "Yangzhou Special", quantity: 2, productId: "1" },
        { name: "Lumpia (5pc)", quantity: 1, productId: "7" },
      ]),
    ).toBe("2× Yangzhou Special, 1× Lumpia (5pc)");
  });

  it("says so rather than rendering an empty line", () => {
    expect(summariseItems([])).toBe("No items recorded");
  });
});

describe("formatPlacedAt", () => {
  it("writes an evening order in Manila time, as the frames do", () => {
    // 11:12 UTC is 19:12 in Manila.
    expect(formatPlacedAt("2026-08-24T11:12:00Z")).toBe("Aug 24, 7:12 PM");
  });

  it("pads the day, so Aug 09 lines up with Aug 24", () => {
    expect(formatPlacedAt("2026-08-09T12:04:00Z")).toBe("Aug 09, 8:04 PM");
  });

  it("does not print Invalid Date at a customer", () => {
    expect(formatPlacedAt(null)).toBe("Date unavailable");
    expect(formatPlacedAt("whenever")).toBe("Date unavailable");
  });
});

describe("totalOf", () => {
  it("sums the items and adds the delivery fee", () => {
    expect(
      totalOf(
        [
          { quantity: 2, subtotal: 360 },
          { quantity: 1, subtotal: 90 },
        ],
        95,
        "Delivery",
      ),
    ).toBe(545);
  });

  it("charges no delivery fee on a pickup, even when the column holds one", () => {
    expect(totalOf([{ quantity: 1, subtotal: 230 }], 95, "Pickup")).toBe(230);
  });

  it("sums in centavos so repeated addition cannot drift", () => {
    expect(
      totalOf(
        [
          { quantity: 1, subtotal: 10.1 },
          { quantity: 1, subtotal: 10.2 },
          { quantity: 1, subtotal: 10.3 },
        ],
        null,
        "Delivery",
      ),
    ).toBe(30.6);
  });
});

describe("formatTotal", () => {
  it("writes whole pesos, matching every other price in the flow", () => {
    expect(formatTotal(545)).toBe("₱545");
  });
});
