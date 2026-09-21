import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateNcrAddress, OUT_OF_NCR_PATTERN, addressForGeocoding } from "./validate-ncr";

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
    // The map service is unreachable in these tests, so they exercise the
    // city fallback deterministically instead of depending on the network.
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

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

    it("accepts addresses at the 15 km boundary and rejects just beyond it", async () => {
      const boundaryResult = await validateNcrAddress("Malate Manila");
      expect(boundaryResult.distanceKm).toBeLessThanOrEqual(15);
      expect(boundaryResult.valid).toBe(true);

      const tooFarResult = await validateNcrAddress("Calamba Laguna");
      expect(tooFarResult.valid).toBe(false);
      expect(tooFarResult.message).toContain("Metro Manila (NCR)");
    });
  });
});

describe("validateNcrAddress — lenient by street / barangay / city / ZIP", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts a Pasig subdivision address once the building number is left out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const query = addressForGeocoding({
      street: "Mercedes Ave.",
      barangay: "San Miguel",
      city: "Pasig",
      zip: "1600",
    });
    expect(query).toBe("Mercedes Ave., San Miguel, Pasig 1600");

    const result = await validateNcrAddress(query);
    expect(result.valid).toBe(true);
    expect(result.source).toBe("estimate");
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.distanceKm).toBeLessThanOrEqual(15);
  });

  it("never puts the building number in the lookup", () => {
    expect(
      addressForGeocoding({ street: "Mercedes Ave.", barangay: "", city: "Pasig", zip: "" }),
    ).toBe("Mercedes Ave., Pasig");
  });

  it("does not mistake a street named Rizal for the province", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await validateNcrAddress("Rizal Avenue, Manila")).valid).toBe(true);
    expect((await validateNcrAddress("Antipolo, Rizal")).valid).toBe(false);
  });

  it("uses the map when it answers, and rejects a hit beyond the radius", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "14.2117", lon: "121.1653", display_name: "Calamba" }],
      }),
    );
    const result = await validateNcrAddress("Some Street, Barangay, Metro Manila");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("too_far");
  });

  it("accepts a map hit inside the radius", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "14.5764", lon: "121.0851", display_name: "Pasig" }],
      }),
    );
    const result = await validateNcrAddress("Mercedes Ave., San Miguel, Pasig 1600");
    expect(result.valid).toBe(true);
    expect(result.source).toBe("geocoder");
  });

  it("falls back to the city when the map finds nothing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
    );
    const result = await validateNcrAddress("Nowhere Lane, Makati");
    expect(result.valid).toBe(true);
    expect(result.source).toBe("estimate");
  });

  it("rejects an address with no recognisable NCR city when the map can't help", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const result = await validateNcrAddress("Main Street, Some Town");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("out_of_area");
  });
});

