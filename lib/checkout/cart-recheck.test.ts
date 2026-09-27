import { describe, expect, it } from "vitest";
import {
  compareCart,
  hasCartProblems,
  lineFlagsFor,
} from "@/lib/checkout/cart-recheck";

const live = [
  { id: "a", name: "Yangzhou Special", unitPrice: 180, available: true },
  { id: "b", name: "Spicy Garlic Chicken", unitPrice: 210, available: false },
  { id: "c", name: "Beef Fried Rice", unitPrice: 195, available: true },
];

describe("compareCart", () => {
  it("names sold-out lines and lines whose price moved (9.1, 9.10)", () => {
    const result = compareCart({ a: 180, b: 210, c: 175 }, live);

    expect(result.unavailable).toEqual([{ id: "b", name: "Spicy Garlic Chicken" }]);
    expect(result.priceChanges).toEqual([
      { id: "c", name: "Beef Fried Rice", was: 175, now: 195 },
    ]);
  });

  it("ignores sub-centavo drift and lines added since", () => {
    const result = compareCart({ a: 180.004 }, [live[0], live[2]]);

    expect(hasCartProblems(result)).toBe(false);
  });

  it("does not report a price change on a line that is sold out", () => {
    const result = compareCart({ b: 100 }, [live[1]]);

    expect(result.priceChanges).toEqual([]);
    expect(result.unavailable).toHaveLength(1);
  });
});

describe("lineFlagsFor", () => {
  it("flags each line by what is wrong with it", () => {
    const flags = lineFlagsFor(compareCart({ a: 180, b: 210, c: 175 }, live));

    expect(flags).toEqual({
      b: { kind: "unavailable" },
      c: { kind: "price", was: 175, now: 195 },
    });
  });

  it("is empty with nothing to check", () => {
    expect(lineFlagsFor(null)).toEqual({});
    expect(hasCartProblems(null)).toBe(false);
  });
});
