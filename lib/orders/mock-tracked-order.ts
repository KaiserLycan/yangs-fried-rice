import type { TrackedOrder } from "@/lib/orders/read-tracked-order";

/**
 * A stand-in order so the tracking screen renders before any order exists.
 *
 * Nothing writes an `order` row yet — placing an order is still a stubbed
 * write — so `readTrackedOrder` returns null for every customer and the page
 * would 404 for everyone, including whoever opens the Vercel preview to
 * review it. This is the same treatment the employee screens already use
 * (`lib/mock-orders.ts`, `lib/mock-deliveries.ts`,
 * `components/manage/dashboard/mock-data.ts`): commit the fixture so the
 * screen demonstrates itself.
 *
 * It is a *fallback*, not a replacement. The real read runs first, so a
 * genuine order renders genuinely the moment one exists — see
 * `app/(account)/orders/[orderId]/page.tsx`.
 *
 * TODO: delete this file and drop the fallback once placing an order writes
 * a real row. Tracked as the "Place an order" write in
 * `docs/reference/ordering-flow-handoff.md`.
 *
 * The values mirror frame `132:481` so the screen matches the design when
 * there is nothing else to show: order #1042, an order the kitchen has not
 * confirmed, arriving in 35–45 minutes, going to 21 Mabini St.
 */
export function mockTrackedOrder(orderId: string): TrackedOrder {
  return {
    orderId,
    orderNumber: "1042",
    orderStatus: "received",
    cancelledAt: null,
    deliveryStatus: null,
    deliveryId: null,
    orderType: "Delivery",
    arrivalWindow: "35–45 min",
    destination: "21 Mabini St",
    // The frame captions the map "Rider Ariel S. · 2.4 km away". The distance
    // has no column anywhere and is left out of the real read, so it is left
    // out here too rather than making the fixture promise something the live
    // screen cannot deliver.
    riderName: "Ariel S.",
  };
}
