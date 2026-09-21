import { redirect } from "next/navigation";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { PastOrdersScreen } from "@/components/orders/past-orders-screen";
import { ToastProvider } from "@/components/ui/toast";
import { readPastOrders } from "@/lib/orders/read-past-orders";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import { BottomTabBar } from "@/components/nav/bottom-tab-bar";
import { readCart } from "@/lib/cart/read-cart";
import { cartItemCount } from "@/lib/menu/cart-totals";

/**
 * Order history (OHF1) — desktop `133:1268`, mobile `133:2101`.
 *
 * Shows the signed-in customer's real orders and nothing else. A customer with
 * no orders sees the empty state — never sample data. (An earlier version fell
 * back to a committed fixture whenever the real read was empty, which put
 * orders the customer never placed on their own history screen.)
 *
 * Middleware already turns signed-out visitors away from /orders, so reaching
 * the redirect below is not expected. Guarded anyway, the same reasoning
 * CartPage and ProfilePage give: middleware is defence in depth, not the only
 * check.
 */
export default async function OrdersPage() {
  const [profile, orders, cart] = await Promise.all([
    readCustomerProfile(),
    readPastOrders(),
    readCart(),
  ]);

  if (!profile) redirect("/login?next=/orders");

  return (
    <ToastProvider>
      <SiteNavBar profile={profile} currentSection="orders" />
      <PastOrdersScreen orders={orders} />
      <BottomTabBar current="orders" cartCount={cartItemCount(cart.lines)} />
    </ToastProvider>
  );
}
