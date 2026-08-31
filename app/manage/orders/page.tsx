import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ManageOrdersPage() {
  return (
    <RoutePlaceholder
      title="Order queue"
      description="Sequential order queue for the kitchen, plus order status management: Received, Preparing, Out for Delivery, Completed, Cancelled. Staff mark orders ready once prepared; delivery orders get assigned to a Rider from here."
      requirements={["Order1", "Order3", "Order4"]}
    />
  );
}
