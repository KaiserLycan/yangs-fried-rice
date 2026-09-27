import { describe, expect, it } from "vitest";
import { tableSql } from "@/__tests__/helpers/schema";
import {
  FIELD_LIMITS,
  emailSchema,
  firstNameSchema,
  lengthProps,
  splitFullName,
} from "./fields";
import { fieldErrorFromDbError } from "./field-errors";

const customer = tableSql("customer");
const employee = tableSql("employee");

/**
 * The form limits and the database CHECK constraints are two copies of one
 * rule. If either side changes alone, a form would accept what the database
 * rejects (or the reverse) — so these fail loudly on drift.
 */
describe("limits match the database constraints", () => {
  it("names", () => {
    expect(FIELD_LIMITS.firstName).toEqual({ min: 2, max: 50 });
    expect(FIELD_LIMITS.lastName).toEqual({ min: 2, max: 50 });
    for (const table of [customer, employee]) {
      for (const column of ["first_name", "last_name"]) {
        expect(table).toContain(`(char_length(${column}) >= 2) AND (char_length(${column}) <= 50)`);
      }
    }
  });

  it("email", () => {
    const { min, max } = FIELD_LIMITS.email;
    expect(customer).toContain(`(char_length(email) >= ${min}) AND (char_length(email) <= ${max})`);
    expect(employee).toContain(`(char_length((email)::text) >= ${min}) AND (char_length((email)::text) <= ${max})`);
  });

});

describe("field rules", () => {
  it("lengthProps gives inputs the same bounds", () => {
    expect(lengthProps("firstName")).toEqual({ minLength: 2, maxLength: 50 });
  });

  it("refuses names over the limit", () => {
    expect(firstNameSchema.safeParse("A".repeat(51)).success).toBe(false);
    expect(firstNameSchema.safeParse("A".repeat(50)).success).toBe(true);
  });

  it("refuses an email over 254 characters", () => {
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.ph`).success).toBe(false);
  });



  it("splitFullName keeps the last word as the last name", () => {
    expect(splitFullName("Maria Clara  Santos")).toEqual({ firstName: "Maria Clara", lastName: "Santos" });
    expect(splitFullName("Cher")).toEqual({ firstName: "Cher", lastName: "" });
  });
});


describe("database rejections map to the field they are about", () => {
  it.each([
    ["customer_first_name_check", "firstName"],
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
