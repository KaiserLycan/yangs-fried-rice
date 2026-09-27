import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PromoCarousel, type PromoSlide } from "@/components/landing/promo-carousel";
import { categoryParam, itemParam } from "@/lib/menu/sign-in-href";

const slide = (id: string, title: string): PromoSlide => ({
  id,
  eyebrow: "Limited time",
  title,
  body: null,
  imageUrl: null,
  href: `/menu?item=${id}`,
  cta: "Order now",
});

describe("landing page carousel", () => {
  it("renders nothing without slides", () => {
    const { container } = render(<PromoCarousel slides={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows one banner without arrows or dots", () => {
    render(<PromoCarousel slides={[slide("a", "Family bundle")]} />);
    expect(screen.getByRole("heading", { name: "Family bundle" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next promotion/i })).toBeNull();
  });

  it("gives every banner a dot and links each CTA to its dish", () => {
    render(<PromoCarousel slides={[slide("a", "Family bundle"), slide("b", "Dim sum Tuesday")]} />);
    expect(screen.getAllByRole("button", { name: /show promotion/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Order now" }).map((a) => a.getAttribute("href"))).toEqual([
      "/menu?item=a",
      "/menu?item=b",
    ]);
  });
});

describe("menu deep links", () => {
  it("accepts a category name, not just a uuid", () => {
    expect(categoryParam("Dim Sum")).toBe("Dim Sum");
    expect(categoryParam(["Soups", "Drinks"])).toBe("Soups");
    expect(categoryParam("  ")).toBeNull();
    expect(categoryParam("x".repeat(81))).toBeNull();
    // ?item= stays uuid-only
    expect(itemParam("Dim Sum")).toBeNull();
  });
});
