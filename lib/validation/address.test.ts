import { describe, it, expect } from "vitest";
import { addressSchema } from "./address";

describe("addressSchema", () => {
  it("accepts a valid address", () => {
    const result = addressSchema.safeParse({
      address: "123 Main Street, Manila, Philippines",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimum length address (5 chars)", () => {
    const result = addressSchema.safeParse({
      address: "12 St",
    });
    expect(result.success).toBe(true);
  });

  it("rejects address shorter than 5 characters", () => {
    const result = addressSchema.safeParse({
      address: "Hi",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Address must be at least 5 characters"
      );
    }
  });

  it("rejects empty string", () => {
    const result = addressSchema.safeParse({
      address: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    const result = addressSchema.safeParse({
      address: "     ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects address exceeding 500 characters", () => {
    const result = addressSchema.safeParse({
      address: "x".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe(
        "Address must be 500 characters or fewer"
      );
    }
  });

  it("rejects missing address field", () => {
    const result = addressSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("trims whitespace from address", () => {
    const result = addressSchema.safeParse({
      address: "  456 Rizal Avenue, Quezon City  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address).toBe("456 Rizal Avenue, Quezon City");
    }
  });

  it("accepts address at exactly 500 characters", () => {
    const result = addressSchema.safeParse({
      address: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});
