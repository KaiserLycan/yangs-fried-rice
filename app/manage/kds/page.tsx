"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownWideNarrow, ArrowUpNarrowWide, Bell, BellOff, LayoutGrid, List } from "lucide-react";
import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";
import { CancelReasonModal } from "@/components/manage/orders/cancel-reason-modal";
import { PickupModal } from "@/components/manage/kds/pickup-modal";
import type { OrderData } from "@/types/staff-order";
import { getDetailedOrders, updateOrderStatus, getPaymentIssuesForKds, type PaymentIssueOrder } from "@/lib/actions/orders";
import { mapStaffOrder, type StaffOrderRow } from "@/lib/orders/map-staff-order";
import { actionCopy, dbStatusFor, type StaffAction } from "@/lib/orders/staff-actions";
import { useKdsSound } from "@/hooks/use-kds-sound";
import { useKitchenOrderFeed } from "@/hooks/use-kitchen-order-feed";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type KdsTab = "active" | "payment_issues" | "for_pickup" | "failed_pickup" | "cancelled";
type SortOrder = "oldest" | "newest";
type ViewMode = "grid" | "list";

const TAB_LABELS: Record<KdsTab, string> = {
  active: "Active",
  payment_issues: "Payment Pending/Issues",
  for_pickup: "For Pick-up",
  failed_pickup: "Failed Pick-up",
  cancelled: "Cancelled (Today)"
};

const CASH_METHODS = ["pay_in_store", "pay-in-store", "cash"];

/** Per-browser preferences. Storage can be missing or blocked; that only loses the preference. */
function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Not worth telling the cook about.
  }
}

