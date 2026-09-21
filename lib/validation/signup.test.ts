import { describe, expect, it } from "vitest";
import { signupSchema } from "./signup";

const VALID = {
  firstName: "Liza",
  lastName: "Reyes",
  email: "liza.reyes@example.com",
  phone: "09171234567",
  password: "at least 8",
  buildingNo: "24",
  street: "Mabini St.",
  barangay: "Barangay Poblacion",
  city: "Makati",
  zip: "1200",
};

/** The message zod reports for one field, or undefined if that field passed. */
function errorFor(overrides: Partial<typeof VALID>, field: keyof typeof VALID) {
  const result = signupSchema.safeParse({ ...VALID, ...overrides });
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signupSchema", () => {
  it("accepts the form fields the PM settled on", () => {
    expect(signupSchema.safeParse(VALID).success).toBe(true);
  });

  describe("name", () => {
    it("rejects an empty first name", () => {
      expect(errorFor({ firstName: "" }, "firstName")).toBe("Enter your name.");
    });

    it("rejects whitespace only in last name", () => {
      expect(errorFor({ lastName: "   " }, "lastName")).toBe("Enter your name.");
    });

    it("accepts a single-word first name", () => {
      expect(errorFor({ firstName: "Liza" }, "firstName")).toBeUndefined();
    });
  });

  // The email field must behave identically to the one on customer login,
  // which narrowed to email alone on 2026-09-02. These cases mirror
  // login.test.ts on purpose: if the two ever diverge, one of them is wrong.
  describe("email", () => {
    it("rejects a local mobile number", () => {
      expect(errorFor({ email: "09171234567" }, "email")).toBe(
        "Enter a valid email address.",
      );
    });

    it("rejects the malformed address shown in the login error frame", () => {
      expect(errorFor({ email: "liza.reyes@gmial" }, "email")).toBe(
        "Enter a valid email address.",
      );
    });

    it("rejects an empty email", () => {
      expect(errorFor({ email: "" }, "email")).toBe(
        "Enter a valid email address.",
      );
    });
  });

  describe("phone", () => {
    it("accepts a local mobile number", () => {
      expect(errorFor({ phone: "09171234567" }, "phone")).toBeUndefined();
    });

    it("accepts the +63 form the design writes it in", () => {
      expect(errorFor({ phone: "+63 917 123 4567" }, "phone")).toBeUndefined();
    });

    it("accepts a number typed with dashes", () => {
      expect(errorFor({ phone: "0917-123-4567" }, "phone")).toBeUndefined();
    });

    it("rejects a landline", () => {
      expect(errorFor({ phone: "028123456" }, "phone")).toBe(
        "Enter a valid mobile number.",
      );
    });

    it("rejects a number that is too short", () => {
      expect(errorFor({ phone: "0917123" }, "phone")).toBe(
        "Enter a valid mobile number.",
      );
    });

    it("rejects a number that is too long", () => {
      expect(errorFor({ phone: "091712345678" }, "phone")).toBe(
        "Enter a valid mobile number.",
      );
    });

    // Phone is required by the form even though the column is nullable: the
    // rider needs a way to reach the customer.
    it("rejects an empty phone", () => {
      expect(errorFor({ phone: "" }, "phone")).toBe(
        "Enter a valid mobile number.",
      );
    });
  });

  describe("password", () => {
    it("rejects a password shorter than eight characters, in login's words", () => {
      expect(errorFor({ password: "short" }, "password")).toBe(
        "Password must be at least 8 characters.",
      );
    });
  });

  describe("address", () => {
    it("rejects an empty building number", () => {
      expect(errorFor({ buildingNo: "" }, "buildingNo")).toBe(
        "Enter building/house number.",
      );
    });

    it("rejects whitespace only in city", () => {
      expect(errorFor({ city: "  \n " }, "city")).toBe(
        "Enter city.",
      );
    });

    it("accepts a complete multi-part address", () => {
      expect(
        errorFor(
          {
            buildingNo: "24",
            street: "Mabini St.",
            barangay: "Barangay Poblacion",
            city: "Makati",
            zip: "1200",
          },
          "street",
        ),
      ).toBeUndefined();
    });
  });

  it("reports every bad field at once, so the form can mark them all", () => {
    const result = signupSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "nope",
      phone: "123",
      password: "x",
      buildingNo: "",
      street: "",
      barangay: "",
      city: "",
      zip: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        new Set(result.error.issues.map((issue) => issue.path[0])),
      ).toEqual(new Set(["firstName", "lastName", "email", "phone", "password", "buildingNo", "street", "barangay", "city", "zip"]));
    }
  });
});
