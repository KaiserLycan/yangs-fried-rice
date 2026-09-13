import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CartPage() {
  return (
    <RoutePlaceholder
      title="Cart"
      description="Review cart contents before checkout: remove items, adjust quantities, edit special instructions, and see the subtotal and delivery fee recalculate in real time. Requires a signed-in customer — the cart is server-side and keyed by customer_id."
      requirements={["Browsing3", "Browsing4", "Browsing5", "Browsing11"]}
    />
  );
}
