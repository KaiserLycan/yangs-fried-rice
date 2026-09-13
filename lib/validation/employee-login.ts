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
export const STAFF_ID_PREFIX = "YFR";

/** e.g. YFR-0142. Case-insensitive: the design draws it upper case, but
 *  nobody should be locked out for typing their own ID in lower case. */
const STAFF_ID_PATTERN = /^YFR-\d{4}$/i;

/** Anything opening with the prefix counts as a staff ID attempt, however
 *  mangled. That is what makes "Enter your full staff ID." the right message
 *  for it rather than the generic one. */
const STAFF_ID_ATTEMPT = /^YFR/i;

/**
 * Only the first of these three is drawn.
 *
 * DESIGNER: the error frames illustrate a truncated staff ID and nothing
 * else, so the other two are written here rather than taken from a frame.
 * They cover a malformed work email and an identifier resembling neither
 * shape, both of which a real employee can type. Confirm the wording.
 */
const INCOMPLETE_STAFF_ID = "Enter your full staff ID.";
const INVALID_EMAIL = "Enter a valid email address.";
const NEITHER_SHAPE = "Enter your staff ID or work email.";

const emailSchema = z.string().email();

export const employeeLoginSchema = z.object({
  identifier: z.string().superRefine((raw, ctx) => {
    const value = raw.trim();

    if (STAFF_ID_PATTERN.test(value)) return;
    if (emailSchema.safeParse(value).success) return;

    // Order matters. A staff ID attempt is recognised by its prefix and an
    // email attempt by its "@", so each wrong value gets the message aimed at
    // the shape the employee was reaching for rather than a generic one.
    const message = STAFF_ID_ATTEMPT.test(value)
      ? INCOMPLETE_STAFF_ID
      : value.includes("@")
        ? INVALID_EMAIL
        : NEITHER_SHAPE;

    ctx.addIssue({ code: z.ZodIssueCode.custom, message });
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
