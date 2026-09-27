/**
 * Utility for determining if the restaurant is open based on Manila time.
 * Restaurant hours are 8am - 6pm (08:00 to 17:59).
 *
 * The hours live here and nowhere else, so moving them into `store_setting`
 * (#115) changes one file.
 */
export const OPENING_HOUR = 8;
export const CLOSING_HOUR = 18;

/** "8:00 AM", "6:00 PM" — how the hours are written everywhere on screen. */
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:00 ${suffix}`;
}

/** "8:00 AM – 6:00 PM". */
export const STORE_HOURS_LABEL = `${formatHour(OPENING_HOUR)} – ${formatHour(CLOSING_HOUR)}`;

function manilaHour(now: Date): number {
  const manilaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return manilaTime.getHours();
}

export function isRestaurantOpen(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const hour = manilaHour(new Date());
  // Open from 08:00 to 17:59
  return hour >= OPENING_HOUR && hour < CLOSING_HOUR;
}

/**
 * When a closed store opens next (UI/UX review, docs/user-simulation.md #16):
 * "Opens today at 8:00 AM" before opening, "Opens tomorrow at 8:00 AM" after
 * closing. Only meaningful while `isRestaurantOpen()` is false.
 */
export function nextOpeningLabel(now: Date = new Date()): string {
  const day = manilaHour(now) < OPENING_HOUR ? "today" : "tomorrow";
  return `Opens ${day} at ${formatHour(OPENING_HOUR)}`;
}
