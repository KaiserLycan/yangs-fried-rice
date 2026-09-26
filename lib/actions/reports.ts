"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveEmployeeRole, isManager, type EmployeeRole } from "@/lib/auth/roles";
import {
  reportDateRangeSchema,
  salesReportQuerySchema,
  performanceReportQuerySchema,
  type ReportDateRange,
  type SalesReportQuery,
  type PerformanceReportQuery,
  type ReportFrequency,
} from "@/lib/validation/orders";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables, TablesInsert } from "@/types/database.types";
import { groupByFrequency } from "./reports-utils";
import { MENU_SATISFACTION_REPORT } from "@/lib/reports/report-types";
import {
  drawBarChart,
  drawHorizontalBarChart,
  ensureSpace,
  type ChartBar,
} from "@/lib/reports/pdf-charts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/** A single row in the sales breakdown (grouped by period). */
export type SalesRow = {
  period: string;
  totalRevenue: number;
  totalOrders: number;
};

/** Summary statistics for sales in a date range. */
export type SalesSummary = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  averageRevenuePerPeriod: number;
  averageOrdersPerPeriod: number;
};

/** Full sales report response. */
export type SalesReportData = {
  dateRange: { start_date: string; end_date: string };
  frequency: ReportFrequency;
  summary: SalesSummary;
  breakdown: SalesRow[];
};

/** Legacy type alias — kept for backward compatibility. */
export type DailySalesRow = SalesRow;

/** Legacy type alias — kept for backward compatibility. */
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

/** A ranked product in the top-selling list. */
export type TopSellingProduct = {
  rank: number;
  productName: string;
  quantitySold: number;
};

/** Revenue trend comparison. */
export type RevenueTrend = {
  previousPeriodRevenue: number;
  percentChange: number;
};

/** Full platform performance response. */
export type PlatformPerformanceData = {
  dateRange: { start_date: string; end_date: string };
  totalRegisteredCustomers: number;
  totalOrdersInRange: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  cancellationRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenueTrend: RevenueTrend;
  topSellingProducts: TopSellingProduct[];
  totalAvailableProducts: number;
  customerSatisfaction: CustomerSatisfaction;
};

/** Ratings customers left on their orders/dishes within the report range. */
export type CustomerSatisfaction = {
  /** Mean rating to one decimal, or null when nobody has rated anything yet. */
  averageRating: number | null;
  totalReviews: number;
  /** One entry per star, 5 → 1, so a chart can draw them in order. */
  distribution: { rating: number; count: number }[];
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

  const role = resolveEmployeeRole(employee.role);
  if (!role || !isManager(role)) {
    return {
      data: null,
      error: "Only admin and manager can access reports.",
    };
  }

  return {
    data: { employee_id: employee.employee_id, role },
    error: null,
  };
}


// ---------------------------------------------------------------------------
// Data queries — Sales Report (AC #4)
// ---------------------------------------------------------------------------

/**
 * Fetch daily transaction data from the database for a date range.
 * Returns raw per-day rows before frequency grouping.
 */
async function fetchDailyTransactionData(
  start_date: string,
  end_date: string,
): Promise<ActionResult<{ date: string; totalRevenue: number; totalOrders: number }[]>> {
  const auth = await requireReportAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();

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
      ? tx.transaction_date.substring(0, 10)
      : null;
    if (!date) continue;

    const existing = byDate.get(date) ?? { revenue: 0, orders: 0 };
    existing.revenue += tx.total_paid ?? 0;
    existing.orders += 1;
    byDate.set(date, existing);
  }

  const dailyData = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { revenue, orders }]) => ({
      date,
      totalRevenue: Math.round(revenue * 100) / 100,
      totalOrders: orders,
    }));

  return { data: dailyData, error: null };
}

/**
 * Fetch sales data with frequency grouping and average calculations.
 *
 * Enhanced version of the original getDailySalesData — supports
 * daily, weekly, monthly, yearly grouping.
 *
 * Requires: admin or manager.
 */
