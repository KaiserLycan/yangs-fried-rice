import { RoutePlaceholder } from "@/components/route-placeholder";

export default function MenuItemPage({
  params,
}: {
  params: { itemId: string };
}) {
  return (
    <RoutePlaceholder
      title={`Menu item ${params.itemId}`}
      description="Item detail: photo, description, price, modifiers, quantity, and special instructions. This page is public, but the 'Add to cart' button is the login wall — a signed-out customer goes to /login and returns here."
      requirements={["Browsing2", "Browsing6"]}
    />
  );
}
