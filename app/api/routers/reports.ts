import { NextResponse } from "next/server";
import {
  getDailySalesData as getDailySalesAction,
  getPlatformSummary as getPlatformSummaryAction,
  getReportPreview as getReportPreviewAction,
  generateReportPDF as generateReportPDFAction,
  saveReport as saveReportAction,
} from "@/lib/actions/reports";

function errorToStatus(error: string): number {
  if (error.includes("must be signed in") || error.includes("not registered")) {
    return 401;
  }
  if (error.includes("permission")) {
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
 * Query daily sales metrics.
 * Query params: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD (defaults to today)
 * Requires: admin or manager.
 */
export async function getDailySales(request: Request) {
  const range = parseDateRangeParams(request.url);
  const result = await getDailySalesAction(range as any);

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
 * Generate PDF sales report.
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
    // result.data is a datauristring: "data:application/pdf;filename=...;base64,..."
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
