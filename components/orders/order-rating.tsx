"use client";

import * as React from "react";
import { MAX_RATING } from "@/lib/orders/past-order";
import { submitReview } from "@/lib/actions/customer-orders";
import { useCartAction } from "@/lib/cart/use-cart-action";

/**
 * The five stars on a past-order card — desktop `133:1268`, mobile
 * `133:2101`.
 *
 * The hollow row the frames draw on an unrated order is the control, not a
 * decoration: pressing a star is how a customer rates the order (OHF2, ticket
 * 12). A rated order renders the same row filled, and read-only — a rating is
 * given once, and editing one is drawn nowhere.
 *
 * Choosing a star calls `submitReview` (PR #66), which inserts the `review`
 * row through the `submit_order_review` RPC. The RPC owns the rules — one
 * review per order, only by the customer who placed it, only once it is
 * completed — and its message is what the toast shows when one is broken.
 *
 * #E8A33F is the frame's own value. The token collection has no amber this
 * warm — `--warning` (#C8791A) is the darker one used for alerts, and stars
 * drawn in it read as brown.
 */

const STAR_COLOUR = "#e8a33f";

function Stars({ filled }: { filled: number }) {
  return (
    <>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index < filled ? "★" : "☆"}
        </span>
      ))}
    </>
  );
}

/**
 * A score that has already been given. `aria-label` carries the whole meaning
 * because the glyphs themselves are hidden — a screen reader announcing
 * "black star black star white star" is noise, not a rating.
 */
export function OrderRatingDisplay({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <p
      className={className}
      style={{ color: STAR_COLOUR }}
      aria-label={`Rated ${rating} out of ${MAX_RATING}`}
    >
      <Stars filled={rating} />
    </p>
  );
}

/**
 * The pressable row. Hovering or focusing a star fills up to it, so the
 * customer can see the score before committing to it — without that, five
 * identical hollow glyphs give no feedback until after the decision.
 *
 * On success there is no local "rated" state: `useCartAction` refreshes the
 * route, `readPastOrders` finds the new `review` row, and the card re-renders
 * with `OrderRatingDisplay` and Reorder as its action — the same persisted-
 * value rule the cart follows. The stars are disabled while the write is in
 * flight so a second press can't race the first.
 */
export function OrderRatingInput({
  orderId,
  orderNumber,
  className,
  firstStarRef,
  productId,
}: {
  /** The `order.order_id` the review is written against. */
  orderId: string;
  productId?: string;
  /** Names the control for assistive tech: "Rate order #1039". */
  orderNumber: string;
  className?: string;
  /**
   * Lets the card's "Rate order" action put the keyboard on this control
   * instead of duplicating it — see `past-order-card.tsx`.
   */
  firstStarRef?: React.Ref<HTMLButtonElement>;
}) {
  const { run, pending } = useCartAction();
  const [preview, setPreview] = React.useState(0);
  // The score being written, shown filled while the write is in flight. Kept
  // apart from the hover preview so a failed write doesn't leave the row
  // looking rated: once `pending` drops, the row is back to plain hover.
  const [chosen, setChosen] = React.useState(0);
  const filled = pending ? chosen : preview;

  return (
    <div
      className={className}
      style={{ color: STAR_COLOUR }}
      role="group"
      aria-label={`Rate order #${orderNumber}`}
      onMouseLeave={() => setPreview(0)}
    >
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const score = index + 1;
        return (
          <button
            key={score}
            ref={score === 1 ? firstStarRef : undefined}
            type="button"
            disabled={pending}
            aria-label={`${score} out of ${MAX_RATING}`}
            onMouseEnter={() => setPreview(score)}
            onFocus={() => setPreview(score)}
            onBlur={() => setPreview(0)}
            onClick={() => {
              setChosen(score);
              run(() => submitReview(orderId, { rating: score, productId }));
            }}
            className="cursor-pointer px-[1px] leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
          >
            <span aria-hidden="true">{score <= filled ? "★" : "☆"}</span>
          </button>
        );
      })}
    </div>
  );
}
