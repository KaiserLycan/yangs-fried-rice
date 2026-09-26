"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { acceptDelivery, releaseDelivery } from "@/lib/actions/delivery";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export type DeliveryData = {
  id: string;
  customer: string;
  address: string;
  phone: string;
  notes: string;
  paymentMethod: string;
  total: number | string;
  status: "ready" | "delivering" | "completed";
  items: { qty: number; name: string }[];
  createdAt: string;
};

interface DeliveryOverviewCardProps {
  delivery: DeliveryData;
  isActive?: boolean;
}

export function DeliveryOverviewCard({ delivery, isActive }: DeliveryOverviewCardProps) {
  const router = useRouter();
  const showToast = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirmRelease, setConfirmRelease] = useState(false);

  const isReady = delivery.status === "ready";
  const isDelivering = delivery.status === "delivering";
  const isCompleted = delivery.status === "completed";

  const itemCount = delivery.items.reduce((sum, item) => sum + item.qty, 0);

  // The card sits inside a <Link>, so every control on it has to stop the
  // click from navigating as well as doing its own job.
  const handleReleaseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmRelease(true);
  };

  const handleReleaseConfirm = () => {
    startTransition(async () => {
      const result = await releaseDelivery(delivery.id);
      setConfirmRelease(false);
      if (result.success) {
        window.dispatchEvent(new CustomEvent("delivery-updated"));
        showToast("Delivery handed back. Another rider can take it now.", "success");
        router.refresh();
      } else {
        showToast(result.error || "Couldn't hand this delivery back.", "error");
      }
    });
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop the Link from navigating instantly
    
    startTransition(async () => {
      const result = await acceptDelivery(delivery.id);
      if (result.success) {
        window.dispatchEvent(new CustomEvent("delivery-updated"));
        router.push(`/deliver/${delivery.id}`);
      } else {
        showToast(result.error || "Failed to accept delivery", "error");
      }
    });
  };

  return (
    <div className={cn(
      "w-full bg-[#FFFCF6] rounded-[16px] p-[20px] transition-colors border",
      isActive ? "border-[#1A1210]" : "border-[#1A1210]/20 hover:border-[#1A1210]/50",
      delivery.status === "completed" && "opacity-60"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-[16px]">
        <div>
          <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">ORDER</p>
          <h3 className="font-display text-[22px] text-[#1A1210] leading-none">
            #{delivery.id.split('-')[0]}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">DELIVER TO</p>
          <h3 className="font-display text-[18px] text-[#1A1210] leading-none uppercase">
            {delivery.customer}
          </h3>
        </div>
      </div>

      {/* Details */}
      <div className="mb-[16px] flex flex-col gap-2">
        <p className="text-[14px] text-[#1A1210] leading-snug">
          {delivery.address} {delivery.notes}
        </p>
        <p className="text-[14px] text-[#1A1210]">
          {delivery.phone}
        </p>
        <p className="text-[12px] text-[#7A6A60] mt-1">
          {itemCount} items · {delivery.paymentMethod === "cash_on_delivery" ? "COD" : delivery.paymentMethod === "paymongo" ? "Paid Online" : delivery.paymentMethod} · {delivery.total ? `₱${Number(delivery.total).toFixed(2)}` : "Paid"}
        </p>
        {isDelivering && (
          <p className="text-[12px] text-[#E8541F] mt-1 font-bold">
            ● Accepted by you
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2">
        {isReady ? (
          <Button 
            className="w-full py-5 rounded-[12px] bg-[#E8541F] hover:bg-[#d44919] text-white"
            onClick={handleAcceptClick}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept"}
          </Button>
        ) : isDelivering ? (
          <div className="flex flex-col gap-2">
            <Button 
              className="w-full py-5 rounded-[12px] bg-[#1A1210] hover:bg-[#2c1f1c] text-white"
              onClick={(e) => {
                // Just let it bubble to the link so it navigates to the details page, or prevent and push
                // Actually, preventing and pushing ensures clean navigation without Link quirks on buttons
                e.preventDefault();
                router.push(`/deliver/${delivery.id}?action=upload`);
              }}
            >
              Arrived & Upload Proof
            </Button>
            {/* Undoes an accidental Accept: the order goes back to the queue
                for any rider, and this rider's other deliveries are untouched. */}
            <button
              type="button"
              onClick={handleReleaseClick}
              disabled={isPending}
              className="w-full rounded-[12px] py-2 text-[13px] font-bold text-[#7A6A60] underline transition-colors hover:text-[#C0392B] disabled:opacity-60"
            >
              Hand back to queue
            </button>
          </div>
        ) : (
          <Button className="w-full py-5 rounded-[12px] bg-[#E3E8E1] text-[#7A6A60]" disabled>
            Delivered
          </Button>
        )}
      </div>

      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <Dialog
          open={confirmRelease}
          onClose={() => setConfirmRelease(false)}
          tone="danger"
          title="HAND THIS DELIVERY BACK?"
          description="It goes back to the queue and any rider can accept it. Your other deliveries aren't affected."
          footer={
            <>
              <Button
                variant="outline"
                className="flex-1 p-[14px]"
                onClick={() => setConfirmRelease(false)}
                disabled={isPending}
              >
                Keep it
              </Button>
              <Button
                variant="confirm"
                className="flex-1"
                onClick={handleReleaseConfirm}
                disabled={isPending}
              >
                {isPending ? "Handing back…" : "Hand back"}
              </Button>
            </>
          }
        />
      </div>
    </div>
  );
}