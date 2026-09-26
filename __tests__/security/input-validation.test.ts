import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation/signup";
import { loginSchema } from "@/lib/validation/login";
import {
  contactDetailsSchema,
  personalDetailsSchema,
  deliveryAddressSchema,
} from "@/lib/validation/profile";
import { addCartItemSchema, updateCartItemSchema, cancelOrderSchema } from "@/lib/validation/cart";
import { reviewSubmissionSchema } from "@/lib/validation/reviews";
import { createEmployeeSchema } from "@/lib/validation/admin";
import { transactionSchema } from "@/lib/validation/transaction";
import { orderStatusSchema, isValidTransition } from "@/lib/validation/orders";
import { toIsoDate } from "@/lib/validation/date-of-birth";

/**
 * Input validation — Phase 4 section A.
 *
 * Each case is written as {field, input, expected} so the table in the report
 * is generated from the assertions that actually ran, not transcribed by hand.
 * Every message asserted here is the one a user sees on the form.
 */

const SIGNUP = {
  firstName: "Liza",
  lastName: "Reyes",
  email: "liza@example.com",
  phone: "+639171234567",
  password: "securepassword123",
  buildingNo: "10",
  street: "Mercedes Ave",
  barangay: "San Miguel",
  city: "Pasig",
  zip: "1600",
};

function messageFor(schema: { safeParse: (v: unknown) => any }, value: unknown, field: string) {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues.find((i: any) => i.path[0] === field)?.message ?? null;
}

describe("A1. required fields reject blank input", () => {
  it.each([
    ["first name", "firstName", "Enter your first name."],
    ["last name", "lastName", "Enter your last name."],
    ["building / house no.", "buildingNo", "Enter building/house number."],
    ["street", "street", "Enter street."],
    ["barangay", "barangay", "Enter barangay."],
    ["city", "city", "Enter city."],
    ["ZIP code", "zip", "Enter ZIP code."],
  ])("%s shows its own error when left blank", (_label, field, expected) => {
    expect(messageFor(signupSchema, { ...SIGNUP, [field]: "" }, field)).toBe(expected);
  });

  it("rejects whitespace-only input, not just an empty string", () => {
    expect(messageFor(signupSchema, { ...SIGNUP, firstName: "   " }, "firstName")).toBe(
      "Enter your first name.",
    );
  });

  it("rejects an empty login", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });
});

describe("A2. email", () => {
  it.each(["abc", "abc@", "@example.com", "abc example.com", "abc@@example.com", "abc@example"])(
    "rejects %s",
    (email) => {
      expect(signupSchema.safeParse({ ...SIGNUP, email }).success).toBe(false);
    },
  );

  it.each(["liza@example.com", "liza.reyes+tag@sub.example.co.uk"])("accepts %s", (email) => {
    expect(signupSchema.safeParse({ ...SIGNUP, email }).success).toBe(true);
  });
});

describe("A3. mobile number — +63 then 10 digits", () => {
  it.each(["09171234567", "+63 917 123 4567", "9171234567"])("accepts %s", (phone) => {
    expect(signupSchema.safeParse({ ...SIGNUP, phone }).success).toBe(true);
  });

  it.each([
    ["917123456", "only nine digits"],
    ["91712345678", "eleven digits"],
    ["0288123456", "a landline"],
    ["abcdefghij", "letters"],
    ["", "blank"],
  ])("rejects %s (%s)", (phone) => {
    expect(signupSchema.safeParse({ ...SIGNUP, phone }).success).toBe(false);
  });
});

