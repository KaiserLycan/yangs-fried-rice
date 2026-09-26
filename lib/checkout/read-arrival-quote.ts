import { createClient } from "@/lib/supabase/server";
import { countActiveKitchenOrders } from "@/lib/orders/kitchen-queue";
import { quoteArrivalWindow } from "@/lib/checkout/arrival-estimate";

/**
 * The arrival window to quote for an order that has not been placed yet.
 *
 * Server-side: it counts the live kitchen queue. Separate from
 * `arrival-estimate.ts` so the pure calculation can be imported by the
 * client components that print it.
 *
 * Best effort by design. If the count cannot be read, the quote is still
 * produced from an empty queue rather than the screen losing its estimate —
 * the same reasoning `/checkout` already applies to a geocoder it cannot
 * reach.
 */
export async function readArrivalQuote({
  fulfilment,
  distanceKm = null,
}: {
  fulfilment: "delivery" | "pickup";
  distanceKm?: number | null;
}): Promise<string> {
  let activeOrdersAhead = 0;
  try {
    activeOrdersAhead = await countActiveKitchenOrders(createClient());
  } catch {
    activeOrdersAhead = 0;
  }

  return quoteArrivalWindow({ fulfilment, activeOrdersAhead, distanceKm });
}
