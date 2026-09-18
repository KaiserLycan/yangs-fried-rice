import Link from "next/link";
import type { PastOrder } from "@/lib/orders/past-order";
import { PastOrderCard } from "@/components/orders/past-order-card";

/**
 * The order history — desktop `133:1268` ("History"), mobile `133:2101`
 * ("post orders").
 *
 * Desktop lays the cards out three to a row under a page heading; mobile puts
 * the heading in its own bar with a hairline under it and stacks the cards.
 * One list, two sets of chrome.
 *
 * No bottom tab bar on mobile, matching the precedent tickets 04 and 06
 * already set: once a customer is inside a specific flow screen rather than
 * browsing, the tab bar doesn't follow them. The frame agrees — it draws
 * none.
 *
 * A Server Component. Only the cards are interactive.
 */
export function PastOrdersScreen({ orders }: { orders: PastOrder[] }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile's own header. The red nav bar is desktop-only by design (see
          `SiteNavBar`), so each screen brings its own. */}
      <div className="border-b border-rule px-[20px] py-[18px] md:hidden">
        <h1 className="font-display text-[24px] text-foreground">MY ORDERS</h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[12px] px-[20px] pb-[24px] pt-[16px] md:gap-[20px] md:px-[40px] md:pb-[60px] md:pt-[30px]">
        <h1 className="hidden font-display text-[32px] text-foreground md:block">
          MY ORDERS
        </h1>

        {orders.length === 0 ? (
          <PastOrdersEmptyState />
        ) : (
          <ul className="flex list-none flex-col gap-[12px] md:grid md:grid-cols-3 md:gap-[16px]">
            {orders.map((order) => (
              <li key={order.orderId}>
                <PastOrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * No frame draws this, and it is the state every real customer is in today —
 * nothing writes an `order` row yet, so a genuine read finds nothing. Phrased
 * as an invitation back to the menu, the same shape `CartEmptyState` uses for
 * the same reason.
 */
function PastOrdersEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] px-[20px] py-[48px] text-center">
      <p className="text-[14px] text-muted-foreground">
        No past orders yet.
      </p>
      <Link href="/menu" className="text-[14px] text-accent underline">
        Browse the menu
      </Link>
    </div>
  );
}
