/**
 * EMPLOYEE authentication. Shared by all three employee roles — Staff,
 * Business Owner, and Rider.
 *
 * Literal prefix, not a route group: the "employee" segment is in the URL on
 * purpose, matching how /manage and /deliver work. Customer-facing areas use
 * route groups so their URLs stay short and shareable; employee-facing areas
 * use literal prefixes.
 *
 * This layout is intentionally NOT an auth gate. It is the page signed-out
 * employees are sent to, so guarding it would loop. /manage and /deliver do
 * the guarding, in their own layouts.
 *
 * Styled as an internal tool rather than as the storefront — an employee
 * signing in at the start of a shift is not a customer.
 */
export default function EmployeeAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
