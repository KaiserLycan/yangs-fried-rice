"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { reorderPastOrder } from "@/lib/actions/cart";
import { formatPeso } from "@/lib/menu/product-listing";
import { formatPlacedAt, summariseItems } from "@/lib/orders/past-order";
import type { RecentOrder } from "@/lib/orders/read-recent-orders";
import { Button } from "@/components/ui/button";

/**
 * "Order again" — the signed-in customer's last three completed orders at
 * the top of the menu, each one tap from being back in the cart
 * (limitations #20). Baymard's food-ordering research found repeat
 * customers slowed down when their past orders were only reachable from a
 * history page; this is the same `reorderPastOrder` My orders uses, brought
 * to where people start.
 *
 * Renders nothing until the orders arrive, and nothing at all for a guest
 * or a customer with no completed order — no empty-state box pushing the
 * menu down.
 *
 * The customer stays on the menu after a reorder: the cart rail (desktop)
 * or the tab bar's count (mobile) shows what was added, and they may want
 * to add something else before checking out.
 */
export function OrderAgainRow({ ordersPromise }: { ordersPromise: Promise<RecentOrder[]> }) {
  const [orders, setOrders] = React.useState<RecentOrder[] | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const router = useRouter();
  const showToast = useToast();

  React.useEffect(() => {
    let active = true;
    // From a Server Component this is React's Flight chunk, whose `.then()`
    // returns undefined; Promise.resolve makes it chainable.
    Promise.resolve(ordersPromise)
      .then((next) => {
        if (active) setOrders(next);
      })
      .catch(() => {
        // A menu without the row beats a menu that errors.
        if (active) setOrders([]);
      });
    return () => {
      active = false;
    };
  }, [ordersPromise]);

  if (!orders || orders.length === 0) return null;

  async function reorder(order: RecentOrder) {
    setPendingId(order.orderId);
    try {
      const result = await reorderPastOrder(order.orderId);
      if (result.error !== null) {
        showToast(result.error, "error");
        return;
      }
      const { addedCount, unavailableCount } = result.data;
      showToast(
        unavailableCount > 0
          ? `Added ${addedCount} ${addedCount === 1 ? "item" : "items"} to your cart. ${unavailableCount} ${unavailableCount === 1 ? "is" : "are"} no longer available.`
          : `Added ${addedCount} ${addedCount === 1 ? "item" : "items"} from order #${order.orderNumber} to your cart.`,
        "success",
      );
      router.refresh();
    } catch {
      showToast("Couldn’t reach the server. Please try again.", "error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="order-again-heading" className="px-[20px] pt-[16px] md:px-0 md:pt-[20px]">
      <h2
        id="order-again-heading"
        className="font-display text-2xl uppercase tracking-[0.22px] text-foreground"
      >
        Order again
      </h2>
      <ul className="mt-[10px] flex snap-x gap-[12px] overflow-x-auto pb-[6px] md:grid md:grid-cols-3 md:overflow-visible">
        {orders.map((order) => (
          <li
            key={order.orderId}
            className="flex w-[260px] shrink-0 snap-start flex-col gap-[8px] rounded-md border border-field-border bg-card p-[14px] md:w-auto"
          >
            <span className="text-sm text-muted-strong">{formatPlacedAt(order.completedAt)}</span>
            <p className="line-clamp-2 flex-1 text-base font-bold leading-[20px] text-foreground">
              {summariseItems(order.items)}
            </p>
            <div className="flex items-center justify-between gap-[10px]">
              <span className="font-display text-lg text-primary">{formatPeso(order.total)}</span>
              <Button variant="unstyled"
                type="button"
                onClick={() => void reorder(order)}
                disabled={pendingId !== null}
                className="flex min-h-[44px] items-center gap-[6px] rounded-md bg-accent px-[14px] text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
              >
                <RotateCcw aria-hidden="true" className="size-[16px]" />
                {pendingId === order.orderId ? "Adding…" : "Order again"}
                <span className="sr-only"> — order #{order.orderNumber}</span>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
