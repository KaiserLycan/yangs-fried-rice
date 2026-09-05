import { describe, expect, it } from "vitest";
import { shortAddressLabel } from "./address-label";

describe("shortAddressLabel", () => {
  it("keeps only the first comma-separated segment", () => {
    expect(shortAddressLabel("21 Mabini St, Malate, Manila, 1004")).toBe(
      "21 Mabini St",
    );
  });

  it("returns the whole thing when there are no commas", () => {
    expect(shortAddressLabel("21 Mabini St")).toBe("21 Mabini St");
  });

  it("trims a long segment rather than letting it break the nav bar", () => {
    expect(shortAddressLabel("128 Paseo del Congreso Extension, Malolos")).toBe(
      "128 Paseo del…",
    );
  });

  it("returns an empty string when there is no address", () => {
    expect(shortAddressLabel("")).toBe("");
    expect(shortAddressLabel("   ")).toBe("");
    expect(shortAddressLabel(null)).toBe("");
    expect(shortAddressLabel(undefined)).toBe("");
  });
});
