/**
 * Skeleton loading state for the dashboard.
 *
 * Mirrors the exact layout of the real dashboard:
 *   - 3 stat cards across the top
 *   - Sales chart (left, spanning 1.4fr) + Top Sellers (right, 1fr)
 *   - Top Rated below Top Sellers
 *
 * Uses Tailwind's `animate-pulse` for the shimmer effect.
 */

function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#e3d6c3]/60 ${className ?? ""}`}
      style={style}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-[14px] border border-[#e3d6c3] bg-white p-4">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="mt-1 h-8 w-32" />
      <SkeletonBox className="h-3 w-28" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] rounded-2xl border border-[#e3d6c3] bg-white p-[18px]">
      <SkeletonBox className="h-3.5 w-36" />
      <div className="flex h-[190px] items-end gap-3.5 pt-5">
        {[110, 95, 127, 118, 160, 170, 145].map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <SkeletonBox className="w-full rounded-t-md" style={{ height: h }} />
            <SkeletonBox className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e3d6c3] bg-white px-[18px] pb-[62px] pt-[18px]">
      <SkeletonBox className="h-3.5 w-24" />
      {[100, 83, 68, 50].map((w, i) => (
        <div key={i} className="flex flex-col gap-[5px]">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-3.5 w-28" />
            <SkeletonBox className="h-3.5 w-14" />
          </div>
          <SkeletonBox className="h-[7px] rounded-full" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Header skeleton */}
      <div className="flex items-baseline gap-3.5">
        <SkeletonBox className="h-8 w-56" />
        <SkeletonBox className="h-4 w-48" />
      </div>

      {/* Stat cards row */}
      <div className="flex gap-3.5">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Grid: Chart + Top Sellers / Top Rated */}
      <div className="grid grid-cols-[1.4fr_1fr] grid-rows-[262px_262px] gap-4">
        {/* Sales chart — spans both rows */}
        <div className="row-span-1">
          <ChartSkeleton />
        </div>

        {/* Top Sellers */}
        <div className="row-span-1">
          <RankingSkeleton />
        </div>

        {/* Empty space below chart (the chart card doesn't span two rows in Figma) */}
        <div />

        {/* Top Rated */}
        <div className="row-span-1">
          <RankingSkeleton />
        </div>
      </div>
    </div>
  );
}
