"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { OrderData } from "@/types/staff-order";
import { useKdsTimer } from "@/hooks/use-kds-timer";
import { primaryActionFor, canCancel, type StaffAction } from "@/lib/orders/staff-actions";

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
}

export function KdsOrderCard({ 
  order, 
  onAction,
  timerTimestamp,
  amberMins = 15,
  redMins = 25,
  hideTimer = false,
  fixedBadge
}: KdsOrderCardProps) {
  const { timerString, color: timerColor } = useKdsTimer(timerTimestamp ?? order.rawCreatedAt, amberMins, redMins);
  const isConfirmed = order.status === "PREP";
  const [isProcessing, setIsProcessing] = useState(false);

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

  return (
    <div className="bg-[#fbf6ec] border border-field-border flex flex-col overflow-hidden rounded-[14px] w-full h-full min-h-[320px] shadow-sm">
      
      {/* Header Area */}
      <div className={`flex flex-col p-[12px] shrink-0 w-full ${
          order.status === "CANCELED"
            ? "bg-[#797167]"
            : (order.status === "QUEUE" || order.status === "PREP") && timerColor === "red"
            ? "bg-red-700 animate-pulse"
            : order.status === "PREP" && timerColor === "amber"
            ? "bg-amber-600"
            : isConfirmed
            ? "bg-[#ca762d]"
            : "bg-[#c0392b]"
        }`}>
        
        {/* Order Number & Time */}
        <div className="flex justify-between items-start">
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
          <div className="flex flex-col text-right items-end gap-1">
            <span className="font-bold text-[#fbf6ec] text-[11px] tracking-[0.88px] uppercase mb-1">
              {order.status}
            </span>
            <span className="font-display text-[#fbf6ec] text-[22px] leading-none">
              {order.status === "CANCELED" ? "-" : timerString}
            </span>
          </div>
        </div>
      </div>
      {/* Fulfillment Badge */}
      {order.fulfillmentMethod && (
        <div className="px-[13px] pt-[8px]">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              order.fulfillmentMethod === "3rd_party_courier"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-teal-100 text-teal-700"
            }`}
          >
            {order.fulfillmentMethod === "3rd_party_courier" ? "3rd Party Courier" : "Self Pickup"}
          </span>
        </div>
      )}



      {/* Order Items List */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 px-[13px] py-[12px] gap-[10px]">
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
            {(item.addons || item.instructions) && (
              <div className="flex flex-col pl-[28px] mt-1 gap-[2px] text-[12px]">
                {item.addons && (
                  <span className="text-[#c0392b] italic">+ {item.addons}</span>
                )}
                {item.instructions && (
                  <span className="text-[#1a1210]">
                    <span className="font-bold">Note:</span> {item.instructions}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Buttons */}
      {(canCancel(order) || primary) && (
        <div className="flex w-full shrink-0 mt-auto">
          {canCancel(order) && (
            <button
              onClick={() => handleAction("Cancel")}
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
              onClick={() => handleAction(primary.type)}
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
  );
}