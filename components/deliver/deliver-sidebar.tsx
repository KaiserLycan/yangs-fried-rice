"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DeliveryOverviewCard } from "./delivery-overview-card";
import { MOCK_DELIVERIES } from "@/lib/mock-deliveries";

export function DeliverSidebar() {
  const pathname = usePathname();
  // Get active delivery ID from the path (e.g., /deliver/1042)
  const activeDeliveryId = pathname.split("/").pop();
  
  const [filter, setFilter] = useState<"all" | "ready" | "delivering">("all");

  const filteredDeliveries = MOCK_DELIVERIES.filter((d) => {
    if (d.status === "completed") return false;
    if (filter !== "all" && d.status !== filter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-[23px] pt-[24px] pb-[16px] shrink-0 border-b border-[#e8dfcd]">
        <h2 className="font-bold text-[11px] tracking-[1.32px] text-[#7A6A60] uppercase mb-[16px]">
          FOR DELIVERY
        </h2>
        
        <div className="flex gap-1 bg-[#ecdcc5] p-1 rounded-[8px]">
          <button 
            onClick={() => setFilter("all")}
            className={`flex-1 text-[12px] font-bold py-1.5 rounded-[6px] transition-colors ${filter === "all" ? "bg-white text-[#1a1210] shadow-sm" : "text-[#7a6a60] hover:text-[#1a1210]"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("ready")}
            className={`flex-1 text-[12px] font-bold py-1.5 rounded-[6px] transition-colors ${filter === "ready" ? "bg-white text-[#1a1210] shadow-sm" : "text-[#7a6a60] hover:text-[#1a1210]"}`}
          >
            Queued
          </button>
          <button 
            onClick={() => setFilter("delivering")}
            className={`flex-1 text-[12px] font-bold py-1.5 rounded-[6px] transition-colors ${filter === "delivering" ? "bg-white text-[#1a1210] shadow-sm" : "text-[#7a6a60] hover:text-[#1a1210]"}`}
          >
            Ongoing
          </button>
        </div>
      </div>

      <div className="flex flex-col px-[23px] py-[24px] gap-[10px] overflow-y-auto h-full">
        {filteredDeliveries.map((delivery) => {
          const isActive = activeDeliveryId === delivery.id;
          
          return (
            <Link 
              key={delivery.id} 
              href={`/deliver/${delivery.id}`} 
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[16px]"
            >
              <DeliveryOverviewCard 
                delivery={delivery} 
                isActive={isActive} 
              />
            </Link>
          );
        })}
        {filteredDeliveries.length === 0 && (
          <p className="text-center text-[13px] text-[#7a6a60] mt-4">
            No deliveries found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}
