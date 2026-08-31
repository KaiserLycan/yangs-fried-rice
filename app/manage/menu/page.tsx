import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ManageMenuPage() {
  return (
    <RoutePlaceholder
      title="Menu management"
      description="Add, edit, and remove or archive food items, and organise them into categories. Changes here must be reflected in the customer-facing menu in real time."
      requirements={["Menu1", "Menu2", "Menu3", "Menu4", "Menu5"]}
    />
  );
}
