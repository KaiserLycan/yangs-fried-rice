"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { DeliveryOverviewCard, type DeliveryData } from "./delivery-overview-card";
import { DeliveryOverviewSkeleton } from "./delivery-overview-skeleton";
import { getAssignedDeliveries, getDeliveryDetailsBatch } from "@/lib/actions/delivery";
import { activeCountOf, queueRank, toDeliveryCard } from "@/lib/orders/rider-queue";
import { createClient } from "@/lib/supabase/client";
import { ManagePagination } from "@/components/manage/manage-pagination";

export function DeliverSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeDeliveryId = pathname.split("/").pop();
  
  const [filter, setFilter] = useState<"all" | "queue" | "delivered">("queue");
  const [allSummaries, setAllSummaries] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    async function loadSidebarQueue() {
      // Don't show full page loading skeleton on background refresh, just keep current data
      if (allSummaries.length === 0) {
        setIsLoading(true);
      }
      
      const { deliveries: summaries, error } = await getAssignedDeliveries();
      
      if (error || !summaries) {
        setIsLoading(false);
        return;
      }
      
      setAllSummaries(summaries);
      setIsLoading(false);
    }

    loadSidebarQueue();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener("delivery-updated", handleUpdate);
    return () => window.removeEventListener("delivery-updated", handleUpdate);
  }, []);

  // Another rider accepting, handing back or finishing a delivery changes
  // this rider's queue too (P46), so every change to `delivery` re-reads it.
  // The queue page is a Server Component, so it is refreshed as well.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const routerRef = useRef(router);
  routerRef.current = router;
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rider-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery" },
        () => {
          setRefreshTrigger((prev) => prev + 1);
          if (pathnameRef.current === "/deliver") routerRef.current.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter and sort the entire pool of summaries
  const filteredSummaries = useMemo(() => {
    return allSummaries
      .filter((s) => {
        let cardStatus = "ready";
        if (s.deliveryStatus === "delivering" || s.deliveryStatus === "out_for_delivery") cardStatus = "delivering";
        if (s.deliveryStatus === "delivered") cardStatus = "completed";

        if (filter === "all") return true;
        if (filter === "queue") return cardStatus === "ready" || cardStatus === "delivering";
        if (filter === "delivered") return cardStatus === "completed";
        return true;
      })
      .sort((a, b) => {
        // Same order as the queue page — see `queueRank`.
        const rank = queueRank(a) - queueRank(b);
        if (rank !== 0) return rank;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allSummaries, filter]);
  const totalPages = Math.ceil(filteredSummaries.length / pageSize);
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    async function fetchPageDetails() {
      if (allSummaries.length === 0) {
        setDeliveries([]);
        setIsFetchingPage(false);
        return;
      }
      
      setIsFetchingPage(true);
      const startIdx = (currentPage - 1) * pageSize;
      const pageSummaries = filteredSummaries.slice(startIdx, startIdx + pageSize);

      const deliveryIds = pageSummaries.map(s => s.deliveryId);
      const result = await getDeliveryDetailsBatch(deliveryIds);
      const detailedResults = result?.deliveries || [];

      // Re-order detailedResults to match deliveryIds
      const orderedResults = deliveryIds
        .map(id => detailedResults.find(d => d.deliveryId === id))
        .filter(Boolean);

      const activeCount = activeCountOf(allSummaries);
      const mapped: DeliveryData[] = orderedResults.map((d) =>
        toDeliveryCard(
          d!,
          allSummaries.find((s) => s.deliveryId === d!.deliveryId),
          activeCount,
        ),
      );

      setDeliveries(mapped);
      setIsFetchingPage(false);
    }

    fetchPageDetails();
  }, [allSummaries, filter, currentPage, pageSize]);



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
        {isLoading || isFetchingPage ? (
          <div className="flex flex-col gap-[10px]">
            {Array.from({ length: pageSize }).map((_, i) => (
              <DeliveryOverviewSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {deliveries.map((delivery) => {
              const isActive = activeDeliveryId === delivery.id;

              // Another rider's delivery has no detail page this rider may
              // open, so it is a plain card rather than a link.
              if (delivery.takenBy) {
                return (
                  <DeliveryOverviewCard key={delivery.id} delivery={delivery} />
                );
              }

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
            {deliveries.length === 0 && (
              <p className="text-center text-[13px] text-[#7a6a60] mt-4">
                No deliveries found for this filter.
              </p>
            )}
            
            {totalPages > 0 && (
              <div className="mt-auto pt-4 border-t border-[#DDCDB8]">
                <ManagePagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                  className="justify-center sm:justify-center"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}