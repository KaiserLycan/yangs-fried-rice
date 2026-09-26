import { describe, expect, it, vi } from "vitest";
import { jsPDF } from "jspdf";
import { drawBarChart, drawHorizontalBarChart, ensureSpace } from "@/lib/reports/pdf-charts";
import { normalizeReportType, reportPdfFileName } from "@/lib/reports/report-types";

function spyDoc() {
  const doc = new jsPDF();
  const rect = vi.spyOn(doc, "rect");
  const text = vi.spyOn(doc, "text");
  return { doc, rect, text };
}

describe("drawBarChart", () => {
  it("draws one filled bar per non-zero value and returns the y below it", () => {
    const { doc, rect } = spyDoc();
    const endY = drawBarChart(doc, {
      x: 14,
      y: 40,
      width: 182,
      height: 50,
      title: "SALES",
      bars: [
        { label: "Mon", value: 100 },
        { label: "Tue", value: 0 },
        { label: "Wed", value: 300, highlight: true },
      ],
    });

    expect(rect).toHaveBeenCalledTimes(2);
    expect(endY).toBeGreaterThan(40 + 50);
  });

  it("scales the tallest bar to the full plot height", () => {
    const { doc, rect } = spyDoc();
    drawBarChart(doc, {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      title: "T",
      bars: [
        { label: "a", value: 50 },
        { label: "b", value: 100 },
      ],
    });
    const heights = rect.mock.calls.map((call) => call[3] as number);
    expect(heights[1]).toBeCloseTo(heights[0] * 2);
  });

  it("says so instead of drawing an empty plot", () => {
    const { doc, rect, text } = spyDoc();
    drawBarChart(doc, { x: 0, y: 0, width: 100, height: 50, title: "T", bars: [] });
    expect(rect).not.toHaveBeenCalled();
    expect(text).toHaveBeenCalledWith("No data for this period.", expect.any(Number), expect.any(Number), expect.anything());
  });

  it("thins the axis labels when there are many periods", () => {
    const { doc, text } = spyDoc();
    const bars = Array.from({ length: 30 }, (_, i) => ({ label: `D${i}`, value: i + 1 }));
    drawBarChart(doc, { x: 0, y: 0, width: 182, height: 50, title: "T", bars });
    const axisLabels = text.mock.calls.filter((call) => /^D\d+$/.test(String(call[0])));
    expect(axisLabels.length).toBeLessThanOrEqual(12);
    expect(axisLabels.length).toBeGreaterThan(0);
  });

  // P38: a 30-day report used to drop every value label.
  it("prints a value on every bar, rotated when the bars are thin", () => {
    const { doc, text } = spyDoc();
    const bars = Array.from({ length: 30 }, (_, i) => ({ label: `D${i}`, value: i + 1, valueLabel: `V${i}` }));
    drawBarChart(doc, { x: 0, y: 0, width: 182, height: 50, title: "T", bars });
    const valueLabels = text.mock.calls.filter((call) => /^V\d+$/.test(String(call[0])));
    expect(valueLabels).toHaveLength(30);
    for (const call of valueLabels) expect(call[3]).toMatchObject({ angle: 90 });
  });

  it("keeps value labels upright when the bars are wide", () => {
    const { doc, text } = spyDoc();
    const bars = Array.from({ length: 7 }, (_, i) => ({ label: `D${i}`, value: i + 1, valueLabel: `V${i}` }));
    drawBarChart(doc, { x: 0, y: 0, width: 182, height: 50, title: "T", bars });
    const valueLabels = text.mock.calls.filter((call) => /^V\d+$/.test(String(call[0])));
    expect(valueLabels).toHaveLength(7);
    for (const call of valueLabels) expect(call[3]).not.toHaveProperty("angle");
  });
});

describe("drawHorizontalBarChart", () => {
  it("draws a track and a bar for each row, with its value", () => {
    const { doc, rect, text } = spyDoc();
    drawHorizontalBarChart(doc, {
      x: 14,
      y: 40,
      width: 182,
      title: "TOP SELLERS",
      bars: [
        { label: "1. Yang Chow", value: 40 },
        { label: "2. Garlic Rice", value: 10 },
      ],
    });
    // Two tracks + two bars.
    expect(rect).toHaveBeenCalledTimes(4);
    expect(text).toHaveBeenCalledWith(
      "40",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "right" }),
    );
  });
});

describe("ensureSpace", () => {
  it("keeps drawing on this page while the block fits", () => {
    const doc = new jsPDF();
    expect(ensureSpace(doc, 100, 50)).toBe(100);
    expect(doc.getNumberOfPages()).toBe(1);
  });

  it("starts a new page when it would run into the footer", () => {
    const doc = new jsPDF();
    expect(ensureSpace(doc, 260, 50)).toBe(20);
    expect(doc.getNumberOfPages()).toBe(2);
  });
});

describe("report types", () => {
  it("maps only the known legacy names to the merged view", () => {
    expect(normalizeReportType("Menu & Customer Satisfaction")).toBe("Menu & Customer Satisfaction");
    expect(normalizeReportType("Customer Satisfaction")).toBe("Menu & Customer Satisfaction");
    expect(normalizeReportType("Menu Items reports")).toBe("Menu & Customer Satisfaction");
    expect(normalizeReportType("Sales and Order")).toBe("Sales and Order");
    expect(normalizeReportType(null)).toBe("Sales and Order");
    expect(normalizeReportType("Inventory")).toBe("Sales and Order");
  });

  it("names the download after the report", () => {
    expect(reportPdfFileName("Menu & Customer Satisfaction", "2026-09-01", "2026-09-26")).toBe(
      "yangs-menu-customer-satisfaction-2026-09-01-to-2026-09-26.pdf",
    );
    expect(reportPdfFileName("Sales and Order", "2026-09-01", "2026-09-26")).toBe(
      "yangs-sales-and-order-2026-09-01-to-2026-09-26.pdf",
    );
  });
});
