import { describe, it, expect } from "vitest";
import {
  formatOrderNumber,
  normalizeOrderSearch,
  orderIdRangeFor,
  orderMatchesSearch,
  orderNumberSearch,
} from "./order-number";

const ID = "38206dc0-b033-4453-864c-b7c487862c7c";

describe("formatOrderNumber", () => {
  // The readable number (migration 20260928000007) is what people see and say.
  it("prints the order number when there is one", () => {
    expect(formatOrderNumber(1042, ID)).toBe("1042");
    expect(formatOrderNumber("1042", ID)).toBe("1042");
  });

  /**
   * The point of issue #106's complaint: the customer's screen, the kitchen
   * and the receipt all have to say the same thing.
   */
  it("says the same thing however many times it is asked", () => {
    expect(formatOrderNumber(1042, ID)).toBe(formatOrderNumber(1042, ID));
  });

  // A row read without the number (a realtime payload) still shows something
  // the staff can search for: the id prefix, as before.
  it("falls back to the id's leading group without a number", () => {
    expect(formatOrderNumber(null, ID)).toBe("38206dc0");
    expect(formatOrderNumber(undefined, "38206DC0-b033")).toBe("38206DC0");
  });

  it("has nothing to show for an order that has neither", () => {
    expect(formatOrderNumber(null)).toBe("");
    expect(formatOrderNumber(undefined, null)).toBe("");
    expect(formatOrderNumber("  ", "  ")).toBe("");
  });
});

describe("orderNumberSearch", () => {
  it("reads the number as printed, with or without #", () => {
    expect(orderNumberSearch("1042")).toBe(1042);
    expect(orderNumberSearch(" #1042 ")).toBe(1042);
  });

  it("leaves anything with a letter to the id-prefix search", () => {
    expect(orderNumberSearch("38206dc0")).toBeNull();
    expect(orderNumberSearch("Liza")).toBeNull();
    expect(orderNumberSearch("")).toBeNull();
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
