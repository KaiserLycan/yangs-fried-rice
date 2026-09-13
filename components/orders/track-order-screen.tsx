"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  headlineFor,
  isCancellable,
  resolveOrderProgress,
  timelineStages,
} from "@/lib/orders/order-stage";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";
import { LiveMapPanel } from "@/components/orders/live-map-panel";
import { OrderTimeline } from "@/components/orders/order-timeline";

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
  cancelSlot,
}: {
  order: TrackedOrder;
  /**
   * Ticket 07 owns the Cancel order control and the note that replaces it.
   * This screen only reserves the space and says whether cancelling is still
   * allowed.
   */
  cancelSlot?: (cancellable: boolean) => React.ReactNode;
}) {
  const serverStatus = {
    orderStatus: order.orderStatus,
    cancelledAt: order.cancelledAt,
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
  const serverKey = `${order.orderStatus}|${order.cancelledAt}|${order.deliveryStatus}`;
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
          }));
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const progress = resolveOrderProgress(status);
  const stages = timelineStages(progress);
  const cancellable = isCancellable(progress);

  const arrival = order.arrivalWindow
    ? `Arriving ${order.arrivalWindow}`
    : "Arrival time to be confirmed";
  const destination = order.destination
    ? `${order.orderType ?? "Delivery"} to ${order.destination}`
    : null;
  const subline = [arrival, destination].filter(Boolean).join(" · ");

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
            className="text-[11px] uppercase tracking-[1.76px] text-on-ink-faint md:text-[12px] md:tracking-[1.92px] md:text-muted-foreground"
          >
            Order #{order.orderNumber}
          </Link>
          <h1 className="font-display text-[30px] text-on-ink md:text-[38px] md:leading-[1.05] md:text-foreground">
            {headlineFor(progress)}
          </h1>
          <p className="pt-[2px] text-[13px] text-on-ink-muted md:pt-[3px] md:text-[14px] md:text-muted-strong">
            {subline}
          </p>
        </header>

        {/* Second on mobile, right-hand column on desktop. */}
        <LiveMapPanel
          riderName={order.riderName}
          className="md:col-start-2 md:row-start-1 md:row-span-2"
        />

        <div className="flex flex-col items-start p-[20px] md:col-start-1 md:row-start-2 md:rounded-lg md:border md:border-rule md:bg-white md:p-[20px]">
          <OrderTimeline stages={stages} />
          {cancelSlot ? (
            <div className="w-full pt-[6px] md:pt-0">
              {cancelSlot(cancellable)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile is a plain stack in DOM order. Desktop becomes a two-column grid
 * whose second column holds the map across both rows, which is what lets the
 * map move from between the header and the timeline to beside them without
 * the markup changing.
 */
const cnGrid =
  "mx-auto flex w-full max-w-[1200px] flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:grid-rows-[auto_auto] md:items-start md:gap-[26px] md:px-[26px] md:pb-[60px] md:pt-[30px]";
