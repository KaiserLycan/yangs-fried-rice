import { describe, expect, it } from "vitest";
import { formatReceiptPeso, receiptTotals } from "./receipt";

const line = (subtotal: number) => ({
  orderItemId: "x",
  productId: "p",
  name: "Dish",
  quantity: 1,
  unitPrice: subtotal,
  subtotal,
  addOns: [],
  specialInstructions: null,
});

describe("receiptTotals", () => {
  it("adds lines, order-level add-ons and the fee, less the discount", () => {
    expect(
      receiptTotals({
        items: [line(360), line(90)],
        orderAddOns: [{ name: "Extra rice", price: 25 }],
        fee: 0,
        payment: {
          method: "paymongo",
          status: "paid",
          discountAmount: 50,
          discountType: "senior",
          taxAmount: 0,
          totalPaid: 425,
        },
      }),
    ).toEqual({ subtotal: 475, fee: 0, discount: 50, total: 425, vatableSales: 379.46, vat: 45.54 });
  });

  it("does not drift on centavos", () => {
    const totals = receiptTotals({
      items: [line(10.1), line(10.2), line(10.3)],
      orderAddOns: [],
      fee: 0,
      payment: null,
    });
    expect(totals.total).toBe(30.6);
  });

  it("never lets a discount take the total below zero", () => {
    const totals = receiptTotals({
      items: [line(100)],
      orderAddOns: [],
      fee: 0,
      payment: { method: null, status: null, discountAmount: 500, discountType: null, taxAmount: 0, totalPaid: 0 },
    });
    expect(totals).toEqual({ subtotal: 100, fee: 0, discount: 100, total: 0, vatableSales: 0, vat: 0 });
  });
});

describe("formatReceiptPeso", () => {
  it("shows centavos", () => {
    expect(formatReceiptPeso(1234.5)).toBe("₱1,234.50");
  });
});
