import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "@/components/layout/site-footer";
import { copyrightYears } from "@/lib/site/site-info";

/**
 * Issue #106: "no site footer exists anywhere (copyright, social links,
 * contact)".
 */
describe("site footer", () => {
  it("is a real landmark, so it can be jumped to", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("carries a copyright line", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(new RegExp(`© ${copyrightYears()} Yang's Fried Rice`)),
    ).toBeInTheDocument();
  });

  it("links only to routes that exist", () => {
    render(<SiteFooter />);
    const nav = screen.getByRole("navigation", { name: "Footer" });

    const hrefs = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual(["/menu", "/orders", "/profile", "/terms"]);
  });

  /**
   * The repository has no phone number, no support address and no accounts.
   * A "Get in touch" heading over nothing is worse than no heading, and an
   * invented number is worse than both.
   */
  it("omits contact details rather than inventing them", () => {
    render(<SiteFooter />);
    expect(screen.queryByText(/get in touch/i)).toBeNull();
  });

  it("clears the mobile tab bar, which is fixed over the bottom of the page", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("contentinfo").className).toContain(
      "pb-[calc(var(--tab-bar-height)_+_24px)]",
    );
  });
});

describe("copyrightYears", () => {
  it("shows a single year until a second one has passed", () => {
    expect(copyrightYears(new Date("2025-06-01"))).toBe("2025");
  });

  it("opens a range once the site has outlived its first year", () => {
    expect(copyrightYears(new Date("2027-01-02"))).toBe("2025–2027");
  });
});
