"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { OrderData } from "@/types/staff-order";
import { useKdsTimer } from "@/hooks/use-kds-timer";
import { primaryActionFor, canCancel, type StaffAction } from "@/lib/orders/staff-actions";
import { FulfillmentBadge } from "@/components/manage/orders/fulfillment-badge";
import { cn } from "@/lib/utils";

interface KdsOrderCardProps {
  order: OrderData;
  onAction?: (type: StaffAction, order: OrderData) => void;
  // Overrides for tabs that track different timestamps (e.g. pickup ready_at)
  timerTimestamp?: string | null;
  amberMins?: number;
  redMins?: number;
  // Visual overrides
  hideTimer?: boolean;
  fixedBadge?: { text: string; bgClass: string; textClass: string };
  /** "grid": a tall ticket. "list": one wide row per order. */
  layout?: "grid" | "list";
}

export function KdsOrderCard({
  order,
  onAction,
  timerTimestamp,
  amberMins = 15,
  redMins = 25,
  hideTimer = false,
  fixedBadge,
  layout = "grid",
}: KdsOrderCardProps) {
  const { timerString, color: timerColor } = useKdsTimer(timerTimestamp ?? order.rawCreatedAt, amberMins, redMins);
  const isConfirmed = order.status === "PREP";
  const isActive = order.status === "QUEUE" || order.status === "PREP";
  const [isProcessing, setIsProcessing] = useState(false);
  const isList = layout === "list";

  const primary = primaryActionFor(order);

  const handleAction = async (type: StaffAction) => {
    if (!onAction || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAction(type, order);
    } finally {
      setIsProcessing(false);
    }
  };

  // Amber past `amberMins`, red past `redMins`, for anything the kitchen
  // still has to cook — a queued order waiting that long matters as much as
  // one being cooked.
  const headerBg =
    order.status === "CANCELED"
      ? "bg-[#797167]"
      : isActive && timerColor === "red"
      ? "bg-red-700 animate-pulse"
      : isActive && timerColor === "amber"
      ? "bg-amber-600"
      : isConfirmed
      ? "bg-[#ca762d]"
      : "bg-[#c0392b]";

  return (
    <div
      className={cn(
        "bg-[#fbf6ec] border border-field-border flex overflow-hidden rounded-[14px] w-full h-full shadow-sm",
        isList ? "flex-col md:flex-row md:min-h-[120px]" : "flex-col min-h-[320px]",
      )}
    >

      {/* Header Area */}
      <div className={cn("flex flex-col p-[12px] shrink-0", isList ? "w-full md:w-[200px]" : "w-full", headerBg)}>

        {/* Order Number & Time */}
        <div className={cn("flex justify-between items-start", isList && "md:flex-col md:gap-3")}>
          <div className="flex flex-col items-start gap-1">
            {/* The same eight characters the customer and the rider see
                since issue #106 — this used to be the id's *first* four
                while the customer was shown its *last* four. */}
            <span className="font-display text-[#fbf6ec] text-[22px] leading-none mb-1">
              #{order.orderNumber}
            </span>
            <span className="font-bold text-[#fbf6ec] text-[11px] tracking-[0.88px] uppercase">
              {order.time}
            </span>
          </div>

          {/* Status & Prep Time */}
          <div className={cn("flex flex-col text-right items-end gap-1", isList && "md:items-start md:text-left")}>
            <span className="font-bold text-[#fbf6ec] text-[11px] tracking-[0.88px] uppercase mb-1">
              {order.status}
            </span>
            {!hideTimer && (
              <span className="font-display text-[#fbf6ec] text-[22px] leading-none">
                {order.status === "CANCELED" ? "-" : timerString}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={cn("flex flex-col flex-1 min-h-0 min-w-0", isList && "md:flex-row")}>
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          {/* Who collects it, and how it's paid */}
          <div className="flex flex-wrap gap-1.5 px-[13px] pt-[10px]">
            <FulfillmentBadge method={order.fulfillmentMethod} />
            {fixedBadge && (
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  fixedBadge.bgClass,
                  fixedBadge.textClass,
                )}
              >
                {fixedBadge.text}
              </span>
            )}
          </div>

          {/* Order Items List */}
          <div
            className={cn(
              "flex-1 overflow-y-auto min-h-0 px-[13px] py-[12px] gap-[10px]",
              isList ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 content-start" : "flex flex-col",
            )}
          >
            {order.items.map((item, index) => (
              <div key={index} className="flex flex-col w-full">
                <div className="flex gap-[10px] items-start text-[#1a1210]">
                  <span className="font-bold text-[14px] shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="font-bold text-[14px] leading-tight flex-1">
                    {item.name}
                  </span>
                </div>
                {/* Add-ons and the line's note on separate rows (P30). */}
                {item.addons && (
                  <span className="pl-[28px] mt-1 text-[12px] text-[#c0392b] italic">+ {item.addons}</span>
                )}
                {/* A request the cook must not miss: its own callout, not
                    another grey line under the item. */}
                {item.instructions && (
                  <div
                    role="note"
                    className="ml-[28px] mt-1.5 flex gap-1.5 items-start rounded-md border-l-4 border-[#d89a00] bg-[#fff1b8] px-2 py-1.5 text-[13px] font-bold leading-snug text-[#3d2a00]"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-[1px] text-[#b37d00]" aria-hidden />
                    <span>
                      <span className="uppercase tracking-wide text-[10px] block text-[#8a6100]">Special instructions</span>
                      {item.instructions}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        {(canCancel(order) || primary) && (
          <div className={cn("flex shrink-0 mt-auto", isList ? "w-full md:w-[160px] md:flex-col md:mt-0" : "w-full")}>
            {canCancel(order) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("Cancel");
                }}
                disabled={isProcessing}
                className="bg-[#c0392b] flex-1 flex justify-center items-center py-[13px] hover:brightness-110 transition-all border-t border-[#3a2e2c]/20 disabled:opacity-60"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span className="font-bold text-[13px] text-white tracking-[0.52px] uppercase">
                    Cancel
                  </span>
                )}
              </button>
            )}
            {primary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(primary.type);
                }}
                disabled={isProcessing}
                className="bg-[#4c9a5e] flex-1 flex justify-center items-center py-[13px] hover:brightness-110 transition-all border-t border-l border-[#3a2e2c]/20 disabled:opacity-60"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <span className="font-bold text-[13px] text-white tracking-[0.52px] uppercase">
                    {primary.label}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
