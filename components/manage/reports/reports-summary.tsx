"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/manage/dashboard/stat-card";
import {
  getSalesReportData,
  getPlatformPerformance,
  type SalesReportData,
  type PlatformPerformanceData,
} from "@/lib/actions/reports";
import { SALES_REPORT, normalizeReportType } from "@/lib/reports/report-types";

interface ReportsSummaryProps {
  type?: string;
  startDate: string;
  endDate: string;
}

function formatPeso(amount: number): string {
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * The loading placeholder has to be the same shape as what replaces it:
 * Sales and Order loads 3 cards, Menu & Customer Satisfaction loads 4. A
 * fixed 3 made the row jump when the fourth card arrived.
 */
function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col rounded-[14px] border border-[#e3d6c3] bg-white p-4"
        >
          <div className="h-3 w-20 bg-[#efe6d8] rounded-full animate-pulse" />
          <div className="mt-3 h-8 w-32 bg-[#efe6d8] rounded-full animate-pulse" />
          <div className="mt-2 h-3 w-28 bg-[#efe6d8] rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ReportsSummary({ type: rawType = SALES_REPORT, startDate, endDate }: ReportsSummaryProps) {
  const type = normalizeReportType(rawType);
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [perfData, setPerfData] = useState<PlatformPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        if (type === SALES_REPORT) {
          const result = await getSalesReportData({
            start_date: startDate,
            end_date: endDate,
            frequency: "daily",
          });
          if (cancelled) return;
          if (result.error) {
            setError(result.error);
          } else {
            setSalesData(result.data);
          }
        } else {
          // Menu & Customer Satisfaction: one performance read feeds both halves.
          const result = await getPlatformPerformance({
            start_date: startDate,
            end_date: endDate,
            top_products: 10,
          });
          if (cancelled) return;
          if (result.error) {
            setError(result.error);
          } else {
            setPerfData(result.data);
          }
        }
      } catch {
        if (!cancelled) setError("Failed to fetch report data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [type, startDate, endDate]);

  const cardCount = type === SALES_REPORT ? 3 : 4;

  if (isLoading) return <SkeletonCards count={cardCount} />;

  if (error) {
    return (
      <div className="flex flex-col md:flex-row gap-3.5">
        <div className="flex flex-1 items-center justify-center rounded-[14px] border border-[#e3d6c3] bg-white p-6 text-[13px] text-[#7a6a60]">
          {error}
        </div>
      </div>
    );
  }

  if (type !== SALES_REPORT && perfData) {
    const topProduct = perfData.topSellingProducts[0];
    const { averageRating, totalReviews } = perfData.customerSatisfaction;
    return (
      <div className="flex flex-col md:flex-row md:flex-wrap gap-3.5">
        <StatCard
          label="Total Items Sold"
          value={perfData.topSellingProducts
            .reduce((sum, p) => sum + p.quantitySold, 0)
            .toLocaleString()}
          subtitle={`Across ${perfData.totalAvailableProducts} products`}
          subtitleColor="muted"
        />
        <StatCard
          label="Top Seller"
          value={topProduct?.productName || "N/A"}
          subtitle={topProduct ? `${topProduct.quantitySold} units sold` : "No data"}
          subtitleColor="green"
        />
        <StatCard
          label="Customer Rating"
          value={averageRating === null ? "No ratings" : `${averageRating.toFixed(1)} ★`}
          subtitle={`${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`}
          subtitleColor={averageRating !== null && averageRating >= 4 ? "green" : "muted"}
        />
        <StatCard
          label="Completion Rate"
          value={`${perfData.completionRate}%`}
          subtitle={`${perfData.cancelledOrders} cancelled`}
          subtitleColor={perfData.cancellationRate > 10 ? "red" : "muted"}
        />
      </div>
    );
  }

  // Default: "Sales and Order"
  if (salesData) {
    const trendSign = salesData.summary.averageOrderValue > 0 ? "" : "";
    return (
      <div className="flex flex-col md:flex-row gap-3.5">
        <StatCard
          label="Total Revenue"
          value={formatPeso(salesData.summary.totalRevenue)}
          subtitle={`${salesData.breakdown.length} ${salesData.frequency === "daily" ? "days" : "periods"} of data`}
          subtitleColor="muted"
        />
        <StatCard
          label="Total Orders"
          value={salesData.summary.totalOrders.toLocaleString()}
          subtitle={`Avg ${formatPeso(salesData.summary.averageRevenuePerPeriod)}/day`}
          subtitleColor="muted"
        />
        <StatCard
          label="Avg Order Value"
          value={formatPeso(salesData.summary.averageOrderValue)}
          subtitle={`${salesData.summary.averageOrdersPerPeriod} orders/day avg`}
          subtitleColor="muted"
        />
      </div>
    );
  }

  return <SkeletonCards count={cardCount} />;
}