import { describe, it, expect } from "vitest";
import {
  productSchema,
  productUpdateSchema,
  categorySchema,
  searchParamsSchema,
} from "./menu";

// productSchema

describe("productSchema", () => {
  it("accepts valid product data with all fields", () => {
    const result = productSchema.safeParse({
      product_name: "Yang Special Fried Rice",
      product_price: 185,
      product_details: "House special with egg, char siu, and scallions",
      category_id: "550e8400-e29b-41d4-a716-446655440000",
      is_available: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal required fields only", () => {
    const result = productSchema.safeParse({
      product_name: "Iced Tea",
      product_price: 45,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_available).toBe(true); // default
    }
  });

  it("defaults is_available to true when omitted", () => {
    const result = productSchema.safeParse({
      product_name: "Test",
      product_price: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_available).toBe(true);
    }
  });

  it("rejects empty product name", () => {
    const result = productSchema.safeParse({
      product_name: "",
      product_price: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Product name is required");
    }
  });

  it("rejects whitespace-only product name", () => {
    const result = productSchema.safeParse({
      product_name: "   ",
      product_price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing product name", () => {
    const result = productSchema.safeParse({
      product_price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = productSchema.safeParse({
      product_name: "Free Item",
      product_price: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Price must be greater than 0",
      );
    }
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({
      product_name: "Broken Item",
      product_price: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects price exceeding maximum", () => {
    const result = productSchema.safeParse({
      product_name: "Expensive Item",
      product_price: 100_000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric price", () => {
    const result = productSchema.safeParse({
      product_name: "Test",
      product_price: "not a number",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category_id (not a UUID)", () => {
    const result = productSchema.safeParse({
      product_name: "Test",
      product_price: 100,
      category_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Invalid category ID");
    }
  });

  it("accepts valid custom product_id", () => {
    const result = productSchema.safeParse({
      product_id: "550e8400-e29b-41d4-a716-446655440000",
      product_name: "Item with ID",
      product_price: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid custom product_id", () => {
    const result = productSchema.safeParse({
      product_id: "not-a-valid-uuid",
      product_name: "Invalid ID Item",
      product_price: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("Product ID must be a valid UUID");
    }
  });

  it("accepts null category_id", () => {
    const result = productSchema.safeParse({
      product_name: "Uncategorized",
      product_price: 50,
      category_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null product_details", () => {
    const result = productSchema.safeParse({
      product_name: "Simple Item",
      product_price: 80,
      product_details: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects product_details exceeding 1000 characters", () => {
    const result = productSchema.safeParse({
      product_name: "Test",
      product_price: 100,
      product_details: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects product_name exceeding 200 characters", () => {
    const result = productSchema.safeParse({
      product_name: "x".repeat(201),
      product_price: 100,
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from product_name", () => {
    const result = productSchema.safeParse({
      product_name: "  Trimmed Name  ",
      product_price: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.product_name).toBe("Trimmed Name");
    }
  });
});

// productUpdateSchema (partial - all fields optional)

describe("productUpdateSchema", () => {
  it("accepts a single field update", () => {
    const result = productUpdateSchema.safeParse({
      product_price: 200,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no fields to update)", () => {
    const result = productUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still validates field constraints when provided", () => {
    const result = productUpdateSchema.safeParse({
      product_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid price even on partial update", () => {
    const result = productUpdateSchema.safeParse({
      product_price: -10,
    });
    expect(result.success).toBe(false);
  });
});

// categorySchema

describe("categorySchema", () => {
  it("accepts a valid category name", () => {
    const result = categorySchema.safeParse({
      category_name: "Fried Rice",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty category name", () => {
    const result = categorySchema.safeParse({
      category_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Category name is required");
    }
  });

  it("rejects whitespace-only category name", () => {
    const result = categorySchema.safeParse({
      category_name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing category_name field", () => {
    const result = categorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects category name exceeding 100 characters", () => {
    const result = categorySchema.safeParse({
      category_name: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("trims whitespace from category_name", () => {
    const result = categorySchema.safeParse({
      category_name: "  Noodles  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category_name).toBe("Noodles");
    }
  });

  it("accepts a custom category_id when valid UUID", () => {
    const result = categorySchema.safeParse({
      category_id: "550e8400-e29b-41d4-a716-446655440000",
      category_name: "Rice",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid category_id", () => {
    const result = categorySchema.safeParse({
      category_id: "not-a-uuid",
      category_name: "Rice",
    });
    expect(result.success).toBe(false);
  });
});

// searchParamsSchema

describe("searchParamsSchema", () => {
  it("accepts a valid search string", () => {
    const result = searchParamsSchema.safeParse({
      search: "fried rice",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no params)", () => {
    const result = searchParamsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects search exceeding 200 characters", () => {
    const result = searchParamsSchema.safeParse({
      search: "x".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Search query must be 200 characters or fewer"
      );
    }
  });

  it("trims whitespace from search", () => {
    const result = searchParamsSchema.safeParse({
      search: "  fried  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe("fried");
    }
  });

  it("accepts a partial category name filter", () => {
    const result = searchParamsSchema.safeParse({
      category: "Fried",
    });
    expect(result.success).toBe(true);
  });

  it("accepts comma-separated category names for multi-select", () => {
    const result = searchParamsSchema.safeParse({
      category: "Rice,Addon,Drinks",
    });
    expect(result.success).toBe(true);
  });

  it("rejects category filter exceeding 100 characters", () => {
    const result = searchParamsSchema.safeParse({
      category: "x".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Category filter must be 100 characters or fewer"
      );
    }
  });

  it("accepts combined search + category name", () => {
    const result = searchParamsSchema.safeParse({
      search: "special",
      category: "Rice",
    });
    expect(result.success).toBe(true);
  });
});
