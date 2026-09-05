import { z } from "zod";
import { customerEmailSchema, customerPasswordSchema } from "./login";

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
 */
const PHONE_SEPARATORS = /[\s().-]/g;
const PH_MOBILE_PATTERN = /^(?:0|(?:\+?63))9\d{9}$/;

/**
 * Exported so the profile screen's contact-details card validates the number
 * with this rule rather than restating it, the same way this file takes its
 * email and password rules from `login.ts`. Two copies of a phone pattern is
 * how sign-up and profile end up disagreeing about what a valid number is.
 */
export const customerMobileSchema = z
  .string()
  .refine(
    (value) => PH_MOBILE_PATTERN.test(value.replace(PHONE_SEPARATORS, "")),
    "Enter a valid mobile number.",
  );

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
const addressSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Enter your delivery address.");

/**
 * The label the address is saved under. Not a form field: a customer has
 * exactly one address at this point in the product, so there is nothing to
 * choose between and no picker is drawn.
 */
export const DEFAULT_ADDRESS_LABEL = "Home";

export const signupSchema = z.object({
  name: customerNameSchema,
  email: customerEmailSchema,
  phone: customerMobileSchema,
  password: customerPasswordSchema,
  address: addressSchema,
});

export type SignupValues = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupValues;
