import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  FIELD_LIMITS,
  addressPartsSchema,
  emailSchema,
  firstNameSchema,
  lengthProps,
  splitFullName,
  zipSchema,
} from "./fields";
import { fieldErrorFromDbError } from "./field-errors";
import { formatAddress } from "@/lib/address/format";

const migration = readFileSync(
  "supabase/migrations/20260924000000_atomic_names_and_addresses.sql",
  "utf8",
);

/**
 * The form limits and the database CHECK constraints are two copies of one
 * rule. If either side changes alone, a form would accept what the database
 * rejects (or the reverse) — so these fail loudly on drift.
 */
describe("limits match the database constraints", () => {
  it.each([
    ["building_no", FIELD_LIMITS.buildingNo],
    ["street", FIELD_LIMITS.street],
    ["barangay", FIELD_LIMITS.barangay],
    ["city", FIELD_LIMITS.city],
  ] as const)("%s", (column, { min, max }) => {
    expect(migration).toContain(`char_length(btrim(${column})) BETWEEN ${min} AND ${max}`);
  });

  it("names", () => {
    expect(FIELD_LIMITS.firstName).toEqual({ min: 2, max: 50 });
    expect(FIELD_LIMITS.lastName).toEqual({ min: 2, max: 50 });
    expect(migration).toContain("char_length(%1$I) BETWEEN 2 AND 50");
  });

  it("email", () => {
    expect(migration).toContain(
      `char_length(%1$I) BETWEEN ${FIELD_LIMITS.email.min} AND ${FIELD_LIMITS.email.max}`,
    );
  });

  it("label and delivery note", () => {
    expect(migration).toContain(`char_length(label) <= ${FIELD_LIMITS.addressLabel.max}`);
    expect(migration).toContain(`char_length(address_note) <= ${FIELD_LIMITS.deliveryNote.max}`);
  });
});

describe("field rules", () => {
  it("lengthProps gives inputs the same bounds", () => {
    expect(lengthProps("firstName")).toEqual({ minLength: 2, maxLength: 50 });
    expect(lengthProps("deliveryNote")).toEqual({ maxLength: 200 });
  });

  it("refuses names over the limit", () => {
    expect(firstNameSchema.safeParse("A".repeat(51)).success).toBe(false);
    expect(firstNameSchema.safeParse("A".repeat(50)).success).toBe(true);
  });

  it("refuses an email over 254 characters", () => {
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.ph`).success).toBe(false);
  });

  it("ZIP is exactly four digits", () => {
    expect(zipSchema.safeParse("1004").success).toBe(true);
    for (const bad of ["100", "10045", "10a4", ""]) {
      expect(zipSchema.safeParse(bad).success).toBe(false);
    }
  });

  it("each address part fails on its own", () => {
    const result = addressPartsSchema.safeParse({
      buildingNo: "",
      street: "St",
      barangay: "Malate",
      city: "Manila",
      zip: "1004",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path[0]).sort()).toEqual(["buildingNo", "street"]);
    }
  });

  it("splitFullName keeps the last word as the last name", () => {
    expect(splitFullName("Maria Clara  Santos")).toEqual({ firstName: "Maria Clara", lastName: "Santos" });
    expect(splitFullName("Cher")).toEqual({ firstName: "Cher", lastName: "" });
  });
});

describe("formatAddress matches the database's generated address_details", () => {
  it("joins the parts the same way", () => {
    expect(
      formatAddress({ buildingNo: "21", street: "Mabini St.", barangay: "Malate", city: "Manila", zip: "1004" }),
    ).toBe("21 Mabini St., Malate, Manila 1004");
    expect(migration).toContain(
      "btrim(building_no || ' ' || street) || ', ' || btrim(barangay) || ', ' || btrim(city || ' ' || zip_code)",
    );
  });
});

describe("database rejections map to the field they are about", () => {
  it.each([
    ["customer_first_name_check", "firstName"],
    ["customer_address_zip_code_check", "zip"],
    ["customer_address_street_check", "street"],
    ["customer_phone_number_check", "phone"],
  ])("%s → %s", (constraint, field) => {
    const errors = fieldErrorFromDbError({
      code: "23514",
      message: `new row for relation violates check constraint "${constraint}"`,
    });
    expect(Object.keys(errors ?? {})).toEqual([field]);
  });

  it("maps a duplicate email to the email field", () => {
    expect(
      fieldErrorFromDbError({ code: "23505", message: 'duplicate key value violates unique constraint "customer_email_key"' }),
    ).toEqual({ email: "An account with this email already exists." });
  });

  it("ignores errors that aren't about a field", () => {
    expect(fieldErrorFromDbError({ code: "42501", message: "permission denied" })).toBeNull();
  });
});
