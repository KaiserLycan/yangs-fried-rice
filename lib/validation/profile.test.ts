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

describe("deliveryAddressSchema", () => {
  it("accepts a full address with a label and a note", () => {
    expect(
      deliveryAddressSchema.safeParse({
        label: "Home",
        addressDetails: "128 Paseo del Congreso, Malolos, Bulacan",
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
        addressDetails: "128 Paseo del Congreso, Malolos, Bulacan",
        deliveryNote: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an empty address", () => {
    expect(
      messageFor(
        deliveryAddressSchema,
        { label: "Home", addressDetails: "", deliveryNote: "" },
        "addressDetails",
      ),
    ).toBe("Enter an address.");
  });

  it("rejects a whitespace-only address", () => {
    expect(
      messageFor(
        deliveryAddressSchema,
        { label: "Home", addressDetails: "   ", deliveryNote: "" },
        "addressDetails",
      ),
    ).toBe("Enter an address.");
  });
});

describe("passwordChangeSchema", () => {
  const valid = {
    currentPassword: "oldpassword1",
    newPassword: "newpassword1",
    confirmPassword: "newpassword1",
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
