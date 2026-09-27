import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SiteFooter } from "@/components/layout/site-footer";
import {
  SELLER_ADDRESS,
  SELLER_NAME,
  copyrightYears,
} from "@/lib/site/site-info";

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

    expect(hrefs).toEqual(["/menu", "/store", "/orders", "/profile", "/terms", "/privacy"]);
  });

  /**
   * The Internet Transactions Act (RA 11967) asks every online seller to show
   * its business name, address and contact details (issue #116).
   */
  it("names the seller and its address", () => {
    render(<SiteFooter />);
    const seller = screen.getByRole("region", { name: "Seller" });
    expect(within(seller).getByText(SELLER_NAME)).toBeInTheDocument();
    expect(within(seller).getByText(SELLER_ADDRESS)).toBeInTheDocument();
  });

  /** An invented number is worse than none: only what is set is shown. */
  it("shows only the contact details that are filled in", () => {
    render(<SiteFooter />);
    const seller = screen.getByRole("region", { name: "Seller" });
    const hrefs = within(seller)
      .queryAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    for (const href of hrefs) {
      expect(href).not.toMatch(/^(mailto|tel):$/);
    }
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
