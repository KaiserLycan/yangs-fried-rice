import {
  ReportTypeSelect,
  ReportDateFilters,
} from "@/components/manage/reports/report-controls";
import { ReportsSummary } from "@/components/manage/reports/reports-summary";
import { ReportsCharts } from "@/components/manage/reports/reports-charts";
import { MOCK_DATE, MOCK_BRANCH } from "@/components/manage/dashboard/mock-data";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-[30px]">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3.5">
          <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
            Reports & Analytics
          </h1>
          <span className="text-[13px] text-[#7a6a60]">
            {MOCK_DATE} · {MOCK_BRANCH}
          </span>
        </div>
        <ReportTypeSelect />
      </div>

      {/* Filters and Actions Row */}
      <div className="flex justify-between items-end border-b border-[#ddcdb8] pb-[20px]">
        <h2 className="text-[18px] font-bold text-[#1a1210]">Overview</h2>
        <ReportDateFilters />
      </div>

      {/* Analytics Content */}
      <div className="flex flex-col gap-[30px] overflow-y-auto pb-[20px]">
        {/* KPI Cards */}
        <ReportsSummary />
        
        {/* Interactive Charts */}
        <ReportsCharts />
      </div>
    </div>
  );
}
