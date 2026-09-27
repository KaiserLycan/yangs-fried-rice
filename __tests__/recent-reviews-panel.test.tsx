import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentReviewsPanel } from "@/components/manage/dashboard/recent-reviews-panel";
import type { RecentReview } from "@/lib/actions/recent-reviews";

/**
 * FINALE 9.3: a rating on the dashboard links to its order and the
 * customer's phone, so a follow-up is one tap rather than five clicks.
 */
const review: RecentReview = {
  reviewId: "r-1",
  orderId: "order-uuid",
  orderNumber: "1042",
  food: 1,
  service: 3,
  comment: "Food was cold and missing my extra rice.",
  customerName: "Mark Santos",
  customerPhone: "09171234567",
  createdAt: "2026-09-28T04:00:00Z",
};

describe("RecentReviewsPanel", () => {
  it("renders nothing when there are no ratings", () => {
    const { container } = render(<RecentReviewsPanel reviews={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links the rating to its order and the customer's phone", () => {
    render(<RecentReviewsPanel reviews={[review]} />);

    expect(screen.getByRole("link", { name: "Open order #1042" })).toHaveAttribute(
      "href",
      "/manage/orders?order=1042",
    );
    expect(screen.getByRole("link", { name: /09171234567/ })).toHaveAttribute(
      "href",
      "tel:09171234567",
    );
    expect(screen.getByText(/Food was cold/)).toBeInTheDocument();
  });

  it("marks a low score for follow-up, and not a good one", () => {
    const { rerender } = render(<RecentReviewsPanel reviews={[review]} />);
    expect(screen.getByText("Follow up")).toBeInTheDocument();

    rerender(<RecentReviewsPanel reviews={[{ ...review, food: 5, service: 4 }]} />);
    expect(screen.queryByText("Follow up")).not.toBeInTheDocument();
  });
});
