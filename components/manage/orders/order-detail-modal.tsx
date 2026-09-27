import * as React from "react";
import type { OrderData } from "@/types/staff-order";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";
import { cn } from "@/lib/utils";
import { DialogRoot } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderDetailModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (type: StaffAction, order: OrderData) => void;
}

const statusConfig = {
  QUEUE: {
    headerBg: "bg-status-received",
  },
  PREP: {
    headerBg: "bg-status-preparing",
  },
  DELIVERY: {
    headerBg: "bg-status-ready",
  },
  COMPLETED: {
    headerBg: "bg-status-done",
  },
  CANCELED: {
    headerBg: "bg-status-cancelled",
  },
};

export function OrderDetailModal({ order, isOpen, onClose, onAction }: OrderDetailModalProps) {
  if (!order) return null;

  const config = statusConfig[order.status];
  const primary = primaryActionFor(order);
  const statusLabel = statusLabelFor(order);

  return (
    // We use DialogRoot from components/ui/dialog.tsx to ensure consistent backdrop,
    // ESC key handling, and click-outside behavior across the entire app.
    // The inner content still uses custom padding and full-bleed layout.
    <DialogRoot
      open={isOpen}
      onClose={onClose}
      className={cn(
        "max-w-[420px] overflow-hidden rounded-lg border-0 shadow-[0_30px_35px_rgba(26,18,16,0.26)]",
        // DialogRoot already supplies standard m-auto, w-full, p-0, and backdrop classes
      )}
    >
      <div className="flex flex-col w-full h-full bg-background">
        
        {/* Header (Same as Card) */}
        <div className={cn("flex justify-between items-start p-4 text-white shrink-0", config.headerBg)}>
          <div>
            {/* The same eight characters the customer sees since issue
                #106 — this used to be the id's first four. */}
            <div className="text-lg font-bold tracking-wider leading-none mb-1">
              #{order.orderNumber}
            </div>
            <div className="text-xs leading-4 font-medium tracking-wide opacity-90">{order.time}</div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="text-xs font-bold uppercase tracking-widest leading-none mb-1">
              {statusLabel}
            </div>
            {order.timer && (
              <div className="text-lg font-bold tracking-wider leading-none">
                {order.timer}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">
          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-xs leading-4 font-bold text-gray-400 tracking-wider uppercase mb-3">
              Contact Information
            </h4>
            {/* Increased the body text size from text-sm to text-base to improve readability based on user request. */}
            <div className="flex flex-col gap-3 text-base">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-gray-900 shrink-0">Name:</span>
                <span className="text-right text-gray-800">{order.contactInfo.name}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-gray-900 shrink-0">Address:</span>
                <span className="text-right text-gray-800">{order.contactInfo.address}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-gray-900 shrink-0">Phone:</span>
                <span className="text-right text-gray-800">{order.contactInfo.phone}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-track w-full mb-6" />

          {/* Order Information */}
          <div className="mb-6">
            <h4 className="text-xs leading-4 font-bold text-gray-400 tracking-wider uppercase mb-3">
              Order Information
            </h4>
            <div className="flex flex-col gap-3 text-base">
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-gray-900 shrink-0">Order Type:</span>
                <span className="text-right text-gray-800">{order.orderInfo.type}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-bold text-gray-900 shrink-0">Status:</span>
                <span className="text-right text-gray-800 capitalize">{statusLabel.toLowerCase()}</span>
              </div>
              {order.orderInfo.specialInstructions && (
                <div className="flex flex-col gap-1 mt-1">
                  <span className="font-bold text-gray-900">Order note:</span>
                  <span className="text-gray-800 leading-relaxed">
                    {order.orderInfo.specialInstructions}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-track w-full mb-6" />

          {/* Order Items */}
          <div>
            <h4 className="text-xs leading-4 font-bold text-gray-400 tracking-wider uppercase mb-3">
              Order Items
            </h4>
            <div className="flex flex-col gap-3 text-base">
              {/* Every line's own add-ons and note, under that line — the
                  modal used to show one line's note as the order's (P30). */}
              {order.items.map((item, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-bold text-gray-900 shrink-0">{item.quantity}x</span>
                    <span className="flex-1 font-semibold text-gray-900">{item.name}</span>
                    <span className="shrink-0 text-gray-800">₱{item.price.toFixed(2)}</span>
                  </div>
                  {item.addons && (
                    <span className="pl-7 text-sm italic text-status-received">+ {item.addons}</span>
                  )}
                  {item.instructions && (
                    <span className="pl-7 text-sm text-gray-800">
                      <span className="font-bold">Note:</span> {item.instructions}
                    </span>
                  )}
                </div>
              ))}
              
              <div className="flex justify-between items-start gap-4 mt-2">
                <span className="font-bold text-gray-900">Delivery Fee</span>
                <span className="shrink-0 text-gray-800">₱{order.deliveryFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-start gap-4 mt-2 pt-2 border-t border-track">
                <span className="font-bold text-gray-900 text-base leading-6">Total</span>
                <span className="font-bold text-gray-900 text-base leading-6">₱{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col w-full shrink-0">
          {(canCancel(order) || primary) && (
            <div className="flex w-full">
              {canCancel(order) && (
                <Button variant="unstyled" 
                  onClick={() => onAction?.("Cancel", order)}
                  className="flex-1 py-4 bg-status-received hover:bg-red-800 transition-colors text-white text-sm font-bold text-center"
                >
                  Cancel
                </Button>
              )}
              {primary && (
                <Button variant="unstyled" 
                  onClick={() => onAction?.(primary.type, order)}
                  className="flex-1 py-4 bg-status-done hover:bg-green-700 transition-colors text-white text-sm font-bold text-center"
                >
                  {primary.label}
                </Button>
              )}
            </div>
          )}
          <Button variant="unstyled" 
            onClick={onClose}
            className="w-full py-3 bg-status-cancelled hover:bg-status-cancelled/90 transition-colors text-white text-sm font-semibold text-center"
          >
            Close
          </Button>
        </div>
      </div>
    </DialogRoot>
  );
}
