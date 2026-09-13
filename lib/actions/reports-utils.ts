import type { ReportFrequency } from "@/lib/validation/orders";

/**
 * Sales report grouping utilities.
 *
 * These are pure functions (no DB, no auth) extracted from
 * lib/actions/reports.ts so they can be exported without
 * triggering the "use server" async requirement.
 */

/** A single row in the sales breakdown (grouped by period). */
export type SalesRow = {
  period: string;
  totalRevenue: number;
  totalOrders: number;
};

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

/**
 * Get the ISO week number for a date.
 */
function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get the ISO year for a week number (handles year boundaries).
 */
function getISOWeekYear(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Map a YYYY-MM-DD date string to a period label based on the frequency.
 */
export function dateToPeriod(dateStr: string, frequency: ReportFrequency): string {
  switch (frequency) {
    case "daily":
      return dateStr; // YYYY-MM-DD
    case "weekly": {
      const week = getISOWeek(dateStr);
      const year = getISOWeekYear(dateStr);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly":
      return dateStr.substring(0, 7); // YYYY-MM
    case "yearly":
      return dateStr.substring(0, 4); // YYYY
  }
}

/**
 * Group daily rows into periods based on frequency.
 * This is a pure function that can be unit-tested independently.
 */
export function groupByFrequency(
  dailyRows: { date: string; totalRevenue: number; totalOrders: number }[],
  frequency: ReportFrequency,
): SalesRow[] {
  const byPeriod = new Map<string, { revenue: number; orders: number }>();

  for (const row of dailyRows) {
    const period = dateToPeriod(row.date, frequency);
    const existing = byPeriod.get(period) ?? { revenue: 0, orders: 0 };
    existing.revenue += row.totalRevenue;
    existing.orders += row.totalOrders;
    byPeriod.set(period, existing);
  }

  return Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { revenue, orders }]) => ({
      period,
      totalRevenue: Math.round(revenue * 100) / 100,
      totalOrders: orders,
    }));
}
