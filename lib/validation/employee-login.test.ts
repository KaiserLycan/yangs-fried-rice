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
  it("accepts a work email", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "rosa@yangs.ph",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace before deciding", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "  rosa@yangs.ph  ",
      password: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  // The old "YFR-0142" style ID was never wired to a lookup (P39).
  it("rejects an old YFR-style ID with the email message", () => {
    expect(
      errorFor({ identifier: "YFR-0142", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your work email.");
  });

  it("rejects a malformed work email with the email message", () => {
    expect(
      errorFor(
        { identifier: "rosa@yangs", password: VALID_PASSWORD },
        "identifier",
      ),
    ).toBe("Enter a valid email address.");
  });

  it("rejects an identifier that is not an email", () => {
    expect(
      errorFor({ identifier: "rosa", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your work email.");
  });

  it("rejects an empty identifier", () => {
    expect(
      errorFor({ identifier: "", password: VALID_PASSWORD }, "identifier"),
    ).toBe("Enter your work email.");
  });

  it("rejects a password shorter than eight characters", () => {
    expect(
      errorFor({ identifier: "rosa@yangs.ph", password: "short" }, "password"),
    ).toBe("Password must be at least 8 characters.");
  });

  it("reports both fields when both are wrong", () => {
    const result = employeeLoginSchema.safeParse({
      identifier: "rosa",
      password: "x",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });
});
