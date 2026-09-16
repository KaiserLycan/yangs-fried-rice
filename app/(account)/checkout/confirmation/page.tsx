import { redirect } from "next/navigation";
import { OrderPlacedScreen } from "@/components/checkout/order-placed-screen";
import { ToastProvider } from "@/components/ui/toast";
import { mockPlacedOrder } from "@/lib/checkout/mock-placed-order";
import { readPlacedOrder } from "@/lib/checkout/read-placed-order";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Order placed (Browsing12, Browsing16) — the receipt a customer lands on
 * once their order exists.
 *
 * Nothing routes here yet, on purpose. Placing an order is still a stubbed
 * write, so checkout's button raises a toast and stays put; sending someone
 * to a receipt for an order that was never created, with their cart still
 * full behind it, would be a worse lie than the toast. The screen is reached
 * by typing `?example=delivery` or `?example=pickup` until the write lands —
 * see `lib/checkout/mock-placed-order.ts`.
 *
 * `?order=<id>` is the real path and takes priority: once the backend creates
 * an order and redirects here with its id, that order renders and the
 * `?example=` switch has no effect on it.
 *
 * Middleware already turns signed-out visitors away from /checkout, so
 * reaching the redirect below is not expected. Guarded anyway, the same
 * defence-in-depth the cart, checkout and profile pages use.
 */
export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string; example?: string | string[] };
}) {
  const profile = await readCustomerProfile();

  if (!profile) redirect("/login?next=/checkout/confirmation");

  const order = searchParams.order
    ? await readPlacedOrder(searchParams.order)
    : null;

  return (
    <ToastProvider>
      <OrderPlacedScreen
        profile={profile}
        order={order ?? mockPlacedOrder(searchParams.example)}
      />
    </ToastProvider>
  );
}
