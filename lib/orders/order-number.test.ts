import { describe, it, expect } from "vitest";
import {
  formatOrderNumber,
  normalizeOrderSearch,
  orderIdRangeFor,
  orderMatchesSearch,
} from "./order-number";

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
const SEARCH_ID = "69403b15-bec1-43f1-a3ad-47a484655630";

describe("normalizeOrderSearch", () => {
  it("accepts the code as printed, with or without # and spaces", () => {
    expect(normalizeOrderSearch("#69403B15")).toBe("69403b15");
    expect(normalizeOrderSearch("  6940 ")).toBe("6940");
  });

  it("rejects text that cannot be part of an id", () => {
    expect(normalizeOrderSearch("almond")).toBeNull();
    expect(normalizeOrderSearch("")).toBeNull();
  });
});

describe("orderMatchesSearch", () => {
  it("matches from the start of the id", () => {
    expect(orderMatchesSearch(SEARCH_ID, "#6940")).toBe(true);
    expect(orderMatchesSearch(SEARCH_ID, "3b15")).toBe(false);
  });

  it("matches everything when the search is empty", () => {
    expect(orderMatchesSearch(SEARCH_ID, "  ")).toBe(true);
  });
});

describe("orderIdRangeFor", () => {
  it("brackets every id that starts with the search", () => {
    const range = orderIdRangeFor("6940")!;
    expect(range).toEqual({
      from: "69400000-0000-0000-0000-000000000000",
      to: "6940ffff-ffff-ffff-ffff-ffffffffffff",
    });
    expect(SEARCH_ID >= range.from && SEARCH_ID <= range.to).toBe(true);
  });

  it("gives no range for a search that is not hex", () => {
    expect(orderIdRangeFor("almond")).toBeNull();
  });
});
