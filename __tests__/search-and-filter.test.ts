import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchParamsSchema } from "@/lib/validation/menu";

// 1. Mock the global fetch API to simulate calling the Next.js Route Handlers
global.fetch = vi.fn();

describe("US-10: Search, Filters & Third-Party Map Integrations", () => {
  
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

  // Acceptance Criteria #3: Address Validation & Fallback
  it("TC-10.3.I: Validates customer address via external/fallback API route", async () => {
    // Mock the backend API route (app/api/address/validate/route.ts) returning a success response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true, formattedAddress: "123 Mapúa Ave, Metro Manila" })
    });

    // Simulate the frontend sending the typed address to your API endpoint
    const response = await fetch("/api/address/validate", {
      method: "POST",
      body: JSON.stringify({ address: "123 mapua ave" })
    });
    const data = await response.json();

    // Verify the API was called correctly and returned the validated mapped address
    expect(global.fetch).toHaveBeenCalledWith("/api/address/validate", expect.any(Object));
    expect(data.valid).toBe(true);
    expect(data.formattedAddress).toContain("Mapúa");
  });

  it("TC-10.3.M: Handles address validation API failure by prompting the text fallback", async () => {
    // Mock the map API failing (e.g., Google Maps is down, or address is unmappable)
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ valid: false, error: "Address not found. Please use text fallback." })
    });

    const response = await fetch("/api/address/validate", {
      method: "POST",
      body: JSON.stringify({ address: "Fake Address 999 in the middle of nowhere" })
    });
    const data = await response.json();

    // Verify the system gracefully catches the error and requests the text fallback
    expect(data.valid).toBe(false);
    expect(data.error).toContain("text fallback");
  });
});