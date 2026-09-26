import { describe, it, expect } from "vitest";
import { formatOrderNumber } from "./order-number";

describe("formatOrderNumber", () => {
  it("gives back the whole id, exactly as stored", () => {
    const id = "3f1a9c7e-2b44-4d81-9f0a-6c5e1b2d3a44";
    expect(formatOrderNumber(id)).toBe(id);
  });

  /**
   * The point of issue #106's complaint: the customer's screen, the kitchen
   * and the rider all have to say the same thing.
   */
  it("says the same thing however many times it is asked", () => {
    const id = "3f1a9c7e-2b44-4d81-9f0a-6c5e1b2d3a44";
    expect(formatOrderNumber(id)).toBe(formatOrderNumber(id));
  });

  it("does not case-fold, because the stored value is what staff will search for", () => {
    expect(formatOrderNumber("3F1A9C7E-2b44")).toBe("3F1A9C7E-2b44");
  });

  it("has nothing to show for an order that has none", () => {
    expect(formatOrderNumber(null)).toBe("");
    expect(formatOrderNumber(undefined)).toBe("");
    expect(formatOrderNumber("  ")).toBe("");
  });
});
