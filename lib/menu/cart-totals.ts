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

export type Fulfilment = "delivery" | "pickup";

export type CartLine = {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  specialInstructions: string | null;
  addOns?: { addon_id: string; name: string; price: number }[];
};

export type CartTotals = {
  subtotal: number;
  deliveryFee: number;
  total: number;
};

/**
 * ₱95 flat, same as ticket 08 records: nothing says whether this is fixed,
 * per-branch, or distance-derived, so the frontend computes it from a
 * constant until that's answered.
 */
const DELIVERY_FEE_PESOS = 95;

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
}: {
  lines: CartLine[];
  fulfilment: Fulfilment;
}): CartTotals {
  const subtotalCentavos = lines.reduce(
    (sum, line) => sum + toCentavos(line.unitPrice) * line.quantity,
    0,
  );
  // An empty cart charges nothing — there is nothing to deliver, so
  // "delivery" being selected isn't enough on its own to add the fee.
  const deliveryFeeCentavos =
    fulfilment === "delivery" && lines.length > 0
      ? toCentavos(DELIVERY_FEE_PESOS)
      : 0;

  return {
    subtotal: toPesos(subtotalCentavos),
    deliveryFee: toPesos(deliveryFeeCentavos),
    total: toPesos(subtotalCentavos + deliveryFeeCentavos),
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
