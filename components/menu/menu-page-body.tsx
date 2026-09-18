import { MenuScreen } from "@/components/menu/menu-screen";
import { ToastProvider } from "@/components/ui/toast";
import { readCart } from "@/lib/cart/read-cart";
import { getCategories, getProducts } from "@/lib/actions/menu";
import type { Fulfilment } from "@/lib/menu/cart-totals";
import { mapProductRow } from "@/lib/menu/product-listing";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * The menu screen and everything it needs to read, as one server component,
 * so that `/` and `/menu` render the same screen from the same code rather
 * than from two copies of this fetch block.
 *
 * Two routes exist because the PM asked on PR #29 for the menu to "reflect in
 * the main page but as the guest version (if not logged in)" — see
 * `.scratch/ordering-flow/issues/09-landing-menu.md`. `/` is the front door a
 * visitor types or is linked to; `/menu` is the canonical URL the nav bar and
 * the mobile tab bar point at, and stays working because the team has already
 * shared it.
 *
 * Public, both ways in. `middleware.ts`'s matcher excludes `/` and `/menu`
 * alike, so a signed-out visitor reaches this. `readCustomerProfile()`
 * returning `null` for a guest is the behaviour this screen wants, unlike
 * `/profile`, which redirects on the same null: `SiteNavBar` shows a "Log in"
 * link instead of the avatar and drops the "Deliver to" address, and
 * `readCart()` yields no lines, so the cart count reads 0. There is no
 * separate "guest version" of the screen to build — this is it.
 *
 * The initial, unfiltered list is fetched here with the existing
 * `getProducts()`/`getCategories()` server actions rather than this app's own
 * `GET /api/menu/products` route — reusing the read jmv0111/LleytonFlores
 * already built rather than a self-fetch for the first paint. Search and
 * category changes after that go through the API route from inside
 * `MenuScreen`, which is the interactive part of this screen.
 *
 * `fulfilment` is threaded in rather than read here because only one of the
 * two routes has it to give: checkout links back as `/menu?fulfilment=pickup`
 * so a customer returning to add an item keeps the choice they made, while `/`
 * is a front door nobody arrives at carrying one. Omitted, it reads as
 * delivery — see `lib/checkout/fulfilment-param.ts`.
 *
 * The desktop cart rail (ticket 04) lives inside this body rather than at
 * `/cart` — that route is mobile's own placement for the same contents. Both
 * read from `readCart()`, so the rail's item count and the mobile tab bar's
 * count (derived from the same rows) can't drift apart from each other.
 */
export function MenuPageBody({ fulfilment }: { fulfilment?: Fulfilment }) {
  const profilePromise = readCustomerProfile();
  const productsPromise = getProducts().then(r => (r.data ?? []).map(mapProductRow));
  const categoriesPromise = getCategories().then(r => (r.data ?? []).map(c => ({ id: c.category_id, name: c.category_name })));
  const cartPromise = readCart();

  return (
    <ToastProvider aboveTabBar>
      <MenuScreen
        profilePromise={profilePromise}
        productsPromise={productsPromise}
        categoriesPromise={categoriesPromise}
        cartPromise={cartPromise}
        initialFulfilment={fulfilment}
      />
    </ToastProvider>
  );
}
