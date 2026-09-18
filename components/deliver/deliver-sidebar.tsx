"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { DeliveryOverviewCard, type DeliveryData } from "./delivery-overview-card";
import { getAssignedDeliveries, getDeliveryDetail } from "@/lib/actions/delivery";
import { Loader2 } from "lucide-react";

export function DeliverSidebar() {
  const pathname = usePathname();
  const activeDeliveryId = pathname.split("/").pop();
  
  const [filter, setFilter] = useState<"all" | "queue" | "delivered">("all");
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSidebarQueue() {
      const { deliveries: summaries, error } = await getAssignedDeliveries();
      
      if (error || !summaries) {
        setIsLoading(false);
        return;
      }

      // Fetch full details for the sidebar cards
      const detailedPromises = summaries.map(s => getDeliveryDetail(s.deliveryId));
      const detailedResults = await Promise.all(detailedPromises);

      const mapped: DeliveryData[] = detailedResults
        .filter(res => res.delivery !== null)
        .map(res => {
          const d = res.delivery!;
          
          let cardStatus: "ready" | "delivering" | "completed" = "ready";
          if (d.deliveryStatus === "delivering" || d.deliveryStatus === "out_for_delivery") cardStatus = "delivering";
          if (d.deliveryStatus === "delivered") cardStatus = "completed";

          return {
            id: d.deliveryId, // Keep full UUID so sidebar Links navigate to real database IDs
            customer: d.customer?.name || "Walk-in Customer",
            address: d.customer?.address || "Address details protected",
            phone: d.customer?.phone || "Contact via details",
            notes: "",
            paymentMethod: "Standard",
            total: 0,
            status: cardStatus,
            items: d.items.map(item => ({
              qty: item.quantity,
              name: item.productName
            }))
          };
        });

      setDeliveries(mapped);
      setIsLoading(false);
    }

    loadSidebarQueue();
  }, []);

  const filteredDeliveries = deliveries.filter((d) => {
    if (filter === "all") return d.status === "ready";
    if (filter === "queue") return d.status === "delivering";
    if (filter === "delivered") return d.status === "completed";
    return false;
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
            onClick={() => setFilter("queue")}
            className={`flex-1 text-[12px] font-bold py-1.5 rounded-[6px] transition-colors ${filter === "queue" ? "bg-white text-[#1a1210] shadow-sm" : "text-[#7a6a60] hover:text-[#1a1210]"}`}
          >
            Queue
          </button>
          <button 
            onClick={() => setFilter("delivered")}
            className={`flex-1 text-[12px] font-bold py-1.5 rounded-[6px] transition-colors ${filter === "delivered" ? "bg-white text-[#1a1210] shadow-sm" : "text-[#7a6a60] hover:text-[#1a1210]"}`}
          >
            Delivered
          </button>
        </div>
      </div>

      <div className="flex flex-col px-[23px] py-[24px] gap-[10px] overflow-y-auto h-full">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8541F]" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}