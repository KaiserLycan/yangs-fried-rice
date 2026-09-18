/**
 * KPI stat card for the dashboard top row.
 *
 * Renders: Sales Today, Orders, Cancelled.
 * Each card has a label (uppercase, muted), a large value (display font),
 * and a subtitle line with a contextual color.
 */

interface StatCardProps {
  /** Uppercase label, e.g. "SALES TODAY" */
  label: string;
  /** Large display value, e.g. "₱31,200" or "86" */
  value: string;
  /** Subtitle text, e.g. "+18% vs last Sat" */
  subtitle: string;
  /** Color variant for the subtitle */
  subtitleColor?: "green" | "red" | "muted";
}

const SUBTITLE_COLORS = {
  green: "text-[#2f5e3c]",
  red: "text-[#8c1c13]",
  muted: "text-[#7a6a60]",
} as const;

export function StatCard({
  label,
  value,
  subtitle,
  subtitleColor = "muted",
}: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col rounded-[14px] border border-[#e3d6c3] bg-white p-4">
      {/* Label */}
      <span className="text-[11px] font-bold uppercase tracking-[1.32px] text-[#7a6a60]">
        {label}
      </span>

      {/* Value */}
      <p className="mt-[6px] font-display text-[30px] leading-normal text-[#1a1210]">
        {value}
      </p>

      {/* Subtitle */}
      <span
        className={`text-[12px] font-bold leading-normal ${SUBTITLE_COLORS[subtitleColor]}`}
      >
        {subtitle}
      </span>
    </div>
  );
}
