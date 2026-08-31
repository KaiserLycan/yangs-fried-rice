import { RoutePlaceholder } from "@/components/route-placeholder";

export default function DeliverHomePage() {
  return (
    <RoutePlaceholder
      title="Deliveries"
      description="A Rider's assigned deliveries. Riders receive dispatches here and open one to see the full delivery detail. Built for a phone screen — this is used in the field, not at a desk."
      requirements={["Order5"]}
    />
  );
}
