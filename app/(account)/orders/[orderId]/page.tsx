import { notFound, redirect } from "next/navigation";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import { ToastProvider } from "@/components/ui/toast";
import { readTrackedOrder } from "@/lib/orders/read-tracked-order";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Track one order — desktop `133:1164`, mobile `132:481` (still cancellable)
 * and `132:543` (kitchen confirmed, cancel withdrawn).
 *
 * `readTrackedOrder` returns null for every customer today, because nothing
 * writes an `order` row yet, so this page 404s in practice. That is the
 * honest behaviour rather than a bug: there is no "order not found" frame to
 * render instead, and faking an order here would put invented data in front
 * of a real customer. To see the screen before the write lands, insert an
 * `order` row for your own customer id — the PR description has the SQL.
 *
 * Middleware already turns signed-out visitors away from /orders, so
 * reaching the redirect below is not expected. Guarded anyway, the same
 * reasoning CartPage and ProfilePage give: middleware is defence in depth,
 * not the only check.
 */
export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const [profile, order] = await Promise.all([
    readCustomerProfile(),
    readTrackedOrder(params.orderId),
  ]);

  if (!profile) redirect(`/login?next=/orders/${params.orderId}`);
  if (!order) notFound();

  return (
    <ToastProvider>
      <SiteNavBar profile={profile} currentSection="track-order" />
      {/* `cancelSlot` is left unpassed on purpose. Ticket 07 owns the Cancel
          order control and the note that replaces it; this ticket only has to
          leave the slot, and the screen already computes whether cancelling
          is still allowed. */}
      <TrackOrderScreen order={order} />
    </ToastProvider>
  );
}
