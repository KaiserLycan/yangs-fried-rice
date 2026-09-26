"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  calculateOrderEta,
  type Coordinates,
  type EtaResult,
} from "@/lib/eta/engine";
import { validateNcrAddress } from "@/lib/address/validate-ncr";
import { countActiveKitchenOrders } from "@/lib/orders/kitchen-queue";

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
    .select("order_id, customer_id, order_status, order_type, created_at, delivery_address")
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

  // 3. Resolve customer coordinates (only legacy delivery orders carry an
  // address; a pickup order has none and this stays null)
  let customerCoordinates: Coordinates | null = customCoords ?? null;

  if (!customerCoordinates && order.delivery_address) {
    const geocoded = await validateNcrAddress(order.delivery_address);
    if (geocoded.latitude && geocoded.longitude) {
      customerCoordinates = {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      };
    }
  }

  // 4. Count active orders ahead in kitchen queue
  const activeOrdersAhead = await countActiveKitchenOrders(
    supabase,
    order.created_at || new Date().toISOString(),
  );

  // 5. Calculate ETA breakdown
  const etaResult = calculateOrderEta({
    orderId: order.order_id,
    orderType: (order.order_type as "delivery" | "take_out" | "dine_in") || "delivery",
    activeOrdersAhead,
    customerCoordinates,
    orderStatus: order.order_status || undefined,
  });

  return {
    success: true,
    data: etaResult,
  };
}
