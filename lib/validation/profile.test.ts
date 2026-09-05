import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { contactDetailsSchema, personalDetailsSchema } from "./profile";

/** The message zod reports for one field, or undefined if that field passed. */
function messageFor(
  schema: z.ZodTypeAny,
  value: Record<string, unknown>,
  field: string,
) {
  const result = schema.safeParse(value);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("personalDetailsSchema", () => {
  it("accepts a name with a date of birth", () => {
    expect(
      personalDetailsSchema.safeParse({
        name: "Liza Reyes",
        dateOfBirth: "1996-06-14",
      }).success,
    ).toBe(true);
  });

  // Date of birth has no column yet and is confirmed optional when it lands,
  // so a customer must be able to correct their name without supplying one.
  it("accepts a name with no date of birth", () => {
    expect(
      personalDetailsSchema.safeParse({ name: "Liza Reyes", dateOfBirth: "" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty name with sign-up's message", () => {
    expect(
      messageFor(personalDetailsSchema, { name: "", dateOfBirth: "" }, "name"),
    ).toBe("Enter your name.");
  });

  it("rejects a whitespace-only name", () => {
    expect(
      messageFor(
        personalDetailsSchema,
        { name: "   ", dateOfBirth: "" },
        "name",
      ),
    ).toBe("Enter your name.");
  });
});

describe("contactDetailsSchema", () => {
  // These mirror signup.test.ts on purpose. The card shares sign-up's rule
  // rather than restating it, and these cases are what proves the sharing is
  // real: if one screen ever starts accepting a number the other rejects,
  // one of the two is wrong.
  it("accepts the local form a customer types", () => {
    expect(contactDetailsSchema.safeParse({ mobile: "09171234567" }).success).toBe(
      true,
    );
  });

  it("accepts the dashed form", () => {
    expect(
      contactDetailsSchema.safeParse({ mobile: "0917-123-4567" }).success,
    ).toBe(true);
  });

  it("accepts the international form with spaces", () => {
    expect(
      contactDetailsSchema.safeParse({ mobile: "+63 917 123 4567" }).success,
    ).toBe(true);
  });

  // Mobile-only is the point: this number exists so a rider can reach the
  // customer at the door, and a landline cannot take an SMS.
  it("rejects a landline", () => {
    expect(messageFor(contactDetailsSchema, { mobile: "0288123456" }, "mobile")).toBe(
      "Enter a valid mobile number.",
    );
  });

  it("rejects an empty number", () => {
    expect(messageFor(contactDetailsSchema, { mobile: "" }, "mobile")).toBe(
      "Enter a valid mobile number.",
    );
  });

  it("rejects a number that is one digit short", () => {
    expect(messageFor(contactDetailsSchema, { mobile: "0917123456" }, "mobile")).toBe(
      "Enter a valid mobile number.",
    );
  });
});
