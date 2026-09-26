import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  contactDetailsSchema,
  deliveryAddressSchema,
  passwordChangeSchema,
  personalDetailsSchema,
} from "./profile";

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
        firstName: "Liza",
        lastName: "Reyes",
        dateOfBirth: "1996-06-14",
      }).success,
    ).toBe(true);
  });

  // Date of birth has no column yet and is confirmed optional when it lands,
  // so a customer must be able to correct their name without supplying one.
  it("accepts a name with no date of birth", () => {
    expect(
      personalDetailsSchema.safeParse({ firstName: "Liza", lastName: "Reyes", dateOfBirth: "" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty first name with sign-up's message", () => {
    expect(
      messageFor(personalDetailsSchema, { firstName: "", lastName: "Reyes", dateOfBirth: "" }, "firstName"),
    ).toBe("Enter your first name.");
  });

  it("rejects a whitespace-only last name", () => {
    expect(
      messageFor(
        personalDetailsSchema,
        { firstName: "Liza", lastName: "   ", dateOfBirth: "" },
        "lastName",
      ),
    ).toBe("Enter your last name.");
  });

  it("rejects a one-letter last name", () => {
    expect(
      messageFor(personalDetailsSchema, { firstName: "Liza", lastName: "R", dateOfBirth: "" }, "lastName"),
    ).toBe("Last name must be at least 2 characters.");
  });

  it("rejects digits and symbols in a name", () => {
    expect(
      messageFor(personalDetailsSchema, { firstName: "L1za", lastName: "Reyes", dateOfBirth: "" }, "firstName"),
    ).toMatch(/only contain letters/);
  });

  it("accepts real-world names with spaces, hyphens, apostrophes and ñ", () => {
    for (const [firstName, lastName] of [["Maria Clara", "dela Cruz"], ["Jean-Luc", "O'Neil"], ["José", "Peñaflor Jr."]]) {
      expect(personalDetailsSchema.safeParse({ firstName, lastName, dateOfBirth: "" }).success).toBe(true);
    }
  });
});

describe("contactDetailsSchema", () => {
  const valid = { mobile: "09171234567", email: "liza@example.com" };

  // These mirror signup.test.ts on purpose. The card shares sign-up's rule
  // rather than restating it, and these cases are what proves the sharing is
  // real: if one screen ever starts accepting a number the other rejects,
  // one of the two is wrong.
  it("accepts the local form a customer types", () => {
    expect(contactDetailsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the dashed form", () => {
    expect(
      contactDetailsSchema.safeParse({ ...valid, mobile: "0917-123-4567" })
        .success,
    ).toBe(true);
  });

  it("accepts the international form with spaces", () => {
    expect(
      contactDetailsSchema.safeParse({ ...valid, mobile: "+63 917 123 4567" })
        .success,
    ).toBe(true);
  });

  // Mobile-only is the point: this number exists so a rider can reach the
  // customer at the door, and a landline cannot take an SMS.
  it("rejects a landline", () => {
    expect(
      messageFor(contactDetailsSchema, { ...valid, mobile: "0288123456" }, "mobile"),
    ).toBe("Enter a valid mobile number.");
  });

  it("rejects an empty number", () => {
    expect(
      messageFor(contactDetailsSchema, { ...valid, mobile: "" }, "mobile"),
    ).toBe("Enter a valid mobile number.");
  });

  it("rejects a number that is one digit short", () => {
    expect(
      messageFor(contactDetailsSchema, { ...valid, mobile: "0917123456" }, "mobile"),
    ).toBe("Enter a valid mobile number.");
  });

  // The email borrows login's rule for the same reason the mobile number
  // borrows sign-up's: a customer signs in with this address, so the screen
  // that changes it and the screen that accepts it must agree on what a
  // valid one is. These mirror login.test.ts.
  it("accepts a valid email address", () => {
    expect(
      contactDetailsSchema.safeParse({ ...valid, email: "liza.reyes@gmail.com" })
        .success,
    ).toBe(true);
  });

  it("rejects an address with no domain, with login's message", () => {
    expect(
      messageFor(contactDetailsSchema, { ...valid, email: "liza@" }, "email"),
    ).toBe("Enter a valid email address.");
  });

  it("rejects an empty email", () => {
    expect(
      messageFor(contactDetailsSchema, { ...valid, email: "" }, "email"),
    ).toBe("Enter a valid email address.");
  });

  // Trimmed rather than rejected: a pasted address often carries a trailing
  // space, and that is a transcription artefact rather than a mistake worth
  // stopping the customer for.
  it("trims surrounding whitespace off the email", () => {
    const result = contactDetailsSchema.safeParse({
      ...valid,
      email: "  liza@example.com  ",
    });
    expect(result.success && result.data.email).toBe("liza@example.com");
  });

  // The frame drew a "gmial.com looks like a typo" helper and it was cut on
  // purpose: no requirement asks for it, and a heuristic second-guessing a
  // customer's own address will be wrong for somebody. Making the field
  // editable is not a reason to bring it back.
  it("accepts an address whose domain merely looks like a typo", () => {
    expect(
      contactDetailsSchema.safeParse({ ...valid, email: "liza@gmial.com" })
        .success,
    ).toBe(true);
  });
});

describe("deliveryAddressSchema", () => {
  it("accepts a full address with a label and a note", () => {
    expect(
      deliveryAddressSchema.safeParse({
        label: "Home",
        buildingNo: "128",
        street: "Paseo del Congreso",
        barangay: "Malolos",
        city: "Bulacan",
        zip: "3000",
        deliveryNote: "Beside the blue gate",
      }).success,
    ).toBe(true);
  });

  // The label and the note are confirmed-upcoming columns with no shape of
  // their own yet, so a customer must be able to save an address without
  // either.
  it("accepts a blank label and a blank note", () => {
    expect(
      deliveryAddressSchema.safeParse({
        label: "",
        buildingNo: "128",
        street: "Paseo del Congreso",
        barangay: "Malolos",
        city: "Bulacan",
        zip: "3000",
        deliveryNote: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty address", () => {
    expect(
      messageFor(
        deliveryAddressSchema,
        { label: "Home", buildingNo: "", street: "", barangay: "", city: "", zip: "", deliveryNote: "" },
        "buildingNo",
      ),
    ).toBe("Enter building/house number.");
  });

  it("rejects a whitespace-only address", () => {
    expect(
      messageFor(
        deliveryAddressSchema,
        { label: "Home", buildingNo: "   ", street: "", barangay: "", city: "", zip: "", deliveryNote: "" },
        "buildingNo",
      ),
    ).toBe("Enter building/house number.");
  });
});

describe("passwordChangeSchema", () => {
  const valid = {
    currentPassword: "oldpassword1",
    newPassword: "Newpassword1!",
    confirmPassword: "Newpassword1!",
  };

  it("accepts a current password, a valid new one, and a matching confirmation", () => {
    expect(passwordChangeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty current password", () => {
    expect(
      messageFor(
        passwordChangeSchema,
        { ...valid, currentPassword: "" },
        "currentPassword",
      ),
    ).toBe("Enter your current password.");
  });

  it("rejects a whitespace-only current password", () => {
    expect(
      messageFor(
        passwordChangeSchema,
        { ...valid, currentPassword: "   " },
        "currentPassword",
      ),
    ).toBe("Enter your current password.");
  });

  // Mirrors login and sign-up on purpose — same schema, same message.
  it("rejects a new password under the shared minimum length", () => {
    expect(
      messageFor(
        passwordChangeSchema,
        { ...valid, newPassword: "short1", confirmPassword: "short1" },
        "newPassword",
      ),
    ).toBe("Password must be at least 8 characters.");
  });

  it("rejects a confirmation that doesn't match the new password", () => {
    expect(
      messageFor(
        passwordChangeSchema,
        { ...valid, confirmPassword: "somethingelse1" },
        "confirmPassword",
      ),
    ).toBe("Passwords don’t match.");
  });
});
