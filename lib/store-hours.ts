/**
 * Opening hours, worked out in Manila time.
 *
 * The hours themselves live in `store_setting` now (issue #115), so a manager
 * can change them without a deploy; `get_store_status()` applies them in the
 * database and `lib/store/store-status.ts` reads the answer. What stays here
 * is the pure arithmetic, for tests and for the fallback when that read
 * fails.
 *
 * There used to be a `NODE_ENV === "development"` early return that made the
 * store always open locally — which also made the closed state impossible to
 * demo. `FORCE_STORE_OPEN` (see `lib/store/store-status.ts`) replaces it.
 */

export type StoreHours = {
  /** First open hour, 0–23. Open from `openHour`:00. */
  openHour: number;
  /** First closed hour, 1–24. Closed from `closeHour`:00. */
  closeHour: number;
};

/** The hours before they were editable: 8am to 6pm. */
export const DEFAULT_STORE_HOURS: StoreHours = { openHour: 8, closeHour: 18 };

/** The hour of the day in Manila, 0–23. */
export function manilaHour(now: Date = new Date()): number {
  // Manila is UTC+8 all year (no daylight saving), so this needs no Intl.
  return (now.getUTCHours() + 8) % 24;
}

/** Is the restaurant open at `now` for these hours? */
export function isRestaurantOpen(
  now: Date = new Date(),
  hours: StoreHours = DEFAULT_STORE_HOURS,
): boolean {
  const hour = manilaHour(now);
  return hour >= hours.openHour && hour < hours.closeHour;
}

/** An hour of the day as customers read it: 8 → "8:00 AM", 18 → "6:00 PM". */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "AM" : "PM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}:00 ${suffix}`;
}
