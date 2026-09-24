import { z } from "zod";
import { customerEmailSchema, customerPasswordSchema } from "./login";
import { customerMobileSchema } from "./signup";
import { dateOfBirthSchema } from "./date-of-birth";
import {
  addressLabelSchema,
  addressPartsSchema,
  deliveryNoteSchema,
  firstNameSchema,
  lastNameSchema,
} from "./fields";

/**
 * The editable cards on the profile screen (Cust4).
 *
 * Nothing here defines a rule of its own: names and address parts come from
 * `fields.ts`, the mobile number from sign-up, the email and password from
 * login. If a rule changes, it changes in one place and every screen follows.
 */

export const personalDetailsSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  /**
   * Optional. An ISO `YYYY-MM-DD` string, or "" when left blank — store the
   * blank as null, not an empty string.
   */
  dateOfBirth: dateOfBirthSchema,
});

/**
 * The mobile number and the email address. The email is the one the
 * customer signs in with, so it takes login's rule.
 */
export const contactDetailsSchema = z.object({
  mobile: customerMobileSchema,
  email: customerEmailSchema,
});

export type PersonalDetailsValues = z.infer<typeof personalDetailsSchema>;
export type PersonalDetailsField = keyof PersonalDetailsValues;
export type ContactDetailsValues = z.infer<typeof contactDetailsSchema>;
export type ContactDetailsField = keyof ContactDetailsValues;

/**
 * The add/edit address form (Cust4, Order7). One dialog serves both: they
 * differ only in which values seed the fields, not in what is valid. The
 * address is five atomic parts, each stored in its own column; the label and
 * delivery note are optional but bounded.
 */
export const deliveryAddressSchema = z
  .object({
    label: addressLabelSchema,
    deliveryNote: deliveryNoteSchema,
  })
  .merge(addressPartsSchema);

export type DeliveryAddressValues = z.infer<typeof deliveryAddressSchema>;
export type DeliveryAddressField = keyof DeliveryAddressValues;

/**
 * The password card (Cust4). The new password takes login's rule; whether
 * the current one is *correct* is the server's question, so the client only
 * checks something was typed. The mismatch error is pointed at
 * `confirmPassword`, the field the frame annotates.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .refine((value) => value.trim().length > 0, "Enter your current password."),
    newPassword: customerPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords don’t match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
export type PasswordChangeField = keyof PasswordChangeValues;
