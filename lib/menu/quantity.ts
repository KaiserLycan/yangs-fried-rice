/**
 * The bound the stepper needs and the frame doesn't draw. "There is no drawn
 * upper bound; pick one and say so in the code" — ticket 03's own words. 20
 * is a customer's whole plausible order for one dish before "call the
 * branch" becomes the more sensible path; it isn't derived from anything
 * else in the system.
 */
export const MAX_QUANTITY = 20;
export const MIN_QUANTITY = 1;

/**
 * Keeps the stepper inside [MIN_QUANTITY, MAX_QUANTITY] no matter which
 * direction it was pushed from — the − button and the + button both go
 * through this rather than each clamping only the edge they can reach.
 */
export function clampQuantity(value: number): number {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value));
}
