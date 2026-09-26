import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RateOrderButton } from "@/components/orders/order-rating";
import { ToastProvider } from "@/components/ui/toast";
import { submitReview } from "@/lib/actions/customer-orders";

/**
 * The write is mocked at the module boundary, the same way
 * `cart-contents.test.tsx` does it: these tests check that the dialog calls
 * `submitReview` with the right order, score and comment, and that the
 * result is handled — not whether the backend then inserts the `review` row.
 *
 * P34–P37 on issue #106: one rating for the whole order, chosen in a dialog
 * with one Submit, a comment that is optional, and nothing written until the
 * customer presses Submit.
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
  render(
    <ToastProvider>
      <RateOrderButton orderId="order-uuid-1" orderNumber="1039" />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Rate order/ }));
}

const submit = () => screen.getByRole("button", { name: "Submit rating" });

describe("RateOrderButton", () => {
  it("writes nothing when the dialog opens or a star is chosen (P34)", () => {
    renderRating();

    fireEvent.click(screen.getByRole("radio", { name: "1 star" }));

    expect(submitReview).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "1 star" })).toBeChecked();
  });

  it("keeps Submit disabled until a score is chosen", () => {
    renderRating();

    expect(submit()).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(submit()).toBeEnabled();
  });

  it("submits one order-level rating with no comment (P35, P36)", async () => {
    renderRating();

    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitReview).toHaveBeenCalledWith("order-uuid-1", {
        rating: 4,
        comment: undefined,
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("sends the comment when one is written (P36)", async () => {
    renderRating();

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText(/Comment/), {
      target: { value: "  Hot and fast  " },
    });
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitReview).toHaveBeenCalledWith("order-uuid-1", {
        rating: 5,
        comment: "Hot and fast",
      }),
    );
  });

  it("shows the backend's message and does not refresh when the write fails", async () => {
    vi.mocked(submitReview).mockResolvedValue({
      data: null,
      error: "You have already submitted an order-level review for this order.",
    });
    renderRating();

    fireEvent.click(screen.getByRole("radio", { name: "5 stars" }));
    fireEvent.click(submit());

    expect(
      await screen.findByText(
        "You have already submitted an order-level review for this order.",
      ),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("disables Submit while the write is in flight", async () => {
    let settle: (value: { data: never; error: null }) => void = () => {};
    vi.mocked(submitReview).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderRating();

    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled(),
    );

    settle({ data: {} as never, error: null });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
