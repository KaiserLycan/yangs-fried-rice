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

/**
 * The symbols Supabase Auth counts for its "lowercase, uppercase letters,
 * digits and symbols" password requirement. A space or an accented letter is
 * not one of them, so it must not satisfy the rule here either — otherwise
 * the form would accept a password that Supabase then rejects.
 */
const PASSWORD_SYMBOL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

/**
 * A password being *set* — sign-up, reset, change, or a manager creating an
 * employee. Mirrors the Supabase Auth setting (min 8; at least one lowercase,
 * uppercase, digit and symbol) so the form refuses what Auth would.
 *
 * Sign-in keeps `passwordSchema` (length only): an account created before the
 * rule existed must still be able to sign in.
 */
export const newPasswordSchema = passwordSchema.superRefine((value, ctx) => {
  const missing: string[] = [];
  if (!/[a-z]/.test(value)) missing.push("a lowercase letter");
  if (!/[A-Z]/.test(value)) missing.push("an uppercase letter");
  if (!/[0-9]/.test(value)) missing.push("a number");
  if (!PASSWORD_SYMBOL.test(value)) missing.push("a symbol such as ! @ # or ?");
  if (missing.length === 0) return;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Password needs ${missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0]}.`,
  });
});

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
