import { describe, expect, it } from "vitest";
import {
  INVALID_MOBILE_MESSAGE,
  isValidPhMobile,
  optionalPhoneSchema,
  phoneDigitsOf,
  phoneSchema,
  toInternationalMobile,
} from "./phone";
import { employeeProfileUpdateSchema } from "./employee-profile";
import { updateCustomerSchema, createEmployeeSchema } from "./admin";
import { contactDetailsSchema } from "./profile";
import { signupSchema } from "./signup";

describe("phoneDigitsOf", () => {
  it("keeps the ten subscriber digits", () => {
    expect(phoneDigitsOf("9171234567")).toBe("9171234567");
  });

  it("drops a trunk 0 or a country code that was pasted in", () => {
    expect(phoneDigitsOf("09171234567")).toBe("9171234567");
    expect(phoneDigitsOf("639171234567")).toBe("9171234567");
    expect(phoneDigitsOf("+63 917 123 4567")).toBe("9171234567");
  });

  it("throws away anything that is not a digit", () => {
    expect(phoneDigitsOf("917-abc-123 4567")).toBe("9171234567");
    expect(phoneDigitsOf("+++")).toBe("");
  });

  it("never allows more than ten digits", () => {
    expect(phoneDigitsOf("91712345679999")).toBe("9171234567");
  });

  it("leaves a half-typed number alone instead of eating the first keystroke", () => {
    // Someone typing "0917…" sees the 0; it is rejected by the rule, not
    // silently swallowed as they type.
    expect(phoneDigitsOf("0")).toBe("0");
    expect(phoneDigitsOf("63")).toBe("63");
  });
});

describe("isValidPhMobile", () => {
  it.each(["9171234567", "09171234567", "0917-123-4567", "+63 917 123 4567", "639171234567"])(
    "accepts %s",
    (value) => {
      expect(isValidPhMobile(value)).toBe(true);
    },
  );

  it.each([
    ["", "blank"],
    ["917123456", "only nine digits"],
    ["91712345678", "eleven digits"],
    ["8171234567", "does not start with 9"],
    ["0288123456", "a landline"],
    ["abcdefghij", "letters"],
  ])("rejects %s (%s)", (value) => {
    expect(isValidPhMobile(value)).toBe(false);
  });
});

describe("toInternationalMobile", () => {
  it("stores one canonical shape whatever was typed", () => {
    for (const typed of ["9171234567", "09171234567", "+63 917 123 4567"]) {
      expect(toInternationalMobile(typed)).toBe("+639171234567");
    }
  });

  it("is blank when there is no number", () => {
    expect(toInternationalMobile("")).toBe("");
    expect(toInternationalMobile(null)).toBe("");
  });
});

describe("the schemas", () => {
  it("requires a number where one is required", () => {
    expect(phoneSchema.safeParse("").success).toBe(false);
    expect(phoneSchema.safeParse("9171234567").success).toBe(true);
  });

  it("allows blank where the number is optional", () => {
    expect(optionalPhoneSchema.safeParse("").success).toBe(true);
    expect(optionalPhoneSchema.safeParse("9171234567").success).toBe(true);
    expect(optionalPhoneSchema.safeParse("12345").success).toBe(false);
  });

  it("uses the same message everywhere", () => {
    const result = phoneSchema.safeParse("12345");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(INVALID_MOBILE_MESSAGE);
    }
  });
});

/**
 * The point of the shared rule: a number that one screen rejects cannot be
 * saved through another. Every screen that takes a phone number is checked
 * against the same bad value here.
 */
describe("every role is held to the same rule", () => {
  const bad = "12345";
  const good = "+639171234567";

  it("rejects it on customer sign-up", () => {
    const base = {
      firstName: "Liza",
      lastName: "Reyes",
      email: "liza@example.com",
      password: "securepassword123",
      buildingNo: "1",
      street: "Mapúa Ave",
      barangay: "San Andres",
      city: "Manila",
      zip: "1000",
    };
    expect(signupSchema.safeParse({ ...base, phone: bad }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, phone: good }).success).toBe(true);
  });

  it("rejects it on the customer profile", () => {
    const base = { email: "liza@example.com" };
    expect(contactDetailsSchema.safeParse({ ...base, mobile: bad }).success).toBe(false);
    expect(contactDetailsSchema.safeParse({ ...base, mobile: good }).success).toBe(true);
  });

  it("rejects it on the employee / rider profile", () => {
    expect(employeeProfileUpdateSchema.safeParse({ mobile: bad }).success).toBe(false);
    expect(employeeProfileUpdateSchema.safeParse({ mobile: good }).success).toBe(true);
    // Optional: leaving it out, or blanking it, is still fine.
    expect(employeeProfileUpdateSchema.safeParse({}).success).toBe(true);
    expect(employeeProfileUpdateSchema.safeParse({ mobile: "" }).success).toBe(true);
  });

  it("rejects it when a manager creates an employee", () => {
    const base = {
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      password: "securepassword123",
      role: "STAFF" as const,
    };
    expect(createEmployeeSchema.safeParse({ ...base, phone: bad }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...base, phone: good }).success).toBe(true);
    expect(createEmployeeSchema.safeParse(base).success).toBe(true);
  });

  it("rejects it when a manager edits a customer", () => {
    expect(updateCustomerSchema.safeParse({ phone_number: bad }).success).toBe(false);
    expect(updateCustomerSchema.safeParse({ phone_number: good }).success).toBe(true);
    expect(updateCustomerSchema.safeParse({ phone_number: "" }).success).toBe(true);
  });
});
