import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CheckoutPage() {
  return (
    <RoutePlaceholder
      title="Checkout"
      description="Order review before confirming: customer name, date, address, ordered items, estimated completion time, and payable amount. Customer picks Pickup or Delivery here, and selects a payment method. Payment method is selection only — nothing is processed yet."
      requirements={["Browsing8", "Browsing9", "Browsing10", "TPI1"]}
    />
  );
}
