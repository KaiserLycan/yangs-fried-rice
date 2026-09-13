import { redirect } from "next/navigation";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import { ToastProvider } from "@/components/ui/toast";
import { mockTrackedOrder } from "@/lib/orders/mock-tracked-order";
import { readTrackedOrder } from "@/lib/orders/read-tracked-order";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Track one order — desktop `133:1164`, mobile `132:481` (still cancellable)
 * and `132:543` (kitchen confirmed, cancel withdrawn).
 *
 * The read is real and runs first, so a genuine order renders genuinely. It
 * returns null for every customer today, because nothing writes an `order`
 * row yet, and the screen falls back to a committed fixture rather than
 * 404ing — otherwise nobody reviewing the preview link can see the screen at
 * all. Same treatment the employee screens already use; see
 * `lib/orders/mock-tracked-order.ts`, which also records what has to land
 * before the fallback can be deleted.
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

  return (
    <ToastProvider>
      <SiteNavBar profile={profile} currentSection="track-order" />
      {/* `cancelSlot` is left unpassed on purpose. Ticket 07 owns the Cancel
          order control and the note that replaces it; this ticket only has to
          leave the slot, and the screen already computes whether cancelling
          is still allowed. */}
      <TrackOrderScreen order={order ?? mockTrackedOrder(params.orderId)} />
    </ToastProvider>
  );
}
