/**
 * Back office. Staff and Business Owner.
 *
 * Literal prefix — "manage" is in the URL on purpose so middleware.ts guards
 * the whole area with one /manage/:path* match, and any page added here later
 * is protected automatically. Maintaining a list of individual protected
 * paths is how admin pages leak.
 *
 * The URL is named for the AREA, not for a role. Both Staff and the Business
 * Owner work here; a Business Owner visiting /staff/* would read wrong, and
 * carving URLs by role would mean duplicating pages.
 *
 * TODO(auth): two checks belong here, not in the URL.
 *   1. Signed-in Employee, else redirect to /employee/login.
 *   2. Business-Owner-only sections — reports/ and staff/ — gated within.
 *      Staff can see orders, menu and inventory but not those two.
 */
export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
