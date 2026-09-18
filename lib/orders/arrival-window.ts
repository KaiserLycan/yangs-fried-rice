import type { GetOrderEtaResult } from "@/lib/actions/eta";

export const ARRIVAL_UNKNOWN = "Arrival time to be confirmed";

/**
 * The arrival window the tracking header shows, taken from the backend's ETA
 * engine (`lib/eta/engine.ts`) rather than from `delivery.estimated_time` —
 * that column is a timestamp the engine writes as a side effect, and the
 * design shows a range ("35–45 min"), which only the engine's
 * `arrivalWindow` carries.
 *
 * Null means "nothing to show": the call failed, or the engine answered
 * "None", which it does for a cancelled or completed order. The screen
 * decides what to say in that case, not this module.
 */
export function arrivalWindowFrom(result: GetOrderEtaResult): string | null {
  if (!result.success || !result.data) return null;
  const window = result.data.arrivalWindow;
  if (!window || window === "None") return null;
  return window;
}

/**
 * The engine's window for a delivery is a bare range ("25–35 mins"); for a
 * pickup it is already a sentence ("Ready in 20–30 mins", "Ready for
 * pickup"). Prefixing "Arriving" to the second kind reads wrong, so only the
 * bare range gets it.
 */
export function arrivalLineFor(window: string | null): string {
  if (!window) return ARRIVAL_UNKNOWN;
  if (/^ready\b/i.test(window)) return window;
  return `Arriving ${window}`;
}
