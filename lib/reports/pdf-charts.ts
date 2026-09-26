import type { jsPDF } from "jspdf";

/**
 * Charts for the exported report PDFs, drawn with jsPDF's own shapes.
 *
 * The PDFs are built in a server action, where there is no canvas to render
 * the on-screen Recharts charts into, so these are plain rectangles and text
 * — vector output that stays sharp at any zoom and adds a few hundred bytes,
 * not an embedded screenshot. They mirror the screen: the same brand reds as
 * `sales-chart.tsx`, bars with value labels, weekends highlighted.
 *
 * Every function takes the top-left corner and returns the y just below
 * what it drew, so a report lays sections out top to bottom.
 */

type RGB = [number, number, number];

export const CHART_COLORS = {
  bar: [191, 67, 66] as RGB, //  #bf4342 — matches sales-chart.tsx
  highlight: [140, 28, 19] as RGB, // #8c1c13
  axis: [221, 205, 184] as RGB, // #ddcdb8 — field-border
  label: [122, 106, 96] as RGB, // #7a6a60
  ink: [26, 18, 16] as RGB,
  track: [246, 233, 217] as RGB, // #f6e9d9
};

export type ChartBar = {
  label: string;
  value: number;
  /** Printed above (or beside) the bar; defaults to the raw value. */
  valueLabel?: string;
  highlight?: boolean;
};

const TITLE_GAP = 6;

function drawTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...CHART_COLORS.ink);
  doc.text(title, x, y);
}

/**
 * A vertical bar chart — sales over time.
 *
 * With many bars the period labels would run together, so only every nth is
 * printed; value labels are dropped entirely once a bar is too thin to hold
 * one, the same rule the on-screen chart follows.
 */
export function drawBarChart(
  doc: jsPDF,
  options: { x: number; y: number; width: number; height: number; title: string; bars: ChartBar[] },
): number {
  const { x, y, width, height, title, bars } = options;
  drawTitle(doc, title, x, y);

  const plotTop = y + TITLE_GAP + 6; // room for value labels above the tallest bar
  const plotBottom = y + TITLE_GAP + height;
  const plotHeight = plotBottom - plotTop;

  doc.setDrawColor(...CHART_COLORS.axis);
  doc.setLineWidth(0.3);
  doc.line(x, plotBottom, x + width, plotBottom);

  if (bars.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...CHART_COLORS.label);
    doc.text("No data for this period.", x + width / 2, plotTop + plotHeight / 2, { align: "center" });
    return plotBottom + 10;
  }

  const max = Math.max(...bars.map((b) => b.value), 0);
  const slot = width / bars.length;
  const barWidth = Math.min(slot * 0.7, 18);
  const labelEvery = Math.max(1, Math.ceil(bars.length / 12));
  const showValues = slot >= 11;

  bars.forEach((bar, i) => {
    const barHeight = max > 0 ? (bar.value / max) * plotHeight : 0;
    const bx = x + i * slot + (slot - barWidth) / 2;
    const by = plotBottom - barHeight;

    if (barHeight > 0) {
      doc.setFillColor(...(bar.highlight ? CHART_COLORS.highlight : CHART_COLORS.bar));
      doc.rect(bx, by, barWidth, barHeight, "F");
    }

    if (showValues) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...CHART_COLORS.highlight);
      doc.text(bar.valueLabel ?? String(bar.value), bx + barWidth / 2, by - 1.5, { align: "center" });
    }

    if (i % labelEvery === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...CHART_COLORS.label);
      doc.text(bar.label, bx + barWidth / 2, plotBottom + 4.5, { align: "center" });
    }
  });

  return plotBottom + 10;
}

/**
 * A horizontal bar chart — ranked items (top sellers) or a rating
 * distribution. Each row is a label, a track, a bar and its value.
 */
export function drawHorizontalBarChart(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    title: string;
    bars: ChartBar[];
    labelWidth?: number;
    rowHeight?: number;
  },
): number {
  const { x, y, width, title, bars, labelWidth = 55, rowHeight = 7 } = options;
  drawTitle(doc, title, x, y);

  let rowY = y + TITLE_GAP;
  if (bars.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...CHART_COLORS.label);
    doc.text("No data for this period.", x, rowY + 4);
    return rowY + 12;
  }

  const valueWidth = 18;
  const trackX = x + labelWidth;
  const trackWidth = width - labelWidth - valueWidth;
  const max = Math.max(...bars.map((b) => b.value), 0);
  const barThickness = rowHeight * 0.6;

  for (const bar of bars) {
    const midY = rowY + rowHeight / 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...CHART_COLORS.ink);
    // Long product names are cut to the label column rather than overprinting the bar.
    const lines: string[] = doc.splitTextToSize(bar.label, labelWidth - 6);
    const label = lines.length > 1 ? `${lines[0].trimEnd()}...` : (lines[0] ?? "");
    doc.text(label, x, midY + 1.2);

    doc.setFillColor(...CHART_COLORS.track);
    doc.rect(trackX, midY - barThickness / 2, trackWidth, barThickness, "F");

    const barLength = max > 0 ? (bar.value / max) * trackWidth : 0;
    if (barLength > 0) {
      doc.setFillColor(...(bar.highlight ? CHART_COLORS.highlight : CHART_COLORS.bar));
      doc.rect(trackX, midY - barThickness / 2, barLength, barThickness, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...CHART_COLORS.ink);
    doc.text(bar.valueLabel ?? String(bar.value), x + width, midY + 1.2, { align: "right" });

    rowY += rowHeight;
  }

  return rowY + 6;
}

/**
 * Start a new page when the next block will not fit above the footer, and
 * return where to draw it. jspdf-autotable breaks its own tables, but hand
 * drawn charts have to ask.
 */
export function ensureSpace(doc: jsPDF, y: number, needed: number, topMargin = 20): number {
  const bottomLimit = doc.internal.pageSize.getHeight() - 20; // clear of pdfFooter
  if (y + needed <= bottomLimit) return y;
  doc.addPage();
  return topMargin;
}
