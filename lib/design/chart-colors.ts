/**
 * Token colours for places CSS variables can't reach: Recharts writes `fill`
 * as an SVG presentation attribute, and `var()` does not resolve there.
 *
 * Each value is the hex of a token in app/globals.css, and
 * chart-colors.test.ts fails if the two drift apart — so these are the
 * tokens, not a second palette.
 */
export const CHART_COLORS = {
  /** --destructive */
  bar: "#BF4342",
  /** --primary: Fri–Sun, the busy days */
  barHighlight: "#B8352A",
  /** --muted-foreground: axis labels */
  axis: "#7A6A60",
} as const;

export const CHART_TOKENS: Record<keyof typeof CHART_COLORS, string> = {
  bar: "destructive",
  barHighlight: "primary",
  axis: "muted-foreground",
};
