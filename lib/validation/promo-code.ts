import { z } from "zod";

/**
 * Promo codes (a customer types one at checkout; the discount is applied
 * when the order is placed).
 *
 * The database holds the same rules — `promotion_code_format` and the other
 * CHECKs in supabase/migrations/20260929160000_promo_codes.sql — and
 * `promo_code_discount()` there is the only place a discount is worked out.
 * This module is the friendlier first line for the checkout field and the
 * manager's promotion form, not the only one.
 */

export const PROMO_CODE_MIN = 3;
export const PROMO_CODE_MAX = 20;
export const PROMO_CODE_PATTERN = /^[A-Z0-9]{3,20}$/;

/** Upper case, no spaces: "  yang 20 " → "YANG20". What is stored and compared. */
export function normalisePromoCode(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, "").toUpperCase();
}

/** A code as typed at checkout. */
export const promoCodeSchema = z
  .string()
  .transform(normalisePromoCode)
  .pipe(
    z
      .string()
      .min(1, "Enter a promo code.")
      .min(PROMO_CODE_MIN, `Promo codes are at least ${PROMO_CODE_MIN} characters.`)
      .max(PROMO_CODE_MAX, `Promo codes are ${PROMO_CODE_MAX} characters or fewer.`)
      .regex(PROMO_CODE_PATTERN, "Promo codes use letters and numbers only."),
  );

/**
 * The hints `promo_code_discount()` raises with. Any of them on a submit
 * means the code, not the cart, is the problem: checkout drops the code and
 * shows the reason beside the field.
 */
export const PROMO_ERROR_CODES = new Set([
  "PROMO_INVALID",
  "PROMO_EXPIRED",
  "PROMO_USED_UP",
  "PROMO_ALREADY_USED",
  "PROMO_MIN_SPEND",
  "PROMO_NOT_APPLICABLE",
  "PROMO_NOT_COMBINABLE",
  "PROMO_CHANGED",
]);

export type AppliedPromo = {
  code: string;
  title: string;
  /** Pesos off, as the database worked it out for this cart. */
  discount: number;
};

// ---------------------------------------------------------------------------
// The manager's side: a promotion's code and terms
// ---------------------------------------------------------------------------

export const PROMO_DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type PromoDiscountType = (typeof PROMO_DISCOUNT_TYPES)[number];

export const PROMO_LIMITS = {
  percentMax: 100,
  fixedMax: 10000,
  minSpendMax: 100000,
  maxDiscountMax: 10000,
  usageLimitMax: 100000,
  perCustomerMax: 100,
} as const;

/** A blank number field is "not set", not zero. */
const optionalAmount = z
  .union([z.number(), z.nan(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "number" && Number.isFinite(value) ? value : null));

/**
 * The promo-code half of a promotion. With no code, every other field here
 * is ignored and cleared: the promotion is a banner only.
 */
export const promotionCodeTermsSchema = z
  .object({
    code: z
      .string()
      .nullable()
      .optional()
      .transform((value) => normalisePromoCode(value) || null),
    discount_type: z.enum(PROMO_DISCOUNT_TYPES).nullable().optional(),
    discount_value: optionalAmount,
    min_spend: optionalAmount,
    max_discount: optionalAmount,
    usage_limit: optionalAmount,
    per_customer_limit: optionalAmount,
  })
  .superRefine((terms, ctx) => {
    if (!terms.code) return;
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (!PROMO_CODE_PATTERN.test(terms.code)) {
      issue("code", `Use ${PROMO_CODE_MIN}–${PROMO_CODE_MAX} letters and numbers, no spaces.`);
    }
    if (!terms.discount_type) {
      issue("discount_type", "Choose percent or pesos off.");
    }
    const value = terms.discount_value;
    if (value === null || value <= 0) {
      issue("discount_value", "Enter the discount.");
    } else if (terms.discount_type === "percent" && value > PROMO_LIMITS.percentMax) {
      issue("discount_value", "A percent discount can be up to 100%.");
    } else if (terms.discount_type === "fixed" && value > PROMO_LIMITS.fixedMax) {
      issue("discount_value", `A peso discount can be up to ₱${PROMO_LIMITS.fixedMax.toLocaleString()}.`);
    } else if (Math.round(value * 100) !== value * 100) {
      issue("discount_value", "Use at most two decimal places.");
    }
    if (terms.min_spend !== null && (terms.min_spend < 0 || terms.min_spend > PROMO_LIMITS.minSpendMax)) {
      issue("min_spend", `Minimum spend can be ₱0 to ₱${PROMO_LIMITS.minSpendMax.toLocaleString()}.`);
    }
    if (
      terms.max_discount !== null &&
      (terms.max_discount <= 0 || terms.max_discount > PROMO_LIMITS.maxDiscountMax)
    ) {
      issue("max_discount", `The cap can be up to ₱${PROMO_LIMITS.maxDiscountMax.toLocaleString()}.`);
    }
    if (
      terms.usage_limit !== null &&
      (!Number.isInteger(terms.usage_limit) || terms.usage_limit < 1 || terms.usage_limit > PROMO_LIMITS.usageLimitMax)
    ) {
      issue("usage_limit", `Total uses must be a whole number from 1 to ${PROMO_LIMITS.usageLimitMax.toLocaleString()}.`);
    }
    if (
      terms.per_customer_limit !== null &&
      (!Number.isInteger(terms.per_customer_limit) ||
        terms.per_customer_limit < 1 ||
        terms.per_customer_limit > PROMO_LIMITS.perCustomerMax)
    ) {
      issue("per_customer_limit", `Uses per customer must be a whole number from 1 to ${PROMO_LIMITS.perCustomerMax}.`);
    }
  })
  .transform((terms) =>
    terms.code
      ? {
          code: terms.code,
          discount_type: terms.discount_type ?? null,
          discount_value: terms.discount_value,
          min_spend: terms.min_spend ?? 0,
          // A cap only means something on a percent discount.
          max_discount: terms.discount_type === "percent" ? terms.max_discount : null,
          usage_limit: terms.usage_limit,
          per_customer_limit: terms.per_customer_limit ?? 1,
        }
      : {
          code: null,
          discount_type: null,
          discount_value: null,
          min_spend: 0,
          max_discount: null,
          usage_limit: null,
          per_customer_limit: 1,
        },
  );

export type PromotionCodeTerms = z.output<typeof promotionCodeTermsSchema>;

/** "20% off (up to ₱100)", "₱50 off" — for the banner and the manager's list. */
export function describePromoDiscount(terms: {
  discount_type: string | null;
  discount_value: number | null;
  max_discount?: number | null;
  min_spend?: number | null;
}): string | null {
  if (!terms.discount_type || terms.discount_value === null) return null;
  const peso = (n: number) => `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
  let text =
    terms.discount_type === "percent"
      ? `${Number(terms.discount_value)}% off`
      : `${peso(Number(terms.discount_value))} off`;
  if (terms.discount_type === "percent" && terms.max_discount) {
    text += ` (up to ${peso(Number(terms.max_discount))})`;
  }
  if (terms.min_spend && Number(terms.min_spend) > 0) {
    text += `, min. spend ${peso(Number(terms.min_spend))}`;
  }
  return text;
}
