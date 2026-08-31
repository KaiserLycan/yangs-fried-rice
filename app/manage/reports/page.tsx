import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ManageReportsPage() {
  return (
    <RoutePlaceholder
      title="Reports"
      description="Platform performance and daily sales reports. Business-Owner-only — gate this in app/manage/layout.tsx, not by giving it a separate URL. recharts is already installed for these charts but is not used anywhere yet."
      requirements={["SAS2"]}
    />
  );
}
