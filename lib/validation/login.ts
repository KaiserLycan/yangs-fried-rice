import { z } from "zod";
import { emailSchema, newPasswordSchema, passwordSchema } from "./fields";

/**
 * Customer login (Cust2): email and password only.
 *
 * Mobile was dropped as an accepted identifier on 2026-09-02 — the business
 * has no mobile login, so the field narrowed from "email or mobile" to
 * "email" in the design.
 *
 * Messages are taken verbatim from the error frames rather than written
 * fresh, so the rendered errors match the design exactly.
 */
/**
 * The two fields, exported separately because the sign-up screen has to use
 * the same ones. Sharing the schema rather than re-typing the rules is what
 * as either screen changes.
 */
export const customerEmailSchema = emailSchema;

export const customerPasswordSchema = passwordSchema;

/**
 * A password the customer is *choosing* (sign-up, change). Stricter than the
 * sign-in rule above, to match Supabase Auth's password requirements.
 */
export const customerNewPasswordSchema = newPasswordSchema;

export const loginSchema = z.object({
  email: customerEmailSchema,
  password: customerPasswordSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;
export type LoginField = keyof LoginValues;
