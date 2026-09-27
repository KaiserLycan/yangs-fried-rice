import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderSummaryRows } from "@/components/checkout/order-summary-rows";
import { computeCartTotals, type CartLine } from "@/lib/menu/cart-totals";

const lines: CartLine[] = [
  { id: "a", name: "Yang Special Fried Rice", unitPrice: 180, quantity: 2, specialInstructions: null },
  { id: "b", name: "Halo-halo", unitPrice: 125, quantity: 1, specialInstructions: null },
];

function row(label: string): string | null {
  const cell = screen.getByText(label);
  return cell.nextElementSibling?.textContent ?? null;
}

describe("order summary with a promo code", () => {
  it("shows the code, takes it off, and splits VAT on what is paid", () => {
    const totals = computeCartTotals({ lines, fulfilment: "pickup" });
    render(
      <OrderSummaryRows
        customerName="Juan"
        placedAtLabel="Now"
        fulfilment="pickup"
        lines={lines}
        totals={totals}
        promo={{ code: "YANGS10", discount: 48.5 }}
      />,
    );
    expect(row("Subtotal")).toBe("₱485.00");
    expect(row("Promo (YANGS10)")).toBe("−₱48.50");
    // ₱436.50 paid: VAT = 436.50 × 12/112 = 46.77
    expect(row("VAT (12%)")).toBe("₱46.77");
    expect(row("VATable sales")).toBe("₱389.73");
    expect(row("Total")).toBe("₱436.50");
  });

  it("ignores the promo when a Senior / PWD discount is shown", () => {
    const totals = computeCartTotals({ lines, fulfilment: "pickup" });
    render(
      <OrderSummaryRows
        customerName="Juan"
        placedAtLabel="Now"
        fulfilment="pickup"
        lines={lines}
        totals={totals}
        discount={{ type: "pwd", vatExemptSales: 433.04, discount: 86.61, total: 346.43 }}
        promo={{ code: "YANGS10", discount: 48.5 }}
      />,
    );
    expect(screen.queryByText("Promo (YANGS10)")).toBeNull();
  });
});
