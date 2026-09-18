"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  canRate,
  formatPlacedAt,
  formatTotal,
  outcomeOf,
  primaryActionOf,
  summariseItems,
  type PastOrder,
} from "@/lib/orders/past-order";
import {
  OrderRatingDisplay,
  OrderRatingInput,
} from "@/components/orders/order-rating";
import { useToast } from "@/components/ui/toast";
import { reorderPastOrder } from "@/lib/actions/cart";

/**
 * One finished order — the card drawn three times across desktop `133:1268`
 * and stacked on mobile `133:2101`.
 *
 * The two breakpoints put the same five pieces in different orders: mobile
 * runs date → items → total/action → stars, desktop runs date → items →
 * stars → total/action. That's done with `order-*` on one set of elements
 * rather than by rendering the card twice, the same reasoning
 * `TrackOrderScreen` gives for its grid — two copies would put every order in
 * the document twice and read the whole history twice to a screen reader.
 *
 * A Client Component because reordering and rating both raise toasts.
 */

export function PastOrderCard({ order }: { order: PastOrder }) {
  const router = useRouter();
  const showToast = useToast();
  const firstStarRef = React.useRef<HTMLButtonElement>(null);
  const [isPending, startTransition] = React.useTransition();

  const outcome = outcomeOf(order);
  const rateable = canRate(order);
  const action = primaryActionOf(order);

  const handleReorder = () => {
    startTransition(async () => {
      const result = await reorderPastOrder(order.orderId);
      
      if (!result.data) {
        showToast(result.error ?? "Failed to reorder");
        return;
      }
      
      const { addedCount, unavailableCount } = result.data;
      if (unavailableCount > 0) {
        showToast(`Added ${addedCount} item(s) to your cart. ${unavailableCount} item(s) are no longer available.`);
      } else {
        showToast(`Added ${addedCount} item(s) to your cart.`);
      }
      
      router.push("/checkout");
    });
  };

  // `md:h-full` makes a card fill the grid row its neighbours set, and the
  // total row below carries `md:mt-auto` so it sits on the bottom edge rather
  // than floating in the middle. Without both, a card with one item or no
  // star row — a cancelled order has neither — draws visibly shorter than the
  // two beside it.
  return (
    <article className="flex flex-col gap-[8px] rounded-lg border border-rule bg-white p-[14px] md:h-full md:gap-[9px] md:p-[18px]">
      <div className="order-1 flex items-start justify-between gap-[12px]">
        <span className="text-[12px] font-bold text-muted-foreground">
          {formatPlacedAt(order.placedAt)}
        </span>
        <span
          className={cn(
            "shrink-0 text-[11px] font-bold",
            outcome.tone === "success" ? "text-success" : "text-muted-foreground",
          )}
        >
          {outcome.label}
        </span>
      </div>

      {/* The items line is the card's link to its own receipt. Ticket 11
          records why: the frames draw a "View receipt" action on one card
          with nothing in the data to say when it applies, and the order
          detail screen already is the receipt. One interactive element, not
          a button nested inside a link. */}
      <Link
        href={`/orders/${order.orderId}`}
        className="order-2 text-[14px] font-bold leading-[18.2px] text-foreground hover:underline md:leading-[18.9px]"
      >
        {summariseItems(order.items)}
        <span className="sr-only"> — view receipt for order #{order.orderNumber}</span>
      </Link>

      {/* Below the total on mobile, above it on desktop. A cancelled order
          renders neither: there is nothing to rate and nothing was rated. */}
      {order.rating !== null ? (
        <OrderRatingDisplay
          rating={order.rating}
          className="order-4 text-[15px] leading-none md:order-3"
        />
      ) : rateable ? (
        <OrderRatingInput
          orderId={order.orderId}
          orderNumber={order.orderNumber}
          firstStarRef={firstStarRef}
          className="order-4 flex text-[15px] leading-none md:order-3"
        />
      ) : null}

      <div className="order-3 flex items-center justify-between gap-[12px] md:order-4 md:mt-auto md:pt-[8px]">
        <span className="font-display text-[18px] text-primary md:text-[19px]">
          {formatTotal(order.total)}
        </span>

        {action === "track" ? (
          <Link
            href={`/orders/${order.orderId}`}
            className="shrink-0 text-[13px] font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Track order
          </Link>
        ) : action === "rate" ? (
          // "Rate order" is the instruction for the star row, so it moves the
          // keyboard there rather than being a second way to rate. Rating
          // without choosing a score isn't a thing the control can do.
          <button
            type="button"
            onClick={() => firstStarRef.current?.focus()}
            className="shrink-0 text-[13px] font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Rate order
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReorder}
            disabled={isPending}
            className="shrink-0 text-[13px] font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
          >
            {isPending ? "Reordering..." : "Reorder"}
            <span className="sr-only"> order #{order.orderNumber}</span>
          </button>
        )}
      </div>
    </article>
  );
}
