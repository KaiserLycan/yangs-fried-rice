import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderReceipt } from "@/components/orders/order-receipt";
import type { TrackedOrder } from "@/lib/orders/read-tracked-order";

type ReceiptOrder = Parameters<typeof OrderReceipt>[0]["order"];

const baseOrder: ReceiptOrder = {
  orderNumber: "1042",
  orderType: "take_out",
  placedAt: "2026-09-27T11:12:00Z",
  completedAt: "2026-09-27T11:40:00Z",
  items: [
    {
      orderItemId: "line-1",
      productId: "p-1",
      name: "Yang Chow Fried Rice",
      quantity: 2,
      unitPrice: 112,
      subtotal: 224,
      addOns: [],
      specialInstructions: null,
    },
  ],
  orderAddOns: [],
  fee: 0,
  specialInstructions: null,
  cashTendered: 300,
  fulfillmentMethod: "self_pickup",
  customerName: "Liza Reyes",
  cashierName: "Juan D.",
  payment: {
    method: "pay_in_store",
    status: "paid",
    discountAmount: 0,
    discountType: null,
    taxAmount: 24,
    totalPaid: 244,
    tipAmount: 20,
  } satisfies NonNullable<TrackedOrder["payment"]>,
};

/** The value printed beside a receipt label, read from the on-screen copy. */
function valueOf(label: string): string {
  const receipt = screen.getByRole("region", { name: "Receipt" });
  const term = within(receipt).getByText(label, { selector: "dt" });
  return term.nextElementSibling?.textContent ?? "";
}

describe("OrderReceipt", () => {
  it("prints the seller block, receipt number, cashier and customer", () => {
    render(<OrderReceipt order={baseOrder} />);
    const receipt = screen.getByRole("region", { name: "Receipt" });
    expect(within(receipt).getByText(/VAT Reg\. TIN/)).toBeInTheDocument();
    expect(within(receipt).getByText(/BIR Permit No\./)).toBeInTheDocument();
    expect(valueOf("Receipt no.")).toBe("00001042");
    expect(valueOf("Cashier")).toBe("Juan D.");
    expect(valueOf("Customer")).toBe("Liza Reyes");
  });

  it("splits VAT, adds the tip, and shows cash tendered and change", () => {
    render(<OrderReceipt order={baseOrder} />);
    expect(valueOf("VATable sales")).toBe("₱200.00");
    expect(valueOf("VAT amount (12%)")).toBe("₱24.00");
    expect(valueOf("VAT-exempt sales")).toBe("₱0.00");
    expect(valueOf("VAT zero-rated sales")).toBe("₱0.00");
    expect(valueOf("Tip")).toBe("₱20.00");
    expect(valueOf("Amount due")).toBe("₱244.00");
    expect(valueOf("Cash tendered")).toBe("₱300.00");
    expect(valueOf("Change")).toBe("₱56.00");
  });

  it("prints a Senior Citizen order's VAT-exempt sales, ID and signature line", () => {
    render(
      <OrderReceipt
        order={{
          ...baseOrder,
          payment: {
            ...baseOrder.payment!,
            discountType: "senior_citizen",
            discountAmount: 40,
            taxAmount: 0,
            tipAmount: 0,
            discountIdNumber: "OSCA-12345",
            nameOnId: "Pedro Santos",
          },
          cashTendered: 200,
        }}
      />,
    );
    expect(valueOf("Less: VAT (12%)")).toBe("−₱24.00");
    expect(valueOf("VAT-exempt sales")).toBe("₱200.00");
    expect(valueOf("VATable sales")).toBe("₱0.00");
    expect(valueOf("Less: Discount (Senior Citizen)")).toBe("−₱40.00");
    expect(valueOf("Amount due")).toBe("₱160.00");
    expect(valueOf("OSCA / SC ID no.")).toBe("OSCA-12345");
    expect(valueOf("Name on ID")).toBe("Pedro Santos");
    expect(valueOf("Signature")).toBe("Signature line");
  });
});
