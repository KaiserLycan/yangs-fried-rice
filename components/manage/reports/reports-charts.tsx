import { SalesChart } from "@/components/manage/dashboard/sales-chart";
import { ProductRanking } from "@/components/manage/dashboard/product-ranking";

const MOCK_SALES_DATA = [
  { day: "Mon", amount: 12000, label: "₱12.0k", isHighlight: false },
  { day: "Tue", amount: 15000, label: "₱15.0k", isHighlight: false },
  { day: "Wed", amount: 14000, label: "₱14.0k", isHighlight: false },
  { day: "Thu", amount: 18000, label: "₱18.0k", isHighlight: false },
  { day: "Fri", amount: 25000, label: "₱25.0k", isHighlight: true },
  { day: "Sat", amount: 32000, label: "₱32.0k", isHighlight: true },
  { day: "Sun", amount: 26500, label: "₱26.5k", isHighlight: true },
];

const MOCK_SATISFACTION_DATA = [
  { name: "Yangzhou Special", count: 120, percentage: 100 },
  { name: "Beef Fried Rice", count: 95, percentage: 80 },
  { name: "Chicken Fried Rice", count: 88, percentage: 73 },
  { name: "Pork Fried Rice", count: 65, percentage: 54 },
];

const MOCK_MENU_ITEMS_DATA = [
  { name: "Yangzhou Special", count: 450, percentage: 100 },
  { name: "Shrimp Fried Rice", count: 320, percentage: 71 },
  { name: "Beef Fried Rice", count: 280, percentage: 62 },
  { name: "Vegetable Fried Rice", count: 150, percentage: 33 },
];

export function ReportsCharts({ type = "Sales and Order" }: { type?: string }) {
  if (type === "Customer Satisfaction") {
    return (
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
        <div>
          <ProductRanking title="Top Rated Items" items={MOCK_SATISFACTION_DATA} />
        </div>
        <div>
          <ProductRanking title="Needs Improvement" items={[
            { name: "Spicy Tofu", count: 15, percentage: 100 },
            { name: "Egg Soup", count: 12, percentage: 80 },
          ]} />
        </div>
      </div>
    );
  }

  if (type === "Menu Items reports") {
    return (
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
        <div>
          <ProductRanking title="Most Sold Items" items={MOCK_MENU_ITEMS_DATA} />
        </div>
        <div>
          <ProductRanking title="Least Sold Items" items={[
            { name: "Plain Rice", count: 45, percentage: 100 },
            { name: "Extra Egg", count: 40, percentage: 88 },
          ]} />
        </div>
      </div>
    );
  }

  // Default: "Sales and Order"
  return (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr] md:gap-4">
      <div>
        <SalesChart data={MOCK_SALES_DATA} />
      </div>
      <div>
        <ProductRanking title="Top Sellers" items={MOCK_MENU_ITEMS_DATA} />
      </div>
    </div>
  );
}