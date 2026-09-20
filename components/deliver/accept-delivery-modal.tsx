"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptDelivery } from "@/lib/actions/delivery";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AcceptDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecline: () => void;
  delivery: any; // Using your existing DeliveryData shape
}

export function AcceptDeliveryModal({ isOpen, onClose, onDecline, delivery }: AcceptDeliveryModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  if (!delivery) return null;

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptDelivery(delivery.id);
      
      if (result.success) {
        onClose();
        window.dispatchEvent(new CustomEvent("delivery-updated"));
        router.refresh(); // Triggers the sidebar and main view to refetch and move it to "Ongoing"
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); if(!isPending) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] overflow-visible bg-transparent p-0 backdrop:bg-black/40"
    >
      <div className="flex flex-col w-full bg-[#FAF7F0] rounded-[24px] shadow-2xl overflow-hidden p-[24px]">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-[16px]">
          <div>
            <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">ORDER</p>
            <h3 className="font-display text-[22px] text-[#1A1210] leading-none">
              #{delivery.id.substring(0, 8)}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#7A6A60] font-bold tracking-widest uppercase mb-1">DELIVER TO</p>
            <h3 className="font-display text-[18px] text-[#1A1210] leading-none uppercase">
              {delivery.customer}
            </h3>
          </div>
        </div>

        {/* Address & Contact */}
        <div className="flex flex-col gap-2 mb-[20px]">
          <p className="text-[14px] text-[#1A1210] leading-snug">
            {delivery.address} {delivery.notes ? `, ${delivery.notes}` : ""}
          </p>
          <p className="text-[14px] text-[#1A1210]">
            {delivery.phone}
          </p>
        </div>

        {/* Items */}
        <div className="flex flex-col gap-3 mb-[20px]">
          {delivery.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-[14px]">
              <span className="text-[#1A1210] font-medium">
                <span className="font-bold text-[#E8541F] mr-2">{item.qty}x</span> 
                {item.name}
              </span>
            </div>
          ))}
          
          <div className="flex justify-between items-center text-[14px]">
            <span className="font-bold text-[#1A1210]">Delivery Fee</span>
            <span className="text-[#1A1210]">₱95.00</span>
          </div>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#DDCDB8]">
            <span className="font-bold text-[16px] text-[#1A1210]">Total</span>
            <span className="font-display text-[18px] text-[#1A1210]">
              ₱{(delivery.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <p className="text-[12px] text-[#7A6A60] italic mb-[24px]">
          *{delivery.paymentMethod || "Cash on delivery"}
        </p>

        {error && <p className="text-red-500 text-sm font-medium text-center mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-[12px]">
          <Button 
            variant="outline" 
            className="flex-1 py-6 text-[15px] border-[#DDCDB8] text-[#7A6A60] hover:bg-[#F2E8D9]"
            onClick={() => {
              onDecline();
              onClose();
            }}
            disabled={isPending}
          >
            Decline
          </Button>
          <Button 
            className="flex-[2] py-6 text-[15px] bg-[#E8541F] hover:bg-[#d44919] text-white"
            onClick={handleAccept}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Accept"}
          </Button>
        </div>

      </div>
    </dialog>
  );
}