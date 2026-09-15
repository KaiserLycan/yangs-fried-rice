import { describe, it, expect } from "vitest";
import { validateNcrAddress, OUT_OF_NCR_PATTERN } from "./validate-ncr";

describe("NCR Address Validation", () => {
  describe("OUT_OF_NCR_PATTERN", () => {
    it("matches provincial names outside Metro Manila", () => {
      expect(OUT_OF_NCR_PATTERN.test("123 Street, Cebu City")).toBe(true);
      expect(OUT_OF_NCR_PATTERN.test("Barangay Uno, Calamba, Laguna")).toBe(true);
      expect(OUT_OF_NCR_PATTERN.test("Davao del Sur")).toBe(true);
      expect(OUT_OF_NCR_PATTERN.test("Imus, Cavite")).toBe(true);
      expect(OUT_OF_NCR_PATTERN.test("San Fernando, Pampanga")).toBe(true);
    });

    it("does not match NCR localities", () => {
      expect(OUT_OF_NCR_PATTERN.test("Taft Avenue, Malate, Manila")).toBe(false);
      expect(OUT_OF_NCR_PATTERN.test("Ayala Avenue, Makati City")).toBe(false);
      expect(OUT_OF_NCR_PATTERN.test("BGC, Taguig")).toBe(false);
      expect(OUT_OF_NCR_PATTERN.test("Cubao, Quezon City")).toBe(false);
    });
  });

  describe("validateNcrAddress", () => {
    it("rejects addresses shorter than 5 characters", async () => {
      const result = await validateNcrAddress("abc");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("at least 5 characters");
    });

    it("rejects addresses explicitly in outside provinces", async () => {
      const result = await validateNcrAddress("123 Main St, Cebu City, Philippines");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("Delivery is currently restricted to Metro Manila (NCR)");
    });

    it("accepts valid NCR addresses via text heuristic fallback", async () => {
      const result = await validateNcrAddress("Unit 502, Taft Avenue, Malate, Manila");
      expect(result.valid).toBe(true);
    });
  });
});
