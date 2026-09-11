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
      {/* ----------------------------------------------------------------
       * Page header
       * TODO: BACKEND INTEGRATION — Replace MOCK_DATE and MOCK_BRANCH
       * with real values from the server. MOCK_DATE should use the
       * server's timezone; MOCK_BRANCH should reflect the employee's
       * assigned branch or a branch selector.
       * --------------------------------------------------------------- */}
      <div className="flex items-baseline gap-3.5">
        <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
          Today at a glance
        </h1>
        <span className="text-[13px] text-[#7a6a60]">
          {MOCK_DATE} · {MOCK_BRANCH}
        </span>
      </div>

      {/* ----------------------------------------------------------------
       * KPI stat cards row
       * TODO: BACKEND INTEGRATION — Replace MOCK_STATS with real-time
       * data. See mock-data.ts for the expected Supabase queries.
       * --------------------------------------------------------------- */}
      <div className="flex gap-3.5">
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

      {/* ----------------------------------------------------------------
       * Grid: Sales Chart + Top Sellers / Top Rated
       *
       * Layout matches Figma exactly:
       *   - 2-column grid: left 1.4fr (chart), right 1fr (rankings)
       *   - 2 rows of 262px each
       *   - Chart sits in row 1, col 1
       *   - Top Sellers sits in row 1, col 2
       *   - Top Rated sits in row 2, col 2
       *
       * TODO: BACKEND INTEGRATION — Replace MOCK_WEEKLY_SALES,
       * MOCK_TOP_SELLERS, and MOCK_TOP_RATED with real data.
       * --------------------------------------------------------------- */}
      <div className="grid grid-cols-[1.4fr_1fr] grid-rows-[262px_262px] gap-4">
        {/* Sales chart — row 1, col 1 */}
        <div className="row-span-1">
          <SalesChart data={MOCK_WEEKLY_SALES} />
        </div>

        {/* Top Sellers — row 1, col 2 */}
        <div className="row-span-1">
          <ProductRanking title="Top sellers" items={MOCK_TOP_SELLERS} />
        </div>

        {/* Empty space — row 2, col 1 (chart doesn't span two rows) */}
        <div />

        {/* Top Rated — row 2, col 2 */}
        <div className="row-span-1">
          <ProductRanking title="Top rated" items={MOCK_TOP_RATED} />
        </div>
      </div>
    </div>
  );
}
