import { redirect } from "next/navigation";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { PastOrdersScreen } from "@/components/orders/past-orders-screen";
import { ToastProvider } from "@/components/ui/toast";
import { mockPastOrders } from "@/lib/orders/mock-past-orders";
import { readPastOrders } from "@/lib/orders/read-past-orders";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { readCart } from "@/lib/cart/read-cart";
import { cartItemCount } from "@/lib/menu/cart-totals";

/**
 * Order history (OHF1) — desktop `133:1268`, mobile `133:2101`.
 *
 * The read is real and runs first, so a genuine history renders genuinely. It
 * comes back empty for every customer today, because nothing writes an
 * `order` row yet, and the screen falls back to a committed fixture rather
 * than showing an empty list — otherwise nobody reviewing the preview link
 * can tell the screen from a broken one. Same treatment the tracking screen
 * uses; see `lib/orders/mock-past-orders.ts`, which also records what has to
 * land before the fallback can be deleted.
 *
 * Note the fallback is on *emptiness*, not on failure: the moment a customer
 * has one real finished order, they see their real history and `?example=`
 * stops affecting this page for them.
 *
 * Middleware already turns signed-out visitors away from /orders, so reaching
 * the redirect below is not expected. Guarded anyway, the same reasoning
 * CartPage and ProfilePage give: middleware is defence in depth, not the only
 * check.
 */
export default async function OrdersPage({
  searchParams,
}: {
  /**
   * `?example=empty` picks which stand-in history to show, and is read only
   * when the real read found nothing — see `mockPastOrders`. It cannot
   * override a genuine history.
   */
  searchParams: { example?: string | string[] };
}) {
  const [profile, orders, cart] = await Promise.all([
    readCustomerProfile(),
    readPastOrders(),
    readCart(),
  ]);

  if (!profile) redirect("/login?next=/orders");

  return (
    <ToastProvider>
      <SiteNavBar profile={profile} currentSection="orders" />
      <PastOrdersScreen
        orders={orders.length > 0 ? orders : mockPastOrders(searchParams.example)}
      />
      <BottomTabBar current="orders" cartCount={cartItemCount(cart.lines)} />
    </ToastProvider>
  );
}
