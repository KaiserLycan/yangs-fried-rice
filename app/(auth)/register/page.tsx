import { RoutePlaceholder } from "@/components/route-placeholder";

export default function RegisterPage() {
  return (
    <RoutePlaceholder
      title="Create an account"
      description="Customer self-registration: name, email, password, delivery address. There is deliberately no employee equivalent of this page — employee accounts are created by the Business Owner from /manage/staff, not self-served."
      requirements={["Cust1"]}
    />
  );
}
