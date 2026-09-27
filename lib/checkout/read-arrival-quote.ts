import { createClient } from "@/lib/supabase/server";
import { countActiveKitchenOrders } from "@/lib/orders/kitchen-queue";
import { quoteArrivalWindow } from "@/lib/checkout/arrival-estimate";
import { readStoreStatus } from "@/lib/store/read-store-status";

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
  const [activeOrdersAhead, store] = await Promise.all([
    countActiveKitchenOrders(createClient()).catch(() => 0),
    // Never throws; falls back to no extra time.
    readStoreStatus(),
  ]);

  return quoteArrivalWindow({
    fulfilment,
    activeOrdersAhead,
    distanceKm,
    extraPrepMinutes: store.extraPrepMinutes,
  });
}
