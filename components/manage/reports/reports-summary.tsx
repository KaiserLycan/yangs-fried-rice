import { StatCard } from "@/components/manage/dashboard/stat-card";

export function ReportsSummary({ type = "Sales and Order" }: { type?: string }) {
  if (type === "Customer Satisfaction") {
    return (
      <div className="flex flex-col md:flex-row gap-3.5">
        <StatCard
          label="Avg Rating"
          value="4.8"
          subtitle="+0.2 from last period"
          subtitleColor="green"
        />
        <StatCard
          label="Total Reviews"
          value="842"
          subtitle="Across all products"
          subtitleColor="muted"
        />
        <StatCard
          label="Response Rate"
          value="95%"
          subtitle="-1% from last period"
          subtitleColor="red"
        />
      </div>
    );
  }

  if (type === "Menu Items reports") {
    return (
      <div className="flex flex-col md:flex-row gap-3.5">
        <StatCard
          label="Total Items Sold"
          value="3,214"
          subtitle="+15% from last period"
          subtitleColor="green"
        />
        <StatCard
          label="Top Category"
          value="Fried Rice"
          subtitle="45% of total sales"
          subtitleColor="muted"
        />
        <StatCard
          label="Out of Stock"
          value="2"
          subtitle="Requires attention"
          subtitleColor="red"
        />
      </div>
    );
  }

  // Default: "Sales and Order"
  return (
    <div className="flex flex-col md:flex-row gap-3.5">
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