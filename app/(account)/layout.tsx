/**
 * Signed-in Customer area.
 *
 * Route group: "(account)" never reaches the URL, so these pages live at the
 * root — /cart, /checkout, /orders, /profile.
 *
 * The project convention is that access checks live in layouts rather than
 * URLs, but that TODO was overtaken by events: `middleware.ts` now guards
 * this whole group by listing each path explicitly (`/cart`, `/checkout`,
 * `/orders`, `/profile`) rather than a single `:path*` match, precisely
 * because route groups add no path segment for one match to catch. Each
 * page still guards itself again on top of that — `/profile` and `/cart`
 * both redirect on a null profile read — because middleware is defence in
 * depth, not the only check; a page should not assume its caller was
 * screened correctly.
 *
 * /cart and /checkout live here rather than in (shop) because the team
 * decided a customer must be logged in before adding to the cart — the Cart
 * table is keyed by customer_id, so there is no such thing as a guest cart.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* This renders all /account nested routes like /account/orders */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
