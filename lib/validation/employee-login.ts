import { z } from "zod";

/**
 * Employee login (SAS1). One schema shared by Staff, Business Owner and
 * Rider.
 *
 * Separate from `login.ts` because the identifier genuinely accepts two
 * shapes here — a staff ID or a work email. Customer login narrowed to email
 * alone on 2026-09-02; that narrowing is specific to customers and does not
 * apply to this screen.
 *
 * DESIGNER: the frames show exactly one staff ID, "YFR-0142", and build their
 * error state from "YFR-9". The prefix and the four-digit body below are
 * inferred from that single example. Confirm the real format before this
 * reaches an employee — a rider with a five-digit ID would be locked out.
 */
export const employeeLoginSchema = z.object({
  identifier: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/**
 * The form-level banner, verbatim from the error frames. Deliberately not
 * part of the schema: it is what the server says after a well-formed
 * submission is rejected, which client-side validation cannot decide.
 */
export const EMPLOYEE_SIGN_IN_FAILED =
  "Those credentials don't match an employee account. Check with your manager.";

export type EmployeeLoginValues = z.infer<typeof employeeLoginSchema>;
export type EmployeeLoginField = keyof EmployeeLoginValues;
