import { z } from "zod";
import { customerEmailSchema, customerPasswordSchema } from "./login";
import { dateOfBirthSchema } from "./date-of-birth";
import { phoneSchema } from "./phone";

/**
 * Customer sign-up (Cust1). Name, email, phone, password, delivery address —
 * the field set settled with the PM on 2026-09-02.
 *
 * Email and password are imported from `login.ts` rather than restated, so
 * the sign-up screen cannot drift away from the login screen's rules or its
 * error wording.
 *
 * DESIGNER: there is no Figma frame for this screen, so none of the messages
 * below are taken from one. Email and password borrow login's, which are
 * drawn; the name, phone and address messages are written here in the same
 * voice — sentence case, one short imperative — and need confirming.
 */

/**
 * A Philippine mobile number, in any of the shapes a customer actually types:
 * 09171234567, 0917-123-4567, +63 917 123 4567. Spaces, dashes, dots and
 * parentheses are stripped before matching because they are how people write
 * a number, not part of it.
 *
 * Deliberately mobile-only, not "any phone": this number exists so a rider
 * can reach the customer at the door, and a landline cannot take an SMS or a
 * call from a moving motorbike.
 *
 * BACKEND: the number is validated but not normalised here. Whoever persists
 * it should store one canonical form — otherwise the same customer's number
 * is three different strings depending on how they typed it.
 *
 * Both exported: `lib/profile/mobile-number.ts` needs the same separators
 * stripped and the same shape matched to *group* a stored number for
 * display, not just to validate it. Two independent copies of "what a PH
 * mobile number looks like" is how validation and display formatting end up
 * disagreeing about what's valid — the capturing groups live here, on the
 * one pattern, rather than in a second regex that has to be kept in sync.
 */
export {
  PHONE_SEPARATORS,
  PH_MOBILE_GROUPS_PATTERN,
} from "./phone";

/**
 * The shared mobile rule, re-exported under the name the profile and sign-up
 * screens already import. The rule itself lives in `lib/validation/phone.ts`
 * so customers, managers, staff and riders are all held to one definition.
 */
export const customerMobileSchema = phoneSchema;

/**
 * Also shared with the profile screen, for the same reason: the name a
 * customer signs up with and the name they later correct are the same field
 * and take the same rule.
 */
export const customerNameSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Enter your name.");

/**
 * The address is one free-text field, and the form's only multi-line one. The
 * address table stores a single detail string plus a label, so there is no
 * structured street/city/postcode breakdown to validate against.
 *
 * Non-empty is therefore the whole rule. A minimum length would be invented
 * rather than specified, and no length check can tell a deliverable address
 * from an undeliverable one anyway.
 */
export const DEFAULT_ADDRESS_LABEL = "Home";

const requiredString = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, message);

export const signupSchema = z.object({
  firstName: customerNameSchema,
  lastName: customerNameSchema,
  email: customerEmailSchema,
  phone: customerMobileSchema,
  /** Optional. "" or an ISO date that is not in the future. */
  dateOfBirth: dateOfBirthSchema.optional(),
  password: customerPasswordSchema,
  buildingNo: requiredString("Enter building/house number."),
  street: requiredString("Enter street."),
  barangay: requiredString("Enter barangay."),
  city: requiredString("Enter city."),
  zip: requiredString("Enter ZIP code."),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupValues;
