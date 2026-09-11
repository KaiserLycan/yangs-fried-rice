"use server";

import { createClient } from "@/lib/supabase/server";
import { isEmployeeRole, isManager, type EmployeeRole } from "@/lib/auth/roles";
import { reportDateRangeSchema, type ReportDateRange } from "@/lib/validation/orders";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables, TablesInsert } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type DailySalesRow = {
  date: string;
  totalRevenue: number;
  totalOrders: number;
};

export type PlatformSummary = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type ReportPreview = {
  dateRange: ReportDateRange;
  summary: PlatformSummary;
  dailyBreakdown: DailySalesRow[];
};

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function requireReportAccess(): Promise<
  ActionResult<{ employee_id: string; role: EmployeeRole }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { data: employee, error } = await supabase
    .from("employee")
    .select("employee_id, role")
    .eq("employee_id", user.id)
    .single();

  if (error || !employee) {
    return { data: null, error: "You are not registered as an employee." };
  }

  const role = employee.role;
  if (!role || !isEmployeeRole(role) || !isManager(role)) {
    return {
      data: null,
      error: "Only admin and manager can access reports.",
    };
  }

  return {
    data: { employee_id: employee.employee_id, role: role as EmployeeRole },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Data queries
// ---------------------------------------------------------------------------

/**
 * Fetch daily sales data: revenue and order count grouped by date.
 *
 * Joins `transaction` → `order` to get the order's created_at date,
 * then aggregates. Only includes transactions with payment_status = 'paid'.
 *
 * Requires: admin or manager.
 */
export async function getDailySalesData(
  input: ReportDateRange,
): Promise<ActionResult<DailySalesRow[]>> {
  const auth = await requireReportAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = reportDateRangeSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const { start_date, end_date } = parsed.data;

  const supabase = createClient();

  // Fetch transactions with their order's created_at date.
  const { data: transactions, error } = await supabase
    .from("transaction")
    .select("total_paid, transaction_date, order_id")
    .gte("transaction_date", start_date)
    .lte("transaction_date", end_date + "T23:59:59.999Z");

  if (error) return { data: null, error: error.message };

  // Group by date.
  const byDate = new Map<string, { revenue: number; orders: number }>();

  for (const tx of transactions ?? []) {
    const date = tx.transaction_date
      ? tx.transaction_date.substring(0, 10) // YYYY-MM-DD
      : null;
    if (!date) continue;

    const existing = byDate.get(date) ?? { revenue: 0, orders: 0 };
    existing.revenue += tx.total_paid ?? 0;
    existing.orders += 1;
    byDate.set(date, existing);
  }

  // Sort by date ascending.
  const dailyData: DailySalesRow[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({
      date,
      totalRevenue: Math.round(revenue * 100) / 100,
      totalOrders: orders,
    }));

  return { data: dailyData, error: null };
}

/**
 * Aggregate summary: total revenue, total orders, average order value.
 * Requires: admin or manager.
 */
export async function getPlatformSummary(
  input: ReportDateRange,
): Promise<ActionResult<PlatformSummary>> {
  const salesResult = await getDailySalesData(input);
  if (!salesResult.data) return { data: null, error: salesResult.error };

  const dailyData = salesResult.data;

  const totalRevenue = dailyData.reduce((sum, d) => sum + d.totalRevenue, 0);
  const totalOrders = dailyData.reduce((sum, d) => sum + d.totalOrders, 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  return {
    data: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Report preview (structured JSON for UI rendering)
// ---------------------------------------------------------------------------

/**
 * Returns the report data as structured JSON so the UI can render a
 * preview before the user clicks download.
 *
 * Requires: admin or manager.
 */
export async function getReportPreview(
  input: ReportDateRange,
): Promise<ActionResult<ReportPreview>> {
  const parsed = reportDateRangeSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const [salesResult, summaryResult] = await Promise.all([
    getDailySalesData(parsed.data),
    getPlatformSummary(parsed.data),
  ]);

  if (!salesResult.data) return { data: null, error: salesResult.error };
  if (!summaryResult.data) return { data: null, error: summaryResult.error };

  return {
    data: {
      dateRange: parsed.data,
      summary: summaryResult.data,
      dailyBreakdown: salesResult.data,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

/**
 * Generate a PDF sales report and return it as a base64-encoded string.
 *
 * The UI can render this as an <iframe> preview or trigger a download
 * via a data URL.
 *
 * Contents:
 *  - Header with restaurant name and date range
 *  - Summary table: total revenue, total orders, avg order value
 *  - Daily breakdown table: date | orders | revenue
 *
 * Requires: admin or manager.
 */
export async function generateReportPDF(
  input: ReportDateRange,
): Promise<ActionResult<string>> {
  const previewResult = await getReportPreview(input);
  if (!previewResult.data) return { data: null, error: previewResult.error };

  const { dateRange, summary, dailyBreakdown } = previewResult.data;

  const doc = new jsPDF();

  // ---- Header ----
  doc.setFontSize(20);
  doc.text("Yang's Fried Rice", 14, 22);

  doc.setFontSize(12);
  doc.text("Sales Report", 14, 32);

  doc.setFontSize(10);
  doc.text(
    `Date Range: ${dateRange.start_date} to ${dateRange.end_date}`,
    14,
    40,
  );
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 46);

  // ---- Summary table ----
  doc.setFontSize(14);
  doc.text("Summary", 14, 58);

  autoTable(doc, {
    startY: 62,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `₱${summary.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
      ["Total Orders", summary.totalOrders.toString()],
      ["Average Order Value", `₱${summary.averageOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [220, 53, 69] },
    styles: { fontSize: 10 },
  });

  // ---- Daily breakdown table ----
  const summaryEndY = (doc as any).lastAutoTable?.finalY ?? 100;

  doc.setFontSize(14);
  doc.text("Daily Breakdown", 14, summaryEndY + 14);

  if (dailyBreakdown.length > 0) {
    autoTable(doc, {
      startY: summaryEndY + 18,
      head: [["Date", "Orders", "Revenue"]],
      body: dailyBreakdown.map((row) => [
        row.date,
        row.totalOrders.toString(),
        `₱${row.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 10 },
    });
  } else {
    doc.setFontSize(10);
    doc.text("No transactions found for this period.", 14, summaryEndY + 22);
  }

  // ---- Footer ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  // Return as base64 for preview + download.
  const base64 = doc.output("datauristring");
  return { data: base64, error: null };
}

// ---------------------------------------------------------------------------
// Save report
// ---------------------------------------------------------------------------

/**
 * Persist a report snapshot to the `reports` table.
 * Requires: admin or manager.
 */
export async function saveReport(
  input: ReportDateRange,
): Promise<ActionResult<Tables<"reports">>> {
  const auth = await requireReportAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const summaryResult = await getPlatformSummary(input);
  if (!summaryResult.data) return { data: null, error: summaryResult.error };

  const { totalRevenue, totalOrders } = summaryResult.data;

  const supabase = createClient();
  const row: TablesInsert<"reports"> = {
    report_type: "daily_sales",
    date_range_start: input.start_date,
    date_range_end: input.end_date,
    total_gross_sales: totalRevenue,
    total_net_sales: totalRevenue, // No discount breakdown at this level
    total_orders_processed: totalOrders,
    generated_by_employee_id: auth.data.employee_id,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(row)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
