import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchParamsSchema } from "@/lib/validation/menu";

describe("US-10: Search & Filters", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Acceptance Criteria #1: Text Search
  it("TC-10.1.U: Validates valid search keyword parameters correctly", () => {
    // Simulating a user typing "Garlic" into the frontend search bar
    const result = searchParamsSchema.safeParse({ search: "Garlic" });
    
    expect(result.success).toBe(true);
    expect(result.data?.search).toBe("Garlic");
  });

  it("TC-10.1.E: Rejects search keywords that exceed the database limit", () => {
    // Simulating a malicious user pasting a massive string into the search bar
    const longString = "a".repeat(201);
    const result = searchParamsSchema.safeParse({ search: longString });
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("200 characters or fewer");
    }
  });

  // Acceptance Criteria #2: Category Filters
  it("TC-10.2.U: Validates category filter parameters correctly", () => {
    // Simulating a user clicking the "Fried Rice" category filter button
    const result = searchParamsSchema.safeParse({ category: "Fried Rice" });
    
    expect(result.success).toBe(true);
    expect(result.data?.category).toBe("Fried Rice");
  });
});
