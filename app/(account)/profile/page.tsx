import { RoutePlaceholder } from "@/components/route-placeholder";

export default function ProfilePage() {
  return (
    <RoutePlaceholder
      title="Profile"
      description="Update name, delivery address, contact details, and password. Also where the customer logs out and can delete their account."
      requirements={["Cust3", "Cust4", "Cust5"]}
    />
  );
}
