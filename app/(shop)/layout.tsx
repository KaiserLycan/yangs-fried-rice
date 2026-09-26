/**
 * Public storefront. No auth — anyone can browse the menu, and these URLs are
 * meant to be shared and typed, so they stay short.
 *
 * Route group: the "(shop)" folder name never reaches the URL. Pages here
 * live at the root — /menu, /menu/:itemId. The group exists to give the
 * storefront its own layout, not to add a path segment.
 *
 * Deliberately unguarded. The login wall for customers sits on the "Add to
 * cart" action, not on the menu pages.
 */
import { SiteFooter } from "@/components/layout/site-footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
