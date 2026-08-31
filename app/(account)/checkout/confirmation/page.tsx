import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CheckoutConfirmationPage() {
  return (
    <RoutePlaceholder
      title="Order placed"
      description="Post-submission receipt: order number, itemised summary, pickup or delivery details, and a dynamic ETA based on kitchen queue and delivery distance. Cart contents are frozen from this point — the customer cannot modify them here. Cancelling is done from the order detail page."
      requirements={["Browsing12", "Browsing16"]}
    />
  );
}
