"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  WALLET_PROVIDERS,
  type WalletProvider,
} from "@/lib/checkout/payment-methods";
import { startWalletPayment } from "@/lib/checkout/paymongo";
import { openWalletTab } from "@/lib/checkout/wallet-tab";
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
/** How long a pending payment is left alone before "Pay now" is offered.
 * The webhook usually lands within seconds of the customer returning; a
 * button shown sooner invites a second intent on top of a payment that is
 * already going through (`create-payment-intent` reuses the pending row and
 * overwrites its reference, so the late webhook would then match nothing). */
const PENDING_GRACE_MS = 20000;

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
  const router = useRouter();
  const showToast = useToast();
  const [status, setStatus] = React.useState(initialStatus);
  const [starting, setStarting] = React.useState<WalletProvider | null>(null);
  const [stalePending, setStalePending] = React.useState(false);

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

  // Watch until the money has actually moved — not only while the row says
  // "pending". A failed attempt used to end the watch, which was wrong the
  // moment the wallet moved into its own tab: the customer pays over there,
  // the webhook writes `paid`, and this tab would sit on "Try again with
  // GCash" for an order that is already paid for. Realtime alone cannot be
  // relied on, since nothing here can check that `transaction` is published.
  const settled = status === "paid" || status === "refunded";

  React.useEffect(() => {
    if (settled) {
      setStalePending(false);
      return;
    }

    const timer = window.setInterval(() => void reread(), POLL_MS);
    // Coming back to this tab is the strongest hint that something happened
    // in the other one, so it re-reads immediately rather than waiting out
    // the interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") void reread();
    };
    document.addEventListener("visibilitychange", onVisible);

    // The grace period is only about a *pending* row: it stops a second
    // intent being started on top of a payment that is still going through.
    // A failed or missing row has nothing in flight to protect.
    if (status !== "pending") {
      setStalePending(false);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    const grace = window.setTimeout(
      () => setStalePending(true),
      PENDING_GRACE_MS,
    );

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(grace);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, settled, reread]);

  // Everything around this card is server-rendered from `order.order_status`
  // — whether the order can be tracked, and whether "switch to cash on
  // delivery" is offered. Those were decided before the payment landed, so
  // the moment it does, the page behind this card is out of date and has to
  // be asked again. Once only: `settled` stays true afterwards.
  const alreadyRefreshed = React.useRef(false);
  React.useEffect(() => {
    if (!settled || alreadyRefreshed.current) return;
    alreadyRefreshed.current = true;
    router.refresh();
  }, [settled, router]);

  // Coming *back* from the wallet page with the browser's Back button can
  // restore this page from cache exactly as it was left — buttons disabled,
  // "Opening wallet…" still showing. `pageshow` with `persisted` is that
  // case; wake the buttons up and re-read the row.
  React.useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      setStarting(null);
      void reread();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reread]);

  async function payWith(provider: WalletProvider) {
    // Opened first, synchronously inside the click: a popup asked for after
    // the awaits below is one the browser blocks. Empty until there is a
    // wallet page to point it at.
    const walletTab = openWalletTab();
    setStarting(provider);
    try {
      const start = await startWalletPayment({
        orderId,
        wallet: provider,
        returnUrl: `${window.location.origin}/checkout/confirmation?order=${orderId}&pay=${provider}`,
      });

      if (start.kind === "redirect") {
        if (walletTab?.send(start.url)) {
          // This tab stays put and keeps watching. `create-payment-intent`
          // has already written the pending row, so re-reading now flips the
          // card to "waiting" and withdraws the buttons — which is what
          // stops a second intent being started on top of this one.
          setStarting(null);
          void reread();
          return;
        }
        // Popup blocked. Fall back to giving up this tab, and leave
        // `starting` set so no button wakes up during the hand-off.
        window.location.assign(start.url);
        return;
      }

      walletTab?.close();
      setStatus(start.kind === "paid" ? "paid" : "pending");
      setStarting(null);
    } catch (error) {
      walletTab?.close();
      showToast(
        error instanceof Error ? error.message : "Couldn’t start the payment.",
      );
      setStarting(null);
    }
  }

  // Which wallet buttons to draw. None once money has moved, and none
  // while a pending payment is still fresh enough to be settling. Known
  // from the URL: just that one. A pending or failed row with no wallet in
  // the URL (the customer reopened the receipt later): offer both, since
  // the row does not say which.
  const isOnlineOrder = wallet !== null || status !== null;
  const canPay =
    isOnlineOrder &&
    (status === null ||
      status === "failed" ||
      (status === "pending" && stalePending));
  const offer = !canPay
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
        {note(status, isOnlineOrder, startFailed, stalePending)}
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
  stalePending: boolean,
): string {
  // Only while nothing has been recorded — once a row exists the row's own
  // state is the truer story than what checkout saw earlier.
  if (startFailed && status === null) {
    return "We couldn’t open your wallet just now. Your order is placed — pay now to finish it.";
  }
  switch (status) {
    case "paid":
      return "Payment received — thank you.";
    case "refunded":
      return "This payment was refunded.";
    case "pending":
      return stalePending
        ? "Still waiting for your wallet to confirm. If you closed the wallet page, pay now to finish."
        : "Waiting for your wallet to confirm the payment…";
    case "failed":
      return "The payment didn’t go through. Nothing was taken — try again below.";
    default:
      return isOnlineOrder
        ? "Your payment hasn’t started yet. Pay now to finish this order."
        : "Nothing has been taken yet — settle up when your order reaches you.";
  }
}