export async function getSalesReportData(
  input: SalesReportQuery,
): Promise<ActionResult<SalesReportData>> {
  const parsed = salesReportQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const { start_date, end_date, frequency } = parsed.data;

  const dailyResult = await fetchDailyTransactionData(start_date, end_date);
  if (!dailyResult.data) return { data: null, error: dailyResult.error };

  const breakdown = groupByFrequency(dailyResult.data, frequency);

  const totalRevenue = breakdown.reduce((sum, r) => sum + r.totalRevenue, 0);
  const totalOrders = breakdown.reduce((sum, r) => sum + r.totalOrders, 0);
  const averageOrderValue =
    totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;
  const periodCount = breakdown.length || 1; // avoid division by zero
  const averageRevenuePerPeriod =
    Math.round((totalRevenue / periodCount) * 100) / 100;
  const averageOrdersPerPeriod =
    Math.round((totalOrders / periodCount) * 100) / 100;

  return {
    data: {
      dateRange: { start_date, end_date },
      frequency,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue,
        averageRevenuePerPeriod,
        averageOrdersPerPeriod,
      },
      breakdown,
    },
    error: null,
  };
}

/**
 * Backward-compatible wrapper — original getDailySalesData signature.
 * Always uses "daily" frequency and returns the legacy shape.
 */
export async function getDailySalesData(
  input: ReportDateRange,
): Promise<ActionResult<DailySalesRow[]>> {
  const parsed = reportDateRangeSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const { start_date, end_date } = parsed.data;

  const dailyResult = await fetchDailyTransactionData(start_date, end_date);
  if (!dailyResult.data) return { data: null, error: dailyResult.error };

  // Map to legacy shape (period = date for daily).
  const rows: DailySalesRow[] = dailyResult.data.map((r) => ({
    period: r.date,
    totalRevenue: r.totalRevenue,
    totalOrders: r.totalOrders,
  }));

  return { data: rows, error: null };
}

/**
 * Aggregate summary: total revenue, total orders, average order value.
 * Backward-compatible — legacy shape.
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
// Data queries — Platform Performance (AC #3)
// ---------------------------------------------------------------------------

/**
 * Fetch platform performance metrics.
 *
 * Returns: customer count, order stats (completion/cancellation rates),
 * revenue summary, revenue trend vs previous period, and top-selling products.
 *
 * The `top_products` parameter controls how many products to return.
 * If fewer products exist than requested, all available are returned.
 *
 * Requires: admin or manager.
 */
