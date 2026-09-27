"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";
import { CancelReasonModal } from "@/components/manage/orders/cancel-reason-modal";
import { PickupModal } from "@/components/manage/kds/pickup-modal";
import type { OrderData } from "@/types/staff-order";
import { getDetailedOrders, updateOrderStatus, getPaymentIssuesForKds, type PaymentIssueOrder } from "@/lib/actions/orders";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import { actionCopy, dbStatusFor, type StaffAction } from "@/lib/orders/staff-actions";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type KdsTab = "active" | "payment_issues" | "for_pickup" | "failed_pickup" | "cancelled";

const TAB_LABELS: Record<KdsTab, string> = {
  active: "Active",
  payment_issues: "Payment Pending/Issues",
  for_pickup: "For Pick-up",
  failed_pickup: "Failed Pick-up",
  cancelled: "Cancelled (Today)"
};

export default function KdsPage() {
  return (
    <ToastProvider>
      <KdsInner />
    </ToastProvider>
  );
}

function KdsInner() {
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<KdsTab>("active");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [issues, setIssues] = useState<PaymentIssueOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelOrder, setCancelOrder] = useState<OrderData | null>(null);
  const [pickupOrder, setPickupOrder] = useState<OrderData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);

    if (activeTab === "active" || activeTab === "for_pickup" || activeTab === "cancelled") {
      let statusFilter: string[] = [];
      if (activeTab === "active") statusFilter = ["pending", "preparing"];
      else if (activeTab === "for_pickup") statusFilter = ["ready"];
      else if (activeTab === "cancelled") statusFilter = ["cancelled"];

      const result = await getDetailedOrders({
        status: statusFilter as any,
        limit: 100,
        offset: 0,
      });

      if (result.error !== null) {
        showToast(`Failed to load orders: ${result.error}`, "error");
      } else {
        const rows = (result.data.data ?? []) as unknown as StaffOrderRow[];
        let mapped = rows.map(mapStaffOrder);
        
        // For Pick-up only shows take_out
        if (activeTab === "for_pickup") {
          mapped = mapped.filter(o => o.orderInfo.type === "take_out");
        }
        
        setOrders(mapped);
      }
    } else {
      // Payment Issues or Failed Pick-up
      const result = await getPaymentIssuesForKds();
      if (result.error) {
        showToast(`Failed to load issues: ${result.error}`, "error");
      } else {
        setIssues(result.data || []);
      }
    }

    setIsLoading(false);
  }, [activeTab, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAction = async (type: StaffAction, order: OrderData) => {
    if (type === "Cancel") {
      setCancelOrder(order);
      return;
    }

    setIsProcessing(true);
    const newDbStatus = dbStatusFor(type);

    const result = await updateOrderStatus(order.id, newDbStatus);

    if (result.error) {
      showToast(`Failed: ${result.error}`, "error");
    } else {
      showToast(actionCopy(type, order.orderNumber).done, "success");
      await fetchOrders();
    }
    setIsProcessing(false);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelOrder) return;
    setIsProcessing(true);
    
    const result = await updateOrderStatus(
      cancelOrder.id,
      "cancelled",
      reason
    );

    if (result.error) {
      showToast(`Failed: ${result.error}`, "error");
    } else {
      showToast(actionCopy("Cancel", cancelOrder.orderNumber).done, "success");
      await fetchOrders();
      setCancelOrder(null);
    }
    setIsProcessing(false);
  };

  const handlePickupConfirm = async () => {
    if (!pickupOrder) return;
    setIsProcessing(true);
    const result = await updateOrderStatus(pickupOrder.id, "completed");
    if (result.error) {
      showToast(`Failed: ${result.error}`, "error");
    } else {
      showToast(actionCopy("Complete", pickupOrder.orderNumber).done, "success");
      await fetchOrders();
      setPickupOrder(null);
    }
    setIsProcessing(false);
  };

  const inQueue = activeTab === "active" ? orders.filter((o) => o.status === "QUEUE").length : 0;
  const inPrep = activeTab === "active" ? orders.filter((o) => o.status === "PREP").length : 0;

  // Determine what to render based on tab
  let displayOrders: any[] = [];
  if (activeTab === "payment_issues") {
    displayOrders = issues.filter(i => i.type === "payment_failed").map(i => mapStaffOrder(i.order as any));
  } else if (activeTab === "failed_pickup") {
    displayOrders = issues.filter(i => i.type === "pickup_overdue").map(i => mapStaffOrder(i.order as any));
  } else {
    displayOrders = orders;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#efe6d8]">
      {/* Header */}
      <div className="bg-[#b8352a] border-[#2e2523] border-b flex flex-wrap md:flex-nowrap gap-3 md:gap-[20px] items-center px-4 md:px-[24px] py-[12px] md:py-[18px] shrink-0 w-full z-10 shadow-sm">
        <Link
          href="/manage/orders"
          className="text-[#fbf6ec] hover:opacity-80 transition-opacity flex items-center justify-center"
          title="Back to Orders"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>

        <div className="flex flex-col items-start ml-2 flex-1 md:flex-none">
          <div className="font-display text-[18px] md:text-[22px] tracking-[0.44px] whitespace-nowrap leading-none">
            <span className="text-[#f0b27a]">KITCHEN</span>
            <span>{` `}</span>
            <span className="text-[#fbf6ec]">DISPLAY</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {(Object.keys(TAB_LABELS) as KdsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
                activeTab === tab ? "bg-[#fbf6ec] text-[#b8352a]" : "text-[#fbf6ec] hover:bg-white/20"
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

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
                </div>
                <div className="p-[12px] flex flex-col gap-3 flex-1 justify-center items-center">
                  <div className="w-8 h-8 rounded-full border-2 border-[#b8352a] border-t-transparent animate-spin" />
                </div>
              </div>
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500 font-bold uppercase tracking-widest">
              No orders in this view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px] items-start content-start">
            {displayOrders.map((order) => {
              
              // Pay in store badge
              const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(order.paymentMethod || "");
              
              // Handle clicking cards for pickup
              const handleCardClick = () => {
                if (activeTab === "for_pickup" || activeTab === "failed_pickup") {
                  setPickupOrder(order);
                }
              };
              
              return (
                <div key={order.id} onClick={handleCardClick} className={(activeTab === "for_pickup" || activeTab === "failed_pickup") ? "cursor-pointer" : ""}>
                  <KdsOrderCard 
                    order={order} 
                    onAction={handleAction}
                    timerTimestamp={
                      (activeTab === "for_pickup" || activeTab === "failed_pickup") ? order.rawReadyAt : order.rawCreatedAt
                    }
                    amberMins={activeTab === "active" ? 15 : 999}
                    redMins={activeTab === "active" ? 25 : 90}
                    hideTimer={activeTab === "payment_issues" || activeTab === "cancelled"}
                    fixedBadge={
                      activeTab === "payment_issues" 
                        ? { text: "Payment Issue", bgClass: "bg-red-200", textClass: "text-red-900" } 
                        : (activeTab === "for_pickup" || activeTab === "failed_pickup") && isCash
                        ? { text: "Pay In-store", bgClass: "bg-blue-100", textClass: "text-blue-700" }
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CancelReasonModal 
        isOpen={cancelOrder !== null}
        order={cancelOrder}
        isProcessing={isProcessing}
        onClose={() => setCancelOrder(null)}
        onConfirm={handleCancelConfirm}
      />
      
      <PickupModal 
        isOpen={pickupOrder !== null}
        order={pickupOrder}
        isProcessing={isProcessing}
        onClose={() => setPickupOrder(null)}
        onConfirm={handlePickupConfirm}
      />
    </div>
  );
}
