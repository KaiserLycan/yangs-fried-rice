import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uniqueChannelName } from "@/lib/supabase/channel-name";

type OrderRow = { order_id?: string; order_status?: string | null };

/**
 * Live order changes for the KDS.
 *
 * `onNewOrder` fires once per order, the first time it is seen as `pending`:
 * a pay-in-store order the moment it is placed, an online one the moment its
 * payment lands (awaiting_payment → pending). `onAnyChange` fires for every
 * insert or update so the board can refresh without waiting for its poll.
 *
 * What arrives is limited by RLS on `order` — staff can read every order.
 */
export function useKitchenOrderFeed({
  onNewOrder,
  onAnyChange,
}: {
  onNewOrder: (orderId: string) => void;
  onAnyChange: () => void;
}) {
  // Latest callbacks without resubscribing every render.
  const newOrderRef = useRef(onNewOrder);
  const anyChangeRef = useRef(onAnyChange);
  newOrderRef.current = onNewOrder;
  anyChangeRef.current = onAnyChange;

  const announced = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const handle = (payload: { new: OrderRow }) => {
      const row = payload.new;
      if (row?.order_id && row.order_status === "pending" && !announced.current.has(row.order_id)) {
        announced.current.add(row.order_id);
        newOrderRef.current(row.order_id);
      }
      anyChangeRef.current();
    };

    const channel = supabase
      .channel(uniqueChannelName("kds-orders"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order" }, handle)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "order" }, handle)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  /** Orders already on the board when it loaded should not ring later. */
  const markSeen = useCallback((orderIds: string[]) => {
    for (const id of orderIds) announced.current.add(id);
  }, []);

  return { markSeen };
}