function startOfToday(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

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

  // Oldest first by default: the order that has waited longest is the next
  // one to cook.
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  useEffect(() => {
    setSortOrder(readPref("kds-sort", ["oldest", "newest"] as const, "oldest"));
    setViewMode(readPref("kds-view", ["grid", "list"] as const, "grid"));
  }, []);

  const { soundEnabled, enableSound, disableSound, playChime } = useKdsSound();

  // Show the skeleton only when the view changes, not on every refresh.
  const hasLoadedTab = useRef<KdsTab | null>(null);

  const fetchOrders = useCallback(async () => {
    const silent = hasLoadedTab.current === activeTab;
    if (!silent) setIsLoading(true);

    if (activeTab === "active" || activeTab === "for_pickup" || activeTab === "cancelled") {
      const result = await getDetailedOrders(
        activeTab === "active"
          ? { status: ["pending", "preparing"], limit: 100, offset: 0 }
          : activeTab === "for_pickup"
          ? // Everything waiting at the counter, marked ready within the last
            // FAILED_PICKUP_MINUTES. Older ones are on Failed Pick-up; they
            // used to sort to the top here and bury the orders just made.
            {
              status: ["ready"],
              ready_from: new Date(Date.now() - FAILED_PICKUP_MINUTES * 60000).toISOString(),
              limit: 100,
              offset: 0,
            }
          : { status: ["cancelled"], cancelled_from: startOfToday(), limit: 100, offset: 0 },
      );

      if (result.error !== null) {
        if (!silent) showToast(`Failed to load orders: ${result.error}`, "error");
      } else {
        const rows = (result.data.data ?? []) as unknown as StaffOrderRow[];
        setOrders(rows.map(mapStaffOrder));
      }
    } else {
      // Payment Issues or Failed Pick-up
      const result = await getPaymentIssuesForKds();
      if (result.error) {
        if (!silent) showToast(`Failed to load issues: ${result.error}`, "error");
      } else {
        setIssues(result.data || []);
      }
    }

    hasLoadedTab.current = activeTab;
    setIsLoading(false);
  }, [activeTab, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime is the fast path; this poll is the safety net for a dropped
  // connection and for the pick-up clocks that change with time alone.
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Chime when an order reaches the kitchen, whichever tab is open.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { markSeen } = useKitchenOrderFeed({
    onNewOrder: () => playChime(),
    onAnyChange: () => {
      // A burst of updates (a whole order moving through) → one refresh.
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(fetchOrders, 400);
    },
  });
  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);
  // Orders already queued when the board opened are not "new".
  useEffect(() => {
    if (activeTab === "active") markSeen(orders.filter((o) => o.status === "QUEUE").map((o) => o.id));
  }, [activeTab, orders, markSeen]);

  const handleToggleSound = async () => {
    if (soundEnabled) {
      disableSound();
      return;
    }
    const ok = await enableSound();
    if (!ok) showToast("This browser wouldn't play sound. Check it isn't muted for this site.", "error");
  };

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

  const isPickupTab = activeTab === "for_pickup" || activeTab === "failed_pickup";

  const displayOrders = useMemo(() => {
    let list: OrderData[];
    if (activeTab === "payment_issues") {
      list = issues.filter((i) => i.type === "payment_failed").map((i) => mapStaffOrder(i.order as unknown as StaffOrderRow));
    } else if (activeTab === "failed_pickup") {
      list = issues.filter((i) => i.type === "pickup_overdue").map((i) => mapStaffOrder(i.order as unknown as StaffOrderRow));
    } else {
      list = orders;
    }

    // Pick-up tabs sort by how long the food has been waiting; the rest by
    // how long the customer has.
    const timeOf = (o: OrderData) => {
      const raw = isPickupTab ? o.rawReadyAt ?? o.rawCreatedAt : o.rawCreatedAt;
      return raw ? new Date(raw).getTime() : 0;
    };
    const direction = sortOrder === "oldest" ? 1 : -1;
    return [...list].sort((a, b) => (timeOf(a) - timeOf(b)) * direction);
  }, [activeTab, issues, orders, sortOrder, isPickupTab]);

  const inQueue = activeTab === "active" ? orders.filter((o) => o.status === "QUEUE").length : 0;
  const inPrep = activeTab === "active" ? orders.filter((o) => o.status === "PREP").length : 0;

  const layoutClass =
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px] items-start content-start"
      : "flex flex-col gap-[10px]";

  const toggleBase =
    "flex items-center gap-1.5 px-3 h-9 text-xs font-bold uppercase tracking-wider transition-colors";
  const toggleOn = "bg-[#b8352a] text-[#fbf6ec]";
  const toggleOff = "bg-[#fbf6ec] text-[#5c4d44] hover:bg-white";

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
        <div className="order-last md:order-none w-full md:w-auto flex-1 flex items-center md:justify-center gap-2 overflow-x-auto scrollbar-hide py-1">
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

      {/* Toolbar: sort, view, sound */}
      <div className="flex flex-wrap items-center gap-2 px-[10px] pt-[10px] shrink-0">
        <div className="flex rounded-lg overflow-hidden border border-[#ddcdb8]" role="group" aria-label="Sort orders">
          <button
            onClick={() => { setSortOrder("oldest"); writePref("kds-sort", "oldest"); }}
            aria-pressed={sortOrder === "oldest"}
            className={cn(toggleBase, sortOrder === "oldest" ? toggleOn : toggleOff)}
          >
            <ArrowUpNarrowWide className="h-4 w-4" aria-hidden /> Oldest
          </button>
          <button
            onClick={() => { setSortOrder("newest"); writePref("kds-sort", "newest"); }}
            aria-pressed={sortOrder === "newest"}
            className={cn(toggleBase, "border-l border-[#ddcdb8]", sortOrder === "newest" ? toggleOn : toggleOff)}
          >
            <ArrowDownWideNarrow className="h-4 w-4" aria-hidden /> Newest
          </button>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-[#ddcdb8]" role="group" aria-label="Layout">
          <button
            onClick={() => { setViewMode("grid"); writePref("kds-view", "grid"); }}
            aria-pressed={viewMode === "grid"}
            className={cn(toggleBase, viewMode === "grid" ? toggleOn : toggleOff)}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden /> Grid
          </button>
          <button
            onClick={() => { setViewMode("list"); writePref("kds-view", "list"); }}
            aria-pressed={viewMode === "list"}
            className={cn(toggleBase, "border-l border-[#ddcdb8]", viewMode === "list" ? toggleOn : toggleOff)}
          >
            <List className="h-4 w-4" aria-hidden /> List
          </button>
        </div>

        <button
          onClick={handleToggleSound}
          aria-pressed={soundEnabled}
          className={cn(
            toggleBase,
            "ml-auto rounded-lg border",
            soundEnabled
              ? "bg-[#4c9a5e] text-white border-[#3d7d4c]"
              : "bg-[#fbf6ec] text-[#b8352a] border-[#b8352a] animate-pulse",
          )}
        >
          {soundEnabled ? <Bell className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
          {soundEnabled ? "Sound on" : "Enable sound"}
        </button>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-y-auto p-[10px] w-full">
        {isLoading ? (
          <div className={layoutClass}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-[#fbf6ec] border border-[#3a2e2c] flex flex-col overflow-hidden rounded-[14px] w-full shadow-sm",
                  viewMode === "grid" ? "min-h-[320px]" : "min-h-[120px]",
                )}
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
          <div className={layoutClass}>
            {displayOrders.map((order) => {
              const isCash = CASH_METHODS.includes(order.paymentMethod || "");

              // Handle clicking cards for pickup
              const handleCardClick = () => {
                if (isPickupTab) setPickupOrder(order);
              };

              return (
                <div key={order.id} onClick={handleCardClick} className={isPickupTab ? "cursor-pointer" : ""}>
                  <KdsOrderCard
                    order={order}
                    onAction={handleAction}
                    layout={viewMode}
                    timerTimestamp={isPickupTab ? order.rawReadyAt ?? order.rawCreatedAt : order.rawCreatedAt}
                    // Active: 15 / 25 min since ordered. Payment: how long the
                    // customer has been stuck. Pick-up: red once it is overdue.
                    amberMins={
                      activeTab === "active" ? 15
                        : activeTab === "payment_issues" ? STUCK_PAYMENT_MINUTES
                        : 999
                    }
                    redMins={
                      activeTab === "active" ? 25
                        : activeTab === "payment_issues" ? STUCK_PAYMENT_MINUTES * 3
                        : FAILED_PICKUP_MINUTES
                    }
                    hideTimer={activeTab === "cancelled"}
                    fixedBadge={
                      activeTab === "payment_issues"
                        ? order.dbStatus === "payment_failed"
                          ? { text: "Payment failed", bgClass: "bg-red-200", textClass: "text-red-900" }
                          : { text: "Awaiting payment", bgClass: "bg-amber-100", textClass: "text-amber-900" }
                        : isPickupTab && isCash
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
