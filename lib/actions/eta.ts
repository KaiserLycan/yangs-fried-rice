"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  calculateOrderEta,
  type Coordinates,
  type EtaResult,
} from "@/lib/eta/engine";
import { countActiveKitchenOrders } from "@/lib/orders/kitchen-queue";
import { readStoreStatus } from "@/lib/store/read-store-status";

export interface GetOrderEtaResult {
  success: boolean;
  error?: string;
  data?: EtaResult;
}

/**
 * Calculates real-time ETA for an order from the active kitchen queue and the
 * order type. Pickup-only (issue #114): there is no delivery leg, and nothing
 * is written back — the old `delivery.estimated_time` column went with the
 * table.
 *
 * Security: Enforces that customers can only view ETA for their own orders.
 * Returns "Order not found." for unauthorized queries to prevent IDOR scanning.
 */
export async function getOrderEtaAction(
  orderId: string,
  customCoords?: Coordinates | null
): Promise<GetOrderEtaResult> {
  const supabase = createClient();

  // 1. Fetch order details
  const { data: order, error: orderError } = await supabase
    .from("order")
    .select("order_id, customer_id, order_status, order_type, created_at")
    .eq("order_id", orderId)
    .single();

  if (orderError || !order) {
    return {
      success: false,
      error: "Order not found.",
    };
  }

  // 2. Enforce order ownership
  let isAuthorized = false;

  // Check if caller has an active employee session (Manager, Staff)
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const employee = await decrypt(token);
      if (employee) {
        isAuthorized = true;
      }
    }
  } catch {
    // Ignore in non-request contexts
  }

  if (!isAuthorized) {
    const { data: authData } = (await supabase.auth?.getUser?.()) ?? {
      data: { user: null },
    };
    const user = authData?.user;

    // Customer must be signed in and be the owner of the order
    if (!user || (order.customer_id && order.customer_id !== user.id)) {
      return {
        success: false,
        error: "Order not found.",
      };
    }
  }

  // 3. Customer coordinates. Pickup-only: nothing geocodes an address any
  // more (map removed in #116), so only a caller-supplied value is used.
  const customerCoordinates: Coordinates | null = customCoords ?? null;

  // 4. Count active orders ahead in kitchen queue, and read the manager's
  // extra prep buffer (issue #115) so tracking quotes what checkout did.
  const [activeOrdersAhead, store] = await Promise.all([
    countActiveKitchenOrders(supabase, order.created_at || new Date().toISOString()),
    readStoreStatus(),
  ]);

  // 5. Calculate ETA breakdown
  const etaResult = calculateOrderEta({
    orderId: order.order_id,
    orderType: (order.order_type as "delivery" | "take_out" | "dine_in") || "delivery",
    activeOrdersAhead,
    customerCoordinates,
    orderStatus: order.order_status || undefined,
    extraPrepMinutes: store.extraPrepMinutes,
  });

  return {
    success: true,
    data: etaResult,
  };
}
