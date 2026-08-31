import { RoutePlaceholder } from "@/components/route-placeholder";

export default function EmployeeLoginPage() {
  return (
    <RoutePlaceholder
      title="Employee sign in"
      description="One sign-in page shared by Staff, Business Owner, and Rider. Customers do not log in here — they use /login. There is no matching register page: employee accounts are created by the Business Owner."
      requirements={["SAS1"]}
    />
  );
}

/**
 * TODO(auth): the destination after sign-in depends on Employee.role, because
 * one page serves three roles:
 *
 *   Staff, Business Owner -> /manage
 *   Rider                 -> /deliver
 *
 * This redirect is the only place in the whole route tree where the role
 * vocabulary actually changes behaviour, which is why the unsettled question
 * of what the roles are called does not block the rest of this scaffold.
 * Confirm the final Employee.role values with the PM and DB developer before
 * wiring it.
 */
