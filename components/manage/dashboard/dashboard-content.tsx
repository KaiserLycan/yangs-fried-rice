"use client";

import { StatCard } from "./stat-card";
import { SalesChart } from "./sales-chart";
import { ProductRanking } from "./product-ranking";
import { StoreControlPanel } from "./store-control-panel";
import { RefundsPanel } from "./refunds-panel";
import { RecentReviewsPanel } from "./recent-reviews-panel";
import type { RecentReview } from "@/lib/actions/recent-reviews";
import type { RefundRow } from "@/lib/actions/refunds";
import {
  EMPTY_STATUS_COUNTS,
  type OrderStatusCounts,
} from "@/lib/orders/status-counts";
import type { StoreStatus } from "@/lib/store/store-status";
import type { DailySales, RankedProduct, DashboardStats } from "@/lib/actions/dashboard";

export interface DashboardContentProps {
  stats: DashboardStats;
  weeklySales: DailySales[];
  topSellers: RankedProduct[];
  dateStr: string;
  branchName: string;
  /** Open / paused / busy and the settings behind it (issue #115). */
  storeStatus: StoreStatus;
  /** Cancelled paid orders' refunds (issue #115); the panel hides when empty. */
  refunds?: RefundRow[];
  /** Orders per stage for the store panel (issue #115 follow-up). */
  orderCounts?: OrderStatusCounts;
  /** The latest order ratings (FINALE 9.3); the panel hides when empty. */
  reviews?: RecentReview[];
}

/**
 * The manager's dashboard.
 *
 * Split into two labelled sections because it used to be one. "Today at a
 * glance" was a bare `<h1>` with everything following it as a flat sibling,
 * including a seven-day sales chart — so the heading promised today and the
 * page showed the week (issue #106).
 *
 * Now each section covers only what its heading claims:
 *
 *   - **Today at a glance** — the three counters and the top sellers, all
 *     scoped to today. The ranking says "today" in its own title too, since
 *     a card can be read on its own.
 *   - **Last 7 days** — the sales chart, which never was a today figure.
 *
 * The latest ratings follow, outside both: they are the newest few, not a
 * range.
 *
 * Whoever changes the range a section reads must move its card to the other
 * section or the same confusion comes back.
 */
export function DashboardContent({
  stats,
  weeklySales,
  topSellers,
  dateStr,
  branchName,
  storeStatus,
  refunds = [],
  orderCounts = EMPTY_STATUS_COUNTS,
  reviews = [],
}: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="dashboard-today" className="flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
          <h1
            id="dashboard-today"
            className="font-display text-2xl md:text-3xl leading-normal text-foreground"
          >
            Today at a glance
          </h1>
          <span className="text-sm text-muted-foreground">
            {dateStr} · {branchName}
          </span>
        </div>

        {/* Pause / busy / hours (issue #115), above the numbers it affects. */}
        <StoreControlPanel status={storeStatus} counts={orderCounts} />
        <RefundsPanel refunds={refunds} />

        {/* KPI stat cards row */}
        <div className="flex flex-col md:flex-row gap-3.5">
          <StatCard
            label="Sales today"
            value={stats.salesToday.amount}
            subtitle={stats.salesToday.trend}
            subtitleColor={stats.salesToday.trendTone}
          />
          <StatCard
            label="Orders"
            value={String(stats.orders.total)}
            subtitle={stats.orders.breakdown}
            subtitleColor="muted"
          />
          <StatCard
            label="Cancelled"
            value={String(stats.cancelled.total)}
            subtitle={stats.cancelled.note}
            subtitleColor="red"
          />
        </div>

        {/* Today's ranking — the page reads it with today's bounds. */}
        <div className="min-h-[262px]">
          <ProductRanking title="Top sellers today" items={topSellers} />
        </div>
      </section>

      <section aria-labelledby="dashboard-week" className="flex flex-col gap-3.5">
        <h2
          id="dashboard-week"
          className="font-display text-lg md:text-2xl leading-normal text-foreground"
        >
          Last 7 days
        </h2>

        <div className="min-h-[262px]">
          <SalesChart data={weeklySales} />
        </div>
      </section>

      <RecentReviewsPanel reviews={reviews} />
    </div>
  );
}
