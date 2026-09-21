import { z } from "zod";

/**
 * One rule for "is this a believable date of birth", shared by the sign-up
 * form and the profile card so the two cannot disagree.
 *
 * The value is an ISO `YYYY-MM-DD` string (what a native date input
 * produces) or "" when left blank — blank is always valid because the field
 * is optional.
 *
 * Dates are compared as *local calendar dates*. `new Date("2000-01-01")`
 * parses as UTC midnight, which in a timezone behind UTC is still Dec 31 —
 * enough to flip a "not in the future" check on the boundary day.
 */

export const MIN_AGE_YEARS = 13;
export const MAX_AGE_YEARS = 150;

export const DOB_FUTURE_MESSAGE = "Date of birth can't be in the future.";
export const DOB_TOO_YOUNG_MESSAGE = `You must be at least ${MIN_AGE_YEARS} years old.`;
export const DOB_INVALID_MESSAGE = "Please enter a valid birthdate.";

/** `YYYY-MM-DD` for a local calendar date — what `<input type="date" max>` wants. */
export function toIsoDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Latest selectable birthdate: today. A birthday cannot be in the future. */
export function latestBirthdate(now: Date = new Date()): string {
  return toIsoDate(now);
}

/** Latest birthdate that still satisfies the minimum age. */
export function latestBirthdateForMinAge(now: Date = new Date()): string {
  return toIsoDate(
    new Date(now.getFullYear() - MIN_AGE_YEARS, now.getMonth(), now.getDate()),
  );
}

/** Earliest selectable birthdate. */
export function earliestBirthdate(now: Date = new Date()): string {
  return toIsoDate(
    new Date(now.getFullYear() - MAX_AGE_YEARS, now.getMonth(), now.getDate()),
  );
}

/** Parses `YYYY-MM-DD` into a local Date, or null if it isn't a real calendar date. */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }
  return date;
}

export function dateOfBirthSchemaFor(now: () => Date = () => new Date()) {
  return z.string().superRefine((value, ctx) => {
    if (!value) return;

    const dob = parseIsoDate(value);
    if (!dob) {
      ctx.addIssue({ code: "custom", message: DOB_INVALID_MESSAGE });
      return;
    }

    const today = now();
    today.setHours(0, 0, 0, 0);

    if (dob.getTime() > today.getTime()) {
      ctx.addIssue({ code: "custom", message: DOB_FUTURE_MESSAGE });
      return;
    }

    const youngest = new Date(
      today.getFullYear() - MIN_AGE_YEARS,
      today.getMonth(),
      today.getDate(),
    );
    if (dob.getTime() > youngest.getTime()) {
      ctx.addIssue({ code: "custom", message: DOB_TOO_YOUNG_MESSAGE });
      return;
    }

    const oldest = new Date(
      today.getFullYear() - MAX_AGE_YEARS,
      today.getMonth(),
      today.getDate(),
    );
    if (dob.getTime() < oldest.getTime()) {
      ctx.addIssue({ code: "custom", message: DOB_INVALID_MESSAGE });
    }
  });
}

export const dateOfBirthSchema = dateOfBirthSchemaFor();
