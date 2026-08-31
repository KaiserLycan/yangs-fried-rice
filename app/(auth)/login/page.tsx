import { RoutePlaceholder } from "@/components/route-placeholder";

export default function CustomerLoginPage() {
  return (
    <RoutePlaceholder
      title="Log in"
      description="Customer login with email and password. Employees do not log in here — Staff, Business Owner and Rider use /employee/login. On success, return the customer to wherever they were headed, which is usually the item they were trying to add to their cart."
      requirements={["Cust2"]}
    />
  );
}
