import { describe, expect, it } from "vitest";
import { formatPeso, mapProductRow } from "./product-listing";

describe("mapProductRow", () => {
  const row = {
    product_id: "p1",
    product_name: "Yangzhou Special",
    product_details: "Shrimp, char siu, egg, spring onion.",
    product_price: 180,
    is_available: true,
    categories: { category_name: "Fried Rice" },
  };

  it("maps every field to the screen shape", () => {
    expect(mapProductRow(row)).toEqual({
      id: "p1",
      name: "Yangzhou Special",
      description: "Shrimp, char siu, egg, spring onion.",
      price: 180,
      categoryName: "Fried Rice",
      isAvailable: true,
      imageUrl: null,
    });
  });

  it("maps a missing description to an empty string, not null", () => {
    expect(
      mapProductRow({ ...row, product_details: null }).description,
    ).toBe("");
  });

  it("maps no category to null", () => {
    expect(mapProductRow({ ...row, categories: null }).categoryName).toBe(
      null,
    );
  });

  // is_available is nullable with no documented default. Only an explicit
  // false should hide a dish — a customer must not lose one off the menu
  // because the column happened to come back empty.
  it("treats a null is_available as available", () => {
    expect(mapProductRow({ ...row, is_available: null }).isAvailable).toBe(
      true,
    );
  });

  it("treats an explicit false is_available as unavailable", () => {
    expect(mapProductRow({ ...row, is_available: false }).isAvailable).toBe(
      false,
    );
  });
});

describe("formatPeso", () => {
  it("formats a whole number with the peso sign and no decimals", () => {
    expect(formatPeso(180)).toBe("₱180");
  });

  it("rounds rather than truncating a fractional price", () => {
    expect(formatPeso(165.5)).toBe("₱166");
  });

  it("adds a thousands separator for a large price", () => {
    expect(formatPeso(1250)).toBe("₱1,250");
  });

  it("formats zero", () => {
    expect(formatPeso(0)).toBe("₱0");
  });
});
