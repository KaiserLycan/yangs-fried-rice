import { RoutePlaceholder } from "@/components/route-placeholder";

export default function DeliveryDetailPage({
  params,
}: {
  params: { deliveryId: string };
}) {
  return (
    <RoutePlaceholder
      title={`Delivery ${params.deliveryId}`}
      description="Full customer delivery details — address, contact, order contents — and the control to mark the order delivered with digital proof of delivery. Deliveries are bounded by the restaurant's 15 km radius."
      requirements={["Order6", "Order7"]}
    />
  );
}
