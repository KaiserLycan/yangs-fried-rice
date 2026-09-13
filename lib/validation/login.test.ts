import { describe, expect, it } from "vitest";
import { loginSchema } from "./login";

const VALID_PASSWORD = "at least 8";

/** The message zod reports for one field, or undefined if that field passed. */
function errorFor(
  values: { email: string; password: string },
  field: "email" | "password",
) {
  const result = loginSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("loginSchema", () => {
  it("accepts a well-formed email address", () => {
    const result = loginSchema.safeParse({
      email: "liza.reyes@example.com",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  // The regression this change exists to prevent. Login accepted mobile
  // numbers until 2026-09-02 and must not silently keep doing so.
  it("rejects a local mobile number", () => {
    expect(errorFor({ email: "09171234567", password: VALID_PASSWORD }, "email")).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects an international mobile number", () => {
    expect(
      errorFor({ email: "+63 917 123 4567", password: VALID_PASSWORD }, "email"),
    ).toBe("Enter a valid email address.");
  });

  // The exact malformed address the error frame illustrates: no dot in the
  // domain, so it looks plausible but is not deliverable.
  it("rejects the malformed address shown in the error frame", () => {
    expect(
      errorFor({ email: "liza.reyes@gmial", password: VALID_PASSWORD }, "email"),
    ).toBe("Enter a valid email address.");
  });

  it("rejects an empty email", () => {
    expect(errorFor({ email: "", password: VALID_PASSWORD }, "email")).toBe(
      "Enter a valid email address.",
    );
  });

  it("rejects a password shorter than eight characters", () => {
    expect(
      errorFor({ email: "liza.reyes@example.com", password: "short" }, "password"),
    ).toBe("Password must be at least 8 characters.");
  });

  it("reports both fields when both are wrong", () => {
    const result = loginSchema.safeParse({ email: "09171234567", password: "x" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });
});
