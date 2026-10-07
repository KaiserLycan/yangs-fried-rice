import { describe, expect, it } from "vitest";
import { formatReceiptNumber, formatReceiptPeso, receiptChange, receiptTotals } from "./receipt";

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
    ).toEqual({
      subtotal: 475,
      fee: 0,
      lessVat: 0,
      discount: 50,
      total: 425,
      vatableSales: 379.46,
      vatExemptSales: 0,
      zeroRatedSales: 0,
      vat: 45.54,
      tip: 0,
      amountDue: 425,
    });
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
    expect(totals).toMatchObject({ subtotal: 100, fee: 0, discount: 100, total: 0, vatableSales: 0, vat: 0, amountDue: 0 });
  });

  it("treats a Senior Citizen / PWD order as VAT-exempt with 20% off", () => {
    const totals = receiptTotals({
      items: [line(112)],
      orderAddOns: [],
      fee: 0,
      payment: {
        method: "pay_in_store",
        status: "pending",
        discountAmount: 20,
        discountType: "senior_citizen",
        taxAmount: 0,
        totalPaid: 0,
      },
    });
    expect(totals).toEqual({
      subtotal: 112,
      fee: 0,
      lessVat: 12,
      discount: 20,
      total: 80,
      vatableSales: 0,
      // Was always printed as ₱0.00 before; it is the sale with VAT removed.
      vatExemptSales: 100,
      zeroRatedSales: 0,
      vat: 0,
      tip: 0,
      amountDue: 80,
    });
  });

  it("handles a PWD order as VAT-exempt with 20% off", () => {
    const totals = receiptTotals({
      items: [line(224)],
      orderAddOns: [],
      fee: 0,
      payment: {
        method: "pay_in_store",
        status: "pending",
        discountAmount: 40,
        discountType: "pwd",
        taxAmount: 0,
        totalPaid: 0,
      },
    });
    expect(totals).toEqual({
      subtotal: 224,
      fee: 0,
      lessVat: 24,
      discount: 40,
      total: 160,
      vatableSales: 0,
      vatExemptSales: 200,
      zeroRatedSales: 0,
      vat: 0,
      tip: 0,
      amountDue: 160,
    });
  });

  it("adds the tip on top of the sale, outside the VAT split", () => {
    const totals = receiptTotals({
      items: [line(224)],
      orderAddOns: [],
      fee: 0,
      payment: {
        method: "pay_in_store",
        status: "pending",
        discountAmount: 0,
        discountType: null,
        taxAmount: 24,
        totalPaid: 0,
        tipAmount: 20,
      },
    });
    expect(totals).toMatchObject({ total: 224, vatableSales: 200, vat: 24, tip: 20, amountDue: 244 });
  });
});

describe("receiptChange", () => {
  it("is the cash tendered less the amount due", () => {
    expect(receiptChange(500, 244)).toBe(256);
  });

  it("is null when no cash amount was given", () => {
    expect(receiptChange(null, 244)).toBeNull();
  });
});

describe("formatReceiptNumber", () => {
  it("zero-pads an order number to eight digits", () => {
    expect(formatReceiptNumber("1042")).toBe("00001042");
  });

  it("keeps an id-prefix fallback as it is", () => {
    expect(formatReceiptNumber("38206dc0")).toBe("38206dc0");
  });
});

describe("formatReceiptPeso", () => {
  it("shows centavos", () => {
    expect(formatReceiptPeso(1234.5)).toBe("₱1,234.50");
  });
});
