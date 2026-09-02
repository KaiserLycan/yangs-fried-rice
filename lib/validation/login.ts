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
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type LoginField = keyof LoginValues;
