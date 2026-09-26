"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MAX_RATING } from "@/lib/orders/past-order";
import { submitReview } from "@/lib/actions/customer-orders";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Rating an order — the stars on a past-order card, and the dialog both
 * My orders and the tracking screen open to give one.
 *
 * One rating for the whole order (P36), written through `submitReview`
 * (PR #66) as an order-level `review` row (`product_id` null). The RPC owns
 * the rules — one order-level review per order, only by the customer who
 * placed it, only once it is completed.
 *
 * Nothing is written until the customer presses Submit (P34). The stars
 * used to sit on the card and write on the first press, so focusing them
 * from "Rate order" looked like a 1-star rating had been given, and the
 * per-item modal on tracking had one Submit per dish (P35, P37).
 *
 * #E8A33F is the frame's own value. The token collection has no amber this
 * warm — `--warning` (#C8791A) is the darker one used for alerts, and stars
 * drawn in it read as brown.
 */

const STAR_COLOUR = "#e8a33f";
const MAX_COMMENT = 1000;

const SCORE_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

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
 * "Rate order" and the dialog it opens. The trigger is a plain text button
 * by default, matching the card's other actions; pass `className` to style
 * it for another screen.
 *
 * On success there is no local "rated" state: the route is refreshed, the
 * reader finds the new `review` row, and the screen re-renders with
 * `OrderRatingDisplay` in place of this — the same persisted-value rule the
 * cart follows.
 */
export function RateOrderButton({
  orderId,
  orderNumber,
  className,
}: {
  /** The `order.order_id` the review is written against. */
  orderId: string;
  /** Shown in the dialog and read to assistive tech: "order #1039". */
  orderNumber: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 text-[13px] font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
      >
        Rate order
        <span className="sr-only"> #{orderNumber}</span>
      </button>
      <RateOrderDialog
        open={open}
        onClose={() => setOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
      />
    </>
  );
}

function RateOrderDialog({
  open,
  onClose,
  orderId,
  orderNumber,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [rating, setRating] = React.useState(0);
  const [preview, setPreview] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const commentId = React.useId();

  // A fresh start each time it opens: a half-finished rating from an earlier
  // open should not still be sitting there.
  React.useEffect(() => {
    if (!open) return;
    setRating(0);
    setPreview(0);
    setComment("");
    setError(null);
  }, [open]);

  const shown = preview || rating;

  const handleSubmit = async () => {
    if (rating === 0 || pending) return;
    setPending(true);
    setError(null);
    try {
      const trimmed = comment.trim();
      const result = await submitReview(orderId, {
        rating,
        comment: trimmed || undefined,
      });
      // Shown inside the dialog, not as a toast: the dialog sits in the top
      // layer, so a toast would render behind it.
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      onClose();
      showToast("Thanks for rating your order.", "success");
      router.refresh();
    } catch {
      setError("Couldn’t reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="sheet"
      title="RATE YOUR ORDER"
      description={`How was order #${orderNumber}? Pick a score — the comment is optional.`}
      footer={
        <>
          <Button
            variant="outline"
            className="flex-1 p-[14px]"
            onClick={onClose}
            disabled={pending}
          >
            Not now
          </Button>
          <Button
            variant="confirm"
            className="flex-1"
            disabled={rating === 0 || pending}
            onClick={handleSubmit}
          >
            {pending ? "Submitting…" : "Submit rating"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        <div className="flex items-center gap-[12px]">
          {/* A radio group: choosing a score only selects it. */}
          <div
            role="radiogroup"
            aria-label={`Score for order #${orderNumber}`}
            className="flex text-[34px] leading-none"
            style={{ color: STAR_COLOUR }}
            onMouseLeave={() => setPreview(0)}
          >
            {Array.from({ length: MAX_RATING }, (_, index) => {
              const score = index + 1;
              return (
                <button
                  key={score}
                  type="button"
                  role="radio"
                  aria-checked={rating === score}
                  aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
                  disabled={pending}
                  onMouseEnter={() => setPreview(score)}
                  onClick={() => setRating(score)}
                  className="px-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
                >
                  <span aria-hidden="true">{score <= shown ? "★" : "☆"}</span>
                </button>
              );
            })}
          </div>
          <span className="text-[13px] font-bold text-muted-strong" aria-live="polite">
            {shown ? SCORE_WORDS[shown] : "Tap a star"}
          </span>
        </div>

        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor={commentId}
            className="text-[11px] font-bold uppercase tracking-[1.5px] text-muted-foreground"
          >
            Comment (optional)
          </label>
          <Textarea
            id={commentId}
            rows={3}
            maxLength={MAX_COMMENT}
            value={comment}
            disabled={pending}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us how the food and delivery were"
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}
      </div>
    </Dialog>
  );
}
