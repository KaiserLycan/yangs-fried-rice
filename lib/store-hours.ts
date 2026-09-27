/**
 * Opening hours, worked out in Manila time, to the minute.
 *
 * The hours themselves live in `store_setting` (issue #115), as
 * `open_time` / `close_time`, so a manager can set 6:30 AM or 7:31 PM
 * without a deploy; `get_store_status()` applies them in the database and
 * `lib/store/store-status.ts` reads the answer. What stays here is the pure
 * arithmetic, for tests, for the dashboard form and for the fallback when
 * that read fails.
 *
 * Times are "HH:MM" strings, 24-hour, the same shape the database returns
 * and `<input type="time">` reads and writes. "24:00" is allowed as a close
 * time and means end of day.
 */

export type StoreHours = {
  /** Open from this minute, "HH:MM". */
  openTime: string;
  /** Closed from this minute, "HH:MM". Later than openTime. */
  closeTime: string;
};

/** The hours before they were editable: 8am to 6pm. */
export const DEFAULT_STORE_HOURS: StoreHours = { openTime: "08:00", closeTime: "18:00" };

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$|^24:00$/;

/** Is this a valid "HH:MM" (00:00–23:59, or 24:00)? */
export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** "06:30" → 390 minutes after midnight. Null for anything malformed. */
export function minutesOfDay(value: string): number | null {
  if (!isValidTime(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since midnight in Manila, 0–1439. */
export function manilaMinutes(now: Date = new Date()): number {
  // Manila is UTC+8 all year (no daylight saving), so this needs no Intl.
  return ((now.getUTCHours() + 8) % 24) * 60 + now.getUTCMinutes();
}

/** Is the restaurant open at `now` for these hours? */
export function isRestaurantOpen(
  now: Date = new Date(),
  hours: StoreHours = DEFAULT_STORE_HOURS,
): boolean {
  const open = minutesOfDay(hours.openTime);
  const close = minutesOfDay(hours.closeTime);
  if (open === null || close === null) return false;
  const current = manilaMinutes(now);
  return current >= open && current < close;
}

/** Does the store close after it opens? The rule the database enforces. */
export function closesAfterOpening(hours: StoreHours): boolean {
  const open = minutesOfDay(hours.openTime);
  const close = minutesOfDay(hours.closeTime);
  return open !== null && close !== null && open < close;
}

/** "06:30" → "6:30 AM", "19:31" → "7:31 PM", "24:00" → "12:00 AM". */
export function formatTime(value: string): string {
  const minutes = minutesOfDay(value);
  if (minutes === null) return value;
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:${String(m).padStart(2, "0")} ${suffix}`;
}
