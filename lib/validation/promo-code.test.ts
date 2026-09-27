import { describe, expect, it } from "vitest";
import {
  describePromoDiscount,
  normalisePromoCode,
  promoCodeSchema,
  promotionCodeTermsSchema,
} from "./promo-code";
import { submitCartSchema } from "./cart";

const CART = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("promo code as typed at checkout", () => {
  it("is upper-cased and stripped of spaces", () => {
    expect(normalisePromoCode("  yang s20 ")).toBe("YANGS20");
    expect(promoCodeSchema.parse(" yangs20 ")).toBe("YANGS20");
  });

  it("refuses blanks, symbols and bad lengths", () => {
    for (const bad of ["", "AB", "YANG-20", "Ñ20A", "X".repeat(21)]) {
      expect(promoCodeSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});

describe("submitCartSchema with a promo code", () => {
  it("takes a code and the discount checkout showed", () => {
    const parsed = submitCartSchema.parse({ cart_id: CART, promo_code: "yangs20", expected_promo_discount: 40 });
    expect(parsed.promo_code).toBe("YANGS20");
    expect(parsed.expected_promo_discount).toBe(40);
  });

  it("won't combine a code with the Senior Citizen / PWD discount", () => {
    const result = submitCartSchema.safeParse({
      cart_id: CART,
      promo_code: "YANGS20",
      discount: { type: "pwd", id_number: "1", name_on_id: "Juan", photo_path: `${CART}/id.jpg` },
    });
    expect(result.success).toBe(false);
  });
});

describe("promotionCodeTermsSchema (the manager's form)", () => {
  const terms = {
    code: "yangs20",
    discount_type: "percent" as const,
    discount_value: 20,
    min_spend: 300,
    max_discount: 100,
    usage_limit: 50,
    per_customer_limit: 1,
  };

  it("keeps a valid code and its terms", () => {
    expect(promotionCodeTermsSchema.parse(terms)).toEqual({ ...terms, code: "YANGS20" });
  });

  it("clears every term when there is no code", () => {
    expect(promotionCodeTermsSchema.parse({ ...terms, code: "" })).toEqual({
      code: null,
      discount_type: null,
      discount_value: null,
      min_spend: 0,
      max_discount: null,
      usage_limit: null,
      per_customer_limit: 1,
    });
  });

  it("drops the cap on a peso discount and defaults blanks", () => {
    const parsed = promotionCodeTermsSchema.parse({
      code: "LESS50",
      discount_type: "fixed",
      discount_value: 50,
      min_spend: null,
      max_discount: 100,
      usage_limit: null,
      per_customer_limit: null,
    });
    expect(parsed).toMatchObject({ max_discount: null, min_spend: 0, usage_limit: null, per_customer_limit: 1 });
  });

  it("names the field that is wrong", () => {
    const cases: Array<[Partial<typeof terms>, string]> = [
      [{ code: "BAD-CODE" }, "code"],
      [{ discount_value: 0 }, "discount_value"],
      [{ discount_value: 101 }, "discount_value"],
      [{ discount_value: 10.005 }, "discount_value"],
      [{ min_spend: -1 }, "min_spend"],
      [{ max_discount: 0 }, "max_discount"],
      [{ usage_limit: 1.5 }, "usage_limit"],
      [{ per_customer_limit: 0 }, "per_customer_limit"],
    ];
    for (const [change, field] of cases) {
      const result = promotionCodeTermsSchema.safeParse({ ...terms, ...change });
      expect(result.success, JSON.stringify(change)).toBe(false);
      if (!result.success) expect(result.error.issues[0].path[0]).toBe(field);
    }
  });

  it("refuses a peso discount over ₱10,000", () => {
    expect(
      promotionCodeTermsSchema.safeParse({ ...terms, discount_type: "fixed", discount_value: 10001 }).success,
    ).toBe(false);
  });
});

describe("describePromoDiscount", () => {
  it("reads like the banner", () => {
    expect(describePromoDiscount({ discount_type: "percent", discount_value: 20, max_discount: 100, min_spend: 300 })).toBe(
      "20% off (up to ₱100), min. spend ₱300",
    );
    expect(describePromoDiscount({ discount_type: "fixed", discount_value: 50 })).toBe("₱50 off");
    expect(describePromoDiscount({ discount_type: null, discount_value: null })).toBeNull();
  });
});
