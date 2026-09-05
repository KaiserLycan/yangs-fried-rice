import { z } from "zod";
import { customerMobileSchema, customerNameSchema } from "./signup";

/**
 * The two editable cards on the profile screen (Cust4): personal details and
 * contact details.
 *
 * Nothing here defines a rule of its own. The name and the mobile number are
 * the same fields the customer filled in at sign-up, so both schemas are
 * imported rather than restated — the same relationship `signup.ts` has with
 * `login.ts`. If the mobile rule changes, it changes in one place and both
 * screens follow.
 */

export const personalDetailsSchema = z.object({
  name: customerNameSchema,
  /**
   * Date of birth has **no column on the customer record yet**. It is
   * confirmed as coming and confirmed as optional when it does, so the field
   * renders and submits, and an empty value is a pass rather than an error.
   *
   * The rule is deliberately thin: the control is a native date input, which
   * already refuses anything that is not a real calendar date, and any
   * further constraint — a minimum age, an earliest year — would be invented
   * here rather than specified by anyone.
   *
   * BACKEND: this arrives as an ISO `YYYY-MM-DD` string, or "" when the
   * customer left it blank. Store the blank as null, not an empty string.
   */
  dateOfBirth: z.string(),
});

/**
 * Only the mobile number. Email is displayed read-only on this card: it is
 * the customer's sign-in identity as well as a stored column, so changing it
 * is a two-system write with an asynchronous verification step and belongs to
 * its own ticket. A field the form never submits has nothing to validate.
 */
export const contactDetailsSchema = z.object({
  mobile: customerMobileSchema,
});

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;
export type PersonalDetailsField = keyof PersonalDetailsValues;
export type ContactDetailsValues = z.infer<typeof contactDetailsSchema>;
export type ContactDetailsField = keyof ContactDetailsValues;
