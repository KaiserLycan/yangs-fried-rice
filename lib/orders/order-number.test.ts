import { describe, it, expect } from "vitest";
import { formatOrderNumber } from "./order-number";

const ID = "38206dc0-b033-4453-864c-b7c487862c7c";

describe("formatOrderNumber", () => {
  it("takes the UUID's leading group", () => {
    expect(formatOrderNumber(ID)).toBe("38206dc0");
  });

  /**
   * The point of issue #106's complaint: the customer's screen, the kitchen
   * and the rider all have to say the same thing.
   */
  it("says the same thing however many times it is asked", () => {
    expect(formatOrderNumber(ID)).toBe(formatOrderNumber(ID));
  });

  /**
   * Four hex characters is 65,536 possibilities — a repeat is likelier than
   * not by a few hundred orders, and both of the old helpers truncated to
   * four while looking authoritative.
   */
  it("keeps enough of the id that two orders will not share a reference", () => {
    const sibling = "38206dc1-b033-4453-864c-b7c487862c7c";
    expect(formatOrderNumber(ID)).not.toBe(formatOrderNumber(sibling));
    expect(formatOrderNumber(ID)).toHaveLength(8);
  });

  it("does not case-fold, so the reference can be pasted into a search", () => {
    expect(formatOrderNumber("38206DC0-b033")).toBe("38206DC0");
  });

  it("has nothing to show for an order that has none", () => {
    expect(formatOrderNumber(null)).toBe("");
    expect(formatOrderNumber(undefined)).toBe("");
    expect(formatOrderNumber("  ")).toBe("");
  });
});
