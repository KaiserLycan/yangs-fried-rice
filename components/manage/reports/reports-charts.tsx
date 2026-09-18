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
import type { DailySales, RankedProduct } from "@/lib/actions/dashboard";

interface ReportsChartsProps {
  type?: string;
  startDate: string;
  endDate: string;
}

function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
      <div className="flex flex-col gap-[18px] rounded-2xl border border-[#e3d6c3] bg-white p-[18px]">
        <div className="h-3 w-32 bg-[#efe6d8] rounded-full animate-pulse" />
        <div className="h-[190px] w-full bg-[#efe6d8]/50 rounded-xl animate-pulse" />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-[#e3d6c3] bg-white px-[18px] pb-[62px] pt-[18px]">
        <div className="h-3 w-24 bg-[#efe6d8] rounded-full animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-[5px]">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-[#efe6d8] rounded-full animate-pulse" />
              <div className="h-3 w-14 bg-[#efe6d8] rounded-full animate-pulse" />
            </div>
            <div className="h-[7px] w-full rounded-full bg-[#efe6d8] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsCharts({
  type = "Sales and Order",
  startDate,
  endDate,
}: ReportsChartsProps) {
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
        if (type === "Sales and Order") {
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
          // Menu Items reports and Customer Satisfaction both use performance data
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

  if (isLoading) return <ChartSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[#e3d6c3] bg-white p-8 text-[13px] text-[#7a6a60]">
        {error}
      </div>
    );
  }

  if (type === "Customer Satisfaction" && perfData) {
    // Map top products as a proxy for satisfaction data
    const topItems: RankedProduct[] = perfData.topSellingProducts.map((p, i) => ({
      name: p.productName,
      count: p.quantitySold,
      percentage:
        perfData.topSellingProducts[0]?.quantitySold > 0
          ? Math.round(
              (p.quantitySold / perfData.topSellingProducts[0].quantitySold) * 100
            )
          : 0,
    }));

    return (
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        <div>
          <ProductRanking
            title="Most Ordered Items"
            items={topItems.slice(0, 5)}
          />
        </div>
        <div>
          <ProductRanking
            title="Least Ordered Items"
            items={topItems.length > 5 ? topItems.slice(-3).reverse() : []}
          />
        </div>
      </div>
    );
  }

  if (type === "Menu Items reports" && perfData) {
    const topItems: RankedProduct[] = perfData.topSellingProducts.map((p) => ({
      name: p.productName,
      count: p.quantitySold,
      percentage:
        perfData.topSellingProducts[0]?.quantitySold > 0
          ? Math.round(
              (p.quantitySold / perfData.topSellingProducts[0].quantitySold) * 100
            )
          : 0,
    }));

    const halfLen = Math.ceil(topItems.length / 2);

    return (
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
        <div>
          <ProductRanking
            title="Most Sold Items"
            items={topItems.slice(0, halfLen)}
          />
        </div>
        <div>
          <ProductRanking
            title="Least Sold Items"
            items={topItems.slice(halfLen).reverse()}
          />
        </div>
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

  return <ChartSkeleton />;
}