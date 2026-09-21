import { describe, expect, it } from "vitest";
import { computeOrderTotal } from "./order-total";
import { formatOrderType, isDeliveryOrder } from "./format";

describe("computeOrderTotal", () => {
  it("adds items, order add-ons and the delivery fee", () => {
    expect(
      computeOrderTotal({
        itemSubtotals: [380, 145],
        orderAddOnPrices: [20],
        deliveryFee: 50,
      }),
    ).toBe(595);
  });

  it("never reads as zero just because nothing has been paid yet", () => {
    expect(computeOrderTotal({ itemSubtotals: [185], deliveryFee: 50 })).toBe(235);
  });

  it("treats missing values as zero", () => {
    expect(
      computeOrderTotal({ itemSubtotals: [null, undefined, 100], deliveryFee: null }),
    ).toBe(100);
  });

  it("does not drift on repeated decimal addition", () => {
    expect(
      computeOrderTotal({ itemSubtotals: [10.1, 10.2, 10.3] }),
    ).toBe(30.6);
  });
});

describe("formatOrderType", () => {
  it("shows take_out as Take Out", () => {
    expect(formatOrderType("take_out")).toBe("Take Out");
  });

  it("labels the other known types", () => {
    expect(formatOrderType("delivery")).toBe("Delivery");
    expect(formatOrderType("dine_in")).toBe("Dine In");
    expect(formatOrderType("pickup")).toBe("Pickup");
  });

  it("title-cases an unknown value instead of showing it raw", () => {
    expect(formatOrderType("drive_thru")).toBe("Drive Thru");
  });

  it("falls back to Take Out when there is no type", () => {
    expect(formatOrderType(null)).toBe("Take Out");
  });
});

describe("isDeliveryOrder", () => {
  it("only matches delivery", () => {
    expect(isDeliveryOrder("delivery")).toBe(true);
    expect(isDeliveryOrder("take_out")).toBe(false);
    expect(isDeliveryOrder(null)).toBe(false);
  });
});
