"use client";

import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProofOfDeliveryModal } from "./proof-of-delivery-modal";
import { MOCK_DELIVERIES } from "@/lib/mock-deliveries";

export function DeliveryDetailsPanel({ deliveryId }: { deliveryId: string }) {
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Find the specific delivery, fallback to the first one if not found (for safety)
  const delivery = MOCK_DELIVERIES.find(d => d.id === deliveryId) || MOCK_DELIVERIES[0];

  return (
    <>
      {/* Drag handle area for mobile (aesthetic) */}
      <div 
        className="w-full flex justify-center py-3 shrink-0 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="w-[40px] h-[4px] bg-[#DDCDB8] rounded-full" />
      </div>

      <div className="flex-1 overflow-y-auto px-[24px] pb-[24px] flex flex-col">
        {/* Customer & Actions */}
        <div className="flex items-start justify-between mb-[24px]">
          <div>
            <h2 className="font-display text-[24px] text-[#1A1210] leading-none mb-1">
              {delivery.customer}
            </h2>
            <p className="text-[14px] text-[#7A6A60]">{delivery.phone}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#E8541F] flex items-center justify-center hover:bg-[#F2E8D9] transition-colors">
              <MessageCircle className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#E8541F] flex items-center justify-center hover:bg-[#F2E8D9] transition-colors">
              <Phone className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Delivery Info */}
        <div className="flex flex-col gap-4 mb-[24px]">
          <div className="bg-[#FAF5EB] p-4 rounded-[12px]">
            <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest mb-1">
              Delivery Address
            </p>
            <p className="text-[15px] text-[#1A1210] font-medium leading-snug">
              {delivery.address}
            </p>
          </div>

          <div className="bg-[#FAF5EB] p-4 rounded-[12px]">
            <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest mb-1">
              Instructions
            </p>
            <p className="text-[14px] text-[#1A1210] italic">
              "{delivery.notes}"
            </p>
          </div>
        </div>

        {/* Order Items & Payment */}
        <div className="flex flex-col gap-3 mb-[32px]">
          <p className="text-[12px] font-bold text-[#7A6A60] uppercase tracking-widest">
            Order Summary
          </p>
          {delivery.items.map((item, i) => (
            <div key={i} className="flex justify-between text-[14px]">
              <span className="text-[#1A1210]"><span className="font-bold text-[#E8541F]">{item.qty}x</span> {item.name}</span>
            </div>
          ))}
          <div className="flex justify-between items-center mt-2 pt-3 border-t border-[#F2E8D9]">
            <span className="text-[14px] text-[#7A6A60]">{delivery.paymentMethod}</span>
            <span className="font-display text-[18px] text-[#1A1210]">{delivery.total}</span>
          </div>
        </div>

        {/* Main Action */}
        <div className="mt-auto pt-4">
          <Button 
            className="w-full py-6 text-[16px]" 
            size="lg"
            onClick={() => setIsProofModalOpen(true)}
          >
            Arrived & Upload Proof
          </Button>
        </div>
          </>
        )}
      </div>

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal 
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        deliveryId={delivery.id}
        customerName={delivery.customer}
      />
    </>
  );
}
