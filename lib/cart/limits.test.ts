import { describe, expect, it } from "vitest";
import {
  MAX_ITEMS_PER_ORDER,
  isOverOrderCap,
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
