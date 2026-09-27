import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SoldOutButton } from "@/components/manage/kds/sold-out-dialog";
import { ToastProvider } from "@/components/ui/toast";
import { getProducts, toggleAvailability } from "@/lib/actions/menu";

/** Kitchen-staff persona: mark a dish sold out without leaving the KDS. */
vi.mock("@/lib/actions/menu", () => ({
  getProducts: vi.fn(),
  toggleAvailability: vi.fn(),
}));

describe("KDS sold-out control", () => {
  it("lists dishes, sold-out first, and switches one off", async () => {
    vi.mocked(getProducts).mockResolvedValue({
      data: [
        { product_id: "p-1", product_name: "Yangzhou Special", is_available: true },
        { product_id: "p-2", product_name: "Spicy Garlic Chicken", is_available: false },
      ] as never,
      error: null,
    });
    vi.mocked(toggleAvailability).mockResolvedValue({ data: {} as never, error: null });

    render(
      <ToastProvider>
        <SoldOutButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Sold out/ }));

    const switches = await screen.findAllByRole("switch");
    expect(switches[0]).toHaveAccessibleName("Spicy Garlic Chicken available");

    fireEvent.click(screen.getByRole("switch", { name: "Yangzhou Special available" }));

    await waitFor(() => expect(toggleAvailability).toHaveBeenCalledWith("p-1", false));
    expect(await screen.findByText("Yangzhou Special marked sold out.")).toBeInTheDocument();
  });
});
