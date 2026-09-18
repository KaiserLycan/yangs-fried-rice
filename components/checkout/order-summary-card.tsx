"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { useToast } from "@/components/ui/toast";
import { submitCart } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { ARRIVAL_ESTIMATE } from "@/lib/checkout/arrival-estimate";
import { orderTypeFor } from "@/lib/checkout/fulfilment-param";
import {
  isOnlinePaymentConfigured,
  startWalletPayment,
} from "@/lib/checkout/paymongo";
import type {
  PaymentMethodId,
  WalletProvider,
} from "@/lib/checkout/payment-methods";
import { formatPeso } from "@/lib/menu/product-listing";
import type { CartLine, CartTotals, Fulfilment } from "@/lib/menu/cart-totals";

/**
 * Order summary (`133:1124` desktop, `132:424` mobile) — issue #22's
 * acceptance criteria read literally, in the order the frames draw them:
 * customer name and time, address and fulfilment type, every line with its
 * quantity and price, the delivery fee, and the amount payable.
 *
 * The rows themselves live in `OrderSummaryRows`, which the confirmation
 * screen also renders. What stays here is what only belongs on checkout: the
 * arrival estimate and the Place order button.
 */

const CARD_NOT_YET =
  "Card payments aren’t available yet — choose GCash / Maya, or pay when your order reaches you.";
const WALLET_NOT_YET =
  "Online payment isn’t set up on this site yet — pay when your order reaches you instead.";

export function OrderSummaryCard({
  customerName,
  placedAtLabel,
  address,
  cartId,
  fulfilment,
  lines,
  totals,
  paymentMethod,
  wallet,
}: {
  customerName: string;
  placedAtLabel: string;
  address: string | null;
  cartId: string;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
  paymentMethod: PaymentMethodId;
  wallet: WalletProvider;
}) {
  const router = useRouter();
  const showToast = useToast();
  const { run, pending } = useCartAction();
  // Stays true once the browser is on its way to the wallet's page. `run`
  // would otherwise re-enable the button during the hand-off, and a second
  // press would submit a cart that is already locked.
  const [redirecting, setRedirecting] = React.useState(false);

  // `submitCart` locks the cart, creates the `order` and hands back its id.
  // The fee is sent along because the backend has no fee rule of its own
  // (see the handoff doc) — the ₱95 `computeCartTotals` already applied is
  // the number the customer just read, so it is the number the order keeps.
  //
  // What happens next depends on how they said they'd pay:
  //
  //   - Cash on delivery / Pay in store: straight to the receipt at
  //     `/checkout/confirmation?order=`. Nothing is charged.
  //   - GCash / Maya: the order exists, so start the online payment and send
  //     them to the wallet's page. If that start fails they still land on
  //     the receipt — the order is real and must not vanish — with `?pay=`
  //     naming the wallet so the receipt can offer "Pay now".
  //   - Card: refused before any order is created. There is no card form
  //     yet, and locking a cart behind an order nobody can pay for would be
  //     worse than a toast. A wallet on a site with no PayMongo key is
  //     refused at the same point, for the same reason.
  //
  // A failure from `submitCart` itself stays here with the backend's reason
  // in a toast, as before.
  function handlePlaceOrder() {
    if (paymentMethod === "card") {
      showToast(CARD_NOT_YET);
      return;
    }
    if (paymentMethod === "wallet" && !isOnlinePaymentConfigured()) {
      showToast(WALLET_NOT_YET);
      return;
    }

    run(
      () =>
        submitCart({
          cart_id: cartId,
          order_type: orderTypeFor(fulfilment),
          delivery_fee: totals.deliveryFee,
        }),
      async ({ order_id }) => {
        const receipt = `/checkout/confirmation?order=${order_id}`;

        if (paymentMethod !== "wallet") {
          router.push(receipt);
          return;
        }

        const receiptForWallet = `${receipt}&pay=${wallet}`;
        try {
          const start = await startWalletPayment({
            orderId: order_id,
            wallet,
            returnUrl: `${window.location.origin}${receiptForWallet}`,
          });
          if (start.kind === "redirect") {
            setRedirecting(true);
            window.location.assign(start.url);
          } else {
            router.push(receiptForWallet);
          }
        } catch {
          // This screen is about to unmount, and its toast with it, so the
          // receipt is told to explain instead.
          router.push(`${receiptForWallet}&pay_error=1`);
        }
      },
    );
  }

  return (
    <section className="flex flex-col gap-[11px] rounded-lg border border-rule bg-card p-[20px]">
      <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
        Order summary
      </h2>

      <OrderSummaryRows
        customerName={customerName}
        placedAtLabel={placedAtLabel}
        address={address}
        fulfilment={fulfilment}
        lines={lines}
        totals={totals}
      />

      <p className="rounded-md bg-secondary/50 p-[12px] text-[12px] leading-[18px] text-muted-strong">
        Estimated arrival <strong>{ARRIVAL_ESTIMATE}</strong> — based on current
        kitchen queue and delivery distance.
      </p>

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={pending || redirecting}
        className="rounded-[13px] bg-accent p-[16px] text-[15px] font-bold text-accent-foreground disabled:opacity-60"
      >
        {redirecting
          ? "Opening wallet…"
          : pending
            ? "Placing order…"
            : `Place order · ${formatPeso(totals.total)}`}
      </button>
    </section>
  );
}
