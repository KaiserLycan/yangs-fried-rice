import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { LogOutControl } from "@/components/auth/log-out-control";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { ToastProvider } from "@/components/ui/toast";
import { logout } from "@/app/(auth)/actions";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

vi.mock("@/app/(auth)/actions", () => ({
  logout: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const profile = {
  firstName: "Liza",
  lastName: "Reyes",
  name: "Liza Reyes",
  dateOfBirth: null,
  mobile: null,
  email: "liza@example.com",
  profileImageUrl: null,
  passwordLastUpdated: null,
  addresses: [],
  activeAddressId: null,
  deliverToAddress: null,
} as unknown as CustomerProfile;

function renderControl() {
  return render(
    <ToastProvider>
      <LogOutControl />
    </ToastProvider>,
  );
}

/**
 * Issue #106: manage and deliver both carry sign-out in their chrome, while
 * a customer had to open their profile and scroll to the bottom to find it.
 */
describe("LogOutControl", () => {
  it("asks before ending the session", () => {
    renderControl();
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it("signs out and replaces the history entry, so Back cannot flash the signed-in page", async () => {
    (logout as any).mockResolvedValue({ success: true });
    renderControl();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });

  it("says so and stays put when signing out fails", async () => {
    (logout as any).mockResolvedValue({
      success: false,
      error: "Could not sign you out.",
    });
    renderControl();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    await waitFor(() =>
      expect(screen.getByText("Could not sign you out.")).toBeInTheDocument(),
    );
    // An error toast, not the neutral one — the person needs to know this
    // did not happen.
    expect(
      screen.getByText("Could not sign you out.").closest("[data-tone]"),
    ).toHaveAttribute("data-tone", "error");
    expect(replace).not.toHaveBeenCalled();
  });

  it("forwards button attributes to the real trigger", () => {
    render(
      <ToastProvider>
        <LogOutControl aria-label="Sign out" aria-describedby="hint">
          <span>x</span>
        </LogOutControl>
      </ToastProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Sign out" });
    expect(trigger).toHaveAttribute("aria-describedby", "hint");
  });
});

describe("sign-out in the nav bar", () => {
  it("is there for a signed-in customer", () => {
    render(
      <ToastProvider>
        <SiteNavBar profile={profile} currentSection="menu" />
      </ToastProvider>,
    );

    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  /**
   * `/menu` is public, so this bar also renders for someone who never signed
   * in. Offering them a way out of a session they do not have would be
   * nonsense — they get "Log in" instead.
   */
  it("is absent for a guest, who is offered a way in instead", () => {
    render(
      <ToastProvider>
        <SiteNavBar profile={null} currentSection="menu" />
      </ToastProvider>,
    );

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it("names itself for anything that cannot see the glyph", () => {
    render(
      <ToastProvider>
        <SiteNavBar profile={profile} currentSection="menu" />
      </ToastProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Log out" });
    const describedBy = trigger.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("Log out");
  });
});
