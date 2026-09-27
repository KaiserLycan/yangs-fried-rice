import { afterEach, describe, expect, it, vi } from "vitest";
import { isRestaurantOpen, nextOpeningLabel, STORE_HOURS_LABEL } from "./store-hours";

/**
 * The opening-hours rule, tested against a controlled clock rather than the
 * real one. `cart-contents.test.tsx` used to depend on the wall clock through
 * this function and failed every evening after 18:00 Manila.
 */
describe("isRestaurantOpen", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function atManilaHour(hour: number) {
    // Manila is UTC+8 and has no daylight saving.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 21, hour - 8, 30)));
  }

  it.each([8, 9, 12, 17])("is open at %s:30 Manila time", (hour) => {
    atManilaHour(hour);
    expect(isRestaurantOpen()).toBe(true);
  });

  it.each([0, 6, 7, 18, 19, 23])("is closed at %s:30 Manila time", (hour) => {
    atManilaHour(hour);
    expect(isRestaurantOpen()).toBe(false);
  });

  it("opens exactly at 08:00 and closes exactly at 18:00", () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(Date.UTC(2026, 8, 21, 0, 0))); // 08:00 Manila
    expect(isRestaurantOpen()).toBe(true);

    vi.setSystemTime(new Date(Date.UTC(2026, 8, 21, 9, 59))); // 17:59 Manila
    expect(isRestaurantOpen()).toBe(true);

    vi.setSystemTime(new Date(Date.UTC(2026, 8, 21, 10, 0))); // 18:00 Manila
    expect(isRestaurantOpen()).toBe(false);
  });
});

describe("nextOpeningLabel", () => {
  // Manila is UTC+8 and has no daylight saving.
  const atManila = (hour: number, minute = 0) => new Date(Date.UTC(2026, 8, 21, hour - 8, minute));

  it("says today before opening and tomorrow after closing", () => {
    expect(nextOpeningLabel(atManila(6, 30))).toBe("Opens today at 8:00 AM");
    expect(nextOpeningLabel(atManila(18, 0))).toBe("Opens tomorrow at 8:00 AM");
    expect(nextOpeningLabel(atManila(23, 59))).toBe("Opens tomorrow at 8:00 AM");
  });

  it("prints the hours the way the banner does", () => {
    expect(STORE_HOURS_LABEL).toBe("8:00 AM – 6:00 PM");
  });
});
