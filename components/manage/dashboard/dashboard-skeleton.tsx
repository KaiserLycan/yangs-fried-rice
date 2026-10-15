/**
 * Skeleton loading state for the dashboard.
 *
 * Mirrors the exact layout of the real dashboard:
 *   - Store control panel at the top (status, hours, order counts)
 *   - 3 KPI stat cards row
 *   - Top sellers today (full-width ranking)
 *   - Last 7 days (full-width sales chart)
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
      className={`animate-pulse rounded-md bg-rule/60 ${className ?? ""}`}
      style={style}
    />
  );
}

function StoreControlSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-rule bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <SkeletonBox className="h-6 w-48" />
        <SkeletonBox className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} className="h-[68px] w-full" />
        ))}
      </div>
      <SkeletonBox className="h-4 w-3/4 max-w-[400px]" />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-md border border-rule bg-white p-4">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="mt-1 h-8 w-32" />
      <SkeletonBox className="h-3 w-28" />
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-rule bg-white px-[18px] pb-6 pt-[18px]">
      <SkeletonBox className="h-4 w-36" />
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

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-[18px] rounded-lg border border-rule bg-white p-[18px]">
      <SkeletonBox className="h-4 w-28" />
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

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Header skeleton */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
          <SkeletonBox className="h-7 w-48 md:w-56" />
          <SkeletonBox className="h-4 w-40 md:w-48" />
        </div>

        {/* Store control panel */}
        <StoreControlSkeleton />

        {/* KPI stat cards row */}
        <div className="flex flex-col md:flex-row gap-3.5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Top sellers today (full-width) */}
        <div className="min-h-[220px]">
          <RankingSkeleton />
        </div>
      </section>

      {/* Last 7 days section (full-width) */}
      <section className="flex flex-col gap-3.5">
        <SkeletonBox className="h-6 w-28" />
        <div className="min-h-[262px]">
          <ChartSkeleton />
        </div>
      </section>
    </div>
  );
}
