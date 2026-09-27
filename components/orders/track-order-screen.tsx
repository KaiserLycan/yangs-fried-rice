"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrderEtaAction } from "@/lib/actions/eta";
import {
  arrivalLineFor,
  arrivalWindowFrom,
} from "@/lib/orders/arrival-window";
import {
  cancellationNoticeFor,
  fulfilmentOf,
  headlineFor,
  resolveOrderProgress,
  stageReachedAt,
  timelineStages,
  type StatusChange,
} from "@/lib/orders/order-stage";
import { formatClockTime } from "@/lib/checkout/order-time";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { Alert } from "@/components/ui/alert";
import { CancelOrderControl } from "@/components/orders/cancel-order-control";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  OrderRatingDisplay,
  RateOrderButton,
} from "@/components/orders/order-rating";

/**
 * The tracking screen: header, then timeline and cancel control. The Figma
 * frames (`133:1164` desktop, `132:481` / `132:543` mobile) also draw a map,
 * but the shop is pickup-only (issue #114) and the map was removed in #116 —
 * there is nothing to follow on it.
 *
 * No bottom tab bar on mobile, matching the precedent ticket 06 names: once a
 * customer is inside a specific flow screen rather than browsing, the tab bar
 * does not follow them.
 *
 * A Client Component because of the subscription below, not because of any
 * interactivity — the page around it stays a Server Component and does the
 * reading.
 */
