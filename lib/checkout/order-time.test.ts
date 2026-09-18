import { describe, expect, it } from "vitest";
import { formatOrderTime } from "./order-time";

describe("formatOrderTime", () => {
  // The frames draw "Aug 30, 6:40 PM". 10:40 UTC is 18:40 in Manila.
  it("matches the shape the frames draw", () => {
    const formatted = formatOrderTime(new Date("2026-08-30T10:40:00Z"));

    expect(formatted).toMatch(/^Aug 30, 6:40\s?[Pp]\.?[Mm]\.?$/);
  });

  // A UTC server would otherwise print a time eight hours behind the
  // kitchen's own clock — and on the wrong day either side of midnight.
  it("reads in Manila time, not the machine's time zone", () => {
    const formatted = formatOrderTime(new Date("2026-08-30T17:00:00Z"));

    expect(formatted).toContain("Aug 31");
    expect(formatted).toContain("1:00");
  });
});
