"use client";

import { OrderData } from "@/lib/mock-orders";

export function KdsOrderCard({ order }: { order: OrderData }) {
  const isConfirmed = order.status === "PREP";

  return (
    <div className={`bg-[#fbf6ec] border border-[#3a2e2c] flex flex-col overflow-hidden rounded-[14px] w-full shadow-sm ${isConfirmed ? "h-[316px]" : "h-[359px]"}`}>
      
      {/* Header Area */}
      <div className={`flex flex-col p-[12px] shrink-0 w-full ${isConfirmed ? "bg-[#ca762d]" : "bg-[#c0392b]"}`}>
        
        {/* Order Number & Time */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <span className="font-display text-[#fbf6ec] text-[22px] leading-none mb-1">
              {order.orderNumber}
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
              {order.timer || "0:00"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items List */}
      <div className="flex-1 flex flex-col overflow-y-auto px-[13px] py-[12px] gap-[10px]">
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-col w-full">
            <div className="flex gap-[10px] items-start text-[#1a1210]">
              <span className="font-bold text-[14px] shrink-0">
                {item.quantity}x
              </span>
              <span className="font-bold text-[14px] leading-tight flex-1">
                {item.name}
              </span>
            </div>
            {item.addons && (
              <div className="flex flex-col pl-[28px] mt-1 text-[#c0392b] text-[12px] italic">
                <span>{item.addons}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Buttons */}
      <div className="flex w-full shrink-0">
        <button className="bg-[#c0392b] flex-1 flex justify-center py-[13px] hover:brightness-110 transition-all border-t border-[#3a2e2c]/20">
          <span className="font-bold text-[13px] text-white tracking-[0.52px] uppercase">Cancel</span>
        </button>
        <button className="bg-[#4c9a5e] flex-1 flex justify-center py-[13px] hover:brightness-110 transition-all border-t border-l border-[#3a2e2c]/20">
          <span className="font-bold text-[13px] text-white tracking-[0.52px] uppercase">
            {isConfirmed ? "Deliver" : "Confirm"}
          </span>
        </button>
      </div>

    </div>
  );
}
