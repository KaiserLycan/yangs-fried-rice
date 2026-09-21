import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OrderRatingInput } from "@/components/orders/order-rating";
import { ToastProvider } from "@/components/ui/toast";
import { submitReview } from "@/lib/actions/customer-orders";

/**
 * The write is mocked at the module boundary, the same way
 * `cart-contents.test.tsx` does it: these tests check that pressing a star
 * calls `submitReview` with the right order and score, and that the result
 * is handled — not whether the backend then inserts the `review` row.
 */
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/lib/actions/customer-orders", () => ({
  submitReview: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitReview).mockResolvedValue({
    data: {} as never,
    error: null,
  });
});

function renderRating() {
  return render(
    <ToastProvider>
      <OrderRatingInput orderId="order-uuid-1" orderNumber="1039" />
    </ToastProvider>,
  );
}

describe("OrderRatingInput", () => {
  it("submits the chosen score for that order and refreshes on success", async () => {
    renderRating();

    fireEvent.click(screen.getByRole("button", { name: "4 out of 5" }));

    await waitFor(() =>
      expect(submitReview).toHaveBeenCalledWith("order-uuid-1", { rating: 4 }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the backend's message and does not refresh when the write fails", async () => {
    vi.mocked(submitReview).mockResolvedValue({
      data: null,
      error: "You have already reviewed this order.",
    });
    renderRating();

    fireEvent.click(screen.getByRole("button", { name: "5 out of 5" }));

    expect(
      await screen.findByText("You have already reviewed this order."),
    ).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
    // The row must not stay filled to the score that failed to save.
    expect(
      screen.getByRole("button", { name: "1 out of 5" }),
    ).toHaveTextContent("☆");
  });

  it("disables the stars while the write is in flight", async () => {
    let settle: (value: { data: never; error: null }) => void = () => {};
    vi.mocked(submitReview).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderRating();

    fireEvent.click(screen.getByRole("button", { name: "3 out of 5" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "1 out of 5" })).toBeDisabled(),
    );

    settle({ data: {} as never, error: null });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
