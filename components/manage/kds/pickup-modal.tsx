"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { OrderData } from "@/types/staff-order";
import { useKdsTimer } from "@/hooks/use-kds-timer";
import { PickupFollowup } from "@/components/manage/orders/pickup-followup";
import { changeDue } from "@/lib/checkout/order-rules";

export interface PickupModalProps {
  order: OrderData | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** After "Customer didn't pick up" — the list refetches. */
  onChanged?: () => void;
}

export function PickupModal({ order, isOpen, isProcessing, onClose, onConfirm, onChanged }: PickupModalProps) {
  const { timerString, color: timerColor } = useKdsTimer(order?.rawReadyAt || order?.rawCreatedAt, 999, 90);

  if (!order) return null;

  const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(order.paymentMethod || "");

  const footer = (
    <div className="flex flex-col gap-2 w-full pt-2">
      <Button
        onClick={onConfirm}
        disabled={isProcessing}
        className="w-full bg-status-preparing hover:bg-status-preparing/90 text-white font-bold py-6 rounded-md text-lg uppercase tracking-wider transition-colors disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Mark as Picked Up"}
      </Button>
      <Button
        onClick={onClose}
        disabled={isProcessing}
        variant="outline"
        className="w-full border-none bg-transparent hover:bg-black/5 text-console font-bold py-6 rounded-md uppercase tracking-wider transition-colors disabled:opacity-50 shadow-none"
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
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Time since ready</span>
          <span className={`font-display text-5xl leading-none ${timerColor === 'red' ? 'text-destructive animate-pulse' : 'text-console'}`}>
            {timerString}
          </span>
        </div>

        {isCash && (
          <div className="bg-status-ready/10 border border-status-ready/30 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
            <span className="text-status-ready font-bold uppercase tracking-wider text-sm">Pay In-store</span>
            <span className="text-status-ready font-display text-2xl">₱ {(order.total + (order.tip ?? 0)).toFixed(2)}</span>
            {(order.tip ?? 0) > 0 && (
              <span className="text-sm text-status-ready">includes a ₱{(order.tip ?? 0).toFixed(2)} tip for the staff</span>
            )}
            {order.cashTendered != null && (
              <span className="text-base font-bold text-foreground">
                Paying with ₱{order.cashTendered.toFixed(2)} · change ₱
                {(changeDue(order.total + (order.tip ?? 0), order.cashTendered) ?? 0).toFixed(2)}
              </span>
            )}
          </div>
        )}

        <div className="-mx-6 -mb-4">
          <PickupFollowup order={order} onChanged={onChanged} />
        </div>
      </div>
    </Dialog>
  );
}
