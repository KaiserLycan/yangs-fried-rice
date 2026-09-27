/**
 * How well the kitchen kept the ready-by time it promised (FINALE 4.3).
 *
 * `order.promised_at` is quoted at checkout and never overwritten (2.5);
 * `order.ready_at` is when staff marked it ready. An order is on time when
 * it was ready by the promise, with a minute's grace for the tap itself.
 */
export type OnTimeSummary = {
  /** Orders with both times, i.e. the ones that can be judged. */
  measured: number;
  /** Percent on time, to one decimal; null when nothing was measured. */
  onTimeRate: number | null;
  /** Mean minutes past the promise, over the late ones only; null if none. */
  averageMinutesLate: number | null;
};

const GRACE_MS = 60_000;

export function summariseOnTime(
  rows: { promised_at: string | null; ready_at: string | null }[],
): OnTimeSummary {
  const lateness = rows
    .filter((row) => row.promised_at && row.ready_at)
    .map((row) => Date.parse(row.ready_at!) - Date.parse(row.promised_at!))
    .filter((ms) => Number.isFinite(ms));

  if (lateness.length === 0) {
    return { measured: 0, onTimeRate: null, averageMinutesLate: null };
  }
  const late = lateness.filter((ms) => ms > GRACE_MS);
  return {
    measured: lateness.length,
    onTimeRate: Math.round(((lateness.length - late.length) / lateness.length) * 1000) / 10,
    averageMinutesLate:
      late.length === 0
        ? null
        : Math.round(late.reduce((sum, ms) => sum + ms, 0) / late.length / 6000) / 10,
  };
}
