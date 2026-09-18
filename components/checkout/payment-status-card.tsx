"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import {
  WALLET_PROVIDERS,
  type WalletProvider,
} from "@/lib/checkout/payment-methods";
import { startWalletPayment } from "@/lib/checkout/paymongo";
import {
  foldPaymentStatus,
  type PaymentStatus,
} from "@/lib/checkout/payment-status";
import { createClient } from "@/lib/supabase/client";

/**
 * The payment block on the receipt, and the one part of that screen that
 * changes after it renders.
 *
 * A wallet payment is settled off-site: the customer pays on GCash / Maya's
 * page, PayMongo tells the backend's webhook, and the webhook flips
 * `transaction.payment_status`. By the time the customer is sent back here
 * that flip may or may not have happened, so the card starts from the status
 * the server read and then keeps watching:
 *
 *   - a Realtime subscription on this order's `transaction` rows, and
 *   - while the answer is still "pending", a re-read every few seconds and
 *     whenever the tab regains focus — the webhook can land while the
 *     customer is still on the wallet's tab, and a subscription alone
 *     depends on the table being published, which nothing here can check.
 *
 * "Pay now" covers the two ways a wallet order arrives here unpaid: the
 * payment never started (`?pay=` names the wallet), or the customer backed
 * out of the wallet page and the row is still pending. Both re-run the same
 * start; `create-payment-intent` reuses the pending row.
 */

const POLL_MS = 4000;

const WALLET_LABEL = new Map(
  WALLET_PROVIDERS.map((provider) => [provider.id, provider.label]),
);

export function PaymentStatusCard({
  orderId,
  methodLabel,
  initialStatus,
  wallet,
  startFailed = false,
}: {
  orderId: string;
  methodLabel: string;
  initialStatus: PaymentStatus | null;
  /** The wallet named in the URL, when the customer came here from one. */
  wallet: WalletProvider | null;
  /** Checkout could not open the wallet page — the toast it raised is gone
   * by the time this screen mounts, so the receipt says so instead. */
  startFailed?: boolean;
}) {
  const showToast = useToast();
  const [status, setStatus] = React.useState(initialStatus);
  const [starting, setStarting] = React.useState<WalletProvider | null>(null);

  const reread = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("transaction")
      .select("payment_status")
      .eq("order_id", orderId);
    if (data) setStatus(foldPaymentStatus(data));
  }, [orderId]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-payment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction",
          filter: `order_id=eq.${orderId}`,
        },
        () => void reread(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, reread]);

  React.useEffect(() => {
    if (status !== "pending") return;

    const timer = window.setInterval(() => void reread(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void reread();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, reread]);

  async function payWith(provider: WalletProvider) {
    setStarting(provider);
    try {
      const start = await startWalletPayment({
        orderId,
        wallet: provider,
        returnUrl: `${window.location.origin}/checkout/confirmation?order=${orderId}&pay=${provider}`,
      });
      if (start.kind === "redirect") {
        // Deliberately left `starting` set: the page is on its way to the
        // wallet, and a button that woke up during the hand-off could start
        // a second intent on the same pending row.
        window.location.assign(start.url);
        return;
      }
      setStatus(start.kind === "paid" ? "paid" : "pending");
      setStarting(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Couldn’t start the payment.",
      );
      setStarting(null);
    }
  }

  // Which wallet buttons to draw. Known from the URL: just that one. A
  // pending or failed row with no wallet in the URL (the customer reopened
  // the receipt later): offer both, since the row does not say which.
  const isOnlineOrder = wallet !== null || status !== null;
  const offer =
    status === "paid" || !isOnlineOrder
      ? []
      : wallet
        ? [wallet]
        : WALLET_PROVIDERS.map((provider) => provider.id);

  return (
    <section
      data-testid="payment-method"
      data-status={status ?? "none"}
      className="flex flex-col gap-[4px] rounded-lg border border-rule bg-card p-[20px]"
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[1.54px] text-muted-foreground">
        Payment method
      </h2>
      <p className="text-[14px] font-bold text-foreground">
        {isOnlineOrder && methodLabel === "Not recorded"
          ? "GCash / Maya wallet"
          : methodLabel}
      </p>
      <p
        role={status === "pending" ? "status" : undefined}
        className="text-[12px] leading-[18px] text-muted-strong"
      >
        {note(status, isOnlineOrder, startFailed)}
      </p>

      {offer.length > 0 ? (
        <div className="mt-[8px] flex flex-col gap-[8px] sm:flex-row">
          {offer.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => void payWith(provider)}
              disabled={starting !== null}
              className="flex-1 rounded-[13px] bg-accent p-[12px] text-[14px] font-bold text-accent-foreground disabled:opacity-60"
            >
              {starting === provider
                ? "Opening wallet…"
                : `${status === "failed" ? "Try again" : "Pay now"} with ${WALLET_LABEL.get(provider)}`}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function note(
  status: PaymentStatus | null,
  isOnlineOrder: boolean,
  startFailed: boolean,
): string {
  if (startFailed && status !== "paid") {
    return "We couldn’t open your wallet just now. Your order is placed — pay now to finish it.";
  }
  switch (status) {
    case "paid":
      return "Payment received — thank you.";
    case "pending":
      return "Waiting for your wallet to confirm the payment… If you closed the wallet page, pay now to finish.";
    case "failed":
      return "The payment didn’t go through. Nothing was taken — try again below.";
    default:
      return isOnlineOrder
        ? "Your payment hasn’t started yet. Pay now to finish this order."
        : "Nothing has been taken yet — settle up when your order reaches you.";
  }
}
