import { describe, expect, it } from "vitest";
import { computeCartTotals, type CartLine } from "./cart-totals";

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  id: "1",
  name: "Yangzhou Special",
  unitPrice: 180,
  quantity: 2,
  specialInstructions: null,
  ...overrides,
});

describe("computeCartTotals", () => {
  it("sums quantity times unit price across every line for the subtotal", () => {
    const totals = computeCartTotals({
      lines: [line({ unitPrice: 180, quantity: 2 }), line({ id: "2", unitPrice: 90, quantity: 1 })],
      fulfilment: "delivery",
    });
    expect(totals.subtotal).toBe(450); // 360 + 90
  });

  // The rule the frames imply and the ticket asks to state outright.
  it("applies the delivery fee for delivery using the shared delivery config", () => {
    const totals = computeCartTotals({ lines: [line()], fulfilment: "delivery", distanceKm: 2 });
    expect(totals.deliveryFee).toBe(70);
  });

  it("never drops below the minimum delivery fee", () => {
    const totals = computeCartTotals({ lines: [line()], fulfilment: "delivery", distanceKm: 0.1 });
    expect(totals.deliveryFee).toBe(51);
  });

  // The frame only ever draws the delivery case, which is exactly why this
  // is the one most likely to be missed if it weren't tested directly.
  it("charges no delivery fee for pickup", () => {
    const totals = computeCartTotals({ lines: [line()], fulfilment: "pickup" });
    expect(totals.deliveryFee).toBe(0);
  });

  it("adds subtotal and delivery fee for the total", () => {
    const totals = computeCartTotals({ lines: [line()], fulfilment: "delivery" });
    expect(totals.total).toBe(totals.subtotal + totals.deliveryFee);
  });

  it("totals an empty cart to zero", () => {
    const totals = computeCartTotals({ lines: [], fulfilment: "delivery" });
    expect(totals).toEqual({ subtotal: 0, deliveryFee: 0, total: 0 });
  });

  // The rule the ticket asks to state outright: money is handled so repeated
  // addition cannot drift. 0.1 + 0.2 !== 0.3 in floating point, and a price
  // like ₱299.99 is exactly the kind of value that triggers it — three of
  // them summed the naive way drift off the cent.
  it("does not drift when summing many fractional prices", () => {
    const totals = computeCartTotals({
      lines: [
        line({ id: "a", unitPrice: 10.1, quantity: 1 }),
        line({ id: "b", unitPrice: 10.2, quantity: 1 }),
        line({ id: "c", unitPrice: 10.3, quantity: 1 }),
      ],
      fulfilment: "pickup",
    });
    expect(totals.subtotal).toBe(30.6);
  });
});
