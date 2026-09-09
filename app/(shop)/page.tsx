import { MenuPageBody } from "@/components/menu/menu-page-body";

/**
 * The landing page, `/`. Renders the menu rather than describing it — asked
 * for by the PM on PR #29 ("Menu should also reflect in the main page but as
 * the guest version (if not logged in)"), replacing the scaffold copy that
 * was still deployed at the root.
 *
 * It renders the menu itself instead of redirecting to `/menu` so that the
 * address a visitor typed is the address they keep. `/menu` still exists and
 * is still what the navigation links to.
 *
 * Lives in the `(shop)` group, not at `app/page.tsx`: the parentheses never
 * reach the URL, so this is still `/`, but the front door is storefront
 * content and inherits the storefront's layout like every other page in it.
 *
 * The "guest version" needs no code of its own — see `MenuPageBody`, which
 * reads a `null` profile and an empty cart for a signed-out visitor.
 */
export default function HomePage() {
  return <MenuPageBody />;
}
