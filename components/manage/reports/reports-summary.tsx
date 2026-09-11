import { StatCard } from "@/components/manage/dashboard/stat-card";

export function ReportsSummary() {
  return (
    <div className="flex gap-3.5">
      <StatCard
        label="Total Revenue"
        value="₱ 142,500"
        subtitle="+12.5% from last period"
        subtitleColor="green"
      />
      <StatCard
        label="Total Orders"
        value="1,245"
        subtitle="Across all channels"
        subtitleColor="muted"
      />
      <StatCard
        label="Avg Order Value"
        value="₱ 114"
        subtitle="-2% from last period"
        subtitleColor="red"
      />
    </div>
  );
}
