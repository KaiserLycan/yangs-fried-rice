import { RoutePlaceholder } from "@/components/route-placeholder";

export default function OrdersPage() {
  return (
    <RoutePlaceholder
      title="Your orders"
      description="Order history with itemised digital receipts, most recent first. Links through to each order's detail page."
      requirements={["OHF1"]}
    />
  );
}
