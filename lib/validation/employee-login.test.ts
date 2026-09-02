import { describe, expect, it } from "vitest";
import { employeeLoginSchema } from "./employee-login";

const VALID_PASSWORD = "at least 8";

/** The message zod reports for one field, or undefined if that field passed. */
function errorFor(
  values: { identifier: string; password: string },
  field: "identifier" | "password",
) {
  const result = employeeLoginSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("employeeLoginSchema", () => {
  it("accepts the staff ID shown in the design", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "YFR-0142",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a lower-case staff ID", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "yfr-0142",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a work email", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "rosa@yangs.ph",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace before deciding", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "  YFR-0142  ",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  // The exact value the error frame illustrates: a staff ID cut short.
  it("rejects the truncated staff ID shown in the error frame", () => {
    expect(
      errorFor({ identifier: "YFR-9", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your full staff ID.");
  });

  // Anything opening with the prefix is read as a staff ID attempt, so it
  // gets the staff ID message rather than the generic one.
  it("treats too many digits as an incomplete staff ID, not an unknown shape", () => {
    expect(
      errorFor(
        { identifier: "YFR-01423", password: VALID_PASSWORD },
        "identifier",
      ),
    ).toBe("Enter your full staff ID.");
  });

  it("rejects a malformed work email with the email message", () => {
    expect(
      errorFor(
        { identifier: "rosa@yangs", password: VALID_PASSWORD },
        "identifier",
      ),
    ).toBe("Enter a valid email address.");
  });

  it("rejects an identifier resembling neither shape", () => {
    expect(
      errorFor({ identifier: "rosa", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your staff ID or work email.");
  });

  it("rejects an empty identifier", () => {
    expect(
      errorFor({ identifier: "", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your staff ID or work email.");
  });

  // The customer screen narrowed to email on 2026-09-02. This screen did not,
  // and this test is what stops that narrowing leaking across.
  it("still accepts a staff ID, which customer login would reject", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "YFR-0142",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than eight characters", () => {
    expect(
      errorFor({ identifier: "YFR-0142", password: "short" }, "password"),
    ).toBe("Password must be at least 8 characters.");
  });

  it("reports both fields when both are wrong", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "YFR-9",
      password: "x",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });
});
