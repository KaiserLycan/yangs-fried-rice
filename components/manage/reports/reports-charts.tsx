import { SalesChart } from "@/components/manage/dashboard/sales-chart";
import { MOCK_WEEKLY_SALES } from "@/components/manage/dashboard/mock-data";

export function ReportsCharts() {
  return (
    <div className="flex flex-col gap-[20px]">
      <h2 className="text-[18px] font-bold text-[#1a1210]">Sales Trend</h2>
      <div className="h-[400px] w-full rounded-[16px] bg-white p-[20px] shadow-sm border border-[#ddcdb8]">
        <SalesChart data={MOCK_WEEKLY_SALES} />
      </div>
    </div>
  );
}
