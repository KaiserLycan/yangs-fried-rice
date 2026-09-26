import { z } from "zod";
import { customerEmailSchema, customerNewPasswordSchema } from "./login";
import { dateOfBirthSchema } from "./date-of-birth";
import { phoneSchema } from "./phone";
import {
  addressPartsSchema,
  firstNameSchema,
  lastNameSchema,
} from "./fields";

/**
 * Customer sign-up (Cust1): first name, last name, email, phone, optional
 * date of birth, password, and the delivery address as five atomic parts.
 *
 * Every rule is imported rather than restated — names and address parts from
 * `fields.ts`, email and password from `login.ts` — so sign-up, the profile
 * screen and the server actions cannot disagree about what is valid, and the
 * length limits match the database's CHECK constraints.
 */

/**
 * Re-exported for `lib/profile/mobile-number.ts`, which groups a stored
 * number for display using the same pattern validation matches against.
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

export const customerFirstNameSchema = firstNameSchema;
export const customerLastNameSchema = lastNameSchema;

export const DEFAULT_ADDRESS_LABEL = "Home";

export const signupSchema = z
  .object({
    firstName: customerFirstNameSchema,
    lastName: customerLastNameSchema,
    email: customerEmailSchema,
    phone: customerMobileSchema,
    /** Optional. "" or an ISO date that is not in the future. */
    dateOfBirth: dateOfBirthSchema.optional(),
    password: customerNewPasswordSchema,
  })
  .merge(addressPartsSchema);

/**
 * What the sign-up *form* checks: the server schema plus the terms box,
 * which the action has no reason to receive but the button must wait for.
 */
export const signupFormSchema = signupSchema.extend({
  terms: z.literal(true, {
    errorMap: () => ({ message: "Agree to the Terms & Policy to continue." }),
  }),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type SignupField = keyof SignupValues;
