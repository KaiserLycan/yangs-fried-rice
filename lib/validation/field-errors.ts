import type { z } from "zod";

/**
 * Field-level errors sent back from a server action or API route, so a form
 * can put "why this failed" under the input that caused it instead of in a
 * toast that names no field.
 *
 * Keys are the form's own field names (`firstName`, `zip`, …), not column
 * names.
 */
export type FieldErrors = Record<string, string>;

/** First message per field wins — one field says one thing. */
export function fieldErrorsFromIssues(issues: z.ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/**
 * A database rejection, translated to the field it is about.
 *
 * The CHECK and UNIQUE constraints added in
 * `supabase/migrations/20260924000000_atomic_names_and_addresses.sql` are
 * named `<table>_<column>_<rule>`, so the constraint name in the Postgres
 * error says which column failed. Anything not recognised returns null and
 * the caller shows its general message.
 */
const CONSTRAINT_FIELDS: Array<[RegExp, string, string]> = [
  [/first_name/, "firstName", "First name was rejected. Use 2–50 letters."],
  [/last_name/, "lastName", "Last name was rejected. Use 2–50 letters."],
  [/_email_key|email_unique/, "email", "An account with this email already exists."],
  [/email/, "email", "Enter a valid email address."],
  [/phone/, "phone", "Enter a valid mobile number, e.g. +63 917 123 4567."],
  [/building_no/, "buildingNo", "Building / house number must be 1–50 characters."],
  [/street/, "street", "Street must be 3–100 characters."],
  [/barangay/, "barangay", "Barangay must be 2–100 characters."],
  [/city/, "city", "City must be 3–50 characters."],
  [/zip/, "zip", "ZIP code must be exactly 4 digits."],
  [/label/, "label", "Label must be 30 characters or fewer."],
  [/address_note/, "deliveryNote", "Delivery note must be 200 characters or fewer."],
  [/address_unique/, "street", "This address is already saved in your profile."],
];

export function fieldErrorFromDbError(
  error: { code?: string; message?: string; details?: string } | null | undefined,
): FieldErrors | null {
  if (!error) return null;
  // 23514 check_violation, 23505 unique_violation, 23502 not_null_violation
  if (!["23514", "23505", "23502"].includes(error.code ?? "")) return null;
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  for (const [pattern, field, message] of CONSTRAINT_FIELDS) {
    if (pattern.test(text)) return { [field]: message };
  }
  return null;
}

/** A short sentence naming the failing fields, for a banner above the form. */
export function summariseFieldErrors(
  errors: FieldErrors,
  labels: Record<string, string> = {},
): string {
  const names = Object.keys(errors).map((key) => labels[key] ?? key);
  if (names.length === 0) return "";
  if (names.length === 1) return `Check ${names[0]}: ${Object.values(errors)[0]}`;
  return `Check these fields: ${names.join(", ")}.`;
}
