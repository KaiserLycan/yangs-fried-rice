import { notFound, redirect } from "next/navigation";
import { OrderPlacedScreen } from "@/components/checkout/order-placed-screen";
import { ToastProvider } from "@/components/ui/toast";
import { walletFromParam } from "@/lib/checkout/payment-methods";
import { readPlacedOrder } from "@/lib/checkout/read-placed-order";
import { readCustomerProfile } from "@/lib/profile/customer-profile";

/**
 * Order placed (Browsing12, Browsing16, PP1) — the receipt a customer lands
 * on once their order exists.
 *
 * `?order=<id>` names the order; checkout sends the customer here after
 * `submitCart`, and a wallet payment's `return_url` brings them back here
 * too. `?pay=gcash|paymaya` rides along on the wallet paths so the receipt
 * knows which wallet to offer if the payment still needs finishing, and
 * `?pay_error=1` when checkout could not open the wallet at all. An id that
 * is not one of this customer's orders is a 404.
 *
 * Middleware already turns signed-out visitors away from /checkout, so
 * reaching the redirect below is not expected. Guarded anyway, the same
 * defence-in-depth the cart, checkout and profile pages use.
 */
export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string; pay?: string; pay_error?: string };
}) {
  const profile = await readCustomerProfile();

  if (!profile) redirect("/login?next=/checkout/confirmation");

  const order = searchParams.order
    ? await readPlacedOrder(searchParams.order)
    : null;

  if (!order) notFound();

  return (
    <ToastProvider>
      <OrderPlacedScreen
        profile={profile}
        order={order}
        wallet={walletFromParam(searchParams.pay)}
        startFailed={searchParams.pay_error === "1"}
      />
    </ToastProvider>
  );
}
