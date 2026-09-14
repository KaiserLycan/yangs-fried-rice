import { NextResponse } from "next/server";
import {
  getDailySalesData as getDailySalesAction,
  getPlatformSummary as getPlatformSummaryAction,
  getReportPreview as getReportPreviewAction,
  generateReportPDF as generateReportPDFAction,
  saveReport as saveReportAction,
  getSalesReportData as getSalesReportAction,
  generateSalesPDF as generateSalesPDFAction,
  getPlatformPerformance as getPlatformPerformanceAction,
  generatePerformancePDF as generatePerformancePDFAction,
} from "@/lib/actions/reports";

function errorToStatus(error: string): number {
  if (error.includes("must be signed in") || error.includes("not registered")) {
    return 401;
  }
  if (error.includes("permission") || error.includes("Only admin")) {
    return 403;
  }
  return 400;
}

function parseDateRangeParams(url: string) {
  const { searchParams } = new URL(url);
  const startDate =
    searchParams.get("startDate") ?? searchParams.get("start_date");
  const endDate =
    searchParams.get("endDate") ?? searchParams.get("end_date");

  return {
    ...(startDate && startDate.trim() ? { start_date: startDate.trim() } : {}),
    ...(endDate && endDate.trim() ? { end_date: endDate.trim() } : {}),
  };
}

/**
 * GET /api/reports/sales
 * Query sales metrics with frequency grouping.
 * Query params:
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 *   ?frequency=daily|weekly|monthly|yearly (default: daily)
 * Requires: admin or manager.
 */
export async function getDailySales(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = parseDateRangeParams(request.url);
  const frequency = searchParams.get("frequency") ?? undefined;

  const input = {
    ...range,
    ...(frequency ? { frequency } : {}),
  };

  const result = await getSalesReportAction(input as any);

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * GET /api/reports/summary
 * Aggregated platform performance summary.
 * Query params: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD (defaults to today)
 * Requires: admin or manager.
 */
export async function getPlatformSummary(request: Request) {
  const range = parseDateRangeParams(request.url);
  const result = await getPlatformSummaryAction(range as any);

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * GET /api/reports/preview
 * Combined summary and daily breakdown for report preview before export.
 * Query params: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Requires: admin or manager.
 */
export async function getReportPreview(request: Request) {
  const range = parseDateRangeParams(request.url);
  const result = await getReportPreviewAction(range as any);

  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * GET /api/reports/pdf
 * Generate PDF sales report (legacy — uses daily frequency).
 * Query params:
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 *   ?format=raw (optional: if 'raw', returns application/pdf binary file)
 * Requires: admin or manager.
 */
export async function generateReportPDF(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const range = parseDateRangeParams(request.url);

  const result = await generateReportPDFAction(range as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  if (format === "raw") {
    const base64Content = result.data.split(",")[1] ?? "";
    const buffer = Buffer.from(base64Content, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sales-report-${range.start_date || "today"}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    data: {
      pdf: result.data,
      format: "datauristring",
    },
  });
}

/**
 * GET /api/reports/sales/pdf
 * Generate PDF sales report with frequency grouping.
 * Query params:
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 *   ?frequency=daily|weekly|monthly|yearly (default: daily)
 *   ?format=raw (optional: returns application/pdf binary)
 * Requires: admin or manager.
 */
export async function generateSalesPDF(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const range = parseDateRangeParams(request.url);
  const frequency = searchParams.get("frequency") ?? undefined;

  const input = {
    ...range,
    ...(frequency ? { frequency } : {}),
  };

  const result = await generateSalesPDFAction(input as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  if (format === "raw") {
    const base64Content = result.data.split(",")[1] ?? "";
    const buffer = Buffer.from(base64Content, "base64");
    const freq = frequency || "daily";

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sales-report-${freq}-${range.start_date || "today"}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    data: {
      pdf: result.data,
      format: "datauristring",
    },
  });
}

/**
 * GET /api/reports/performance
 * Platform performance metrics.
 * Query params:
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 *   ?top_products=5 (integer 1-50, default: 5)
 * Requires: admin or manager.
 */
export async function getPlatformPerformance(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = parseDateRangeParams(request.url);
  const topProducts = searchParams.get("top_products") ?? undefined;

  const input = {
    ...range,
    ...(topProducts ? { top_products: topProducts } : {}),
  };

  const result = await getPlatformPerformanceAction(input as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * GET /api/reports/performance/pdf
 * Generate PDF platform performance report.
 * Query params:
 *   ?start_date=YYYY-MM-DD
 *   ?end_date=YYYY-MM-DD
 *   ?top_products=5 (integer 1-50, default: 5)
 *   ?format=raw (optional: returns application/pdf binary)
 * Requires: admin or manager.
 */
export async function generatePerformancePDF(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const range = parseDateRangeParams(request.url);
  const topProducts = searchParams.get("top_products") ?? undefined;

  const input = {
    ...range,
    ...(topProducts ? { top_products: topProducts } : {}),
  };

  const result = await generatePerformancePDFAction(input as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  if (format === "raw") {
    const base64Content = result.data.split(",")[1] ?? "";
    const buffer = Buffer.from(base64Content, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="performance-report-${range.start_date || "today"}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    data: {
      pdf: result.data,
      format: "datauristring",
    },
  });
}

/**
 * POST /api/reports
 * Save report snapshot to database.
 * Body: { start_date?: string, end_date?: string }
 * Requires: admin or manager.
 */
export async function saveReport(request: Request) {
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const result = await saveReportAction(body as any);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json(
    { message: "Report saved successfully", data: result.data },
    { status: 201 }
  );
}
