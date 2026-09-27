import { afterEach, describe, expect, it, vi } from "vitest";
import {
  closesAfterOpening,
  formatTime,
  isRestaurantOpen,
  isValidTime,
  manilaMinutes,
  minutesOfDay,
} from "./store-hours";

/**
 * The opening-hours rule, tested against a controlled clock rather than the
 * real one. `cart-contents.test.tsx` used to depend on the wall clock through
 * this function and failed every evening after 18:00 Manila.
 */
describe("isRestaurantOpen (default 08:00–18:00)", () => {
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

describe("isRestaurantOpen to the minute (issue #115)", () => {
  // A Manila clock time on a fixed day.
  const at = (h: number, m: number) => new Date(Date.UTC(2026, 8, 21, h - 8, m));
  const hours = { openTime: "06:30", closeTime: "19:31" };

  it("opens at the exact minute", () => {
    expect(isRestaurantOpen(at(6, 29), hours)).toBe(false);
    expect(isRestaurantOpen(at(6, 30), hours)).toBe(true);
  });

  it("closes at the exact minute", () => {
    expect(isRestaurantOpen(at(19, 30), hours)).toBe(true);
    expect(isRestaurantOpen(at(19, 31), hours)).toBe(false);
  });

  it("treats 00:00–24:00 as open all day", () => {
    const allDay = { openTime: "00:00", closeTime: "24:00" };
    expect(isRestaurantOpen(new Date(Date.UTC(2026, 8, 21, 16, 0)), allDay)).toBe(true); // 00:00
    expect(isRestaurantOpen(new Date(Date.UTC(2026, 8, 21, 15, 59)), allDay)).toBe(true); // 23:59
  });

  it("is closed when the hours are malformed", () => {
    expect(isRestaurantOpen(at(12, 0), { openTime: "8am", closeTime: "18:00" })).toBe(false);
  });
});

describe("time helpers", () => {
  it("validates HH:MM", () => {
    expect(isValidTime("06:30")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(true);
    expect(isValidTime("24:01")).toBe(false);
    expect(isValidTime("6:30")).toBe(false);
    expect(isValidTime("12:60")).toBe(false);
  });

  it("converts to minutes of the day", () => {
    expect(minutesOfDay("06:30")).toBe(390);
    expect(minutesOfDay("24:00")).toBe(1440);
    expect(minutesOfDay("nope")).toBeNull();
  });

  it("reads Manila minutes, wrapping past midnight", () => {
    expect(manilaMinutes(new Date(Date.UTC(2026, 8, 21, 0, 15)))).toBe(8 * 60 + 15);
    expect(manilaMinutes(new Date(Date.UTC(2026, 8, 21, 16, 5)))).toBe(5);
  });

  it("checks that the store closes after it opens", () => {
    expect(closesAfterOpening({ openTime: "06:30", closeTime: "19:31" })).toBe(true);
    expect(closesAfterOpening({ openTime: "19:31", closeTime: "06:30" })).toBe(false);
    expect(closesAfterOpening({ openTime: "08:00", closeTime: "08:00" })).toBe(false);
  });

  it.each([
    ["00:00", "12:00 AM"],
    ["06:30", "6:30 AM"],
    ["12:00", "12:00 PM"],
    ["19:31", "7:31 PM"],
    ["24:00", "12:00 AM"],
  ])("formats %s as %s", (value, text) => {
    expect(formatTime(value)).toBe(text);
  });
});
