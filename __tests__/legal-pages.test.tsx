import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { SELLER_ADDRESS, SELLER_NAME } from "@/lib/site/site-info";

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <span>{props.alt}</span>,
}));

function headings() {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent ?? "");
}

/**
 * Issue #116. The Data Privacy Act (RA 10173) asks for a privacy notice; the
 * Internet Transactions Act (RA 11967) asks for clear terms and the seller's
 * details. The ticket lists the topics each page must cover.
 */
describe("privacy page", () => {
  it("covers what is collected, why, how long, who gets it, cross-border and rights", () => {
    render(<PrivacyPage />);
    const text = headings().join(" | ");

    expect(text).toMatch(/what we collect/i);
    expect(text).toMatch(/why/i);
    expect(text).toMatch(/how long/i);
    expect(text).toMatch(/who we share/i);
    expect(text).toMatch(/outside the philippines/i);
    expect(text).toMatch(/your rights/i);
  });

  // Sign-up asks for an address and an 18+ confirmation, so the notice has
  // to say so (Data Privacy Act: tell people what is collected).
  it("discloses the address and age confirmation that sign-up collects", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/address you give at sign-up/i);
    expect(text).toMatch(/18 or have a parent/i);
  });

  it("names the services that receive customer data", () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(/Supabase/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PayMongo/).length).toBeGreaterThan(0);
  });

  it("says who the seller is and when the notice last changed", () => {
    render(<PrivacyPage />);
    expect(screen.getAllByText(new RegExp(SELLER_NAME)).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(new RegExp(SELLER_ADDRESS)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});

describe("terms page", () => {
  it("covers refunds, cancellation, store cancels, missing items, law and complaints", () => {
    render(<TermsPage />);
    const text = headings().join(" | ");

    expect(text).toMatch(/refund/i);
    expect(text).toMatch(/cancelling your order/i);
    expect(text).toMatch(/when we cancel/i);
    expect(text).toMatch(/missing, wrong or damaged items/i);
    expect(text).toMatch(/governing law/i);
    expect(text).toMatch(/complaints/i);
  });

  it("carries a last-updated date", () => {
    render(<TermsPage />);
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  /** The shop is pickup-only and takes no cards (issues #114, #116). */
  it("does not promise delivery, cash on delivery or card payments", () => {
    const { container } = render(<TermsPage />);
    const body = container.textContent ?? "";

    expect(body).not.toMatch(/cash on delivery/i);
    expect(body).not.toMatch(/credit|debit card/i);
    expect(body).not.toMatch(/delivery distance/i);
  });

  it("links to the privacy notice", () => {
    render(<TermsPage />);
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toContain("/privacy");
  });
});
