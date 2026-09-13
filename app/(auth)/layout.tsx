/**
 * CUSTOMER authentication. Storefront-styled — this is a customer-facing
 * page and should look like the rest of the shop.
 *
 * Route group: "(auth)" never reaches the URL, so these live at /login and
 * /register.
 *
 * Employees do NOT log in here. They have their own page at /employee/login,
 * under app/employee/. The two are separate because the identity models are
 * separate: Customer is its own table, while Staff, Business Owner and Rider
 * are all values of Employee.role.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
