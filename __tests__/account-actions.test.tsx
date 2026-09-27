import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AccountActions } from "@/components/profile/account-actions";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/auth/log-out-control", () => ({
  LogOutControl: () => <button type="button">Log out</button>,
}));

function openDialog(activeOrderCount?: number) {
  render(
    <ToastProvider>
      <AccountActions activeOrderCount={activeOrderCount} />
    </ToastProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));
}

/** The dialog's confirm button, not the trigger link that opened it. */
function confirmButton() {
  const buttons = screen.getAllByRole("button", { name: "Delete Account" });
  return buttons[buttons.length - 1];
}

describe("AccountActions delete guard (issue #115)", () => {
  it("offers deletion when no order is in progress", () => {
    openDialog(0);

    expect(screen.getByText(/permanently deletes your profile/i)).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("explains and disables deletion while one order is in progress", () => {
    openDialog(1);

    expect(
      screen.getByText(
        "You have 1 order still in progress. You can delete your account once it's completed or cancelled.",
      ),
    ).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });

  it("counts several orders in the message", () => {
    openDialog(3);

    expect(screen.getByText(/You have 3 orders still in progress/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();
  });
});
