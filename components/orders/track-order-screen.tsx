"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getOrderEtaAction } from "@/lib/actions/eta";
import {
  arrivalLineFor,
  arrivalWindowFrom,
} from "@/lib/orders/arrival-window";
import { cn } from "@/lib/utils";
import {
  cancellationNoticeFor,
  fulfilmentOf,
  headlineFor,
  resolveOrderProgress,
  timelineStages,
} from "@/lib/orders/order-stage";
import { isPickup } from "@/lib/orders/past-order";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { Alert } from "@/components/ui/alert";
import { AssignedRiderCard } from "@/components/orders/assigned-rider-card";
import { CancelOrderControl } from "@/components/orders/cancel-order-control";
import { LiveMapPanel } from "@/components/orders/live-map-panel";
import { OrderTimeline } from "@/components/orders/order-timeline";
import {
  OrderRatingDisplay,
  RateOrderButton,
} from "@/components/orders/order-rating";

/**
 * The tracking screen. Desktop (`133:1164`) is two columns — header, timeline
 * and cancel control on the left, map on the right. Mobile (`132:481`,
 * `132:543`) stacks them, and the order is header, then map, then timeline:
 * the map sits between the header and the timeline rather than below
 * everything.
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
export function TrackOrderScreen({ 
  order,
  locationIqApiKey
}: { 
  order: TrackedOrder;
  locationIqApiKey?: string;
}) {
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
   * The rider is the one thing on this screen the subscription cannot patch
   * in: a delivery event carries `rider_id`, but the name, photo and vehicle
   * live on `rider` and `employee`. So when the id changes the page is asked
   * to re-read, and the card fills from the next server render. Both the id
   * and the router go through refs for the same reason as `serverStatusRef`
   * — the handler closes over the first render, and the router must not be
   * an effect dependency or the channel would reopen on every render.
   */
  const router = useRouter();
  const routerRef = React.useRef(router);
  routerRef.current = router;
  const riderIdRef = React.useRef(order.rider?.riderId ?? null);
  riderIdRef.current = order.rider?.riderId ?? null;

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

  React.useEffect(() => {
    const supabase = createClient();

    // Both tables, because the four stages are split across them: stages 1
    // and 2 come from `order`, stages 3 and 4 from `delivery`. Watching only
    // one would leave the screen stuck halfway through the journey.
    //
    // The delivery subscription filters on `order_id` rather than
    // `delivery_id` so it also hears the INSERT — a delivery row does not
    // exist until the order is dispatched, so there is frequently no
    // `delivery_id` to subscribe to when this screen first mounts.
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
          event: "*",
          schema: "public",
          table: "delivery",
          filter: `order_id=eq.${orderId}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          setLive((previous) => ({
            ...(previous ?? serverStatusRef.current),
            deliveryStatus:
              (payload.new?.delivery_status as string | null) ?? null,
          }));
          refreshEta();

          const riderId = (payload.new?.rider_id as string | null) ?? null;
          if (riderId !== riderIdRef.current) routerRef.current.refresh();
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
  const stages = timelineStages(progress, fulfilment);

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
  const subline = [arrival, destination].filter(Boolean).join(" · ");

  // A rider only ever exists for a delivery, and an empty card on a cancelled
  // order would promise one that is never coming. A rider already on the
  // order stays visible regardless — the customer may still want to know
  // who has their food.
  const showRider =
    order.rider !== null ||
    (!isPickup(order.orderType) && progress.kind !== "cancelled");

  return (
    <div className="min-h-screen bg-background">
      <div
        className={cnGrid}
        data-testid="track-order-layout"
      >
        {/* Header. Full-bleed ink panel on mobile, plain copy on cream on
            desktop — same element, different clothes. */}
        <header className="flex flex-col gap-[4px] bg-foreground p-[20px] md:col-start-1 md:row-start-1 md:gap-[3px] md:bg-transparent md:p-0">
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
          {progress.kind === "cancelled" && (
            <div className="mt-4">
              <Alert className="bg-destructive/10 border-destructive/20 text-destructive md:text-destructive md:bg-error-surface md:border-error-border">
                {cancellationNoticeFor(status.cancellationReason)}
              </Alert>
            </div>
          )}
        </header>

        {/* Second on mobile, right-hand column on desktop. */}
        <LiveMapPanel
          riderName={order.rider?.name ?? null}
          destinationCoordinates={order.destinationCoordinates}
          className="md:col-start-2 md:row-start-1 md:row-span-3"
          locationIqApiKey={locationIqApiKey}
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

        {/* Fourth on mobile, third row of the left column on desktop. */}
        {showRider && (
          <AssignedRiderCard
            rider={order.rider}
            className="border-t border-rule md:col-start-1 md:row-start-3 md:border-t"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Mobile is a plain stack in DOM order. Desktop becomes a two-column grid
 * whose second column holds the map across all three rows — header, timeline,
 * rider — which is what lets the map move from between the header and the
 * timeline to beside them without the markup changing.
 */
const cnGrid =
  "mx-auto flex w-full max-w-[1200px] flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-[auto_auto_auto] md:items-start md:gap-[26px] md:px-[26px] md:pb-[60px] md:pt-[30px]";
