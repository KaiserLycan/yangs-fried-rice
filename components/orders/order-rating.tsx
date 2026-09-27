"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MAX_RATING } from "@/lib/orders/past-order";
import { submitOrderRatings } from "@/lib/actions/customer-orders";
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
 * One rating per order (P36): food (required) and service (optional) on the
 * order-level `review` row, plus an optional star for each dish (FINALE 2.3),
 * written together through `submitOrderRatings`. The RPC owns the rules —
 * one order-level review per order, only by the customer who placed it, only
 * once it is completed.
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

const STAR_COLOUR = "hsl(var(--star))";
const MAX_COMMENT = 1000;

const SCORE_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

const SECTION_LABEL =
  "text-sm font-bold uppercase tracking-[1.5px] text-muted-foreground";

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

/** A line of the order the customer can rate on its own. */
export type RatableItem = {
  productId: string | null;
  name: string;
};

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
  items = [],
  className,
}: {
  /** The `order.order_id` the review is written against. */
  orderId: string;
  /** Shown in the dialog and read to assistive tech: "order #1039". */
  orderNumber: string;
  /** The order's lines, offered for per-dish ratings. */
  items?: RatableItem[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="unstyled"
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "shrink-0 text-sm font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
      >
        Rate order
        <span className="sr-only"> #{orderNumber}</span>
      </Button>
      <RateOrderDialog
        open={open}
        onClose={() => setOpen(false)}
        orderId={orderId}
        orderNumber={orderNumber}
        items={items}
      />
    </>
  );
}

/**
 * The same dish can be on an order twice (different add-ons); it is rated
 * once. A line whose product was deleted has nothing to rate against.
 */
export function uniqueDishes(
  items: RatableItem[],
): { productId: string; name: string }[] {
  const seen = new Set<string>();
  const dishes: { productId: string; name: string }[] = [];
  for (const item of items) {
    if (!item.productId || seen.has(item.productId)) continue;
    seen.add(item.productId);
    dishes.push({ productId: item.productId, name: item.name });
  }
  return dishes;
}

/**
 * Five stars as a radio group: choosing a score only selects it. The "sm"
 * size is the per-dish row, where five large stars would not fit beside a
 * dish name on a phone.
 */
function StarPicker({
  label,
  value,
  onChange,
  disabled,
  size = "lg",
}: {
  label: string;
  value: number;
  onChange: (score: number) => void;
  disabled: boolean;
  size?: "lg" | "sm";
}) {
  const [preview, setPreview] = React.useState(0);
  const shown = preview || value;

  return (
    <div className="flex items-center gap-[12px]">
      <div
        role="radiogroup"
        aria-label={label}
        className={cn("flex leading-none", size === "lg" ? "text-3xl" : "text-2xl")}
        style={{ color: STAR_COLOUR }}
        onMouseLeave={() => setPreview(0)}
      >
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const score = index + 1;
          return (
            <Button variant="unstyled"
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`${score} ${score === 1 ? "star" : "stars"}`}
              disabled={disabled}
              onMouseEnter={() => setPreview(score)}
              onClick={() => onChange(score)}
              className={cn(
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default",
                size === "lg" ? "px-[2px]" : "min-h-[36px] px-[3px]",
              )}
            >
              <span aria-hidden="true">{score <= shown ? "★" : "☆"}</span>
            </Button>
          );
        })}
      </div>
      {size === "lg" ? (
        <span className="text-sm font-bold text-muted-strong" aria-live="polite">
          {shown ? SCORE_WORDS[shown] : "Tap a star"}
        </span>
      ) : null}
    </div>
  );
}

