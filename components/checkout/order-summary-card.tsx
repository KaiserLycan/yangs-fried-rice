"use client";

import * as React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUTS, useShortcut } from "@/lib/hooks/use-shortcut";
import { useRouter } from "next/navigation";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { useToast } from "@/components/ui/toast";
import { submitCart } from "@/lib/actions/cart";
import { useCartAction } from "@/lib/cart/use-cart-action";
import { orderTypeFor } from "@/lib/checkout/fulfilment-param";
import {
  isOnlinePaymentConfigured,
  startWalletPayment,
} from "@/lib/checkout/paymongo";
import { WALLET_TAB_PARAM, openWalletTab } from "@/lib/checkout/wallet-tab";
import type {
  PaymentMethodId,
  WalletProvider,
} from "@/lib/checkout/payment-methods";
import { formatPeso, formatPesoCentavos } from "@/lib/menu/product-listing";
import {
  seniorPwdBreakdown,
  type CartLine,
  type CartTotals,
  type Fulfilment,
} from "@/lib/menu/cart-totals";
import { createClient } from "@/lib/supabase/client";
import {
  SENIOR_PWD_ID_BUCKET,
  seniorPwdIdPath,
  seniorPwdIdUploadProblem,
} from "@/lib/storage/senior-pwd-ids";
import type { SeniorPwdDiscountState } from "@/components/checkout/senior-pwd-discount-picker";
import { Button } from "@/components/ui/button";

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
  cartId,
  fulfilment,
  lines,
  totals,
  paymentMethod,
  wallet,
  arrivalEstimate,
  seniorDiscount,
}: {
  customerName: string;
  placedAtLabel: string;
  cartId: string;
  fulfilment: Fulfilment;
  lines: CartLine[];
  totals: CartTotals;
  paymentMethod: PaymentMethodId;
  wallet: WalletProvider;
  /**
   * The window quoted for this order, computed from the live kitchen queue
   * and the delivery distance (issue #106 — this was the fixed string
   * "35–45 min"). Read on the server, because the queue is a database count.
   */
  arrivalEstimate: string;
  seniorDiscount?: SeniorPwdDiscountState;
}) {
  const router = useRouter();
  const showToast = useToast();
  const { run, pending } = useCartAction();
  // Stays true once the browser is on its way to the wallet's page. `run`
  // would otherwise re-enable the button during the hand-off, and a second
  // press would submit a cart that is already locked.
  const [redirecting, setRedirecting] = React.useState(false);

  // Where to send the customer if they come back from the wallet. Set just
  // before the browser leaves for PayMongo, and read on the way back in.
  // A ref, not state: the back/forward cache restores this page's JavaScript
  // heap intact, so whatever was written here survives the round trip.
  const walletReceipt = React.useRef<string | null>(null);

  // Back from the wallet page restores this screen from the browser's cache:
  // same DOM, same state, button still disabled, and — because nothing was
  // re-requested — no idea that an order now exists.
  //
  // `router.refresh()` alone is not enough. The checkout route redirects an
  // unpaid order to its receipt, but a `redirect()` raised inside a Server
  // Component during a refresh does not reliably navigate; the payload comes
  // back and the page stays put. That left a customer whose payment failed
  // looking at the summary they had already submitted, with no way to reach
  // the order or to switch it to cash on delivery (issue #106).
  //
  // So this does not ask the server where to go. It already knows: the order
  // id came back from `submitCart` before the browser ever left.
  React.useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const receipt = walletReceipt.current;
      if (receipt) {
        // `replace`, so Back from the receipt does not come straight back
        // here and bounce them forward again.
        router.replace(receipt);
        return;
      }
      setRedirecting(false);
      router.refresh();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router]);

  // `submitCart` locks the cart, creates the `order` and hands back its id.
  // The fee is sent along because the backend has no fee rule of its own
  // (see the handoff doc) — the ₱95 `computeCartTotals` already applied is
  // the number the customer just read, so it is the number the order keeps.
  //
  // What happens next depends on how they said they'd pay:
  //
  //   - Cash on delivery / Pay in store: the order is `pending` and straight
  //     to the receipt at `/checkout/confirmation?order=`. Nothing is charged
  //     now, but these are collected later by design.
  //   - GCash / Maya: the order is created held at `awaiting_payment`, so it
  //     is out of the kitchen's sight until PayMongo's webhook says the money
  //     arrived. Start the online payment and send them to the wallet's page.
  //     If that start fails they still land on the receipt — the order is
  //     real and must not vanish — with `?pay=` naming the wallet so the
  //     receipt can offer "Pay now" or a switch to cash on delivery.
  //   - Card: refused before any order is created. There is no card form
  //     yet, and locking a cart behind an order nobody can pay for would be
  //     worse than a toast. A wallet on a site with no PayMongo key is
  //     refused at the same point, for the same reason.
  //
  // A failure from `submitCart` itself stays here with the backend's reason
  // in a toast, as before.
  // Ctrl/⌘+Enter places the order — unless focus is inside a form (the
  // address editor), where the same keys save that form instead.
  useShortcut(SHORTCUTS.placeOrder.combo, () => {
    if (document.activeElement?.closest("form")) return;
    if (pending || redirecting) return;
    handlePlaceOrder();
  });

  const isDiscountActive = Boolean(seniorDiscount?.enabled);
  const discountTotals = isDiscountActive
    ? seniorPwdBreakdown(totals.total)
    : null;

  function handlePlaceOrder() {
    if (paymentMethod === "card") {
      showToast(CARD_NOT_YET);
      return;
    }
    if (paymentMethod === "wallet" && !isOnlinePaymentConfigured()) {
      showToast(WALLET_NOT_YET);
      return;
    }

    if (seniorDiscount?.enabled) {
      if (!seniorDiscount.idNumber.trim()) {
        showToast("Please enter the ID number on your Senior Citizen / PWD ID.");
        return;
      }
      if (!seniorDiscount.nameOnId.trim()) {
        showToast("Please enter the name on your Senior Citizen / PWD ID.");
        return;
      }
      if (!seniorDiscount.photo) {
        showToast("Please upload a photo of your Senior Citizen or PWD ID.");
        return;
      }
      const problem = seniorPwdIdUploadProblem(seniorDiscount.photo);
      if (problem) {
        showToast(problem);
        return;
      }
    }

    // `card` is refused above. Pickup-only (issue #114): the action accepts
    // the wallet or paying at the counter, and anything else lands on the
    // counter — the method that needs nothing up front.
    const chosenMethod: "wallet" | "pay-in-store" =
      paymentMethod === "wallet" ? "wallet" : "pay-in-store";

    // Opened here, in the click itself, and before anything is awaited: a
    // popup asked for later — after `submitCart` comes back — is one the
    // browser did not see the customer request, and it gets blocked. Empty
    // for now; it is pointed at the wallet once PayMongo has answered.
    const walletTab = paymentMethod === "wallet" ? openWalletTab() : null;

    run(
      async () => {
        try {
          let uploadedPhotoPath: string | null = null;
          if (seniorDiscount?.enabled && seniorDiscount.photo) {
            const supabase = createClient();
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
              walletTab?.close();
              return {
                data: null,
                error: "Your session expired. Please sign in again.",
              };
            }

            const fileType = seniorDiscount.photo.type as any;
            uploadedPhotoPath = seniorPwdIdPath(user.id, fileType);

            const { error: uploadError } = await supabase.storage
              .from(SENIOR_PWD_ID_BUCKET)
              .upload(uploadedPhotoPath, seniorDiscount.photo, {
                contentType: seniorDiscount.photo.type,
              });

            if (uploadError) {
              walletTab?.close();
              return {
                data: null,
                error: "The ID photo couldn't be uploaded. Please try again.",
              };
            }
          }

          const result = await submitCart({
            cart_id: cartId,
            order_type: orderTypeFor(fulfilment),
            delivery_fee: totals.deliveryFee,
            // Decides whether the order is cookable on arrival. A wallet
            // order is held at `awaiting_payment` until PayMongo confirms,
            // so the kitchen never sees a payment that was abandoned or
            // refused.
            payment_method: chosenMethod,
            // What each line cost on this screen. If the menu price moved
            // since, the database refuses with PRICE_CHANGED and names the
            // dishes; the toast shows that and the refresh brings in the
            // new prices, so the customer re-confirms (issue #115).
            expected_prices: Object.fromEntries(
              lines.map((line) => [line.id, line.unitPrice]),
            ),
            wallet,
            discount:
              seniorDiscount?.enabled && uploadedPhotoPath
                ? {
                    type: seniorDiscount.type,
                    id_number: seniorDiscount.idNumber.trim(),
                    name_on_id: seniorDiscount.nameOnId.trim(),
                    photo_path: uploadedPhotoPath,
                  }
                : undefined,
          });
          // No order, so nothing to pay: don't leave an empty tab behind.
          if (result.error !== null) walletTab?.close();
          return result;
        } catch (thrown) {
          walletTab?.close();
          throw thrown;
        }
      },
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
            // Baked into the payment intent, so it has to be decided now —
            // which is fine, because the tab was opened before any of this
            // was awaited. The marker tells the receipt that loads over
            // there that it is the throwaway tab and may close itself.
            returnUrl: `${window.location.origin}${receiptForWallet}${
              walletTab ? `&${WALLET_TAB_PARAM}=1` : ""
            }`,
          });

          if (start.kind !== "redirect") {
            walletTab?.close();
            router.push(receiptForWallet);
            return;
          }

          // The wallet goes in its own tab and this one goes to the receipt,
          // which watches the payment settle and offers "pay again" and
          // "switch to cash on delivery" throughout. PayMongo's dead-end
          // page then costs a tab switch instead of the whole order.
          if (walletTab?.send(start.url)) {
            router.push(receiptForWallet);
            return;
          }

          // The popup was blocked, or the customer closed it while the
          // intent was being created. Fall back to the old hand-off: give
          // up this tab, and leave a note for the way back in.
          setRedirecting(true);
          walletReceipt.current = receiptForWallet;
          window.location.assign(start.url);
        } catch {
          walletTab?.close();
          // This screen is about to unmount, and its toast with it, so the
          // receipt is told to explain instead.
          router.push(`${receiptForWallet}&pay_error=1`);
        }
      },
    );
  }

  return (
    <section className="flex flex-col gap-[11px] rounded-lg border border-rule bg-card p-[20px]">
      <h2 className="text-sm font-bold uppercase tracking-[1.54px] text-muted-foreground">
        Order summary
      </h2>

      <OrderSummaryRows
        customerName={customerName}
        placedAtLabel={placedAtLabel}
        fulfilment={fulfilment}
        lines={lines}
        totals={totals}
        discount={
          isDiscountActive && discountTotals
            ? {
                type: seniorDiscount!.type,
                vatExemptSales: discountTotals.vatExemptSales,
                discount: discountTotals.discount,
                total: discountTotals.total,
              }
            : null
        }
      />

      <p className="rounded-md bg-secondary/50 p-[12px] text-sm leading-[18px] text-muted-strong">
        {/* This sentence has always claimed the figure came from the queue
            and the distance. Since issue #106 it does. */}
        Estimated arrival <strong>{arrivalEstimate}</strong> — based on current
        kitchen queue and delivery distance.
      </p>

      <Tooltip
        content="Send this order to the kitchen"
        shortcut={pending || redirecting ? undefined : SHORTCUTS.placeOrder.combo}
        className="w-full"
      >
        <Button variant="unstyled"
          type="button"
          onClick={handlePlaceOrder}
          disabled={pending || redirecting}
          className="w-full rounded-md bg-accent p-[16px] text-base font-bold text-accent-foreground disabled:opacity-60"
        >
          {redirecting
            ? "Opening wallet…"
            : pending
              ? "Placing order…"
              : `Place order · ${formatSummaryMoney(
                  discountTotals ? discountTotals.total : totals.total,
                )}`}
        </Button>
      </Tooltip>
    </section>
  );
}

function formatSummaryMoney(amount: number): string {
  return Number.isInteger(amount) ? formatPeso(amount) : formatPesoCentavos(amount);
}
