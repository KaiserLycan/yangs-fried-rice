"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";
import { OrderData } from "@/lib/mock-orders";
import { getDetailedOrders, updateOrderStatus } from "@/lib/actions/orders";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import { actionCopy, dbStatusFor, type StaffAction } from "@/lib/orders/staff-actions";
import { useToast, ToastProvider } from "@/components/ui/toast";

export default function KdsPage() {
  return (
    <ToastProvider>
      <KdsInner />
    </ToastProvider>
  );
}

function KdsInner() {
  const showToast = useToast();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);

    // KDS shows orders that are in queue (pending/received) or being prepared
    const result = await getDetailedOrders({
      status: ["pending", "received", "preparing"] as any,
      limit: 50,
      offset: 0,
    });

    if (result.error) {
      showToast(`Failed to load orders: ${result.error}`, "error");
    }

    if (result.data) {
      const { data: detailedOrders } = result.data;

      const mappedOrders: OrderData[] = detailedOrders
        .filter((res) => res !== null)
        .map((order) => mapStaffOrder(order as unknown as StaffOrderRow));

      // Priority: 1. PREP, 2. QUEUE. Then First-Come First-Serve
      mappedOrders.sort((a: any, b: any) => {
        const priority: Record<string, number> = {
          "PREP": 1,
          "QUEUE": 2,
        };
        const pA = priority[a.status] || 99;
        const pB = priority[b.status] || 99;
        
        if (pA !== pB) return pA - pB;
        
        const timeA = new Date(a.rawCreatedAt || 0).getTime();
        const timeB = new Date(b.rawCreatedAt || 0).getTime();
        return timeA - timeB; // Oldest first
      });

      setOrders(mappedOrders);
    }
    setIsLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAction = async (type: StaffAction, order: OrderData) => {
    const newDbStatus = dbStatusFor(type);

    const result = await updateOrderStatus(order.id, newDbStatus);

    if (result.error) {
      showToast(`Failed: ${result.error}`, "error");
    } else {
      showToast(actionCopy(type, order.orderNumber).done, "success");
      await fetchOrders();
    }
  };

  const inQueue = orders.filter((o) => o.status === "QUEUE").length;
  const inPrep = orders.filter((o) => o.status === "PREP").length;

  return (
    <div className="flex flex-col h-full w-full bg-[#efe6d8]">
      {/* Header */}
      <div className="bg-[#b8352a] border-[#2e2523] border-b flex flex-wrap md:flex-nowrap gap-3 md:gap-[20px] items-center px-4 md:px-[24px] py-[12px] md:py-[18px] shrink-0 w-full z-10 shadow-sm">
        {/* Back Button */}
        <Link
          href="/manage/orders"
          className="text-[#fbf6ec] hover:opacity-80 transition-opacity flex items-center justify-center"
          title="Back to Orders"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>

        {/* Title */}
        <div className="flex flex-col items-start ml-2 flex-1 md:flex-none">
          <div className="font-display text-[18px] md:text-[22px] tracking-[0.44px] whitespace-nowrap leading-none">
            <span className="text-[#f0b27a]">KITCHEN</span>
            <span>{` `}</span>
            <span className="text-[#fbf6ec]">DISPLAY</span>
          </div>
        </div>

        <div className="flex-1 hidden md:block" />

        {/* Stats */}
        <div className="flex flex-col items-end text-right justify-center ml-auto md:ml-0">
          <p className="font-bold text-[#fbf6ec] text-[9px] md:text-[10px] tracking-[1.4px] leading-none mb-1">
            IN QUEUE
          </p>
          <p className="font-display text-[#f0b27a] text-[18px] md:text-[22px] leading-none">
            {inQueue}
          </p>
        </div>

        <div className="flex flex-col items-end text-right justify-center ml-4 md:ml-2">
          <p className="font-bold text-[#fbf6ec] text-[9px] md:text-[10px] tracking-[1.4px] leading-none mb-1">
            PREPARING
          </p>
          <p className="font-display text-[#f0b27a] text-[18px] md:text-[22px] leading-none">
            {inPrep}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-[10px] w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px] items-start content-start">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#fbf6ec] border border-[#3a2e2c] flex flex-col overflow-hidden rounded-[14px] w-full min-h-[320px] shadow-sm"
              >
                <div className="bg-[#efe6d8] p-[12px] flex justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-16 bg-[#e3d6c3] rounded-full animate-pulse" />
                    <div className="h-3 w-12 bg-[#e3d6c3] rounded-full animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-3 w-10 bg-[#e3d6c3] rounded-full animate-pulse" />
                    <div className="h-5 w-12 bg-[#e3d6c3] rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 p-[13px] flex flex-col gap-3">
                  <div className="h-4 w-3/4 bg-[#efe6d8] rounded-full animate-pulse" />
                  <div className="h-4 w-1/2 bg-[#efe6d8] rounded-full animate-pulse" />
                </div>
                <div className="flex w-full h-[44px]">
                  <div className="flex-1 bg-[#efe6d8] border-r border-[#e3d6c3] animate-pulse" />
                  <div className="flex-1 bg-[#efe6d8] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[15px] text-[#7a6a60]">
            No active orders in the kitchen.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px] items-start content-start">
            {orders.map((order) => (
              <KdsOrderCard
                key={order.id}
                order={order}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
