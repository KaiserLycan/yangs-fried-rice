import { describe, expect, it } from "vitest";
import { formatMobileNumber } from "./mobile-number";

describe("formatMobileNumber", () => {
  it("groups a stored local number the way the frame draws it", () => {
    expect(formatMobileNumber("09174028851")).toBe("0917 402 8851");
  });

  // Sign-up validates but does not normalise, so all three shapes can reach
  // this screen and all three have to read identically once they do.
  it("groups a dashed number", () => {
    expect(formatMobileNumber("0917-402-8851")).toBe("0917 402 8851");
  });

  it("groups an international number into the local form", () => {
    expect(formatMobileNumber("+63 917 402 8851")).toBe("0917 402 8851");
  });

  it("groups an international number written without the plus", () => {
    expect(formatMobileNumber("639174028851")).toBe("0917 402 8851");
  });

  // A number this cannot parse is still the customer's number.
  it("returns an unrecognised number exactly as stored", () => {
    expect(formatMobileNumber("(02) 8812 3456")).toBe("(02) 8812 3456");
  });

  it("returns an empty string when there is no number", () => {
    expect(formatMobileNumber(null)).toBe("");
    expect(formatMobileNumber(undefined)).toBe("");
    expect(formatMobileNumber("")).toBe("");
  });
});
