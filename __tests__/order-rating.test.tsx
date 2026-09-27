import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RateOrderButton, uniqueDishes } from "@/components/orders/order-rating";
import { ToastProvider } from "@/components/ui/toast";
import { submitOrderRatings } from "@/lib/actions/customer-orders";

/**
 * The write is mocked at the module boundary, the same way
 * `cart-contents.test.tsx` does it: these tests check that the dialog calls
 * `submitOrderRatings` with the right order, scores and comment, and that
 * the result is handled — not whether the backend then inserts the rows.
 *
 * P34–P37 on issue #106: one rating for the whole order, chosen in a dialog
 * with one Submit, a comment that is optional, and nothing written until the
 * customer presses Submit. FINALE 2.3: food and service scores, and an
 * optional star per dish with "Rate all the same".
 */
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/lib/actions/customer-orders", () => ({
  submitOrderRatings: vi.fn(),
}));

const DISHES = [
  { productId: "p-1", name: "Yangzhou Special" },
  { productId: "p-2", name: "Beef Fried Rice" },
  { productId: "p-1", name: "Yangzhou Special" },
  { productId: null, name: "Deleted dish" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitOrderRatings).mockResolvedValue({
    data: {} as never,
    error: null,
  });
});

function renderRating(items: { productId: string | null; name: string }[] = []) {
  render(
    <ToastProvider>
      <RateOrderButton orderId="order-uuid-1" orderNumber="1039" items={items} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Rate order/ }));
}

const submit = () => screen.getByRole("button", { name: "Submit rating" });
const food = () => screen.getByRole("radiogroup", { name: /Food score/ });
const service = () => screen.getByRole("radiogroup", { name: /Service score/ });
const star = (group: HTMLElement, name: string) =>
  within(group).getByRole("radio", { name });

describe("RateOrderButton", () => {
  it("writes nothing when the dialog opens or a star is chosen (P34)", () => {
    renderRating();

    fireEvent.click(star(food(), "1 star"));

    expect(submitOrderRatings).not.toHaveBeenCalled();
    expect(star(food(), "1 star")).toBeChecked();
  });

  it("keeps Submit disabled until the food is scored", () => {
    renderRating();

    expect(submit()).toBeDisabled();
    fireEvent.click(star(service(), "5 stars"));
    expect(submit()).toBeDisabled();
    fireEvent.click(star(food(), "4 stars"));
    expect(submit()).toBeEnabled();
  });

  it("submits the food score alone, with no comment (P35, P36)", async () => {
    renderRating();

    fireEvent.click(star(food(), "4 stars"));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitOrderRatings).toHaveBeenCalledWith("order-uuid-1", {
        food: 4,
        service: undefined,
        comment: undefined,
        items: [],
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("sends the service score and the trimmed comment (2.3, P36)", async () => {
    renderRating();

    fireEvent.click(star(food(), "5 stars"));
    fireEvent.click(star(service(), "3 stars"));
    fireEvent.change(screen.getByLabelText(/Comment/), {
      target: { value: "  Hot and fast  " },
    });
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitOrderRatings).toHaveBeenCalledWith("order-uuid-1", {
        food: 5,
        service: 3,
        comment: "Hot and fast",
        items: [],
      }),
    );
  });

  it("offers no dish list when the order has nothing ratable", () => {
    renderRating([{ productId: null, name: "Deleted dish" }]);

    expect(screen.queryByLabelText(/Rate each dish/)).not.toBeInTheDocument();
  });

  it("rates every dish the same as the food by default (2.3)", async () => {
    renderRating(DISHES);

    fireEvent.click(star(food(), "4 stars"));
    fireEvent.click(screen.getByLabelText("Rate each dish"));
    expect(screen.getByLabelText("Rate all the same")).toBeChecked();
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitOrderRatings).toHaveBeenCalledWith("order-uuid-1", {
        food: 4,
        service: undefined,
        comment: undefined,
        items: [
          { productId: "p-1", rating: 4 },
          { productId: "p-2", rating: 4 },
        ],
      }),
    );
  });

  it("sends only the dishes starred one by one (2.3)", async () => {
    renderRating(DISHES);

    fireEvent.click(star(food(), "4 stars"));
    fireEvent.click(screen.getByLabelText("Rate each dish"));
    fireEvent.click(screen.getByLabelText("Rate all the same"));
    const beef = screen.getByRole("radiogroup", { name: "Score for Beef Fried Rice" });
    fireEvent.click(star(beef, "2 stars"));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(submitOrderRatings).toHaveBeenCalledWith("order-uuid-1", {
        food: 4,
        service: undefined,
        comment: undefined,
        items: [{ productId: "p-2", rating: 2 }],
      }),
    );
  });

  it("shows the backend's message and does not refresh when the write fails", async () => {
    vi.mocked(submitOrderRatings).mockResolvedValue({
      data: null,
      error: "You have already rated this order.",
    });
    renderRating();

    fireEvent.click(star(food(), "5 stars"));
    fireEvent.click(submit());

    expect(
      await screen.findByText("You have already rated this order."),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("disables Submit while the write is in flight", async () => {
    let settle: (value: { data: never; error: null }) => void = () => {};
    vi.mocked(submitOrderRatings).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderRating();

    fireEvent.click(star(food(), "3 stars"));
    fireEvent.click(submit());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled(),
    );

    settle({ data: {} as never, error: null });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});

describe("uniqueDishes", () => {
  it("drops repeated and deleted dishes", () => {
    expect(uniqueDishes(DISHES)).toEqual([
      { productId: "p-1", name: "Yangzhou Special" },
      { productId: "p-2", name: "Beef Fried Rice" },
    ]);
  });
});