function RateOrderDialog({
  open,
  onClose,
  orderId,
  orderNumber,
  items,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: RatableItem[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [food, setFood] = React.useState(0);
  const [service, setService] = React.useState(0);
  const [rateDishes, setRateDishes] = React.useState(false);
  const [allSame, setAllSame] = React.useState(true);
  const [dishRatings, setDishRatings] = React.useState<Record<string, number>>(
    {},
  );
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const commentId = React.useId();
  const dishes = React.useMemo(() => uniqueDishes(items), [items]);
  const oneDish = dishes.length === 1;

  // A fresh start each time it opens: a half-finished rating from an earlier
  // open should not still be sitting there.
  React.useEffect(() => {
    if (!open) return;
    setFood(0);
    setService(0);
    setRateDishes(false);
    setAllSame(true);
    setDishRatings({});
    setComment("");
    setError(null);
  }, [open]);

  // "Rate all the same" gives every dish the food score; otherwise only the
  // dishes the customer actually starred are sent.
  const dishPayload = !rateDishes
    ? []
    : allSame || oneDish
      ? dishes.map((dish) => ({ productId: dish.productId, rating: food }))
      : dishes
          .filter((dish) => dishRatings[dish.productId])
          .map((dish) => ({
            productId: dish.productId,
            rating: dishRatings[dish.productId],
          }));

  const handleSubmit = async () => {
    if (food === 0 || pending) return;
    setPending(true);
    setError(null);
    try {
      const trimmed = comment.trim();
      const result = await submitOrderRatings(orderId, {
        food,
        service: service || undefined,
        comment: trimmed || undefined,
        items: dishPayload,
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
      description={`How was order #${orderNumber}? Rate the food — the rest is optional.`}
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
            disabled={food === 0 || pending}
            onClick={handleSubmit}
          >
            {pending ? "Submitting…" : "Submit rating"}
          </Button>
        </>
      }
    >
      {/* Capped and scrolling: an order of eight dishes rated one by one
          would otherwise push Submit off a phone screen. */}
      <div className="-mx-[4px] flex max-h-[60vh] flex-col gap-[14px] overflow-y-auto px-[4px]">
        <div className="flex flex-col gap-[6px]">
          <span className={SECTION_LABEL}>Food</span>
          <StarPicker
            label={`Food score for order #${orderNumber}`}
            value={food}
            onChange={setFood}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className={SECTION_LABEL}>Service (optional)</span>
          <StarPicker
            label={`Service score for order #${orderNumber}`}
            value={service}
            onChange={setService}
            disabled={pending}
          />
        </div>

        {dishes.length > 0 ? (
          <div className="flex flex-col gap-[4px]">
            <label className="flex min-h-[36px] items-center gap-[10px] text-sm font-bold text-foreground">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-primary"
                checked={rateDishes}
                disabled={pending}
                onChange={(event) => setRateDishes(event.target.checked)}
              />
              {oneDish
                ? "Give the dish the same score"
                : "Rate each dish"}
            </label>

            {rateDishes && !oneDish ? (
              <label className="flex min-h-[36px] items-center gap-[10px] pl-[28px] text-sm text-muted-strong">
                <input
                  type="checkbox"
                  className="h-[18px] w-[18px] accent-primary"
                  checked={allSame}
                  disabled={pending}
                  onChange={(event) => setAllSame(event.target.checked)}
                />
                Rate all the same
              </label>
            ) : null}

            {rateDishes && !oneDish && !allSame ? (
              <ul className="mt-[4px] flex flex-col divide-y divide-rule rounded-md border border-rule">
                {dishes.map((dish) => (
                  <li
                    key={dish.productId}
                    className="flex flex-wrap items-center justify-between gap-x-[12px] px-[12px] py-[4px]"
                  >
                    <span className="min-w-0 break-words text-sm font-bold text-foreground">
                      {dish.name}
                    </span>
                    <StarPicker
                      label={`Score for ${dish.name}`}
                      value={dishRatings[dish.productId] ?? 0}
                      onChange={(score) =>
                        setDishRatings((current) => ({
                          ...current,
                          [dish.productId]: score,
                        }))
                      }
                      disabled={pending}
                      size="sm"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-[6px]">
          <label htmlFor={commentId} className={SECTION_LABEL}>
            Comment (optional)
          </label>
          <Textarea
            id={commentId}
            rows={3}
            maxLength={MAX_COMMENT}
            value={comment}
            disabled={pending}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us how the food and service were"
          />
        </div>

        {error ? <Alert>{error}</Alert> : null}
      </div>
    </Dialog>
  );
}
