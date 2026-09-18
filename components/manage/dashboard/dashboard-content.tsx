"use client";

import { StatCard } from "./stat-card";
import { SalesChart } from "./sales-chart";
import { ProductRanking } from "./product-ranking";
import type { DailySales, RankedProduct, DashboardStats } from "@/lib/actions/dashboard";

export interface DashboardContentProps {
  stats: DashboardStats;
  weeklySales: DailySales[];
  topSellers: RankedProduct[];
  topRated: RankedProduct[];
  dateStr: string;
  branchName: string;
}

export function DashboardContent({
  stats,
  weeklySales,
  topSellers,
  topRated,
  dateStr,
  branchName,
}: DashboardContentProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
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
          subtitleColor="green"
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

      {/* Grid: Sales Chart + Top Sellers / Top Rated */}
      <div className="flex flex-col md:grid md:grid-cols-[1.4fr_1fr] md:grid-rows-[262px_262px] gap-4">
        {/* Sales chart */}
        <div className="md:row-span-1">
          <SalesChart data={weeklySales} />
        </div>

        {/* Top Sellers */}
        <div className="md:row-span-1">
          <ProductRanking title="Top sellers" items={topSellers} />
        </div>

        {/* Empty space — hide on mobile so it doesn't create a massive gap */}
        <div className="hidden md:block" />

        {/* Top Rated */}
        <div className="md:row-span-1">
          <ProductRanking title="Top rated" items={topRated} />
        </div>
      </div>
    </div>
  );
}
