"use client";

import { useEffect, useState } from "react";
import { SalesChart } from "@/components/manage/dashboard/sales-chart";
import { ProductRanking } from "@/components/manage/dashboard/product-ranking";
import {
  getSalesReportData,
  getPlatformPerformance,
  type SalesReportData,
  type PlatformPerformanceData,
} from "@/lib/actions/reports";
import { SALES_REPORT, normalizeReportType } from "@/lib/reports/report-types";
import type { DailySales, RankedProduct } from "@/lib/actions/dashboard";

interface ReportsChartsProps {
  type?: string;
  startDate: string;
  endDate: string;
}

/** One ranking-card placeholder: a title and a few label + bar rows. */
function RankingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e3d6c3] bg-white px-[18px] pb-[62px] pt-[18px]">
      <div className="h-3 w-24 bg-[#efe6d8] rounded-full animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-[5px]">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-[#efe6d8] rounded-full animate-pulse" />
            <div className="h-3 w-14 bg-[#efe6d8] rounded-full animate-pulse" />
          </div>
          <div className="h-[7px] w-full rounded-full bg-[#efe6d8] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder with the same layout as the report it stands in for:
 *  - Sales and Order: a chart beside a ranking (2 columns).
 *  - Menu & Customer Satisfaction: two rankings side by side, then a
 *    full-width ratings card underneath.
 * A single fixed skeleton made the page reflow when the real content arrived.
 */
function ChartSkeleton({ variant }: { variant: "sales" | "menu" }) {
  if (variant === "menu") {
    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
          <RankingSkeleton />
          <RankingSkeleton />
        </div>
        <RankingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
      <div className="flex flex-col gap-[18px] rounded-2xl border border-[#e3d6c3] bg-white p-[18px]">
        <div className="h-3 w-32 bg-[#efe6d8] rounded-full animate-pulse" />
        <div className="h-[190px] w-full bg-[#efe6d8]/50 rounded-xl animate-pulse" />
      </div>
      <RankingSkeleton />
    </div>
  );
}

export function ReportsCharts({
  type: rawType = SALES_REPORT,
  startDate,
  endDate,
}: ReportsChartsProps) {
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
          const [salesResult, perfResult] = await Promise.all([
            getSalesReportData({
              start_date: startDate,
              end_date: endDate,
              frequency: "daily",
            }),
            getPlatformPerformance({
              start_date: startDate,
              end_date: endDate,
              top_products: 5,
            }),
          ]);
          if (cancelled) return;
          if (salesResult.error) {
            setError(salesResult.error);
          } else {
            setSalesData(salesResult.data);
          }
          if (perfResult.data) {
            setPerfData(perfResult.data);
          }
        } else {
          // Menu & Customer Satisfaction: one performance read feeds every card
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
        if (!cancelled) setError("Failed to fetch chart data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [type, startDate, endDate]);

  const skeletonVariant = type === SALES_REPORT ? "sales" : "menu";

  if (isLoading) return <ChartSkeleton variant={skeletonVariant} />;

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[#e3d6c3] bg-white p-8 text-[13px] text-[#7a6a60]">
        {error}
      </div>
    );
  }

  if (type !== SALES_REPORT && perfData) {
    const topQuantity = perfData.topSellingProducts[0]?.quantitySold ?? 0;
    const topItems: RankedProduct[] = perfData.topSellingProducts.map((p) => ({
      name: p.productName,
      count: p.quantitySold,
      percentage: topQuantity > 0 ? Math.round((p.quantitySold / topQuantity) * 100) : 0,
    }));

    // Split the ranking so the same product never appears in both halves.
    const halfLen = Math.ceil(topItems.length / 2);

    const { distribution, totalReviews } = perfData.customerSatisfaction;
    const mostRated = Math.max(0, ...distribution.map((d) => d.count));
    const ratingItems: RankedProduct[] = distribution.map((d) => ({
      name: `${d.rating} ★`,
      count: d.count,
      percentage: mostRated > 0 ? Math.round((d.count / mostRated) * 100) : 0,
    }));

    return (
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
          <ProductRanking title="Most Sold Items" items={topItems.slice(0, halfLen)} />
          <ProductRanking
            title="Least Sold Items"
            items={topItems.slice(halfLen).reverse()}
          />
        </div>
        <ProductRanking
          title={`Customer Ratings · ${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`}
          items={totalReviews > 0 ? ratingItems : []}
          unit="reviews"
        />
      </div>
    );
  }

  // Default: "Sales and Order"
  if (salesData) {
    // Map breakdown to chart format
    const chartData: DailySales[] = salesData.breakdown.map((row, i) => {
      // Format the period label for display
      const label =
        row.totalRevenue >= 1000
          ? `₱${(row.totalRevenue / 1000).toFixed(1)}k`
          : `₱${row.totalRevenue.toFixed(0)}`;

      // Try to parse date for short day label
      let dayLabel = row.period;
      try {
        const d = new Date(row.period + "T00:00:00");
        if (!isNaN(d.getTime())) {
          dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        }
      } catch {}

      return {
        day: dayLabel,
        amount: row.totalRevenue,
        label,
        isHighlight: i >= salesData.breakdown.length - 3, // highlight last 3
      };
    });

    // Map top sellers
    const topSellers: RankedProduct[] = (perfData?.topSellingProducts ?? []).map(
      (p) => ({
        name: p.productName,
        count: p.quantitySold,
        percentage:
          (perfData?.topSellingProducts[0]?.quantitySold ?? 0) > 0
            ? Math.round(
                (p.quantitySold /
                  perfData!.topSellingProducts[0].quantitySold) *
                  100
              )
            : 0,
      })
    );

    return (
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
        <div>
          <SalesChart data={chartData} />
        </div>
        <div>
          <ProductRanking title="Top Sellers" items={topSellers} />
        </div>
      </div>
    );
  }

  return <ChartSkeleton variant={skeletonVariant} />;
}