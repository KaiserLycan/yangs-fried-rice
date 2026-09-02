import { describe, expect, it } from "vitest";
import { signupSchema } from "./signup";

const VALID = {
  name: "Liza Reyes",
  email: "liza.reyes@example.com",
  phone: "09171234567",
  password: "at least 8",
  address: "24 Mabini St., Barangay Poblacion, Makati",
};

/** The message zod reports for one field, or undefined if that field passed. */
function errorFor(overrides: Partial<typeof VALID>, field: keyof typeof VALID) {
  const result = signupSchema.safeParse({ ...VALID, ...overrides });
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signupSchema", () => {
  it("accepts the five fields the PM settled on", () => {
    expect(signupSchema.safeParse(VALID).success).toBe(true);
  });

  describe("name", () => {
    it("rejects an empty name", () => {
      expect(errorFor({ name: "" }, "name")).toBe("Enter your name.");
    });

    it("rejects whitespace only", () => {
      expect(errorFor({ name: "   " }, "name")).toBe("Enter your name.");
    });

    it("accepts a single-word name", () => {
      expect(errorFor({ name: "Liza" }, "name")).toBeUndefined();
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
    it("rejects an empty address", () => {
      expect(errorFor({ address: "" }, "address")).toBe(
        "Enter your delivery address.",
      );
    });

    it("rejects whitespace only", () => {
      expect(errorFor({ address: "  \n " }, "address")).toBe(
        "Enter your delivery address.",
      );
    });

    it("accepts a multi-line address, since the field is a textarea", () => {
      expect(
        errorFor(
          { address: "24 Mabini St.\nBarangay Poblacion\nMakati" },
          "address",
        ),
      ).toBeUndefined();
    });
  });

  it("reports every bad field at once, so the form can mark them all", () => {
    const result = signupSchema.safeParse({
      name: "",
      email: "nope",
      phone: "123",
      password: "x",
      address: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        new Set(result.error.issues.map((issue) => issue.path[0])),
      ).toEqual(new Set(["name", "email", "phone", "password", "address"]));
    }
  });
});
