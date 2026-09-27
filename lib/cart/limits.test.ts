import { describe, expect, it } from "vitest";
import {
  MAX_ITEMS_PER_ORDER,
  dishLimitMessage,
  isOverOrderCap,
  quantityRoom,
  remainingItems,
  wouldExceedOrderCap,
} from "./limits";

describe("MAX_ITEMS_PER_ORDER", () => {
  it("is 30, the figure submit_cart_to_order also enforces", () => {
    expect(MAX_ITEMS_PER_ORDER).toBe(30);
  });
});

describe("wouldExceedOrderCap", () => {
  it("allows filling the cart exactly to the cap", () => {
    expect(wouldExceedOrderCap(25, 5)).toBe(false);
  });

  it("refuses going one past the cap", () => {
    expect(wouldExceedOrderCap(25, 6)).toBe(true);
    expect(wouldExceedOrderCap(30, 1)).toBe(true);
  });

  it("always allows removing items, even from a cart already over", () => {
    expect(wouldExceedOrderCap(35, -1)).toBe(false);
    expect(wouldExceedOrderCap(35, 0)).toBe(false);
  });
});

describe("isOverOrderCap", () => {
  it("is false at the cap and true past it", () => {
    expect(isOverOrderCap(30)).toBe(false);
    expect(isOverOrderCap(31)).toBe(true);
  });
});

describe("remainingItems", () => {
  it("is what still fits, never negative", () => {
    expect(remainingItems(0)).toBe(30);
    expect(remainingItems(29)).toBe(1);
    expect(remainingItems(30)).toBe(0);
    expect(remainingItems(35)).toBe(0);
  });
});

describe("dishLimitMessage", () => {
  it("matches submit_cart_to_order's wording", () => {
    expect(dishLimitMessage("Yang's Halo-Halo")).toBe(
      "You can only order up to 20 of each dish (Yang's Halo-Halo).",
    );
  });
});

describe("quantityRoom", () => {
  it("allows a full 20 in an empty cart", () => {
    expect(quantityRoom({ cartTotalItems: 0, dishItems: 0 })).toEqual({ room: 20, limitedBy: null });
  });

  it("at 29 items, only 1 more fits", () => {
    expect(quantityRoom({ cartTotalItems: 29, dishItems: 0 })).toEqual({ room: 1, limitedBy: "order" });
  });

  it("at 30 items, nothing fits", () => {
    expect(quantityRoom({ cartTotalItems: 30, dishItems: 0 })).toEqual({ room: 0, limitedBy: "order" });
  });

  it("counts the same dish across every line (13 already → 7 more)", () => {
    expect(quantityRoom({ cartTotalItems: 13, dishItems: 13 })).toEqual({ room: 7, limitedBy: "dish" });
  });

  it("gives an edited line its own quantity back", () => {
    // Editing a 10 of a dish that has 13 across two lines, cart at 30.
    expect(quantityRoom({ cartTotalItems: 30, dishItems: 13, baseline: 10 })).toEqual({
      room: 10,
      limitedBy: "order",
    });
  });

  it("never goes negative for a cart already over", () => {
    expect(quantityRoom({ cartTotalItems: 35, dishItems: 22 }).room).toBe(0);
  });
});
