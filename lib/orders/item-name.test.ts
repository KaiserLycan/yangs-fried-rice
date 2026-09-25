import { describe, expect, it } from "vitest";
import {
  ITEM_GONE_LABEL,
  orderItemName,
  orderItemUnitPrice,
} from "./item-name";

/**
 * Issue #106: an order in the rider queue read "20x Unknown item" because the
 * menu had changed underneath it. The line's money was intact — only the name
 * was being resolved live, against a product row that had been deleted.
 */
describe("orderItemName", () => {
  it("prefers the snapshot taken when the order was placed", () => {
    expect(orderItemName("Yangzhou Special", "Yangzhou Deluxe")).toBe(
      "Yangzhou Special",
    );
  });

  it("survives the product being deleted outright", () => {
    // The reported case: the join comes back with nothing at all.
    expect(orderItemName("Yangzhou Special", null)).toBe("Yangzhou Special");
    expect(orderItemName("Yangzhou Special", undefined)).toBe(
      "Yangzhou Special",
    );
  });

  it("falls back to the live name for orders placed before snapshots existed", () => {
    expect(orderItemName(null, "Yangzhou Special")).toBe("Yangzhou Special");
  });

  it("says something honest when there is genuinely nothing left", () => {
    expect(orderItemName(null, null)).toBe(ITEM_GONE_LABEL);
    // Never the bare, bug-looking string the views used to print.
    expect(orderItemName(null, null)).not.toMatch(/unknown/i);
  });

  it("treats blank and whitespace-only names as missing", () => {
    expect(orderItemName("", "Live name")).toBe("Live name");
    expect(orderItemName("   ", "Live name")).toBe("Live name");
    expect(orderItemName("  ", "  ")).toBe(ITEM_GONE_LABEL);
  });
});

describe("orderItemUnitPrice", () => {
  it("prefers the snapshot price", () => {
    expect(orderItemUnitPrice(180, 500, 2, 999)).toBe(180);
  });

  it("divides the stored line total when there is no snapshot", () => {
    expect(orderItemUnitPrice(null, 360, 2, 999)).toBe(180);
  });

  it("never divides by zero", () => {
    expect(orderItemUnitPrice(null, 360, 0, 42)).toBe(42);
  });

  it("uses today's price only as a last resort", () => {
    // Least honest of the three: the menu price may have moved since.
    expect(orderItemUnitPrice(null, null, 2, 150)).toBe(150);
    expect(orderItemUnitPrice(null, null, 2, null)).toBe(0);
  });

  it("keeps a free line free rather than falling through to today's price", () => {
    expect(orderItemUnitPrice(0, 999, 3, 500)).toBe(0);
  });
});
