/**
 * Product ranking card — used for "Top Sellers" and "Top Rated".
 *
 * Displays a list of items with their count and a horizontal progress bar
 * proportional to the top item's count.
 */

import type { RankedProduct } from "@/lib/actions/dashboard";

interface ProductRankingProps {
  /** Section title, e.g. "TOP SELLERS" */
  title: string;
  /** Ranked list of products */
  items: RankedProduct[];
  /** What each count measures — "sold" for sales, "reviews" for ratings. */
  unit?: string;
}

export function ProductRanking({ title, items, unit = "sold" }: ProductRankingProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-rule bg-white px-[18px] pb-[62px] pt-[18px]">
      {/* Section header */}
      <span className="text-xs font-bold uppercase tracking-[1.44px] text-muted-foreground">
        {title}
      </span>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center pt-10 text-sm text-muted-foreground">
          No data available.
        </div>
      ) : (
        items.map((item) => (
          <div key={item.name} className="flex flex-col gap-[5px]">
            {/* Name + count row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {item.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {item.count} {unit}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-[7px] w-full rounded-full bg-track">
              <div
                className="h-[7px] rounded-full bg-destructive"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
