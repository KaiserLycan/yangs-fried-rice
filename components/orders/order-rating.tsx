"use client";

import * as React from "react";
import { MAX_RATING } from "@/lib/orders/past-order";
import { useToast } from "@/components/ui/toast";

/**
 * The five stars on a past-order card — desktop `133:1268`, mobile
 * `133:2101`.
 *
 * The hollow row the frames draw on an unrated order is the control, not a
 * decoration: pressing a star is how a customer rates the order (OHF2, ticket
 * 12). A rated order renders the same row filled, and read-only — a rating is
 * given once, and editing one is drawn nowhere.
 *
 * Rating writes nothing. Inserting a `review` row belongs to the backend
 * developer, so choosing a star raises the not-implemented toast; the write
 * is specified in `docs/reference/ordering-flow-handoff.md`.
 *
 * #E8A33F is the frame's own value. The token collection has no amber this
 * warm — `--warning` (#C8791A) is the darker one used for alerts, and stars
 * drawn in it read as brown.
 */

const STAR_COLOUR = "#e8a33f";

const NOT_IMPLEMENTED_MESSAGE =
  "Rating an order isn’t available yet. We’re still building it.";

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
 */
export function OrderRatingInput({
  orderNumber,
  className,
  firstStarRef,
}: {
  /** Named in the toast so it is clear which order was being rated. */
  orderNumber: string;
  className?: string;
  /**
   * Lets the card's "Rate order" action put the keyboard on this control
   * instead of duplicating it — see `past-order-card.tsx`.
   */
  firstStarRef?: React.Ref<HTMLButtonElement>;
}) {
  const showToast = useToast();
  const [preview, setPreview] = React.useState(0);

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
            aria-label={`${score} out of ${MAX_RATING}`}
            onMouseEnter={() => setPreview(score)}
            onFocus={() => setPreview(score)}
            onBlur={() => setPreview(0)}
            onClick={() => {
              setPreview(0);
              showToast(NOT_IMPLEMENTED_MESSAGE);
            }}
            className="cursor-pointer px-[1px] leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span aria-hidden="true">{score <= preview ? "★" : "☆"}</span>
          </button>
        );
      })}
    </div>
  );
}
