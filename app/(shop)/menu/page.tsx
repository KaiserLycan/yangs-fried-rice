import { MenuPageBody } from "@/components/menu/menu-page-body";
import { fulfilmentFromParam } from "@/lib/checkout/fulfilment-param";

/**
 * Menu browse (Browsing1-16, SFR1-2, Menu5), public.
 *
 * The canonical menu URL — the one `SiteNavBar` and `BottomTabBar` link to,
 * and the one the team has already shared. `/` renders the same body (see
 * `app/(shop)/page.tsx`); everything this page does lives in `MenuPageBody`
 * so the two routes can't drift apart.
 *
 * Reads are real; the Add to cart button on every card opens the item detail
 * modal (ticket 03) rather than writing anything.
 *
 * The one thing this route has that `/` does not is `?fulfilment=`. Checkout
 * links back here as `/menu?fulfilment=pickup` (see `CheckoutScreen`), so a
 * customer who chose Pickup and returned to add another item would otherwise
 * land on a menu quietly switched back to delivery, ₱95 fee and all.
 */
export default function MenuPage({
  searchParams,
}: {
  searchParams: { fulfilment?: string };
}) {
  return <MenuPageBody fulfilment={fulfilmentFromParam(searchParams.fulfilment)} />;
}
