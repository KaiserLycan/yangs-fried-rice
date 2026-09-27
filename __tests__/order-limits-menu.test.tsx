import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/toast";
import type { ProductListing } from "@/lib/menu/product-listing";

/**
 * Issue #115: the menu stops at the limits before the server has to —
 * 30 items per order, 20 of one dish across all its lines — and says why,
 * so the customer never sees two messages for one refusal.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const addCartItem = vi.fn();
vi.mock("@/lib/actions/cart", () => ({
  addCartItem: (input: unknown) => addCartItem(input),
  updateCartItem: vi.fn(),
}));

import { ItemDetailModal } from "@/components/menu/item-detail-modal";
import { ProductCard } from "@/components/menu/product-card";

const halo: ProductListing = {
  id: "p-halo",
  name: "Yang's Halo-Halo",
  description: "Shaved ice, leche flan, ube.",
  price: 120,
  categoryName: "Desserts",
  isAvailable: true,
  imageUrl: null,
};

function openDialog(cartTotalItems: number, cartProductItems: number) {
  render(
    <ToastProvider>
      <ItemDetailModal
        product={halo}
        onClose={vi.fn()}
        onAdd={vi.fn()}
        cartTotalItems={cartTotalItems}
        cartProductItems={cartProductItems}
      />
    </ToastProvider>,
  );
  // The dialog draws a mobile and a desktop layout; the desktop one is the
  // second of each control.
  return {
    add: () => screen.getAllByRole("button", { name: /Add to cart/ })[1],
    plus: () => screen.getAllByRole("button", { name: "Increase quantity" })[1],
  };
}

beforeEach(() => {
  addCartItem.mockReset();
  addCartItem.mockResolvedValue({ data: {}, error: null });
});

describe("item dialog limits", () => {
  it("allows a full 20 in an empty cart", () => {
    const { add, plus } = openDialog(0, 0);
    expect(add()).toBeEnabled();
    expect(plus()).toBeEnabled();
  });

  it("at 29 items, lets only 1 more in", () => {
    const { add, plus } = openDialog(29, 0);
    expect(add()).toBeEnabled();
    expect(plus()).toBeDisabled();
  });

  it("at 30 items, disables Add and links to the bulk-order contact", () => {
    const { add } = openDialog(30, 0);

    expect(add()).toBeDisabled();
    const notices = screen.getAllByRole("status");
    expect(notices[0]).toHaveTextContent(
      "That's a big order! Please contact us for a bulk order or catering.",
    );
    expect(
      within(notices[0]).getByRole("link", {
        name: "Please contact us for a bulk order or catering.",
      }),
    ).toHaveAttribute("href", "/");
  });

  it("counts the dish across all its lines: 20 already, nothing more", () => {
    const { add } = openDialog(20, 20);

    expect(add()).toBeDisabled();
    expect(screen.getAllByRole("status")[0]).toHaveTextContent(
      "You can only order up to 20 of each dish (Yang's Halo-Halo).",
    );
  });

  it("stops the stepper at what is left of the dish (13 in cart → 7)", () => {
    const { plus } = openDialog(13, 13);
    // Type 10; it snaps down to 7.
    const quantity = screen.getAllByRole("textbox", { name: "Quantity" })[1];
    fireEvent.change(quantity, { target: { value: "10" } });
    expect(quantity).toHaveValue("7");
    expect(plus()).toBeDisabled();
  });

  it("does not toast a big-order warning when an add simply fills the cart", async () => {
    const { add } = openDialog(29, 0);
    fireEvent.click(add());
    await vi.waitFor(() => expect(addCartItem).toHaveBeenCalled());
    expect(screen.queryByText(/That's a big order!/)).not.toBeInTheDocument();
  });
});

describe("product card Add", () => {
  it("is disabled when the cart is full", () => {
    render(<ProductCard product={halo} onSelect={vi.fn()} cartFull />);
    expect(screen.getByRole("button", { name: /^Add/ })).toBeDisabled();
  });

  it("is enabled otherwise", () => {
    render(<ProductCard product={halo} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^Add/ })).toBeEnabled();
  });
});
