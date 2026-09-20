import { redirect } from "next/navigation";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { TrackOrderScreen } from "@/components/orders/track-order-screen";
import { ToastProvider } from "@/components/ui/toast";
import { getOrderEtaAction } from "@/lib/actions/eta";
import { arrivalWindowFrom } from "@/lib/orders/arrival-window";
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
 * The arrival window comes from the backend's ETA engine (issue #10), read
 * in the same pass as the order. The action refuses an order the caller
 * does not own with the same "Order not found." as a missing one, so a
 * failed estimate never leaks anything — the screen just says the time is
 * to be confirmed. The screen re-asks on every Realtime status change.
 *
 * Middleware already turns signed-out visitors away from /orders, so
 * reaching the redirect below is not expected. Guarded anyway, the same
 * reasoning CartPage and ProfilePage give: middleware is defence in depth,
 * not the only check.
 */
export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { orderId: string };
  /**
   * `?example=cancelled` picks which stand-in state to show, and is read
   * only when the real read found nothing — see `mockTrackedOrder`. It
   * cannot override a genuine order.
   */
  searchParams: { example?: string | string[] };
}) {
  const [profile, order, eta] = await Promise.all([
    readCustomerProfile(),
    readTrackedOrder(params.orderId),
    getOrderEtaAction(params.orderId),
  ]);

  if (!profile) redirect(`/login?next=/orders/${params.orderId}`);

  return (
    <ToastProvider>
      <SiteNavBar profile={profile} currentSection="track-order" />
      <TrackOrderScreen
        order={
          order
            ? { ...order, arrivalWindow: arrivalWindowFrom(eta) }
            : mockTrackedOrder(params.orderId, searchParams.example)
        }
        locationIqApiKey={process.env.LOCATIONIQ_API_KEY}
      />
    </ToastProvider>
  );
}
