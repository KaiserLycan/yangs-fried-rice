"use client";

/**
 * Bar chart — "Sales, Last 7 Days".
 *
 * Uses recharts (already a project dependency) with custom bar rendering
 * to match the Figma design:
 *   - Bars have rounded top corners (6px radius)
 *   - Mon–Thu use #bf4342 (lighter red)
 *   - Fri–Sun use #8c1c13 (darker red, "highlight" days)
 *   - Value labels sit above each bar in bold, and drop out when a bar is
 *     too narrow to hold one (see `renderValueLabel`); the tooltip still
 *     gives the figure on tap
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
  Tooltip,
} from "recharts";
import type { DailySales } from "@/lib/actions/dashboard";

interface SalesChartProps {
  data: DailySales[];
}

const BAR_COLOR_DEFAULT = "#bf4342";
const BAR_COLOR_HIGHLIGHT = "#8c1c13";

/** Matches `barCategoryGap` below: the share of each slot left empty. */
const CATEGORY_GAP = 0.18;

/**
 * Rough advance width of one character of the 11px bold label. DM Sans
 * figures run about 0.6em; measuring real text per render would cost a
 * layout pass for a decision this coarse.
 */
const LABEL_CHAR_WIDTH = 6.6;

/**
 * Custom label renderer — positions the ₱-formatted value above each bar.
 *
 * Returns nothing when the label is wider than the bar's whole slot (the bar
 * plus its share of the gap), because it would then run into its neighbours.
 * That happens at phone width, but also in the reports screen's half-width
 * column, so it keys off the bar's rendered width rather than a breakpoint.
 */
// Recharts v2 LabelList `content` typing is overly strict — the actual
// runtime props are a loose bag of values. A typed wrapper would fight the
// library more than it helps, so we accept `any` here.
function renderValueLabel(props: any) {
  const { x = 0, y = 0, width = 0, value } = props as {
    x?: number;
    y?: number;
    width?: number;
    value?: string;
  };
  const text = String(value ?? "");
  const slotWidth = Number(width) / (1 - CATEGORY_GAP);
  if (text.length * LABEL_CHAR_WIDTH > slotWidth - 4) return null;
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 8}
      textAnchor="middle"
      className="fill-[#8c1c13] text-[11px] font-bold"
      style={{ fontFamily: "var(--font-sans)", fontWeight: 700 }}
    >
      {text}
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
              barCategoryGap={`${CATEGORY_GAP * 100}%`}
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
              <Tooltip
                cursor={{ fill: "rgba(140, 28, 19, 0.06)" }}
                formatter={(_value, _name, item) => [
                  (item?.payload as DailySales | undefined)?.label ?? _value,
                  "Sales",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #DDCDB8",
                  fontSize: 12,
                  fontFamily: "var(--font-sans)",
                }}
                labelStyle={{ color: "#7a6a60", fontWeight: 700 }}
                itemStyle={{ color: "#8c1c13", fontWeight: 700 }}
              />
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
