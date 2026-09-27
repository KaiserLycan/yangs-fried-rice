import { describe, expect, it } from "vitest";
import {
  computeCartTotals,
  seniorPwdBreakdown,
  vatBreakdown,
  type CartLine,
  dishQuantityInCart,
} from "./cart-totals";

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
    expect(totals).toEqual({ subtotal: 0, deliveryFee: 0, total: 0, vatableSales: 0, vat: 0 });
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

describe("vatBreakdown", () => {
  it("takes the 12% VAT out of the total rather than adding it", () => {
    expect(vatBreakdown(112)).toEqual({ vatableSales: 100, vat: 12 });
  });

  it("always adds back to the total, to the centavo", () => {
    for (const total of [0.14, 1, 99.99, 180, 459, 1234.56]) {
      const { vatableSales, vat } = vatBreakdown(total);
      expect(Math.round((vatableSales + vat) * 100)).toBe(Math.round(total * 100));
    }
  });

  // Same rounding as round(total * 12 / 112, 2) in submit_cart_to_order.
  it("rounds VAT to the nearest centavo, half up", () => {
    expect(vatBreakdown(0.14).vat).toBe(0.02); // 1.5 centavos
    expect(vatBreakdown(459).vat).toBe(49.18); // 49.178…
  });

  it("is carried on the cart totals", () => {
    const totals = computeCartTotals({ lines: [line({ unitPrice: 56, quantity: 2 })], fulfilment: "pickup" });
    expect(totals).toMatchObject({ total: 112, vatableSales: 100, vat: 12 });
  });
});

describe("seniorPwdBreakdown", () => {
  it("drops the VAT, then takes 20% off", () => {
    expect(seniorPwdBreakdown(112)).toEqual({ vatExemptSales: 100, discount: 20, total: 80 });
  });

  it("always adds back: exempt sales minus discount is the total", () => {
    for (const total of [0.14, 1, 99.99, 180, 459, 1234.56]) {
      const { vatExemptSales, discount, total: due } = seniorPwdBreakdown(total);
      expect(Math.round((vatExemptSales - discount) * 100)).toBe(Math.round(due * 100));
    }
  });

  // Same rounding as round(total * 100 / 112, 2) in submit_cart_to_order.
  it("rounds to the centavo, half up", () => {
    expect(seniorPwdBreakdown(0.14).vatExemptSales).toBe(0.13); // 12.5 centavos
    expect(seniorPwdBreakdown(459)).toEqual({ vatExemptSales: 409.82, discount: 81.96, total: 327.86 });
  });
});

describe("dishQuantityInCart (issue #115)", () => {
  const dish = { id: "p-1", name: "Yang's Halo-Halo" };
  const product = { id: "p-1", name: "Yang's Halo-Halo" } as never;

  it("adds up every line of the dish, notes or not", () => {
    expect(
      dishQuantityInCart(
        [
          { id: "a", name: dish.name, unitPrice: 120, quantity: 13, specialInstructions: null, product },
          { id: "b", name: dish.name, unitPrice: 120, quantity: 10, specialInstructions: "less ice", product },
          { id: "c", name: "Bottled Water", unitPrice: 30, quantity: 5, specialInstructions: null, product: { id: "p-2", name: "Bottled Water" } as never },
        ],
        dish,
      ),
    ).toBe(23);
  });

  it("matches an optimistic line (no product yet) by name", () => {
    expect(
      dishQuantityInCart(
        [{ id: "optimistic-1", name: dish.name, unitPrice: 120, quantity: 2, specialInstructions: null }],
        dish,
      ),
    ).toBe(2);
  });
});
