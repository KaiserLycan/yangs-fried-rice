/**
 * Product ranking card — used for "Top Sellers" and "Top Rated".
 *
 * Displays a list of items with their count and a horizontal progress bar
 * proportional to the top item's count.
 *
 * TODO: BACKEND INTEGRATION — This component is purely presentational.
 * Pass real data from the parent. The `percentage` field on each item
 * controls the bar width (0–100).
 */

import type { RankedProduct } from "@/lib/actions/dashboard";

interface ProductRankingProps {
  /** Section title, e.g. "TOP SELLERS" */
  title: string;
  /** Ranked list of products */
  items: RankedProduct[];
}

export function ProductRanking({ title, items }: ProductRankingProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e3d6c3] bg-white px-[18px] pb-[62px] pt-[18px]">
      {/* Section header */}
      <span className="text-[12px] font-bold uppercase tracking-[1.44px] text-[#7a6a60]">
        {title}
      </span>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center pt-10 text-[13px] text-[#7a6a60]">
          No data available.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.name} className="flex flex-col gap-[5px]">
            {/* Name + count row */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#1a1210]">
                {item.name}
              </span>
              <span className="text-[13px] text-[#7a6a60]">
                {item.count} sold
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-[7px] w-full rounded-full bg-[#efe6d8]">
              <div
                className="h-[7px] rounded-full bg-[#bf4342]"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
