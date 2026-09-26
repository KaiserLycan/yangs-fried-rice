import { describe, expect, it } from "vitest";
import {
  DOB_FUTURE_MESSAGE,
  DOB_INVALID_MESSAGE,
  DOB_TOO_YOUNG_MESSAGE,
  EMPLOYEE_DOB_TOO_YOUNG_MESSAGE,
  EMPLOYEE_MIN_AGE_YEARS,
  MIN_AGE_YEARS,
  dateOfBirthSchemaFor,
  latestBirthdate,
  latestBirthdateForMinAge,
  toIsoDate,
} from "./date-of-birth";

const NOW = new Date(2026, 8, 21, 15, 30); // 21 Sep 2026, local
const schema = dateOfBirthSchemaFor(() => new Date(NOW));

function firstMessage(value: string) {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
}

describe("dateOfBirthSchema", () => {
  it("accepts a blank value — the field is optional", () => {
    expect(firstMessage("")).toBeNull();
  });

  it("accepts an ordinary birthdate", () => {
    expect(firstMessage("1996-06-14")).toBeNull();
  });

  it("rejects a date that has not happened yet", () => {
    expect(firstMessage("2026-09-22")).toBe(DOB_FUTURE_MESSAGE);
    expect(firstMessage("2030-01-01")).toBe(DOB_FUTURE_MESSAGE);
  });

  it("accepts today's date only as far as the minimum age allows", () => {
    // Today is not in the future, but it is under the minimum age.
    expect(firstMessage("2026-09-21")).toBe(DOB_TOO_YOUNG_MESSAGE);
  });

  it("rejects someone under the minimum age", () => {
    expect(firstMessage("2020-01-01")).toBe(DOB_TOO_YOUNG_MESSAGE);
  });

  it("accepts exactly the minimum age", () => {
    expect(firstMessage("2013-09-21")).toBeNull();
  });

  it("rejects an impossible calendar date", () => {
    expect(firstMessage("2001-02-30")).toBe(DOB_INVALID_MESSAGE);
    expect(firstMessage("not-a-date")).toBe(DOB_INVALID_MESSAGE);
  });

  it("rejects an implausibly old date", () => {
    expect(firstMessage("1800-01-01")).toBe(DOB_INVALID_MESSAGE);
  });
});

describe("date helpers", () => {
  it("formats a local date as YYYY-MM-DD without a UTC shift", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses today as the latest selectable birthdate", () => {
    expect(latestBirthdate(NOW)).toBe("2026-09-21");
  });
});

/**
 * Issue #106: a manager could set an employee's date of birth to make them
 * 13. The rule itself was correct — 13 was the wrong number for someone
 * being employed, so the two minimums are now separate.
 *
 * These tests exist to stop them quietly becoming one again.
 */
describe("employee minimum age", () => {
  const employeeSchema = dateOfBirthSchemaFor(
    () => new Date(NOW),
    EMPLOYEE_MIN_AGE_YEARS,
  );

  const employeeMessage = (value: string) => {
    const result = employeeSchema.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  };

  it("is stricter than the customer minimum", () => {
    expect(EMPLOYEE_MIN_AGE_YEARS).toBeGreaterThan(MIN_AGE_YEARS);
  });

  it("rejects the 13-year-old the issue complained about", () => {
    // Exactly 13 on NOW — accepted for a customer, not for an employee.
    expect(firstMessage("2013-09-21")).toBeNull();
    expect(employeeMessage("2013-09-21")).toBe(EMPLOYEE_DOB_TOO_YOUNG_MESSAGE);
  });

  it("rejects someone one day short of 18", () => {
    expect(employeeMessage("2008-09-22")).toBe(EMPLOYEE_DOB_TOO_YOUNG_MESSAGE);
  });

  it("accepts someone exactly 18", () => {
    expect(employeeMessage("2008-09-21")).toBeNull();
  });

  it("says the age it actually enforces", () => {
    expect(EMPLOYEE_DOB_TOO_YOUNG_MESSAGE).toContain("18");
    expect(DOB_TOO_YOUNG_MESSAGE).toContain("13");
  });

  it("takes an age, not a date, as the picker bound", () => {
    // The trap this replaced: passing a Date as the first argument used to
    // be valid and produced a boundary near the Unix epoch.
    expect(latestBirthdateForMinAge(EMPLOYEE_MIN_AGE_YEARS, NOW)).toBe(
      "2008-09-21",
    );
    expect(latestBirthdateForMinAge(MIN_AGE_YEARS, NOW)).toBe("2013-09-21");
  });
});