describe("A4. password", () => {
  it("rejects a password under 8 characters", () => {
    expect(signupSchema.safeParse({ ...SIGNUP, password: "1234567" }).success).toBe(false);
  });

  it("accepts 8 characters", () => {
    expect(signupSchema.safeParse({ ...SIGNUP, password: "12345678" }).success).toBe(true);
  });

  it("applies the same rule to a manager creating an employee", () => {
    const base = { firstName: "Alice", lastName: "Smith", email: "a@b.com", role: "STAFF" as const };
    expect(createEmployeeSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(createEmployeeSchema.safeParse({ ...base, password: "12345678" }).success).toBe(true);
  });
});

describe("A5. date of birth", () => {
  it("rejects a date in the future", () => {
    // Built as a *local* calendar date. `toISOString()` renders UTC, so
    // between midnight and 08:00 in Manila (UTC+8) its "tomorrow" is still
    // today's local date — the schema rightly called that not-in-the-future
    // and this case failed for eight hours a day.
    const now = new Date();
    const tomorrow = toIsoDate(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    );
    expect(messageFor(personalDetailsSchema, { firstName: "Liza", lastName: "Reyes", dateOfBirth: tomorrow }, "dateOfBirth"))
      .toMatch(/future/i);
  });

  it("rejects an impossible calendar date", () => {
    expect(personalDetailsSchema.safeParse({ firstName: "Liza", lastName: "Reyes", dateOfBirth: "2001-02-30" }).success).toBe(false);
  });

  it("accepts a blank date — the field is optional", () => {
    expect(personalDetailsSchema.safeParse({ firstName: "Liza", lastName: "Reyes", dateOfBirth: "" }).success).toBe(true);
  });
});

describe("A6. quantities, ratings and money", () => {
  const product = "11111111-1111-4111-8111-111111111111";

  it.each([0, -1, 100, 1.5])("rejects a cart quantity of %s", (quantity) => {
    expect(addCartItemSchema.safeParse({ product_id: product, quantity }).success).toBe(false);
  });

  it("accepts a quantity of 1 to 99", () => {
    expect(addCartItemSchema.safeParse({ product_id: product, quantity: 1 }).success).toBe(true);
    expect(addCartItemSchema.safeParse({ product_id: product, quantity: 99 }).success).toBe(true);
  });

  it.each([0, 6, -3, 2.5])("rejects a rating of %s", (rating) => {
    expect(reviewSubmissionSchema.safeParse({ rating }).success).toBe(false);
  });

  it("accepts a rating of 1 to 5", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(reviewSubmissionSchema.safeParse({ rating }).success).toBe(true);
    }
  });

  it("rejects a negative amount on a transaction", () => {
    const base = {
      order_id: product,
      payment_method: "cash",
      subtotal: 100,
      total_paid: 100,
    };
    expect(transactionSchema.safeParse({ ...base, subtotal: -1 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...base, total_paid: -1 }).success).toBe(false);
    expect(transactionSchema.safeParse(base).success).toBe(true);
  });
});

describe("A7. length limits", () => {
  const product = "11111111-1111-4111-8111-111111111111";

  it("caps special instructions at 500 characters", () => {
    expect(
      addCartItemSchema.safeParse({
        product_id: product,
        quantity: 1,
        special_instructions: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("caps a review comment at 1000 characters", () => {
    expect(reviewSubmissionSchema.safeParse({ rating: 5, comment: "x".repeat(1001) }).success).toBe(false);
    expect(reviewSubmissionSchema.safeParse({ rating: 5, comment: "x".repeat(1000) }).success).toBe(true);
  });

  it("caps a cancellation reason at 300 characters", () => {
    expect(cancelOrderSchema.safeParse({ cancellation_reason: "x".repeat(301) }).success).toBe(false);
  });
});

describe("A8. a field must be sent to be changed", () => {
  it("rejects an update that changes nothing", () => {
    expect(updateCartItemSchema.safeParse({}).success).toBe(false);
  });

  it("accepts an update that changes one field", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 2 }).success).toBe(true);
  });
});

describe("A9. fixed vocabularies and state transitions", () => {
  it("rejects an order status that is not in the vocabulary", () => {
    expect(orderStatusSchema.safeParse("shipped").success).toBe(false);
    expect(orderStatusSchema.safeParse("preparing").success).toBe(true);
  });

  it("refuses an illegal status jump", () => {
    expect(isValidTransition("pending", "completed")).toBe(false);
    expect(isValidTransition("completed", "preparing")).toBe(false);
    expect(isValidTransition("cancelled", "preparing")).toBe(false);
  });

  it("allows the legal steps", () => {
    expect(isValidTransition("pending", "preparing")).toBe(true);
    expect(isValidTransition("preparing", "ready")).toBe(true);
    expect(isValidTransition("ready", "completed")).toBe(true);
  });
});

describe("A10. address form", () => {
  const ADDRESS = {
    label: "Home",
    buildingNo: "10",
    street: "Mercedes Ave",
    barangay: "San Miguel",
    city: "Pasig",
    zip: "1600",
    deliveryNote: "",
  };

  it("accepts a complete address", () => {
    expect(deliveryAddressSchema.safeParse(ADDRESS).success).toBe(true);
  });

  it.each(["buildingNo", "street", "barangay", "city", "zip"])(
    "rejects an address missing %s",
    (field) => {
      expect(deliveryAddressSchema.safeParse({ ...ADDRESS, [field]: "" }).success).toBe(false);
    },
  );

  it("treats the label and the delivery note as optional", () => {
    expect(deliveryAddressSchema.safeParse({ ...ADDRESS, label: "", deliveryNote: "" }).success).toBe(true);
  });
});

describe("A11. contact details", () => {
  it("requires both a valid mobile and a valid email together", () => {
    expect(contactDetailsSchema.safeParse({ mobile: "+639171234567", email: "a@b.com" }).success).toBe(true);
    expect(contactDetailsSchema.safeParse({ mobile: "+639171234567", email: "abc" }).success).toBe(false);
    expect(contactDetailsSchema.safeParse({ mobile: "123", email: "a@b.com" }).success).toBe(false);
  });
});
