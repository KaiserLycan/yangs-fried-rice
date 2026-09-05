import { z } from "zod";
import { customerPasswordSchema } from "./login";
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

/**
 * The add/edit address form (Cust4, Order7). One dialog serves both: they
 * differ only in which values seed the fields, not in what is valid.
 *
 * The address is a single free-text control — the stored model has no
 * street/city/postcode breakdown to validate against — so the only real rule
 * is that it isn't empty. The label and delivery note are unconstrained: a
 * customer can leave either blank, and nothing here invents a shape for
 * fields the design leaves free text.
 */
export const deliveryAddressSchema = z.object({
  label: z.string(),
  addressDetails: z
    .string()
    .refine((value) => value.trim().length > 0, "Enter an address."),
  deliveryNote: z.string(),
});

export type DeliveryAddressValues = z.infer<typeof deliveryAddressSchema>;
export type DeliveryAddressField = keyof DeliveryAddressValues;

/**
 * The password card (Cust4). The new password borrows
 * `customerPasswordSchema` from `login.ts` rather than restating the
 * minimum length — the same relationship this file already has with
 * `signup.ts` for the name and mobile rules — so login, sign-up and this
 * screen cannot disagree about what a valid password is.
 *
 * The current password has no format of its own to check here: whether it
 * is *correct* is a server-side question, not this schema's. The only thing
 * a client can verify is that the customer typed something.
 *
 * The mismatch check is a whole-object refinement rather than a per-field
 * rule, because whether confirmation matches depends on the new password
 * too. Its `path` points the error at `confirmPassword`, which is the field
 * the frame actually annotates.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .refine((value) => value.trim().length > 0, "Enter your current password."),
    newPassword: customerPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don’t match.",
    path: ["confirmPassword"],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
export type PasswordChangeField = keyof PasswordChangeValues;
