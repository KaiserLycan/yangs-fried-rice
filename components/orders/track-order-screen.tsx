"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrderEtaAction } from "@/lib/actions/eta";
import { arrivalLineFor, arrivalWindowFrom } from "@/lib/orders/arrival-window";
import { cn } from "@/lib/utils";
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
import { OrderReceipt } from "@/components/orders/order-receipt";
import { PickupPointPanel } from "@/components/orders/pickup-point-panel";
import { ReportProblem } from "@/components/orders/report-problem";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { canReportIssue } from "@/lib/validation/order-issue";
import {
  OrderRatingDisplay,
  RateOrderButton,
} from "@/components/orders/order-rating";
import { uniqueChannelName } from "@/lib/supabase/channel-name";

/**
 * The tracking screen. Desktop (`133:1164`) is two columns — header, timeline
 * and cancel control on the left; where to pick up and the receipt on the
 * right. Mobile (`132:481`, `132:543`) stacks them: header, pickup panel,
 * timeline, receipt. The frames drew a delivery map where the pickup panel
 * is; the shop is pickup-only (issue #114), so there is nothing to map.
 *
 * That reordering is done with grid placement rather than by rendering the
 * screen twice. Two copies would be the quicker way to write it and the wrong
 * thing to ship — the page would carry two `h1`s and two copies of the
 * timeline, and a screen reader would read the whole order twice.
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
    let cancelled = false;
    let channels: ReturnType<typeof supabase.channel>[] = [];

    // Load the session first, as the notification bell does. Joined before
    // it, Realtime treats the customer as anon and RLS hides every change to
    // their own order — the screen never moved (#116).
    void supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channels = subscribe();
    });

    function subscribe() {
      // Pickup-only (issue #114): every stage comes from `order` now, so one
      // subscription is the whole journey.
      const channel = supabase
        .channel(uniqueChannelName(`order-tracking-${orderId}`))
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
              cancellationReason:
                (payload.new.cancellation_reason as string | null) ?? null,
            }));
            refreshEta();
          },
        )
        .subscribe();

      // Its own channel (#116): if this subscription is refused, the status
      // listener above must keep working.
      const logChannel = supabase
        .channel(uniqueChannelName(`order-status-log-${orderId}`))
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
              {
                toStatus: (payload.new.to_status as string | null) ?? null,
                changedAt,
              },
            ]);
          },
        )
        .subscribe();

      return [channel, logChannel];
    }

    return () => {
      cancelled = true;
      for (const channel of channels) supabase.removeChannel(channel);
    };
  }, [orderId, refreshEta]);

  // Take-out reads "Ready for pickup" / "Picked up"; delivery keeps its own words.
  const fulfilment = fulfilmentOf(order.orderType);
  const progress = resolveOrderProgress({
    ...status,
    orderType: order.orderType,
  });
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
  // Fixed when the order was placed; the arrival line above can move, this
  // cannot (#116). Nothing to promise once the order is cancelled.
  const promised =
    order.promisedAt && progress.kind !== "cancelled"
      ? `Promised by ${formatClockTime(new Date(order.promisedAt))}`
      : null;
  const subline = [arrival, promised].filter(Boolean).join(" · ");
  const delivered = progress.kind === "stage" && progress.stage === "delivered";
  // Re-read against the live status, so the button appears the moment staff
  // mark the order picked up. A status that arrived over realtime carries no
  // completion time, so the check falls back to when the order was placed.
  const canReport = canReportIssue({
    orderStatus: status.orderStatus,
    completedAt: order.completedAt,
    placedAt: order.placedAt,
  });

  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(cnGrid, "md:grid-rows-[auto_auto]")}
        data-testid="track-order-layout"
      >
        {/* Header. Full-bleed ink panel on mobile, plain copy on cream on
            desktop — same element, different clothes. */}
        <header className="flex flex-col gap-[4px] bg-foreground p-[20px] md:col-start-1 md:row-start-1 md:gap-[3px] md:bg-transparent md:p-0">
          <Link
            href="/orders"
            className="group mb-1 flex w-fit items-center gap-[4px] text-sm uppercase tracking-[1.76px] text-on-ink-faint transition-colors hover:text-white md:mb-2 md:text-sm md:tracking-[1.92px] md:text-muted-foreground md:hover:text-foreground"
          >
            <ChevronLeft className="h-[14px] w-[14px] md:h-[16px] md:w-[16px]" />
            <span>Back to orders</span>
          </Link>
          <span className="text-sm uppercase tracking-[1.76px] text-on-ink-faint md:text-sm md:tracking-[1.92px] md:text-muted-foreground">
            {/* The id renders in the case it is stored in — see the receipt's
                own note, and `lib/orders/order-number.ts`. */}
            Order <span className="normal-case">#{order.orderNumber}</span>
          </span>
          <h1 className="font-display text-3xl text-on-ink md:text-5xl md:leading-[1.05] md:text-foreground">
            {headlineFor(progress, fulfilment)}
          </h1>
          <p
            className="pt-[2px] text-sm text-on-ink-muted md:pt-[3px] md:text-sm md:text-muted-strong"
            aria-busy={etaPending}
          >
            {subline}
          </p>

          {/* Shown for every cancellation, not only one with a reason: the
              kitchen's cancel writes none, and the customer was left with a
              bare headline (P28). */}
          {progress.kind === "cancelled" &&
            (() => {
              const notice = cancellationNoticeFor(status.cancellationReason);
              return (
                <div className="mt-4">
                  <Alert className="border-destructive/20 bg-destructive/10 text-destructive md:border-error-border md:bg-error-surface md:text-destructive">
                    {notice.message}
                    {/* Its own line, so it reads as the reason (P54). Spans,
                      because Alert already wraps its content in a <p>. */}
                    {notice.reason && (
                      <span className="mt-1 block">
                        <span className="font-semibold">Reason:</span>{" "}
                        {notice.reason}
                      </span>
                    )}
                  </Alert>
                </div>
              );
            })()}
        </header>

        {/* Second on mobile, right-hand column on desktop — where the
            delivery map used to be. A pickup order has nowhere to route to;
            what the customer needs is where to collect it (issue #118). */}
        <PickupPointPanel
          orderNumber={order.orderNumber}
          className="md:col-start-2 md:row-start-1"
        />

        <div className="flex flex-col items-start p-[20px] md:col-start-1 md:row-start-2 md:rounded-lg md:border md:border-rule md:bg-white md:p-[20px]">
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
          {delivered && (
            <div className="mt-4 flex w-full items-center justify-between gap-[12px] border-t border-rule pt-[14px]">
              {order.rating !== null ? (
                <>
                  <span className="text-sm font-bold text-muted-strong">
                    You rated this order
                  </span>
                  <OrderRatingDisplay
                    rating={order.rating}
                    className="text-lg leading-none"
                  />
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-muted-strong">
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
          {/* Missing, wrong or damaged items, for 24 hours after pickup
              (limitations #24). Also shows the state of a report once made. */}
          {(canReport || order.issue) && (
            <div className="mt-2 flex w-full items-center justify-between gap-[12px] border-t border-rule pt-[10px]">
              <ReportProblem
                orderId={orderId}
                orderNumber={order.orderNumber}
                items={order.items}
                issue={order.issue}
                canReport={canReport}
              />
            </div>
          )}
        </div>

        {/* Below the timeline on mobile, under the pickup panel on desktop. */}
        <div className="border-t border-rule p-[20px] md:col-start-2 md:row-start-2 md:rounded-lg md:border md:bg-white">
          <OrderReceipt order={order} />
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile is a plain stack in DOM order. Desktop becomes a two-column grid:
 * header and timeline on the left, the pickup panel and the receipt on the
 * right — which is what lets the pickup panel move from between the header
 * and the timeline to beside them without the markup changing. The row count
 * is set at the call site, because an empty third row would still carry the
 * gap above it.
 */
const cnGrid =
  "mx-auto flex w-full max-w-[1200px] flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-[26px] md:px-[26px] md:pb-[60px] md:pt-[30px]";
