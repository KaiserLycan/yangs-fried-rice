import { describe, expect, it } from "vitest";
import { manilaDayStart } from "./status-counts";

describe("manilaDayStart", () => {
  it("is midnight Manila (16:00 UTC the day before)", () => {
    // 10:00 Manila on the 28th.
    expect(manilaDayStart(new Date("2026-09-28T02:00:00.000Z"))).toBe("2026-09-27T16:00:00.000Z");
  });

  it("rolls over at Manila midnight, not UTC midnight", () => {
    // 00:30 Manila on the 29th is still the 28th in UTC.
    expect(manilaDayStart(new Date("2026-09-28T16:30:00.000Z"))).toBe("2026-09-28T16:00:00.000Z");
    // 23:59 Manila on the 28th.
    expect(manilaDayStart(new Date("2026-09-28T15:59:00.000Z"))).toBe("2026-09-27T16:00:00.000Z");
  });
});
