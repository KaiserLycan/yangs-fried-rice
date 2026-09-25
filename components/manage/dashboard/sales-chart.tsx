"use client";

/**
 * Bar chart — "Sales, Last 7 Days".
 *
 * Uses recharts (already a project dependency) with custom bar rendering
 * to match the Figma design:
 *   - Bars have rounded top corners (6px radius)
 *   - Mon–Thu use #bf4342 (lighter red)
 *   - Fri–Sun use #8c1c13 (darker red, "highlight" days)
 *   - Value labels sit above each bar in bold
 *   - Day labels sit below each bar in regular weight
 *
 * Replace the `data` prop source in dashboard-content.tsx with
 * real weekly sales data from Supabase.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { DailySales } from "@/lib/actions/dashboard";

interface SalesChartProps {
  data: DailySales[];
}

const BAR_COLOR_DEFAULT = "#bf4342";
const BAR_COLOR_HIGHLIGHT = "#8c1c13";

/**
 * Custom label renderer — positions the ₱-formatted value above each bar.
 *
 * Hidden below `md`. Seven peso amounts across a phone-width chart do not
 * fit: they collide with their neighbours and read as one smear (issue
 * #106). Done with `display` rather than by measuring the container, so
 * there is no breakpoint to track in JavaScript and nothing that can render
 * differently on the server than in the browser. `display` applies to SVG
 * the same way it applies to anything else.
 *
 * The bars keep their day labels and their relative heights, which is what
 * the chart is for at that size; the exact figures are a tap away on the
 * dashboard's own counters.
 *
 * Exported for the test — the chart itself needs a measured container that
 * jsdom will not give it.
 */
// Recharts v2 LabelList `content` typing is overly strict — the actual
// runtime props are a loose bag of values. A typed wrapper would fight the
// library more than it helps, so we accept `any` here.
export function renderValueLabel(props: any) {
  const { x = 0, y = 0, width = 0, value } = props as {
    x?: number;
    y?: number;
    width?: number;
    value?: string;
  };
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 8}
      textAnchor="middle"
      className="hidden fill-[#8c1c13] text-[11px] font-bold md:block"
      style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}
    >
      {value}
    </text>
  );
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="flex flex-col gap-[18px] rounded-2xl border border-[#e3d6c3] bg-white p-[18px]">
      {/* Section header */}
      <span className="text-[12px] font-bold uppercase tracking-[1.44px] text-[#7a6a60]">
        Sales, last 7 days
      </span>

      {/* Chart */}
      <div className="h-[190px] w-full">
        {!data.some(d => d.amount > 0) ? (
          <div className="flex h-full w-full items-center justify-center text-[13px] text-[#7a6a60]">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              barCategoryGap="18%"
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#7a6a60",
                  fontSize: 11,
                  fontFamily: "var(--font-sans)",
                }}
                dy={8}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                maxBarSize={62}
              >
                <LabelList dataKey="label" content={renderValueLabel} />
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isHighlight
                        ? BAR_COLOR_HIGHLIGHT
                        : BAR_COLOR_DEFAULT
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
