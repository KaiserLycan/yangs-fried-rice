import { z } from "zod";
import { emailSchema, newPasswordSchema } from "./fields";

/**
 * Forgotten-password recovery, for customers and employees alike.
 *
 * Issue #106 reported the customer "Forgot password?" link as non-functional
 * — it pointed back at the login page — and asked for employees to get the
 * same way back in. Both now use these two schemas and the same pair of
 * routes; nothing here is role-specific, because Supabase Auth holds one
 * password per account whether that account is a customer or an employee.
 *
 * The rules are the shared `emailSchema` and `passwordSchema` rather than
 * fresh ones, so a password accepted at sign-up is accepted here and the two
 * screens cannot drift apart.
 */

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, { message: "Confirm your new password." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Those passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * What the "we've sent you a link" screen says.
 *
 * Deliberately the same whether or not the address belongs to an account.
 * Saying "no account with that email" here would turn the form into a way to
 * ask which addresses are registered, which is the more serious problem of
 * the two — and issue #106's other security note (no limit on failed login
 * attempts) is about exactly that kind of probing.
 */
export const RESET_LINK_SENT =
  "If that email is registered, a reset link is on its way. Check your inbox and your spam folder.";
