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

  it("accepts exactly 20 (MAX_QUANTITY)", () => {
    expect(
      addCartItemSchema.safeParse({ product_id: validUUID, quantity: 20 }).success,
    ).toBe(true);
  });

  it("rejects quantity greater than 20 (MAX_QUANTITY)", () => {
    const res = addCartItemSchema.safeParse({
      product_id: validUUID,
      quantity: 21,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toMatch(/cannot exceed 20/i);
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
    }
  });

  it("accepts dine_in with special instructions", () => {
    const res = submitCartSchema.safeParse({
      cart_id: validUUID,
      order_type: "dine_in",
      special_instructions: "No onions",
    });
    expect(res.success).toBe(true);
  });

  it("rejects delivery — the shop is pickup-only (issue #114)", () => {
    const res = submitCartSchema.safeParse({
      cart_id: validUUID,
      order_type: "delivery",
    });
    expect(res.success).toBe(false);
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
 * Issue #106 / #114: only the methods a pickup order can use get through.
 * The picker is not the only way in — `app/api/cart/submit/route.ts` passes a
 * raw body straight through.
 */
describe("submitCartSchema payment method", () => {
  const validUUID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const parse = (extra: Record<string, unknown>) =>
    submitCartSchema.safeParse({ cart_id: validUUID, ...extra });

  it("rejects cash on delivery", () => {
    expect(
      parse({ order_type: "take_out", payment_method: "cash-on-delivery" })
        .success,
    ).toBe(false);
  });

  it("accepts the wallet and paying in store", () => {
    expect(parse({ payment_method: "wallet" }).success).toBe(true);
    expect(parse({ payment_method: "pay-in-store" }).success).toBe(true);
  });

  it("defaults to paying in store when no method is given", () => {
    const res = parse({ order_type: "take_out" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.payment_method).toBe("pay-in-store");
  });
});

describe("quantity cap on update (issue #115)", () => {
  it("accepts 20 and rejects 21", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 20 }).success).toBe(true);
    expect(updateCartItemSchema.safeParse({ quantity: 21 }).success).toBe(false);
  });
});

describe("submitCartSchema expected_prices (issue #115)", () => {
  const cartId = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
  const lineId = "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  it("is optional", () => {
    const res = submitCartSchema.safeParse({ cart_id: cartId });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.expected_prices).toBeUndefined();
  });

  it("accepts cart_item_id → unit price", () => {
    const res = submitCartSchema.safeParse({
      cart_id: cartId,
      expected_prices: { [lineId]: 165.5 },
    });
    expect(res.success).toBe(true);
  });

  it("rejects a key that is not a cart_item_id", () => {
    expect(
      submitCartSchema.safeParse({ cart_id: cartId, expected_prices: { nope: 1 } }).success,
    ).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(
      submitCartSchema.safeParse({ cart_id: cartId, expected_prices: { [lineId]: -1 } })
        .success,
    ).toBe(false);
  });
});
