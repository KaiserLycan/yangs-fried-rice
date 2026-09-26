import {
  arrivalWindowBounds,
  calculateKitchenPrepMinutes,
  calculateTransitMinutes,
} from "@/lib/eta/engine";

/**
 * How long the order a customer is about to place will take.
 *
 * This used to be `ARRIVAL_ESTIMATE = "35–45 min"` — the designer's copy,
 * printed as though the app had worked it out. Meanwhile a real ETA engine
 * (`lib/eta/engine.ts`) was computing a genuine window one screen later on
 * tracking, so a customer was shown an invented range at checkout and a
 * computed one immediately after, with no relationship between them (issue
 * #106).
 *
 * The same engine is used here, so the two agree in method. They will not
 * always agree to the minute — the kitchen queue moves between the quote and
 * the order landing in it — and that is the honest answer rather than a
 * fixed string that was never right for anyone.
 *
 * Pure, and deliberately kept that way: the checkout summary and the cart
 * rail that print it are both client components, so the read that produces
 * `activeOrdersAhead` lives in `read-arrival-quote.ts` instead.
 */
export function quoteArrivalWindow({
  fulfilment,
  activeOrdersAhead,
  distanceKm = null,
}: {
  fulfilment: "delivery" | "pickup";
  /** How many orders the kitchen is already working through. */
  activeOrdersAhead: number;
  /**
   * Distance to the delivery address, when it is known. Checkout has
   * geocoded it already (it drives the delivery fee); the cart rail on
   * `/menu` has not, and passing `null` falls back to the engine's default
   * transit time rather than blocking the estimate.
   */
  distanceKm?: number | null;
}): string {
  const prep = calculateKitchenPrepMinutes(activeOrdersAhead);
  const transit = calculateTransitMinutes(
    distanceKm,
    fulfilment === "pickup" ? "take_out" : "delivery",
  );

  const { lower, upper } = arrivalWindowBounds(prep + transit);
  // "min" rather than the engine's "mins" — these sit inside sentences the
  // checkout frames already word that way ("Estimated arrival 35–45 min").
  return `${lower}–${upper} min`;
}
