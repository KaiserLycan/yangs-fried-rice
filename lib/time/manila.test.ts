import { describe, expect, it } from "vitest";
import { addDays, manilaDateKey, manilaDayBounds, manilaDayEnd, manilaDayStart } from "./manila";

describe("Manila calendar days (Finding 14)", () => {
  it("starts and ends a day at Manila midnight, not UTC", () => {
    expect(manilaDayStart("2026-09-29")).toBe("2026-09-28T16:00:00.000Z");
    expect(manilaDayEnd("2026-09-29")).toBe("2026-09-29T15:59:59.999Z");
  });

  it("puts a 7:30 AM Manila order on its own day", () => {
    // 2026-09-28 23:30 UTC is 7:30 AM on the 29th in Manila.
    expect(manilaDateKey(new Date("2026-09-28T23:30:00Z"))).toBe("2026-09-29");
    expect(manilaDateKey(new Date("2026-09-29T15:59:00Z"))).toBe("2026-09-29");
    expect(manilaDateKey(new Date("2026-09-29T16:00:00Z"))).toBe("2026-09-30");
  });

  it("steps across month ends", () => {
    expect(addDays("2026-09-29", 3)).toBe("2026-10-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("bounds today and yesterday from any server clock", () => {
    const now = new Date("2026-09-28T23:30:00Z"); // 7:30 AM, 29 Sep, Manila
    expect(manilaDayBounds(0, now)).toEqual({
      start: "2026-09-28T16:00:00.000Z",
      end: "2026-09-29T15:59:59.999Z",
    });
    expect(manilaDayBounds(1, now).start).toBe("2026-09-27T16:00:00.000Z");
  });
});
