"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReportTypeSelect,
  ReportDateFilters,
} from "@/components/manage/reports/report-controls";
import { ReportsSummary } from "@/components/manage/reports/reports-summary";
import { ReportsCharts } from "@/components/manage/reports/reports-charts";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

// Default to current month range
function getDefaultStartDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type") || "Sales and Order";

  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getToday());

  const MOCK_DATE = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());
  const MOCK_BRANCH = "Malate branch";

  return (
    <div className="flex flex-col gap-[20px] md:gap-[30px]">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3.5">
          <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
            Reports &amp; Analytics
          </h1>
          <span className="text-[13px] text-[#7a6a60]">
            {MOCK_DATE} · {MOCK_BRANCH}
          </span>
        </div>
        <ReportTypeSelect />
      </div>

      {/* Filters and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0 border-b border-[#ddcdb8] pb-[20px]">
        <h2 className="text-[18px] font-bold text-[#1a1210]">Overview</h2>
        <ReportDateFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          reportType={reportType}
        />
      </div>

      {/* Analytics Content */}
      <div className="flex flex-col gap-[20px] md:gap-[30px] overflow-y-auto pb-[20px]">
        {/* KPI Cards */}
        <ReportsSummary
          type={reportType}
          startDate={startDate}
          endDate={endDate}
        />

        {/* Interactive Charts */}
        <ReportsCharts
          type={reportType}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground animate-pulse">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}