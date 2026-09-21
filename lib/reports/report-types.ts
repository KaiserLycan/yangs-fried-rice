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

/**
 * Old bookmarked URLs (`?type=Menu Items reports`, `?type=Customer
 * Satisfaction`) land on the merged view instead of an empty report.
 */
export function normalizeReportType(raw: string | null | undefined): ReportType {
  if (!raw || raw === SALES_REPORT) return SALES_REPORT;
  return MENU_SATISFACTION_REPORT;
}
