import Link from "next/link";
import type { PastOrder } from "@/lib/orders/past-order";
import { PastOrderCard } from "@/components/orders/past-order-card";
import { Button } from "@/components/ui/button";

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
export function PastOrdersScreen({
  orders,
  search = "",
  limit = 30,
}: {
  orders: PastOrder[];
  /** What the customer searched for — a dish or an order number (FINALE 9.8). */
  search?: string;
  /** How many were asked for; a full page means there may be older ones. */
  limit?: number;
}) {
  const moreQuery = new URLSearchParams({ ...(search ? { q: search } : {}), show: String(limit + 30) }).toString();
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile's own header. The red nav bar is desktop-only by design (see
          `SiteNavBar`), so each screen brings its own. */}
      <div className="flex items-center gap-[12px] border-b border-rule px-[20px] py-[18px] md:hidden">
        <h1 className="font-display text-2xl uppercase text-foreground">MY ORDERS</h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-[12px] px-[20px] pb-[calc(var(--tab-bar-height)+24px)] pt-[16px] md:gap-[20px] md:px-[40px] md:pb-[60px] md:pt-[30px]">
        <h1 className="hidden font-display text-3xl text-foreground md:block">
          MY ORDERS
        </h1>

        {/* A plain GET form: works before the page hydrates, and the URL
            can be shared or bookmarked. */}
        <form action="/orders" role="search" className="flex w-full max-w-[520px] gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search}
            maxLength={60}
            placeholder="Find an order: a dish, or #1241"
            aria-label="Search your orders"
            className="h-[44px] flex-1 rounded-md border border-field-border bg-card px-3 text-base text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <Button type="submit" variant="outline" className="w-auto px-4">
            Search
          </Button>
        </form>

        {orders.length === 0 && search ? (
          <p className="text-base text-muted-strong">
            No orders with &ldquo;{search}&rdquo;.{" "}
            <Link href="/orders" className="font-bold text-primary hover:underline">
              Show all orders
            </Link>
          </p>
        ) : orders.length === 0 ? (
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

        {orders.length >= limit && (
          <Link
            href={`/orders?${moreQuery}`}
            scroll={false}
            className="self-center rounded-full border border-field-border bg-card px-5 py-2.5 text-sm font-bold text-foreground hover:bg-highlight"
          >
            Show older orders
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * What a customer with no orders sees. Deliberately plain: no sample orders,
 * just an invitation back to the menu, the same shape `CartEmptyState` uses.
 */
function PastOrdersEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] px-[20px] py-[48px] text-center">
      <p className="text-sm text-muted-foreground">
        You haven’t placed any orders yet.
      </p>
      <Link href="/menu" className="text-sm text-accent underline">
        Browse the menu
      </Link>
    </div>
  );
}
