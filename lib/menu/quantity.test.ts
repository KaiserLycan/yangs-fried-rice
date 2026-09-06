import { describe, expect, it } from "vitest";
import { clampQuantity, MAX_QUANTITY, MIN_QUANTITY } from "./quantity";

describe("clampQuantity", () => {
  it("passes through a value already inside the range", () => {
    expect(clampQuantity(3)).toBe(3);
  });

  it("floors at the minimum — the way to want none of something is to not add it", () => {
    expect(clampQuantity(0)).toBe(MIN_QUANTITY);
    expect(clampQuantity(-5)).toBe(MIN_QUANTITY);
  });

  it("ceilings at the stated maximum", () => {
    expect(clampQuantity(MAX_QUANTITY + 1)).toBe(MAX_QUANTITY);
    expect(clampQuantity(999)).toBe(MAX_QUANTITY);
  });

  it("accepts the boundary values themselves", () => {
    expect(clampQuantity(MIN_QUANTITY)).toBe(MIN_QUANTITY);
    expect(clampQuantity(MAX_QUANTITY)).toBe(MAX_QUANTITY);
  });
});
