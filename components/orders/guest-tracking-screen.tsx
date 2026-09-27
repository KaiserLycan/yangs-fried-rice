"use client";

import * as React from "react";
import Link from "next/link";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { readPublicOrderTracking, type PublicTrackedOrder } from "@/lib/actions/public-tracking";
import { formatPesoCentavos } from "@/lib/menu/product-listing";
import { PICKUP_COUNTER } from "@/lib/site/site-info";
import {
  fulfilmentOf,
  headlineFor,
  pendingPromptFor,
  resolveOrderProgress,
  stageReachedAt,
  timelineStages,
} from "@/lib/orders/order-stage";
import { useNow } from "@/lib/hooks/use-now";

/** How often the page asks again. No realtime: a guest has no session for RLS. */
const POLL_MS = 15_000;

function manilaTime(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
}

/**
 * The status of one order for whoever holds its tracking link — no sign-in
 * (FINALE "More things"). Read-only: cancelling, rating and reporting a
 * problem stay on the signed-in order page, which knows who is asking.
 */
export function GuestTrackingScreen({ initial, token }: { initial: PublicTrackedOrder; token: string }) {
  const [order, setOrder] = React.useState(initial);
  const [stale, setStale] = React.useState(false);
  const now = useNow(POLL_MS);

  React.useEffect(() => {
    const done = order.orderStatus === "completed" || order.orderStatus === "cancelled";
    if (done) return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const next = await readPublicOrderTracking(order.orderId, token).catch(() => null);
      if (next) {
        setOrder(next);
        setStale(false);
      } else {
        setStale(true);
      }
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [order.orderId, order.orderStatus, token]);

  const fulfilment = fulfilmentOf(order.orderType);
  const progress = resolveOrderProgress({
    orderStatus: order.orderStatus,
    cancelledAt: order.cancelledAt,
    deliveryStatus: null,
    orderType: order.orderType,
  });
  const stages = timelineStages(progress, fulfilment, stageReachedAt(order.statusLog, order.orderType));
  const prompt = pendingPromptFor(order.orderStatus, order.pendingAt, now);
  const promised = progress.kind === "cancelled" ? null : manilaTime(order.promisedAt);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 py-8">
      <header className="flex flex-col gap-2 rounded-lg bg-primary p-5 text-on-brand">
        <span className="text-sm uppercase tracking-[1.76px] text-on-brand-subtle">Order #{order.orderNumber}</span>
        <h1 className="font-display text-3xl uppercase">{headlineFor(progress, fulfilment)}</h1>
        {promised && <p className="text-base text-on-brand-muted">Promised by {promised}</p>}
        {progress.kind === "cancelled" && order.cancellationReason && (
          <p className="text-base text-on-brand-muted">{order.cancellationReason}</p>
        )}
      </header>

      {prompt === "waiting" && (
        <p role="status" className="text-sm text-muted-strong">
          Waiting for the store to confirm the order…
        </p>
      )}
      {prompt === "cancel-free" && (
        <p role="status" className="rounded-md bg-warning-surface p-3 text-sm font-bold text-warning-text">
          The store hasn&apos;t confirmed yet. Sign in to cancel for free.
        </p>
      )}

      <section className="rounded-lg border border-rule bg-card p-5">
        <OrderTimeline stages={stages} />
        {progress.kind !== "cancelled" && (
          <p className="mt-2 text-sm text-muted-strong">
            Collect at {PICKUP_COUNTER} and say order #{order.orderNumber}.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-rule bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-[1.44px] text-muted-foreground">Items</h2>
        <ul className="flex flex-col gap-1 text-base text-foreground">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span className="shrink-0">{formatPesoCentavos(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        {order.payment && (
          <p className="mt-1 flex justify-between border-t border-rule pt-2 text-base font-bold text-foreground">
            <span>{order.payment.method === "pay_in_store" ? "To pay at the counter" : "Total"}</span>
            <span>{formatPesoCentavos(order.payment.due)}</span>
          </p>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        {stale ? "Couldn't refresh just now — trying again. " : "This page updates by itself. "}
        Anyone with this link can see this order&apos;s status, but nothing about who placed it.{" "}
        <Link href={`/login?next=/orders/${order.orderId}`} className="font-bold text-primary hover:underline">
          Sign in
        </Link>{" "}
        to cancel, rate or report a problem.
      </p>
    </div>
  );
}
