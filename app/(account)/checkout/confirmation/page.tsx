import { notFound, redirect } from "next/navigation";
import { OrderPlacedScreen } from "@/components/checkout/order-placed-screen";
import { WalletTabCloser } from "@/components/checkout/wallet-tab-closer";
import { ToastProvider } from "@/components/ui/toast";
import { walletFromParam } from "@/lib/checkout/payment-methods";
import { readPlacedOrder } from "@/lib/checkout/read-placed-order";
import { readCustomerProfile } from "@/lib/profile/customer-profile";
import { WALLET_TAB_PARAM } from "@/lib/checkout/wallet-tab";

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
  searchParams: {
    order?: string;
    pay?: string;
    pay_error?: string;
    [WALLET_TAB_PARAM]?: string;
  };
}) {
  const profile = await readCustomerProfile();

  if (!profile) redirect("/login?next=/checkout/confirmation");

  const order = searchParams.order
    ? await readPlacedOrder(searchParams.order)
    : null;

  if (!order) notFound();

  return (
    <ToastProvider>
      {/* Renders nothing. If this document is the tab checkout opened for
          the payment, it closes itself now that PayMongo has answered — the
          customer's own tab is already watching the row. The receipt below
          still renders, so a browser that refuses to close leaves them on a
          usable page rather than a blank one. */}
      <WalletTabCloser
        active={searchParams[WALLET_TAB_PARAM] === "1"}
        orderId={order.orderId}
      />
      <OrderPlacedScreen
        profile={profile}
        order={order}
        wallet={walletFromParam(searchParams.pay)}
        startFailed={searchParams.pay_error === "1"}
      />
    </ToastProvider>
  );
}
