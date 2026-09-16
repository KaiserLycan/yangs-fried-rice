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

export interface GetOrderEtaResult {
  success: boolean;
  error?: string;
  data?: EtaResult;
}

/**
 * Calculates real-time ETA for an order factoring in active kitchen queue traffic,
 * order type, and delivery distance from the store.
 * Also persists arrival window to `delivery.estimated_time` for Supabase Realtime clients.
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

  // Check if caller has an active employee session (Manager, Staff, Rider)
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

  // 2. Fetch associated delivery record if available
  const { data: delivery } = await supabase
    .from("delivery")
    .select("delivery_id, delivery_status, estimated_time")
    .eq("order_id", orderId)
    .maybeSingle();

  // 3. Resolve customer coordinates
  let customerCoordinates: Coordinates | null = customCoords ?? null;

  if (!customerCoordinates && order.customer_id) {
    const { data: addressRow } = await supabase
      .from("customer_address")
      .select("address_details")
      .eq("customer_id", order.customer_id)
      .limit(1)
      .maybeSingle();

    if (addressRow?.address_details) {
      const geocoded = await validateNcrAddress(addressRow.address_details);
      if (geocoded.latitude && geocoded.longitude) {
        customerCoordinates = {
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        };
      }
    }
  }

  // 4. Count active orders ahead in kitchen queue
  const { count: queueCount } = await supabase
    .from("order")
    .select("order_id", { count: "exact", head: true })
    .in("order_status", ["pending", "received", "confirmed", "preparing"])
    .lt("created_at", order.created_at || new Date().toISOString());

  const activeOrdersAhead = queueCount ?? 0;

  // 5. Calculate ETA breakdown
  const etaResult = calculateOrderEta({
    orderId: order.order_id,
    orderType: (order.order_type as "delivery" | "take_out" | "dine_in") || "delivery",
    activeOrdersAhead,
    customerCoordinates,
    orderStatus: order.order_status || undefined,
    deliveryStatus: delivery?.delivery_status || undefined,
  });

  // 6. Update delivery.estimated_time (timestamptz column) if delivery record exists
  const timestampToSave =
    etaResult.arrivalWindow === "None" ? null : etaResult.estimatedArrivalTimestamp;

  if (delivery && delivery.estimated_time !== timestampToSave) {
    await supabase
      .from("delivery")
      .update({ estimated_time: timestampToSave })
      .eq("order_id", orderId);
  }

  return {
    success: true,
    data: etaResult,
  };
}
