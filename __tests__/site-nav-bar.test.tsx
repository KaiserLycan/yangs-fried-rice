import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { SiteNavBar } from "@/components/nav/site-nav-bar";
import { ToastProvider } from "@/components/ui/toast";
import type { CustomerProfile } from "@/lib/profile/customer-profile";

/**
 * `SiteNavBar` is desktop chrome behind `middleware.ts`'s auth gate, so it
 * cannot be eyeballed against the frame in a browser the way the rest of
 * this ticket's checklist asks for — there is no signed-in session available
 * in this environment. These are the fixture-backed checks that stand in for
 * that, the same reasoning ticket 04 gives for testing the cart's populated
 * layout this way.
 *
 * Wrapped in `ToastProvider` because the shared avatar button raises a toast
 * on click and reads the provider's context on every render, not just when
 * clicked — the same requirement the real page meets in
 * `app/(account)/profile/page.tsx`.
 */
function renderNavBar(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const profile: CustomerProfile = {
  name: "Liza Reyes",
  dateOfBirth: null,
  mobile: null,
  email: "liza@example.com",
  memberSince: null,
  orderCount: 0,
  deliverToAddress: "21 Mabini St, Malolos, Bulacan",
  addresses: [],
};

describe("SiteNavBar", () => {
  it("marks the current section by id, not by label", () => {
    renderNavBar(<SiteNavBar profile={profile} currentSection="account" />);

    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Menu" }),
    ).not.toHaveAttribute("aria-current");
  });

  // "Track order" and "My orders" share a href today (no tracking route
  // exists yet) but carry distinct ids, so each can be current on its own.
  it("does not mark both /orders links current at once", () => {
    renderNavBar(<SiteNavBar profile={profile} currentSection="track-order" />);

    expect(
      screen.getByRole("link", { name: "Track order" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "My orders" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("shows the short delivery address when the customer has one", () => {
    renderNavBar(<SiteNavBar profile={profile} currentSection="menu" />);

    expect(screen.getByText("Deliver to")).toBeInTheDocument();
    expect(screen.getByText(/21 Mabini St/)).toBeInTheDocument();
  });

  it("hides the delivery address affordance when there is none saved", () => {
    renderNavBar(
      <SiteNavBar
        profile={{ ...profile, deliverToAddress: null }}
        currentSection="menu"
      />,
    );

    expect(screen.queryByText("Deliver to")).not.toBeInTheDocument();
  });

  it("renders no search slot when none is passed", () => {
    renderNavBar(<SiteNavBar profile={profile} currentSection="account" />);

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("renders the search slot when one is passed", () => {
    renderNavBar(
      <SiteNavBar
        profile={profile}
        currentSection="menu"
        search={<input role="searchbox" aria-label="Search menu items" />}
      />,
    );

    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});
