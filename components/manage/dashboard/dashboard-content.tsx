"use client";

import { StatCard } from "./stat-card";
import { SalesChart } from "./sales-chart";
import { ProductRanking } from "./product-ranking";
import type { DailySales, RankedProduct, DashboardStats } from "@/lib/actions/dashboard";

export interface DashboardContentProps {
  stats: DashboardStats;
  weeklySales: DailySales[];
  topSellers: RankedProduct[];
  dateStr: string;
  branchName: string;
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
 * Whoever changes the range a section reads must move its card to the other
 * section or the same confusion comes back.
 */
export function DashboardContent({
  stats,
  weeklySales,
  topSellers,
  dateStr,
  branchName,
}: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="dashboard-today" className="flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
          <h1
            id="dashboard-today"
            className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]"
          >
            Today at a glance
          </h1>
          <span className="text-[13px] text-[#7a6a60]">
            {dateStr} · {branchName}
          </span>
        </div>

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
          className="font-display text-[20px] md:text-[24px] leading-normal text-[#1a1210]"
        >
          Last 7 days
        </h2>

        <div className="min-h-[262px]">
          <SalesChart data={weeklySales} />
        </div>
      </section>
    </div>
  );
}
