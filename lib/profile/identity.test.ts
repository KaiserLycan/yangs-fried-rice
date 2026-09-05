import { describe, expect, it } from "vitest";
import { formatMemberSince, formatOrderCount, initialsFrom } from "./identity";

describe("initialsFrom", () => {
  it("takes the first letter of the first and last name", () => {
    expect(initialsFrom("Liza Reyes")).toBe("LR");
  });

  it("skips middle names rather than returning three letters", () => {
    expect(initialsFrom("Liza Marie Reyes")).toBe("LR");
  });

  it("returns a single letter for a single name", () => {
    expect(initialsFrom("Liza")).toBe("L");
  });

  it("upper-cases whatever it is given", () => {
    expect(initialsFrom("liza reyes")).toBe("LR");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(initialsFrom("   Liza    Reyes   ")).toBe("LR");
  });

  it("treats a hyphenated first name as one name", () => {
    expect(initialsFrom("Maria-Clara Santos")).toBe("MS");
  });

  // The avatar renders whatever comes back, so an unusable name has to
  // produce an empty string rather than a stray character.
  it("returns an empty string when there is no usable name", () => {
    expect(initialsFrom("")).toBe("");
    expect(initialsFrom("    ")).toBe("");
  });

  it("keeps a non-Latin first character intact", () => {
    expect(initialsFrom("李 明")).toBe("李明");
  });
});

describe("formatMemberSince", () => {
  it("renders the month name and year", () => {
    expect(formatMemberSince("2025-03-14T08:22:00Z")).toBe("March 2025");
  });

  // Read in a timezone behind UTC, the first of the month would otherwise
  // fall back into the previous one and report the wrong month.
  it("reads the date in UTC rather than the server's timezone", () => {
    expect(formatMemberSince("2025-03-01T00:00:00Z")).toBe("March 2025");
  });

  it("returns an empty string for a date it cannot parse", () => {
    expect(formatMemberSince("not a date")).toBe("");
    expect(formatMemberSince("")).toBe("");
  });

  it("returns an empty string when the date is missing entirely", () => {
    expect(formatMemberSince(undefined)).toBe("");
    expect(formatMemberSince(null)).toBe("");
  });
});

describe("formatOrderCount", () => {
  it("pluralises a count of several", () => {
    expect(formatOrderCount(24)).toBe("24 orders");
  });

  it("uses the singular for exactly one", () => {
    expect(formatOrderCount(1)).toBe("1 order");
  });

  // A customer who has never ordered still sees the line, so zero has to
  // read as a sentence rather than being special-cased away.
  it("pluralises zero", () => {
    expect(formatOrderCount(0)).toBe("0 orders");
  });
});