export function TrackOrderScreen({ order }: { order: TrackedOrder }) {
  const serverStatus = {
    orderStatus: order.orderStatus,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
    deliveryStatus: order.deliveryStatus,
  };

  /**
   * Only the three status fields move; everything else about a tracked order
   * is fixed for its lifetime. `live` holds a patch from the subscription and
   * is null until one arrives, so the server read is what renders by default.
   *
   * Seeding `useState` from the props directly would have been shorter and
   * wrong: state initialisers run once, so a later server render carrying a
   * *newer* status — a router refresh, a revalidation — would be ignored in
   * favour of the value this screen first mounted with. Comparing the three
   * fields and dropping the patch when they change is the fix; comparing the
   * `order` object itself would not work, since the server hands over a new
   * object every render and the patch would be thrown away immediately.
   */
  const serverKey = `${order.orderStatus}|${order.cancelledAt}|${order.cancellationReason}|${order.deliveryStatus}`;
  const [live, setLive] = React.useState<typeof serverStatus | null>(null);
  const [seenKey, setSeenKey] = React.useState(serverKey);

  if (seenKey !== serverKey) {
    setSeenKey(serverKey);
    setLive(null);
  }

  const status = live ?? serverStatus;

  /**
   * The channel is opened once and its handlers close over that first render.
   * They still need today's server values as the base for a partial patch —
   * an `order` event carries no delivery status and vice versa — so the
   * fallback is read through a ref rather than from the closure.
   */
  const serverStatusRef = React.useRef(serverStatus);
  serverStatusRef.current = serverStatus;

  const { orderId } = order;

  /**
   * The arrival window moves too, but not over the subscription: the ETA is
   * computed by `getOrderEtaAction`, not stored anywhere the screen could
   * watch. So every status event re-asks the action, and the answer replaces
   * the window the page rendered with. Same reset rule as `live` above — a
   * newer server window drops the client's.
   *
   * `etaRequest` numbers each ask so a slow reply cannot land on top of a
   * faster, newer one. A failed ask keeps whatever was showing; there is no
   * toast, because nothing the customer did caused it and nothing they can
   * press would fix it.
   */
  const [liveArrival, setLiveArrival] = React.useState<string | null>();
  const [seenArrival, setSeenArrival] = React.useState(order.arrivalWindow);
  const [etaPending, setEtaPending] = React.useState(false);
  const etaRequest = React.useRef(0);

  if (seenArrival !== order.arrivalWindow) {
    setSeenArrival(order.arrivalWindow);
    setLiveArrival(undefined);
  }

  const arrivalWindow =
    liveArrival === undefined ? order.arrivalWindow : liveArrival;

  const refreshEta = React.useCallback(() => {
    const request = ++etaRequest.current;
    setEtaPending(true);
    void (async () => {
      try {
        const result = await getOrderEtaAction(orderId);
        if (request === etaRequest.current) {
          setLiveArrival(arrivalWindowFrom(result));
        }
      } catch {
        // Dropped connection or stale deployment: keep the last window.
      } finally {
        if (request === etaRequest.current) setEtaPending(false);
      }
    })();
  }, [orderId]);

  /**
   * Status changes that arrived over the subscription after the page loaded
   * (#116). Added to the server's log so each new stage gets its time
   * without a reload.
   */
  const [liveLog, setLiveLog] = React.useState<StatusChange[]>([]);
  const statusLog = React.useMemo(
    () => [...order.statusLog, ...liveLog],
    [order.statusLog, liveLog],
  );

  React.useEffect(() => {
    const supabase = createClient();

    // Pickup-only (issue #114): every stage comes from `order` now, so one
    // subscription is the whole journey.
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "order",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          setLive((previous) => ({
            ...(previous ?? serverStatusRef.current),
            orderStatus: (payload.new.order_status as string | null) ?? null,
            cancelledAt: (payload.new.cancelled_at as string | null) ?? null,
            cancellationReason: (payload.new.cancellation_reason as string | null) ?? null,
          }));
          refreshEta();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_status_log",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const changedAt = payload.new.changed_at as string | undefined;
          if (!changedAt) return;
          setLiveLog((previous) => [
            ...previous,
            { toStatus: (payload.new.to_status as string | null) ?? null, changedAt },
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, refreshEta]);

  // Take-out reads "Ready for pick up" / "Picked up"; delivery keeps its own words.
  const fulfilment = fulfilmentOf(order.orderType);
  const progress = resolveOrderProgress({ ...status, orderType: order.orderType });
  const stages = timelineStages(
    progress,
    fulfilment,
    stageReachedAt(statusLog, order.orderType),
  );

  // While a fresh estimate is on its way the old one stays up rather than
  // flashing the fallback; only a screen with nothing yet says it is working.
  // A cancelled order is not arriving at all (P28).
  const arrival =
    progress.kind === "cancelled"
      ? null
      : etaPending && arrivalWindow === null
      ? "Updating arrival time…"
      : arrivalLineFor(arrivalWindow);
  const destination = order.destination
    ? `${order.orderType ?? "Delivery"} to ${order.destination}`
    : null;
  // Fixed when the order was placed; the arrival line above can move, this
  // cannot (#116). Nothing to promise once the order is cancelled.
  const promised =
    order.promisedAt && progress.kind !== "cancelled"
      ? `Promised by ${formatClockTime(new Date(order.promisedAt))}`
      : null;
  const subline = [arrival, promised, destination].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <div
        className={cnLayout}
        data-testid="track-order-layout"
      >
        {/* Header. Full-bleed ink panel on mobile, plain copy on cream on
            desktop — same element, different clothes. */}
        <header className="flex flex-col gap-[4px] bg-foreground p-[20px] md:gap-[3px] md:bg-transparent md:p-0">
          <Link
            href="/orders"
            className="group mb-1 flex w-fit items-center gap-[4px] text-[11px] uppercase tracking-[1.76px] text-on-ink-faint transition-colors hover:text-white md:mb-2 md:text-[12px] md:tracking-[1.92px] md:text-muted-foreground md:hover:text-foreground"
          >
            <ChevronLeft className="h-[14px] w-[14px] md:h-[16px] md:w-[16px]" />
            <span>Back to orders</span>
          </Link>
          <span
            className="text-[11px] uppercase tracking-[1.76px] text-on-ink-faint md:text-[12px] md:tracking-[1.92px] md:text-muted-foreground"
          >
            {/* The id renders in the case it is stored in — see the receipt's
                own note, and `lib/orders/order-number.ts`. */}
            Order <span className="normal-case">#{order.orderNumber}</span>
          </span>
          <h1 className="font-display text-[30px] text-on-ink md:text-[38px] md:leading-[1.05] md:text-foreground">
            {headlineFor(progress, fulfilment)}
          </h1>
          <p
            className="pt-[2px] text-[13px] text-on-ink-muted md:pt-[3px] md:text-[14px] md:text-muted-strong"
            aria-busy={etaPending}
          >
            {subline}
          </p>

          {/* Shown for every cancellation, not only one with a reason: the
              kitchen's cancel writes none, and the customer was left with a
              bare headline (P28). */}
          {progress.kind === "cancelled" && (() => {
            const notice = cancellationNoticeFor(status.cancellationReason);
            return (
              <div className="mt-4">
                <Alert className="bg-destructive/10 border-destructive/20 text-destructive md:text-destructive md:bg-error-surface md:border-error-border">
                  {notice.message}
                  {/* Its own line, so it reads as the reason (P54). Spans,
                      because Alert already wraps its content in a <p>. */}
                  {notice.reason && (
                    <span className="mt-1 block">
                      <span className="font-semibold">Reason:</span> {notice.reason}
                    </span>
                  )}
                </Alert>
              </div>
            );
          })()}
        </header>

        <div className="flex flex-col items-start p-[20px] md:rounded-lg md:border md:border-rule md:bg-white md:p-[20px]">
          <OrderTimeline stages={stages} />
          {/* Ticket 06 left this as a render-prop slot for ticket 07 to fill.
              A function prop cannot cross the server/client boundary, and the
              page that renders this screen is a Server Component, so the
              control is rendered here instead — it needs the live
              `cancellable` this component already computes, and nothing else
              renders this screen. */}
          <div className="w-full pt-[6px] md:pt-0">
            <CancelOrderControl
              orderId={orderId}
              orderNumber={order.orderNumber}
              progress={progress}
            />
          </div>
          {/* One rating for the whole order, and none offered once given
              (P35, P37). The per-item modal that was here asked again after
              every rating and had a Submit per dish. */}
          {progress.kind === "stage" && progress.stage === "delivered" && (
            <div className="mt-4 flex w-full items-center justify-between gap-[12px] border-t border-rule pt-[14px]">
              {order.rating !== null ? (
                <>
                  <span className="text-[13px] font-bold text-muted-strong">
                    You rated this order
                  </span>
                  <OrderRatingDisplay
                    rating={order.rating}
                    className="text-[18px] leading-none"
                  />
                </>
              ) : (
                <>
                  <span className="text-[13px] font-bold text-muted-strong">
                    How was your order?
                  </span>
                  <RateOrderButton
                    orderId={orderId}
                    orderNumber={order.orderNumber}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One column at every width. On desktop it keeps the width the left column
 * had when the map sat beside it, so lines stay a readable length.
 */
const cnLayout =
  "mx-auto flex w-full max-w-[640px] flex-col md:gap-[26px] md:px-[26px] md:pb-[60px] md:pt-[30px]";
