import { MenuPageBody } from "@/components/menu/menu-page-body";

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
 */
export default function MenuPage() {
  return <MenuPageBody />;
}
