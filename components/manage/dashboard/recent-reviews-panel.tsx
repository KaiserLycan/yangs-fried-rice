import Link from "next/link";
import { Phone } from "lucide-react";
import type { RecentReview } from "@/lib/actions/recent-reviews";
import { formatPlacedAt } from "@/lib/orders/past-order";

/**
 * The latest order ratings (FINALE 9.3). A low one is marked, and each row
 * carries what a follow-up needs: the order, opened straight from here, and
 * the customer's number as a tap-to-call link. Hidden when nobody has rated
 * anything yet.
 */

/** At or below this, the row is marked for a follow-up. */
const LOW_SCORE = 2;

function stars(score: number) {
  return "★".repeat(score) + "☆".repeat(5 - score);
}

export function RecentReviewsPanel({ reviews }: { reviews: RecentReview[] }) {
  if (reviews.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-reviews"
      className="flex flex-col gap-3 rounded-lg border border-rule bg-white p-4"
    >
      <h2 id="recent-reviews" className="font-display text-2xl leading-normal text-foreground">
        Latest ratings
      </h2>

      <ul className="flex flex-col divide-y divide-rule">
        {reviews.map((review) => {
          const low =
            review.food <= LOW_SCORE || (review.service !== null && review.service <= LOW_SCORE);
          return (
            <li key={review.reviewId} className="flex flex-col gap-1 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-bold text-foreground">
                  Food{" "}
                  <span style={{ color: "hsl(var(--star))" }} aria-label={`${review.food} out of 5`}>
                    {stars(review.food)}
                  </span>
                </span>
                {review.service !== null ? (
                  <span className="font-bold text-foreground">
                    Service{" "}
                    <span style={{ color: "hsl(var(--star))" }} aria-label={`${review.service} out of 5`}>
                      {stars(review.service)}
                    </span>
                  </span>
                ) : null}
                {low ? (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold uppercase tracking-[0.8px] text-white">
                    Follow up
                  </span>
                ) : null}
                <span className="text-muted-strong">{formatPlacedAt(review.createdAt)}</span>
              </div>

              {review.comment ? (
                <p className="break-words text-sm italic text-muted-strong">
                  &ldquo;{review.comment}&rdquo;
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-foreground">{review.customerName}</span>
                {review.customerPhone ? (
                  <a
                    href={`tel:${review.customerPhone}`}
                    className="flex min-h-[32px] items-center gap-1 font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    {review.customerPhone}
                  </a>
                ) : null}
                {review.orderNumber ? (
                  <Link
                    href={`/manage/orders?order=${encodeURIComponent(review.orderNumber)}`}
                    className="flex min-h-[32px] items-center font-bold text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    Open order #{review.orderNumber}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
