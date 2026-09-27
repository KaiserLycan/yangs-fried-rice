/**
 * The cart's money math (Order4 in the requirements proposal), colocated
 * with tests the way `lib/profile/` handles password strength and mobile
 * numbers — this is the module `vitest.config.mts` was originally set up
 * for.
 *
 * Two rules the frames imply and this module states outright rather than
 * leaving to the caller: the delivery fee applies to Delivery and not to
 * Pickup, and every sum runs in integer centavos so repeated addition can't
 * drift the way floating-point pesos can (₱10.10 + ₱10.20 + ₱10.30 is
 * exactly the shape of sum that drifts if summed as `number` pesos directly).
 */

import {
  BASE_DELIVERY_FEE_PHP,
  MIN_DELIVERY_FEE_PHP,
  PER_KM_RATE_PHP,
} from "@/lib/eta/engine";
import type { ProductListing } from "@/lib/menu/product-listing";

export type Fulfilment = "delivery" | "pickup";

export type CartLine = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  specialInstructions: string | null;
  addOns?: { addon_id: string; name: string; price: number }[];
  /**
   * The dish as the menu shows it, with its add-on choices — what the cart's
   * "Edit" dialog opens pre-filled (limitations #23). Absent on an optimistic
   * line the menu draws before the server has answered.
   */
  product?: ProductListing;
};

export type CartTotals = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** The total minus the VAT inside it. See `vatBreakdown`. */
  vatableSales: number;
  /** The 12% VAT already inside the total. Not added on top. */
  vat: number;
};

/** Philippine VAT, in whole percent. Menu prices already include it. */
export const VAT_PERCENT = 12;

export function calculateDeliveryFee(distanceKm?: number | null): number {
  if (!Number.isFinite(distanceKm as number)) {
    return BASE_DELIVERY_FEE_PHP;
  }

  const safeDistance = distanceKm ?? 0;
  if (safeDistance <= 0) {
    return BASE_DELIVERY_FEE_PHP;
  }

  const fee = Math.max(
    MIN_DELIVERY_FEE_PHP,
    BASE_DELIVERY_FEE_PHP + safeDistance * PER_KM_RATE_PHP,
  );

  return Number(fee.toFixed(2));
}

/** Pesos to whole centavos, rounded — the unit every sum below runs in. */
function toCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

function toPesos(centavos: number): number {
  return centavos / 100;
}

export function computeCartTotals({
  lines,
  fulfilment,
  distanceKm,
}: {
  lines: CartLine[];
  fulfilment: Fulfilment;
  distanceKm?: number | null;
}): CartTotals {
  const subtotalCentavos = lines.reduce(
    (sum, line) => sum + toCentavos(line.unitPrice) * line.quantity,
    0,
  );

  const deliveryFee =
    fulfilment === "delivery" && lines.length > 0
      ? calculateDeliveryFee(distanceKm)
      : 0;

  const deliveryFeeCentavos = toCentavos(deliveryFee);
  const total = toPesos(subtotalCentavos + deliveryFeeCentavos);

  return {
    subtotal: toPesos(subtotalCentavos),
    deliveryFee: toPesos(deliveryFeeCentavos),
    total,
    ...vatBreakdown(total),
  };
}

/**
 * Splits a VAT-inclusive total into VATable sales + VAT (issue #116).
 * VAT = total × 12 / 112, rounded to the centavo; VATable sales is the rest,
 * so the two always add back to the total. `submit_cart_to_order` saves the
 * same figure as `transaction.tax_amount`.
 */
export function vatBreakdown(total: number): { vatableSales: number; vat: number } {
  const totalCentavos = toCentavos(total);
  const vatCentavos = Math.round((totalCentavos * VAT_PERCENT) / (100 + VAT_PERCENT));
  return {
    vatableSales: toPesos(totalCentavos - vatCentavos),
    vat: toPesos(vatCentavos),
  };
}

/** Senior Citizen / PWD discount, in whole percent (issue #116). */
export const SENIOR_PWD_DISCOUNT_PERCENT = 20;

/**
 * A Senior Citizen / PWD order (issue #116): VAT-exempt, then 20% off.
 * ₱112 → ₱100 VAT-exempt sales, ₱20 discount, ₱80 due. Same rounding as
 * `submit_cart_to_order`, which saves `vatExemptSales` as
 * `transaction.subtotal` and `discount` as `transaction.discount_amount`.
 */
export function seniorPwdBreakdown(total: number): {
  vatExemptSales: number;
  discount: number;
  total: number;
} {
  const exemptCentavos = Math.round(
    (toCentavos(total) * 100) / (100 + VAT_PERCENT),
  );
  const discountCentavos = Math.round(
    (exemptCentavos * SENIOR_PWD_DISCOUNT_PERCENT) / 100,
  );
  return {
    vatExemptSales: toPesos(exemptCentavos),
    discount: toPesos(discountCentavos),
    total: toPesos(exemptCentavos - discountCentavos),
  };
}

/** The per-line total shown beside each dish — quantity times unit price. */
export function lineTotal(line: CartLine): number {
  return toPesos(toCentavos(line.unitPrice) * line.quantity);
}

/**
 * "3 items" in the desktop rail's header. A sum of quantities, not a count
 * of lines — two lines of quantity 2 and 1 read as 3 items, matching how
 * `lib/cart/cart-count.ts` defines the same number for the mobile tab bar.
 * One definition, read from two different places, rather than two
 * definitions that could quietly drift apart.
 */
export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
