import {
  DEFAULT_STORE_HOURS,
  formatTime,
  isRestaurantOpen,
  isValidTime,
} from "@/lib/store-hours";

/**
 * Whether the shop can take an order right now, and why not (issue #115).
 *
 * The answer comes from `get_store_status()` in the database
 * (20260928000003_store_setting.sql), which applies the opening hours, the
 * manager's pause and the busy limit. This module is the pure half — types,
 * parsing and the customer-facing wording — so the client components that
 * draw the banners can import it. The read itself is in
 * `read-store-status.ts`, server-only, the same split as
 * `arrival-estimate.ts` / `read-arrival-quote.ts`.
 */

export type StoreStatus = {
  /** Inside opening hours, or forced open. */
  isOpen: boolean;
  /** A manager pressed "Pause" and it has not run out. */
  isPaused: boolean;
  /** When a timed pause ends (ISO), or null for "until resumed". */
  pausedUntil: string | null;
  /** Active orders have reached the limit: checkout waits (auto-pause). */
  isBusy: boolean;
  activeOrders: number;
  maxActiveOrders: number;
  /** "HH:MM", Manila. */
  openTime: string;
  /** "HH:MM", Manila; "24:00" means end of day. */
  closeTime: string;
  extraPrepMinutes: number;
  /** The manager's "Force open" switch in `store_setting`. */
  isForceOpen: boolean;
};

export type StoreBlockCode = "STORE_CLOSED" | "STORE_PAUSED" | "STORE_BUSY";

export const BUSY_MESSAGE =
  "We're very busy right now. Please try again in a few minutes.";

/**
 * What the status would be with no database to ask: the old hardcoded 8–18,
 * never paused, never busy. Used when the read fails, so a hiccup reading
 * settings shows the ordinary hours rather than locking every customer out.
 * The database still has the final say at checkout.
 */
export function fallbackStoreStatus(now: Date = new Date()): StoreStatus {
  return {
    isOpen: isRestaurantOpen(now, DEFAULT_STORE_HOURS),
    isPaused: false,
    pausedUntil: null,
    isBusy: false,
    activeOrders: 0,
    maxActiveOrders: 20,
    openTime: DEFAULT_STORE_HOURS.openTime,
    closeTime: DEFAULT_STORE_HOURS.closeTime,
    extraPrepMinutes: 0,
    isForceOpen: false,
  };
}

/**
 * Turns the jsonb `get_store_status()` returns into a `StoreStatus`. Anything
 * missing or the wrong type falls back field by field, so a column added
 * later cannot break the read.
 */
export function parseStoreStatus(raw: unknown, now: Date = new Date()): StoreStatus {
  const base = fallbackStoreStatus(now);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;

  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  const num = (v: unknown, d: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : d;
  const time = (v: unknown, d: string) =>
    typeof v === "string" && isValidTime(v) ? v : d;

  return {
    isOpen: bool(r.is_open, base.isOpen),
    isPaused: bool(r.is_paused, false),
    pausedUntil: typeof r.paused_until === "string" ? r.paused_until : null,
    isBusy: bool(r.is_busy, false),
    activeOrders: num(r.active_orders, 0),
    maxActiveOrders: num(r.max_active_orders, base.maxActiveOrders),
    openTime: time(r.open_time, base.openTime),
    closeTime: time(r.close_time, base.closeTime),
    extraPrepMinutes: num(r.extra_prep_minutes, 0),
    isForceOpen: bool(r.is_force_open, false),
  };
}

/**
 * Why checkout should refuse right now, in the words the customer sees, or
 * null when it may go ahead. Closed wins over paused, and paused over busy:
 * "we open at 8" is the more useful thing to hear at 9pm than "very busy".
 */
export function storeBlockFor(
  status: StoreStatus,
): { code: StoreBlockCode; message: string } | null {
  if (!status.isOpen) {
    return {
      code: "STORE_CLOSED",
      message: `We're closed right now. We open at ${formatTime(status.openTime)}.`,
    };
  }
  if (status.isPaused) return { code: "STORE_PAUSED", message: BUSY_MESSAGE };
  if (status.isBusy) return { code: "STORE_BUSY", message: BUSY_MESSAGE };
  return null;
}

/** "6:30 AM – 7:31 PM", for the closed banner. */
export function formatStoreHours(status: Pick<StoreStatus, "openTime" | "closeTime">): string {
  return `${formatTime(status.openTime)} – ${formatTime(status.closeTime)}`;
}
