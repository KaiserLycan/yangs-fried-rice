import { z } from "zod";

/**
 * Customer login (Cust2): email and password only.
 *
 * Mobile was dropped as an accepted identifier on 2026-09-02 — the business
 * has no mobile login, so the field narrowed from "email or mobile" to
 * "email" in the design. Employee login is unaffected; it genuinely accepts
 * either a staff ID or a work email.
 *
 * Messages are taken verbatim from the error frames rather than written
 * fresh, so the rendered errors match the design exactly.
 */
/**
 * The two fields, exported separately because the sign-up screen has to use
 * the same ones. Sharing the schema rather than re-typing the rules is what
 * keeps the promise that "the email field behaves identically to login" true
 * as either screen changes.
 */
export const customerEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.");

export const customerPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const loginSchema = z.object({
  email: customerEmailSchema,
  password: customerPasswordSchema,
});

export type LoginValues = z.infer<typeof loginSchema>;
export type LoginField = keyof LoginValues;
