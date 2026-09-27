/**
 * Calendar days in Manila time (UTC+8, no daylight saving), whatever the
 * server's own clock is set to (user simulation Finding 14).
 *
 * The reports and dashboard used UTC midnight, which only lined up because
 * the shop opened at 8 AM Manila (= 00:00 UTC). An order at 7:30 AM Manila
 * on the 5th was counted on the 4th, and Vercel's servers run on UTC.
 */
const MANILA_OFFSET = "+08:00";
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** "2026-09-29" → the first instant of that day in Manila, as ISO. */
export function manilaDayStart(date: string): string {
  return new Date(`${date}T00:00:00${MANILA_OFFSET}`).toISOString();
}

/** "2026-09-29" → the last millisecond of that day in Manila, as ISO. */
export function manilaDayEnd(date: string): string {
  return new Date(`${date}T23:59:59.999${MANILA_OFFSET}`).toISOString();
}

/** The Manila calendar date an instant falls on, "YYYY-MM-DD". */
export function manilaDateKey(instant: Date = new Date()): string {
  return new Date(instant.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" plus (or minus) whole days. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Start and end (ISO) of the Manila day `offsetDays` before today. */
export function manilaDayBounds(offsetDays: number, now: Date = new Date()): { start: string; end: string } {
  const date = addDays(manilaDateKey(now), -offsetDays);
  return { start: manilaDayStart(date), end: manilaDayEnd(date) };
}
