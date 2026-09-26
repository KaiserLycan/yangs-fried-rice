import { z } from "zod";
import { emailSchema } from "./fields";

/**
 * Employee login (SAS1). One schema shared by Manager, Staff and Rider.
 *
 * Email only. The design once showed a "YFR-0142" style ID, but there is no
 * column to look it up, so it was dropped (issue #106, P39).
 */
export const employeeLoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value.includes("@")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter your work email." });
        return;
      }

      const email = emailSchema.safeParse(value);
      if (!email.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: email.error.issues[0].message });
      }
    }),
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
