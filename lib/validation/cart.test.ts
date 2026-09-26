import { describe, it, expect } from "vitest";
import {
  addCartItemSchema,
  updateCartItemSchema,
  submitCartSchema,
  cancelOrderSchema,
} from "./cart";

describe("addCartItemSchema", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("accepts valid input with all fields", () => {
    const res = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 2,
      special_instructions: "Extra sauce, please",
    });
    expect(res.success).toBe(true);
  });

  it("accepts valid input without special instructions", () => {
    const res = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 1,
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid product UUID", () => {
    const res = addCartItemSchema.safeParse({
      product_id: "not-a-uuid",
      quantity: 1,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/valid UUID/i);
    }
  });

  it("rejects zero or negative quantity", () => {
    const zeroRes = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 0,
    });
    expect(zeroRes.success).toBe(false);

    const negRes = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: -2,
    });
    expect(negRes.success).toBe(false);
  });

  it("rejects quantity greater than 99", () => {
    const res = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 100,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/cannot exceed 99/i);
    }
  });

  it("rejects special instructions over 500 characters", () => {
    const res = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 1,
      special_instructions: "a".repeat(501),
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/cannot exceed 500 characters/i);
    }
  });
});

describe("updateCartItemSchema", () => {
  it("accepts updating quantity only", () => {
    const res = updateCartItemSchema.safeParse({ quantity: 5 });
    expect(res.success).toBe(true);
  });

  it("accepts updating special_instructions only", () => {
    const res = updateCartItemSchema.safeParse({ special_instructions: "Less salt" });
    expect(res.success).toBe(true);
  });

  it("rejects empty object update", () => {
    const res = updateCartItemSchema.safeParse({});
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/at least one/i);
    }
  });

  it("rejects invalid quantity update", () => {
    const res = updateCartItemSchema.safeParse({ quantity: -1 });
    expect(res.success).toBe(false);
  });
});

describe("submitCartSchema", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("accepts valid submit input with default order_type", () => {
    const res = submitCartSchema.safeParse({ cart_id: validUUID });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.order_type).toBe("take_out");
      expect(res.data.delivery_fee).toBe(0);
    }
  });

  it("accepts explicit order_type delivery with delivery_fee", () => {
    const res = submitCartSchema.safeParse({
      cart_id: validUUID,
      order_type: "delivery",
      delivery_fee: 50,
      special_instructions: "Leave at door",
    });
    expect(res.success).toBe(true);
  });

  it("rejects invalid order_type", () => {
    const res = submitCartSchema.safeParse({
      cart_id: validUUID,
      order_type: "drive_thru",
    });
    expect(res.success).toBe(false);
  });

  it("rejects negative delivery_fee", () => {
    const res = submitCartSchema.safeParse({
      cart_id: validUUID,
      delivery_fee: -10,
    });
    expect(res.success).toBe(false);
  });
});

describe("cancelOrderSchema", () => {
  it("accepts default reason when empty object provided", () => {
    const res = cancelOrderSchema.safeParse({});
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.cancellation_reason).toBe("Customer requested cancellation");
    }
  });

  it("accepts custom reason", () => {
    const res = cancelOrderSchema.safeParse({
      cancellation_reason: "Ordered by mistake, want to re-order",
    });
    expect(res.success).toBe(true);
  });

  it("rejects reason that is too short", () => {
    const res = cancelOrderSchema.safeParse({
      cancellation_reason: "no",
    });
    expect(res.success).toBe(false);
  });

  it("rejects reason exceeding 300 characters", () => {
    const res = cancelOrderSchema.safeParse({
      cancellation_reason: "x".repeat(301),
    });
    expect(res.success).toBe(false);
  });
});

/**
 * Issue #106: the picker offered all three methods on every order, so a
 * customer could promise to pay a rider for food they were collecting
 * themselves. The picker is fixed, but it is not the only way in —
 * `app/api/cart/submit/route.ts` passes a raw body straight through.
 */
describe("submitCartSchema payment method and fulfilment", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const parse = (extra: Record<string, unknown>) =>
    submitCartSchema.safeParse({ cart_id: validUUID, ...extra });

  it("rejects cash on delivery on an order nobody is delivering", () => {
    expect(
      parse({ order_type: "take_out", payment_method: "cash-on-delivery" })
        .success,
    ).toBe(false);
    expect(
      parse({ order_type: "dine_in", payment_method: "cash-on-delivery" })
        .success,
    ).toBe(false);
  });

  it("rejects paying in store for a delivery", () => {
    expect(
      parse({ order_type: "delivery", payment_method: "pay-in-store" }).success,
    ).toBe(false);
  });

  it("accepts each method on the fulfilment that offers it", () => {
    expect(
      parse({ order_type: "delivery", payment_method: "cash-on-delivery" })
        .success,
    ).toBe(true);
    expect(
      parse({ order_type: "take_out", payment_method: "pay-in-store" }).success,
    ).toBe(true);
  });

  it("accepts the wallet either way — it is paid before the food is cooked", () => {
    expect(
      parse({ order_type: "delivery", payment_method: "wallet" }).success,
    ).toBe(true);
    expect(
      parse({ order_type: "take_out", payment_method: "wallet" }).success,
    ).toBe(true);
  });

  it("fills in a method that suits the order when none is given", () => {
    // A fixed default of cash on delivery would have made every silent
    // take-out submission fail the rule above.
    const pickup = parse({ order_type: "take_out" });
    expect(pickup.success).toBe(true);
    if (pickup.success) expect(pickup.data.payment_method).toBe("pay-in-store");

    const delivery = parse({ order_type: "delivery" });
    expect(delivery.success).toBe(true);
    if (delivery.success) {
      expect(delivery.data.payment_method).toBe("cash-on-delivery");
    }
  });
});
