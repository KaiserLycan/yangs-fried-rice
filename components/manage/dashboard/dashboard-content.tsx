"use client";

/**
 * Dashboard main content — "Today at a glance".
 *
 * This is the primary orchestrator for the dashboard page. It composes
 * all the individual dashboard widgets (stat cards, sales chart, product
 * rankings) and manages the loading state.
 *
 * ============================================================
 * TODO: BACKEND INTEGRATION
 * ============================================================
 * 1. Replace all MOCK_* imports with real data fetches.
 *    Ideally, move data fetching to the server component
 *    (app/manage/dashboard/page.tsx) and pass data as props.
 *
 * 2. The `isLoading` state currently simulates a network delay.
 *    Replace with actual loading state from your data fetching
 *    solution (React Query, SWR, or server component Suspense).
 *
 * 3. The date and branch name should come from the server context.
 *    See MOCK_DATE and MOCK_BRANCH in mock-data.ts.
 *
 * 4. Error states are not implemented yet. Add error boundaries
 *    and retry logic when wiring real data.
 * ============================================================
 */

import { StatCard } from "./stat-card";
import { SalesChart } from "./sales-chart";
import { ProductRanking } from "./product-ranking";
import { DashboardSkeleton } from "./dashboard-skeleton";
import {
  MOCK_STATS,
  MOCK_WEEKLY_SALES,
  MOCK_TOP_SELLERS,
  MOCK_TOP_RATED,
  MOCK_DATE,
  MOCK_BRANCH,
} from "./mock-data";

export function DashboardContent() {
  // TODO: BACKEND INTEGRATION — Replace with real data fetching state.
  // When wiring real API calls, use Suspense or a data fetching library
  // (like React Query/SWR) to trigger the DashboardSkeleton.

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          Today at a glance
        </h1>
        <span className="text-[13px] text-[#7a6a60]">
          {MOCK_DATE} · {MOCK_BRANCH}
        </span>
      </div>

      {/* KPI stat cards row */}
      <div className="flex flex-col md:flex-row gap-3.5">
        <StatCard
          label="Sales today"
          value={MOCK_STATS.salesToday.amount}
          subtitle={MOCK_STATS.salesToday.trend}
          subtitleColor="green"
        />
        <StatCard
          label="Orders"
          value={String(MOCK_STATS.orders.total)}
          subtitle={MOCK_STATS.orders.breakdown}
          subtitleColor="muted"
        />
        <StatCard
          label="Cancelled"
          value={String(MOCK_STATS.cancelled.total)}
          subtitle={MOCK_STATS.cancelled.note}
          subtitleColor="red"
        />
      </div>

      {/* Grid: Sales Chart + Top Sellers / Top Rated */}
      <div className="flex flex-col md:grid md:grid-cols-[1.4fr_1fr] md:grid-rows-[262px_262px] gap-4">
        {/* Sales chart */}
        <div className="md:row-span-1">
          <SalesChart data={MOCK_WEEKLY_SALES} />
        </div>

        {/* Top Sellers */}
        <div className="md:row-span-1">
          <ProductRanking title="Top sellers" items={MOCK_TOP_SELLERS} />
        </div>

        {/* Empty space — hide on mobile so it doesn't create a massive gap */}
        <div className="hidden md:block" />

        {/* Top Rated */}
        <div className="md:row-span-1">
          <ProductRanking title="Top rated" items={MOCK_TOP_RATED} />
        </div>
      </div>
    </div>
  );
}
