import { describe, expect, it } from "vitest";
import {
  BUSY_MESSAGE,
  fallbackStoreStatus,
  formatStoreHours,
  parseStoreStatus,
  storeBlockFor,
  type StoreStatus,
} from "./store-status";

// Noon in Manila (UTC+8), inside the default 8–18.
const NOON_MANILA = new Date(Date.UTC(2026, 8, 28, 4, 0));
// 21:00 in Manila, after closing.
const NINE_PM_MANILA = new Date(Date.UTC(2026, 8, 28, 13, 0));

function status(overrides: Partial<StoreStatus> = {}): StoreStatus {
  return { ...fallbackStoreStatus(NOON_MANILA), ...overrides };
}

describe("parseStoreStatus", () => {
  it("maps the jsonb from get_store_status()", () => {
    const parsed = parseStoreStatus(
      {
        is_open: true,
        is_paused: true,
        paused_until: "2026-09-28T05:00:00+00:00",
        is_busy: false,
        active_orders: 7,
        max_active_orders: 25,
        open_hour: 9,
        close_hour: 21,
        extra_prep_minutes: 10,
        is_force_open: false,
      },
      NOON_MANILA,
    );

    expect(parsed).toEqual({
      isOpen: true,
      isPaused: true,
      pausedUntil: "2026-09-28T05:00:00+00:00",
      isBusy: false,
      activeOrders: 7,
      maxActiveOrders: 25,
      openHour: 9,
      closeHour: 21,
      extraPrepMinutes: 10,
      isForceOpen: false,
    });
  });

  it("falls back to the default hours when there is nothing to read", () => {
    expect(parseStoreStatus(null, NINE_PM_MANILA)).toEqual(
      fallbackStoreStatus(NINE_PM_MANILA),
    );
    expect(parseStoreStatus(null, NINE_PM_MANILA).isOpen).toBe(false);
  });

  it("falls back field by field when a value has the wrong type", () => {
    const parsed = parseStoreStatus({ is_open: "yes", open_hour: null }, NOON_MANILA);
    expect(parsed.isOpen).toBe(true); // noon, default hours
    expect(parsed.openHour).toBe(8);
  });
});

describe("storeBlockFor", () => {
  it("lets an open, unpaused, not-busy shop take orders", () => {
    expect(storeBlockFor(status())).toBeNull();
  });

  it("refuses when closed and says when it opens", () => {
    expect(storeBlockFor(status({ isOpen: false, openHour: 9 }))).toEqual({
      code: "STORE_CLOSED",
      message: "We're closed right now. We open at 9:00 AM.",
    });
  });

  it("refuses when paused", () => {
    expect(storeBlockFor(status({ isPaused: true }))).toEqual({
      code: "STORE_PAUSED",
      message: BUSY_MESSAGE,
    });
  });

  it("refuses when busy (auto-pause)", () => {
    expect(storeBlockFor(status({ isBusy: true }))).toEqual({
      code: "STORE_BUSY",
      message: BUSY_MESSAGE,
    });
  });

  it("reports closed before paused before busy", () => {
    expect(
      storeBlockFor(status({ isOpen: false, isPaused: true, isBusy: true }))?.code,
    ).toBe("STORE_CLOSED");
    expect(storeBlockFor(status({ isPaused: true, isBusy: true }))?.code).toBe(
      "STORE_PAUSED",
    );
  });
});

describe("formatStoreHours", () => {
  it("prints the hours as customers read them", () => {
    expect(formatStoreHours({ openHour: 8, closeHour: 18 })).toBe("8:00 AM – 6:00 PM");
    expect(formatStoreHours({ openHour: 0, closeHour: 24 })).toBe("12:00 AM – 12:00 AM");
  });
});