export async function getPlatformPerformance(
  input: PerformanceReportQuery,
): Promise<ActionResult<PlatformPerformanceData>> {
  const parsed = performanceReportQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const { start_date, end_date, top_products } = parsed.data;

  const auth = await requireReportAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();

  // --- 1. Total registered customers (all-time) ---
  const { count: customerCount, error: customerError } = await supabase
    .from("customer")
    .select("customer_id", { count: "exact", head: true });

  if (customerError) return { data: null, error: customerError.message };

  // --- 2. Revenue from transactions in range ---
  const { data: transactions, error: txError } = await supabase
    .from("transaction")
    .select("total_paid")
    .gte("transaction_date", start_date)
    .lte("transaction_date", end_date + "T23:59:59.999Z");

  if (txError) return { data: null, error: txError.message };

  const totalRevenue = (transactions ?? []).reduce(
    (sum, tx) => sum + (tx.total_paid ?? 0),
    0,
  );
  const totalTransactions = transactions?.length ?? 0;

  // --- 3. Orders in range — count by status ---
  const { data: orders, error: orderError } = await supabase
    .from("order")
    .select("order_id, order_status")
    .gte("created_at", start_date)
    .lte("created_at", end_date + "T23:59:59.999Z");

  if (orderError) return { data: null, error: orderError.message };

  const totalOrdersInRange = orders?.length ?? 0;
  const completedOrders = (orders ?? []).filter(
    (o) => o.order_status === "completed",
  ).length;
  const cancelledOrders = (orders ?? []).filter(
    (o) => o.order_status === "cancelled",
  ).length;

  const completionRate =
    totalOrdersInRange > 0
      ? Math.round((completedOrders / totalOrdersInRange) * 10000) / 100
      : 0;
  const cancellationRate =
    totalOrdersInRange > 0
      ? Math.round((cancelledOrders / totalOrdersInRange) * 10000) / 100
      : 0;

  const averageOrderValue =
    totalTransactions > 0
      ? Math.round((totalRevenue / totalTransactions) * 100) / 100
      : 0;

  // --- 4. Top-selling products in range ---
  // Get order IDs in range first, then find order_items for those orders.
  const orderIds = (orders ?? []).map((o) => o.order_id);

  let topSellingProducts: TopSellingProduct[] = [];
  let totalAvailableProducts = 0;

  if (orderIds.length > 0) {
    const { data: orderItems, error: oiError } = await supabase
      .from("order_item")
      .select("product_id, quantity")
      .in("order_id", orderIds);

    if (oiError) return { data: null, error: oiError.message };

    // Aggregate by product_id.
    const productQty = new Map<string, number>();
    for (const item of orderItems ?? []) {
      if (!item.product_id) continue;
      productQty.set(
        item.product_id,
        (productQty.get(item.product_id) ?? 0) + item.quantity,
      );
    }

    totalAvailableProducts = productQty.size;

    // Sort and take top N.
    const sortedProducts = Array.from(productQty.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, top_products);

    // Fetch product names.
    if (sortedProducts.length > 0) {
      const productIds = sortedProducts.map(([id]) => id);
      const { data: products, error: prodError } = await supabase
        .from("product")
        .select("product_id, product_name")
        .in("product_id", productIds);

      if (prodError) return { data: null, error: prodError.message };

      const nameMap = new Map(
        (products ?? []).map((p) => [p.product_id, p.product_name]),
      );

      topSellingProducts = sortedProducts.map(([id, qty], index) => ({
        rank: index + 1,
        productName: nameMap.get(id) ?? "Unknown Product",
        quantitySold: qty,
      }));
    }
  }

  // --- 5. Revenue trend — compare to previous period of equal length ---
  const startMs = new Date(start_date).getTime();
  const endMs = new Date(end_date).getTime();
  const rangeLengthMs = endMs - startMs + 86400000; // inclusive day count * ms per day
  const prevEndDate = new Date(startMs - 86400000).toISOString().split("T")[0]; // day before start
  const prevStartDate = new Date(startMs - rangeLengthMs).toISOString().split("T")[0];

  const { data: prevTransactions, error: prevTxError } = await supabase
    .from("transaction")
    .select("total_paid")
    .gte("transaction_date", prevStartDate)
    .lte("transaction_date", prevEndDate + "T23:59:59.999Z");

  if (prevTxError) return { data: null, error: prevTxError.message };

  const previousPeriodRevenue = (prevTransactions ?? []).reduce(
    (sum, tx) => sum + (tx.total_paid ?? 0),
    0,
  );
  const percentChange =
    previousPeriodRevenue > 0
      ? Math.round(
          ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) *
            10000,
        ) / 100
      : totalRevenue > 0
        ? 100
        : 0;

  // --- 6. Customer satisfaction: ratings left in the range ---
  // A failure here must not sink the whole report, so it degrades to "no
  // ratings yet" instead of returning an error.
  const { data: reviewRows } = await supabase
    .from("review")
    .select("rating")
    .gte("created_at", start_date)
    .lte("created_at", end_date + "T23:59:59.999Z");

  const ratings = (reviewRows ?? [])
    .map((row) => row.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const customerSatisfaction: CustomerSatisfaction = {
    averageRating:
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
        : null,
    totalReviews: ratings.length,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: ratings.filter((r) => r === rating).length,
    })),
  };

  return {
    data: {
      dateRange: { start_date, end_date },
      totalRegisteredCustomers: customerCount ?? 0,
      totalOrdersInRange,
      completedOrders,
      cancelledOrders,
      completionRate,
      cancellationRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue,
      revenueTrend: {
        previousPeriodRevenue: Math.round(previousPeriodRevenue * 100) / 100,
        percentChange,
      },
      topSellingProducts,
      totalAvailableProducts,
      customerSatisfaction,
    },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Report preview (structured JSON for UI rendering) — backward compatible
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
// PDF styling & helpers
// ---------------------------------------------------------------------------

const PDF_COLORS = {
  brandRed: [140, 28, 19] as [number, number, number], // #8C1C13
  black: [26, 18, 16] as [number, number, number], // #1A1210 - ink black
  muted: [122, 106, 96] as [number, number, number], // #7A6A60 - neutral muted
  border: [221, 205, 184] as [number, number, number], // #DDCDB8 - surface sand
  tableHeaderBg: [245, 237, 226] as [number, number, number], // #F5EDE2 - soft cream
  tableAltRow: [251, 246, 236] as [number, number, number], // #FBF6EC - surface cream
  white: [255, 255, 255] as [number, number, number],
};

/** "12.3k" / "850" — short enough to sit above a narrow bar. */
function compactAmount(amount: number): string {
  return amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount.toFixed(0);
}

/**
 * One bar per breakdown row. Daily periods are ISO dates, shown as the
 * weekday with Fri–Sun highlighted, exactly like the dashboard chart; other
 * frequencies keep their period label.
 */
function salesChartBars(
  breakdown: { period: string; totalRevenue: number }[],
  frequency: string,
): ChartBar[] {
  return breakdown.map((row) => {
    const bar: ChartBar = {
      label: row.period,
      value: row.totalRevenue,
      valueLabel: compactAmount(row.totalRevenue),
    };
    if (frequency !== "daily") return bar;
    const date = new Date(`${row.period}T00:00:00`);
    if (Number.isNaN(date.getTime())) return bar;
    const day = date.getDay();
    return {
      ...bar,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      highlight: day === 0 || day === 5 || day === 6,
    };
  });
}

function formatPeso(amount: number): string {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function drawReportHeader(
  doc: jsPDF,
  title: string,
  dateRangeStr: string,
) {
  // Brand red banner block on the left (matching the reference image)
  doc.setFillColor(...PDF_COLORS.brandRed);
  doc.rect(14, 14, 115, 15, "F");

  // Bold white text inside banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(title.toUpperCase(), 20, 24);

  // Top right branch & date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text("Yang's Fried Rice · Malate Branch", 196, 19, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(dateRangeStr, 196, 25, { align: "right" });
}

function drawKeyValueGrid(
  doc: jsPDF,
  startY: number,
  rows: [{ label: string; value: string }, { label: string; value: string }][],
): number {
  let currentY = startY;

  for (const [col1, col2] of rows) {
    // Upper labels in muted uppercase bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(col1.label.toUpperCase(), 14, currentY);
    doc.text(col2.label.toUpperCase(), 110, currentY);

    // Primary values in bold black font
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(col1.value, 14, currentY + 5.5);
    doc.text(col2.value, 110, currentY + 5.5);

    // Subtle horizontal divider line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 9.5, 196, currentY + 9.5);

    currentY += 15;
  }

  return currentY;
}

function pdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(
      14,
      doc.internal.pageSize.getHeight() - 14,
      196,
      doc.internal.pageSize.getHeight() - 14,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(
      "Yang's Fried Rice · Confidential & Proprietary",
      14,
      doc.internal.pageSize.getHeight() - 9,
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      196,
      doc.internal.pageSize.getHeight() - 9,
      { align: "right" },
    );
  }
}

// ---------------------------------------------------------------------------
// PDF generation — Sales Report (AC #4)
// ---------------------------------------------------------------------------

/**
 * Generate a PDF for the sales report with frequency grouping.
 * Returns base64-encoded data URI string.
 *
 * Requires: admin or manager.
 */
export async function generateSalesPDF(
  input: SalesReportQuery,
): Promise<ActionResult<string>> {
  const reportResult = await getSalesReportData(input);
  if (!reportResult.data) return { data: null, error: reportResult.error };

  const { dateRange, frequency, summary, breakdown } = reportResult.data;
  const doc = new jsPDF();

  const frequencyLabel =
    frequency === "daily"
      ? "Day"
      : frequency === "weekly"
        ? "Week"
        : frequency === "monthly"
          ? "Month"
          : "Year";

  const dateLabel = `${dateRange.start_date} to ${dateRange.end_date}`;

  // 1. Header banner
  const title =
    frequency === "daily" ? "Daily Sales Report" : `${frequencyLabel}ly Sales Report`;
  drawReportHeader(doc, title, dateLabel);

  // 2. 2-column key-value metrics grid
  const nextY = drawKeyValueGrid(doc, 36, [
    [
      {
        label: `Total ${frequencyLabel}ly Sales`,
        value: formatPeso(summary.totalRevenue),
      },
      { label: "Branch", value: "001 Malate Branch" },
    ],
    [
      { label: "Date Range", value: dateLabel },
      {
        label: "Total Orders",
        value: `${summary.totalOrders.toLocaleString()} orders`,
      },
    ],
    [
      {
        label: "Average Order Value",
        value: formatPeso(summary.averageOrderValue),
      },
      {
        label: `Avg Revenue Per ${frequencyLabel}`,
        value: formatPeso(summary.averageRevenuePerPeriod),
      },
    ],
  ]);

  // 3. Chart — the same picture as the screen, so the export is not just a table.
  const chartEndY = drawBarChart(doc, {
    x: 14,
    y: nextY + 7,
    width: 182,
    height: 55,
    title: `SALES PER ${frequencyLabel.toUpperCase()} (PHP)`,
    bars: salesChartBars(breakdown, frequency),
  });

  // 4. Table Title
  const tableY = ensureSpace(doc, chartEndY, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(
    `PARTICULARS OF SALES BREAKDOWN (${frequencyLabel.toUpperCase()})`,
    14,
    tableY,
  );

  // 5. Table with autoTable
  if (breakdown.length > 0) {
    autoTable(doc, {
      startY: tableY + 4,
      head: [["#", "PERIOD", "ORDERS", "TOTAL SALES"]],
      body: breakdown.map((row, idx) => [
        (idx + 1).toString(),
        row.period,
        row.totalOrders.toString(),
        formatPeso(row.totalRevenue),
      ]),
      theme: "plain",
      headStyles: {
        fillColor: PDF_COLORS.tableHeaderBg,
        textColor: PDF_COLORS.black,
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.2,
        lineColor: PDF_COLORS.border,
      },
      bodyStyles: {
        textColor: PDF_COLORS.black,
        fontSize: 8.5,
        lineWidth: 0.1,
        lineColor: PDF_COLORS.border,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.tableAltRow,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { halign: "left" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text("No transactions found for this period.", 14, tableY + 9);
  }

  pdfFooter(doc);

  const base64 = doc.output("datauristring");
  return { data: base64, error: null };
}

// ---------------------------------------------------------------------------
// PDF generation — Platform Performance (AC #3)
// ---------------------------------------------------------------------------

/**
 * Generate the PDF for the Menu & Customer Satisfaction report — the only
 * non-sales view on /manage/reports. The function keeps its old name because
 * the API routes call it; the document itself is titled after the report the
 * manager picked, not "Platform Performance Report".
 * Returns base64-encoded data URI string.
 *
 * Requires: admin or manager.
 */
export async function generatePerformancePDF(
  input: PerformanceReportQuery,
): Promise<ActionResult<string>> {
  const perfResult = await getPlatformPerformance(input);
  if (!perfResult.data) return { data: null, error: perfResult.error };

  const data = perfResult.data;
  const doc = new jsPDF();

  const dateLabel = `${data.dateRange.start_date} to ${data.dateRange.end_date}`;

  // 1. Header banner
  drawReportHeader(doc, `${MENU_SATISFACTION_REPORT} Report`, dateLabel);

  // 2. 2-column key-value metrics grid
  const trendSign = data.revenueTrend.percentChange >= 0 ? "+" : "";
  const nextY = drawKeyValueGrid(doc, 36, [
    [
      { label: "Total Revenue", value: formatPeso(data.totalRevenue) },
      { label: "Branch", value: "001 Malate Branch" },
    ],
    [
      {
        label: "Registered Customers",
        value: `${data.totalRegisteredCustomers.toLocaleString()} customers`,
      },
      {
        label: "Total Orders in Range",
        value: `${data.totalOrdersInRange.toLocaleString()} orders`,
      },
    ],
    [
      {
        label: "Completion Rate",
        value: `${data.completionRate}% (${data.completedOrders} completed)`,
      },
      {
        label: "Cancellation Rate",
        value: `${data.cancellationRate}% (${data.cancelledOrders} cancelled)`,
      },
    ],
    [
      {
        label: "Average Order Value",
        value: formatPeso(data.averageOrderValue),
      },
      {
        label: "Revenue Trend (vs Prior)",
        value: `${trendSign}${data.revenueTrend.percentChange}% (Prior: ${formatPeso(data.revenueTrend.previousPeriodRevenue)})`,
      },
    ],
    [
      {
        label: "Customer Rating",
        value:
          data.customerSatisfaction.averageRating === null
            ? "No ratings yet"
            : `${data.customerSatisfaction.averageRating} / 5 (${data.customerSatisfaction.totalReviews} reviews)`,
      },
      {
        label: "5-Star Reviews",
        value: `${data.customerSatisfaction.distribution.find((d) => d.rating === 5)?.count ?? 0}`,
      },
    ],
  ]);

  // 3. Charts — top sellers, then how customers rated the food.
  const productsY = ensureSpace(doc, nextY + 7, 20 + data.topSellingProducts.length * 7);
  const productsEndY = drawHorizontalBarChart(doc, {
    x: 14,
    y: productsY,
    width: 182,
    title: "TOP SELLERS BY QUANTITY",
    bars: data.topSellingProducts.map((p, i) => ({
      label: `${p.rank}. ${p.productName}`,
      value: p.quantitySold,
      highlight: i === 0,
    })),
  });

  const ratingsY = ensureSpace(doc, productsEndY, 20 + 5 * 7);
  const ratingsEndY = drawHorizontalBarChart(doc, {
    x: 14,
    y: ratingsY,
    width: 182,
    labelWidth: 30,
    title:
      data.customerSatisfaction.averageRating === null
        ? "CUSTOMER RATINGS"
        : `CUSTOMER RATINGS (AVERAGE ${data.customerSatisfaction.averageRating} / 5)`,
    bars:
      data.customerSatisfaction.totalReviews > 0
        ? data.customerSatisfaction.distribution.map((d) => ({
            label: `${d.rating} star${d.rating === 1 ? "" : "s"}`,
            value: d.count,
            highlight: d.rating === 5,
          }))
        : [],
  });

  // 4. Table Title
  const tableY = ensureSpace(doc, ratingsEndY, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(
    `TOP ${data.topSellingProducts.length} SELLING PRODUCTS`,
    14,
    tableY,
  );

  // 5. Table with autoTable
  if (data.topSellingProducts.length > 0) {
    autoTable(doc, {
      startY: tableY + 4,
      head: [["#", "PRODUCT NAME", "QUANTITY SOLD"]],
      body: data.topSellingProducts.map((p) => [
        p.rank.toString(),
        p.productName,
        p.quantitySold.toString(),
      ]),
      theme: "plain",
      headStyles: {
        fillColor: PDF_COLORS.tableHeaderBg,
        textColor: PDF_COLORS.black,
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.2,
        lineColor: PDF_COLORS.border,
      },
      bodyStyles: {
        textColor: PDF_COLORS.black,
        fontSize: 8.5,
        lineWidth: 0.1,
        lineColor: PDF_COLORS.border,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.tableAltRow,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { halign: "left" },
        2: { halign: "right" },
      },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text("No product sales found for this period.", 14, tableY + 9);
  }

  pdfFooter(doc);

  const base64 = doc.output("datauristring");
  return { data: base64, error: null };
}

// ---------------------------------------------------------------------------
// Legacy PDF generation — backward compatible
// ---------------------------------------------------------------------------

/**
 * Generate a PDF sales report and return it as a base64-encoded string.
 *
 * This is the original function kept for backward compatibility.
 * New code should use generateSalesPDF or generatePerformancePDF.
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
  const dateLabel = `${dateRange.start_date} to ${dateRange.end_date}`;

  drawReportHeader(doc, "Sales Report", dateLabel);

  const nextY = drawKeyValueGrid(doc, 36, [
    [
      { label: "Total Revenue", value: formatPeso(summary.totalRevenue) },
      { label: "Branch", value: "001 Malate Branch" },
    ],
    [
      { label: "Date Range", value: dateLabel },
      {
        label: "Total Orders",
        value: `${summary.totalOrders.toLocaleString()} orders`,
      },
    ],
    [
      {
        label: "Average Order Value",
        value: formatPeso(summary.averageOrderValue),
      },
      { label: "Report Type", value: "Daily Summary" },
    ],
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text("PARTICULARS OF DAILY BREAKDOWN", 14, nextY + 7);

  if (dailyBreakdown.length > 0) {
    autoTable(doc, {
      startY: nextY + 11,
      head: [["#", "DATE", "ORDERS", "REVENUE"]],
      body: dailyBreakdown.map((row, idx) => [
        (idx + 1).toString(),
        row.period,
        row.totalOrders.toString(),
        formatPeso(row.totalRevenue),
      ]),
      theme: "plain",
      headStyles: {
        fillColor: PDF_COLORS.tableHeaderBg,
        textColor: PDF_COLORS.black,
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.2,
        lineColor: PDF_COLORS.border,
      },
      bodyStyles: {
        textColor: PDF_COLORS.black,
        fontSize: 8.5,
        lineWidth: 0.1,
        lineColor: PDF_COLORS.border,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.tableAltRow,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { halign: "left" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text("No transactions found for this period.", 14, nextY + 16);
  }

  pdfFooter(doc);

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
