import { z } from "zod";

/**
 * The one table of length limits and shapes for every text field a person
 * types into, shared by the forms (for `minLength`/`maxLength`, the live
 * hints and the disabled Submit button) and by the server actions (which
 * re-validate, because an action can be called without the form).
 *
 * The database enforces the same bounds as CHECK constraints —
 * `supabase/migrations/20260924000000_atomic_names_and_addresses.sql` — so a
 * limit changed here must be changed there too. The limits test in
 * `lib/validation/fields.test.ts` pins the numbers so that drift is loud.
 */
export const FIELD_LIMITS = {
  firstName: { min: 2, max: 50 },
  lastName: { min: 2, max: 50 },
  email: { min: 6, max: 254 },
  password: { min: 8, max: 72 },
  buildingNo: { min: 1, max: 50 },
  street: { min: 3, max: 100 },
  barangay: { min: 2, max: 100 },
  city: { min: 3, max: 50 },
  zip: { min: 4, max: 4 },
  addressLabel: { min: 0, max: 30 },
  deliveryNote: { min: 0, max: 200 },
  vehicleMakeModel: { min: 2, max: 50 },
  vehiclePlateNumber: { min: 5, max: 10 },
  driverLicenseNumber: { min: 11, max: 13 },
  productName: { min: 2, max: 80 },
  productDetails: { min: 0, max: 300 },
  categoryName: { min: 2, max: 40 },
  addonName: { min: 2, max: 60 },
  specialInstructions: { min: 0, max: 500 },
  reviewComment: { min: 0, max: 1000 },
} as const;

export type LimitedField = keyof typeof FIELD_LIMITS;

/** Spread onto an `<input>` so the browser enforces the same bounds as the schema. */
export function lengthProps(field: LimitedField): {
  minLength?: number;
  maxLength: number;
} {
  const { min, max } = FIELD_LIMITS[field];
  return min > 0 ? { minLength: min, maxLength: max } : { maxLength: max };
}

/**
 * Letters (any script — "Peñaflor", "Nuñez"), plus the space, hyphen,
 * apostrophe and period real names carry ("Dela Cruz", "O'Neil", "Jr.").
 * Must start with a letter; no digits.
 */
export const PERSON_NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'-]*$/u;

/** Trimmed text within the field's length bounds. `label` starts the message: "Street must be…". */
function boundedText(field: LimitedField, label: string) {
  const { min, max } = FIELD_LIMITS[field];
  let schema = z.string().trim();
  if (min > 1) {
    schema = schema.min(min, `${label} must be at least ${min} characters.`);
  }
  return schema.max(max, `${label} must be ${max} characters or fewer.`);
}

/** A required text field: blank gets `blankMessage`, then the length bounds apply. */
function requiredText(field: LimitedField, label: string, blankMessage: string) {
  return z.string().trim().min(1, blankMessage).pipe(boundedText(field, label));
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

function personName(field: "firstName" | "lastName", label: string) {
  return requiredText(field, label, `Enter your ${label.toLowerCase()}.`).pipe(
    z
      .string()
      .regex(
        PERSON_NAME_PATTERN,
        `${label} can only contain letters, spaces, hyphens, apostrophes and periods.`,
      ),
  );
}

export const firstNameSchema = personName("firstName", "First name");
export const lastNameSchema = personName("lastName", "Last name");

/**
 * The shape check covers the minimum (x@y.zz is already six characters), so
 * a short address is told it's invalid rather than given a character count.
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter a valid email address.")
  .max(FIELD_LIMITS.email.max, `Email must be ${FIELD_LIMITS.email.max} characters or fewer.`)
  .email("Enter a valid email address.")
  .regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, "Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(FIELD_LIMITS.password.min, `Password must be at least ${FIELD_LIMITS.password.min} characters.`)
  .max(FIELD_LIMITS.password.max, `Password must be ${FIELD_LIMITS.password.max} characters or fewer.`);

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const buildingNoSchema = requiredText("buildingNo", "Building / house number", "Enter building/house number.");
export const streetSchema = requiredText("street", "Street", "Enter street.");
export const barangaySchema = requiredText("barangay", "Barangay", "Enter barangay.");
export const citySchema = requiredText("city", "City", "Enter city.");

/** Philippine ZIP codes are exactly four digits. */
export const zipSchema = z
  .string()
  .trim()
  .min(1, "Enter ZIP code.")
  .regex(/^\d{4}$/, "ZIP code must be exactly 4 digits.");

export const addressLabelSchema = boundedText("addressLabel", "Label");
export const deliveryNoteSchema = boundedText("deliveryNote", "Delivery note");

/** The five parts of a street address, used by sign-up, profile and checkout. */
export const addressPartsSchema = z.object({
  buildingNo: buildingNoSchema,
  street: streetSchema,
  barangay: barangaySchema,
  city: citySchema,
  zip: zipSchema,
});

export type AddressParts = z.infer<typeof addressPartsSchema>;

// ---------------------------------------------------------------------------
// Riders
// ---------------------------------------------------------------------------

export const vehicleMakeModelSchema = requiredText("vehicleMakeModel", "Vehicle make and model", "Enter the vehicle make and model.");

/** "ABC 1234" (car), "123 ABC" / "AB 12345" (motorcycle). */
export const vehiclePlateNumberSchema = requiredText("vehiclePlateNumber", "Plate number", "Enter the plate number.").pipe(
  z
    .string()
    .regex(/^[A-Z0-9]+(?: [A-Z0-9]+)?$/i, "Use letters and numbers only, e.g. ABC 1234."),
);

/** LTO licence number: letter + 2 digits, 2 digits, 6 digits — N01-12-345678. */
export const driverLicenseNumberSchema = requiredText("driverLicenseNumber", "Licence number", "Enter the licence number.").pipe(
  z.string().regex(/^[A-Z]\d{2}-\d{2}-\d{6}$/i, "Use the LTO format, e.g. N01-12-345678."),
);

/** An ISO date that is today or later — an expired licence can't be used. */
export const licenseExpiryDateSchema = z
  .string()
  .min(1, "Enter the licence expiry date.")
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const expiry = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry.getTime() >= today.getTime();
  }, "The licence has expired.");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "Juan Dela Cruz" → the two parts, used where only a single legacy string exists. */
export function splitFullName(full: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (full ?? "").trim().replace(/\s+/g, " ");
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return { firstName: trimmed, lastName: "" };
  return {
    firstName: trimmed.slice(0, lastSpace),
    lastName: trimmed.slice(lastSpace + 1),
  };
}

export function joinFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
