/**
 * The report views on /manage/reports.
 *
 * "Menu Items reports" and "Customer Satisfaction" used to be two separate
 * tabs that drew nearly the same data (the satisfaction one had no ratings at
 * all). They are one view now: how the menu is selling and how customers rate
 * it belong side by side.
 */

export const SALES_REPORT = "Sales and Order";
export const MENU_SATISFACTION_REPORT = "Menu & Customer Satisfaction";

export const REPORT_TYPES = [SALES_REPORT, MENU_SATISFACTION_REPORT] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

/** Names the merged view used to go by, still found in bookmarked URLs. */
const LEGACY_MENU_SATISFACTION_TYPES = ["Menu Items reports", "Customer Satisfaction"];

/**
 * Old bookmarked URLs (`?type=Menu Items reports`, `?type=Customer
 * Satisfaction`) land on the merged view instead of an empty report.
 *
 * Only those names do. Anything else unrecognised used to fall through to
 * Menu & Satisfaction too, so a typo'd or future report type silently
 * rendered — and exported — the wrong report. It now gets the default view.
 */
export function normalizeReportType(raw: string | null | undefined): ReportType {
  if (raw === MENU_SATISFACTION_REPORT) return MENU_SATISFACTION_REPORT;
  if (raw && LEGACY_MENU_SATISFACTION_TYPES.includes(raw)) return MENU_SATISFACTION_REPORT;
  return SALES_REPORT;
}

/**
 * The downloaded file's name, e.g.
 * `yangs-menu-customer-satisfaction-2026-09-01-to-2026-09-26.pdf`, so two
 * exports of different reports over the same dates no longer collide.
 */
export function reportPdfFileName(type: ReportType, startDate: string, endDate: string): string {
  const slug = type
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `yangs-${slug}-${startDate}-to-${endDate}.pdf`;
}
