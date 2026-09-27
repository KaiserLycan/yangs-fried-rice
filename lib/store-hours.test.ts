import { afterEach, describe, expect, it, vi } from "vitest";
import { formatHour, isRestaurantOpen, manilaHour } from "./store-hours";

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

describe("isRestaurantOpen with custom hours (store_setting, issue #115)", () => {
  const at = (hour: number) => new Date(Date.UTC(2026, 8, 21, hour - 8, 30));

  it("uses the hours it is given", () => {
    const hours = { openHour: 10, closeHour: 22 };
    expect(isRestaurantOpen(at(9), hours)).toBe(false);
    expect(isRestaurantOpen(at(10), hours)).toBe(true);
    expect(isRestaurantOpen(at(21), hours)).toBe(true);
    expect(isRestaurantOpen(at(22), hours)).toBe(false);
  });

  it("treats 0–24 as open all day", () => {
    const allDay = { openHour: 0, closeHour: 24 };
    expect(isRestaurantOpen(new Date(Date.UTC(2026, 8, 21, 16, 0)), allDay)).toBe(true); // 00:00 Manila
    expect(isRestaurantOpen(new Date(Date.UTC(2026, 8, 21, 15, 59)), allDay)).toBe(true); // 23:59 Manila
  });
});

describe("manilaHour", () => {
  it("is UTC+8, wrapping past midnight", () => {
    expect(manilaHour(new Date(Date.UTC(2026, 8, 21, 0, 0)))).toBe(8);
    expect(manilaHour(new Date(Date.UTC(2026, 8, 21, 16, 0)))).toBe(0);
    expect(manilaHour(new Date(Date.UTC(2026, 8, 21, 23, 0)))).toBe(7);
  });
});

describe("formatHour", () => {
  it.each([
    [0, "12:00 AM"],
    [8, "8:00 AM"],
    [12, "12:00 PM"],
    [18, "6:00 PM"],
    [24, "12:00 AM"],
  ])("formats %s as %s", (hour, text) => {
    expect(formatHour(hour)).toBe(text);
  });
});
