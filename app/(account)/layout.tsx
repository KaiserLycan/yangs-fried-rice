/**
 * Signed-in Customer area.
 *
 * Route group: "(account)" never reaches the URL, so these pages live at the
 * root — /cart, /checkout, /orders, /profile.
 *
 * This layout is the auth gate for the whole group. The project convention is
 * that access checks live in layouts rather than URLs, which means any page
 * added inside (account) is protected without anyone remembering to update
 * the middleware matcher. That matters here specifically: route groups add no
 * path segment, so middleware cannot guard this area with a single :path*
 * match the way it can for /manage and /deliver.
 *
 * /cart and /checkout live here rather than in (shop) because the team
 * decided a customer must be logged in before adding to the cart — the Cart
 * table is keyed by customer_id, so there is no such thing as a guest cart.
 *
 * TODO(auth): read the Supabase session; redirect to /login when absent,
 * preserving the intended destination so the customer lands back where they
 * were trying to go.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
