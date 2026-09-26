import * as React from "react";
import { OrderData } from "@/lib/mock-orders";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";
import { cn } from "@/lib/utils";
import { DialogRoot } from "@/components/ui/dialog";

interface OrderDetailModalProps {
  order: OrderData | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (type: StaffAction, order: OrderData) => void;
}

const statusConfig = {
  QUEUE: {
    headerBg: "bg-[#C73926]",
    label: "QUEUE",
  },
  PREP: {
    headerBg: "bg-[#CD7D39]",
    label: "PREP",
  },
  DELIVERY: {
    headerBg: "bg-[#507A9D]",
    label: "DELIVERING",
  },
  COMPLETED: {
    headerBg: "bg-[#48995F]",
    label: "COMPLETED",
  },
  CANCELED: {
    headerBg: "bg-[#797167]",
    label: "CANCELED",
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
        "max-w-[420px] overflow-hidden rounded-[16px] border-0 shadow-[0_30px_35px_rgba(26,18,16,0.26)]",
        // DialogRoot already supplies standard m-auto, w-full, p-0, and backdrop classes
      )}
    >
      <div className="flex flex-col w-full h-full bg-[#FAF7F0]">
        
        {/* Header (Same as Card) */}
        <div className={cn("flex justify-between items-start p-4 text-white shrink-0", config.headerBg)}>
          <div>
            {/* The same eight characters the customer sees since issue
                #106 — this used to be the id's first four. */}
            <div className="text-xl font-bold tracking-wider leading-none mb-1">
              #{order.orderNumber}
            </div>
            <div className="text-xs font-medium tracking-wide opacity-90">{order.time}</div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
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
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">
              Contact Information
            </h4>
            {/* Increased the body text size from text-[13px] to text-[15px] to improve readability based on user request. */}
            <div className="flex flex-col gap-3 text-[15px]">
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

          <div className="h-px bg-[#E6DED5] w-full mb-6" />

          {/* Order Information */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">
              Order Information
            </h4>
            <div className="flex flex-col gap-3 text-[15px]">
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
                  <span className="font-bold text-gray-900">Special Instructions:</span>
                  <span className="text-gray-800 leading-relaxed">
                    {order.orderInfo.specialInstructions}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-[#E6DED5] w-full mb-6" />

          {/* Order Items */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">
              Order Items
            </h4>
            <div className="flex flex-col gap-3 text-[15px]">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start gap-4">
                  <span className="font-bold text-gray-900 shrink-0">{item.quantity}x</span>
                  <span className="flex-1 font-semibold text-gray-900">{item.name}</span>
                  <span className="shrink-0 text-gray-800">₱{item.price.toFixed(2)}</span>
                </div>
              ))}
              
              <div className="flex justify-between items-start gap-4 mt-2">
                <span className="font-bold text-gray-900">Delivery Fee</span>
                <span className="shrink-0 text-gray-800">₱{order.deliveryFee.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-start gap-4 mt-2 pt-2 border-t border-[#E6DED5]">
                <span className="font-bold text-gray-900 text-base">Total</span>
                <span className="font-bold text-gray-900 text-base">₱{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col w-full shrink-0">
          {(canCancel(order) || primary) && (
            <div className="flex w-full">
              {canCancel(order) && (
                <button 
                  onClick={() => onAction?.("Cancel", order)}
                  className="flex-1 py-4 bg-[#C73926] hover:bg-red-800 transition-colors text-white text-[13px] font-bold text-center"
                >
                  Cancel
                </button>
              )}
              {primary && (
                <button 
                  onClick={() => onAction?.(primary.type, order)}
                  className="flex-1 py-4 bg-[#48995F] hover:bg-green-700 transition-colors text-white text-[13px] font-bold text-center"
                >
                  {primary.label}
                </button>
              )}
            </div>
          )}
          <button 
            onClick={onClose}
            className="w-full py-3 bg-[#5D5753] hover:bg-[#4a4542] transition-colors text-white text-[13px] font-semibold text-center"
          >
            Close
          </button>
        </div>
      </div>
    </DialogRoot>
  );
}
