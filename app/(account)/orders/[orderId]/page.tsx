import { RoutePlaceholder } from "@/components/route-placeholder";

export default function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  return (
    <RoutePlaceholder
      title={`Order ${params.orderId}`}
      description="Live preparation and delivery progress, plus the itemised receipt. Cancellation lives here: allowed only before the restaurant confirms the order, always behind a confirmation prompt, and blocked outright once confirmed. Completed orders can be rated and reviewed from this page."
      requirements={[
        "Order2",
        "Browsing13",
        "Browsing14",
        "Browsing15",
        "OHF2",
      ]}
    />
  );
}
