"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { OrderData } from "@/types/staff-order";
import { primaryActionFor, type StaffAction } from "@/lib/orders/staff-actions";
import { Button } from "@/components/ui/button";

interface KdsOrderCardProps {
  order: OrderData;
  onAction?: (type: StaffAction, order: OrderData) => void;
}

export function KdsOrderCard({ order, onAction }: KdsOrderCardProps) {
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
    <div className="bg-background border border-field-border flex flex-col overflow-hidden rounded-md w-full h-full min-h-[320px] shadow-sm">
      
      {/* Header Area */}
      <div className={`flex flex-col p-[12px] shrink-0 w-full ${isConfirmed ? "bg-status-preparing" : "bg-error-border"}`}>
        
        {/* Order Number & Time */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            {/* The same eight characters the customer and the rider see
                since issue #106 — this used to be the id's *first* four
                while the customer was shown its *last* four. */}
            <span className="font-display text-background text-2xl leading-none mb-1">
              #{order.orderNumber}
            </span>
            <span className="font-bold text-background text-sm tracking-[0.88px] uppercase">
              {order.time}
            </span>
          </div>
          
          {/* Status & Prep Time */}
          <div className="flex flex-col text-right items-end gap-1">
            <span className="font-bold text-background text-sm tracking-[0.88px] uppercase mb-1">
              {order.status}
            </span>
            <span className="font-display text-background text-2xl leading-none">
              {order.timer || "0:00"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items List */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0 px-[13px] py-[12px] gap-[10px]">
        {order.seniorPwd && (
          <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-100/80 px-2.5 py-1 text-sm font-bold text-amber-950">
            <span>Verify ID · {order.seniorPwd.type === "senior_citizen" ? "Senior" : "PWD"}</span>
            <span>−₱{order.seniorPwd.discount.toFixed(2)}</span>
          </div>
        )}
        {order.items.map((item, index) => (
          <div key={index} className="flex flex-col w-full">
            <div className="flex gap-[10px] items-start text-foreground">
              <span className="font-bold text-sm shrink-0">
                {item.quantity}x
              </span>
              <span className="font-bold text-sm leading-tight flex-1">
                {item.name}
              </span>
            </div>
            {/* Add-ons and the line's note on separate rows (P30). */}
            {(item.addons || item.instructions) && (
              <div className="flex flex-col pl-[28px] mt-1 gap-[2px] text-sm">
                {item.addons && (
                  <span className="text-error-border italic">+ {item.addons}</span>
                )}
                {item.instructions && (
                  <span className="text-foreground">
                    <span className="font-bold">Note:</span> {item.instructions}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Buttons */}
      <div className="flex w-full shrink-0 mt-auto">
        <Button variant="unstyled"
          onClick={() => handleAction("Cancel")}
          disabled={isProcessing}
          className="bg-error-border flex-1 flex justify-center items-center py-[13px] hover:brightness-110 transition-all border-t border-foreground/20 disabled:opacity-60"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <span className="font-bold text-sm text-white tracking-[0.52px] uppercase">
              Cancel
            </span>
          )}
        </Button>
        <Button variant="unstyled"
          onClick={() => primary && handleAction(primary.type)}
          disabled={isProcessing || !primary}
          className="bg-status-done flex-1 flex justify-center items-center py-[13px] hover:brightness-110 transition-all border-t border-l border-foreground/20 disabled:opacity-60"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <span className="font-bold text-sm text-white tracking-[0.52px] uppercase">
              {primary?.label ?? ""}
            </span>
          )}
        </Button>
      </div>

    </div>
  );
}