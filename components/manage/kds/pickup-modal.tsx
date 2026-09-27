"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { OrderData } from "@/types/staff-order";
import { useKdsTimer } from "@/hooks/use-kds-timer";

export interface PickupModalProps {
  order: OrderData | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PickupModal({ order, isOpen, isProcessing, onClose, onConfirm }: PickupModalProps) {
  const { timerString, color: timerColor } = useKdsTimer(order?.rawReadyAt || order?.rawCreatedAt, 999, 90);

  if (!order) return null;

  const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(order.paymentMethod || "");

  const footer = (
    <div className="flex flex-col gap-2 w-full pt-2">
      <Button
        onClick={onConfirm}
        disabled={isProcessing}
        className="w-full bg-[#ca762d] hover:bg-[#b56927] text-white font-bold py-6 rounded-[10px] text-lg uppercase tracking-wider transition-colors disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Mark as Picked Up"}
      </Button>
      <Button
        onClick={onClose}
        disabled={isProcessing}
        variant="outline"
        className="w-full border-none bg-transparent hover:bg-black/5 text-[#3a2e2c] font-bold py-6 rounded-[10px] uppercase tracking-wider transition-colors disabled:opacity-50 shadow-none"
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={`Order #${order.orderNumber}`}
      description="Mark order as picked up"
      footer={footer}
    >
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Time since ready</span>
          <span className={`font-display text-[48px] leading-none ${timerColor === 'red' ? 'text-red-600 animate-pulse' : 'text-[#3a2e2c]'}`}>
            {timerString}
          </span>
        </div>

        {isCash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-blue-700 font-bold uppercase tracking-wider text-sm">Pay In-store</span>
            <span className="text-blue-900 font-display text-2xl">₱ {order.total.toFixed(2)}</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}
