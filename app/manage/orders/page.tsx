"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { OrderSidebar, OrderStatus } from "@/components/manage/orders/order-sidebar";
import { OrderCard } from "@/components/manage/orders/order-card";
import { OrderData } from "@/lib/mock-orders";
import { OrderDetailModal } from "@/components/manage/orders/order-detail-modal";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast, ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getDetailedOrders, updateOrderStatus } from "@/lib/actions/orders";

// 1. Wrapper component to provide the Toast context
export default function ManageOrdersPage() {
  return (
    <ToastProvider>
      <ManageOrdersInner />
    </ToastProvider>
  );
}

// 2. The inner component that handles data logic
function ManageOrdersInner() {
  const showToast = useToast();

  // Real Data State
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI State
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  
  const [confirmAction, setConfirmAction] = useState<{ type: 'Cancel' | 'Deliver' | 'Confirm', order: OrderData } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelError, setShowCancelError] = useState(false);

  // Fetch Orders on Mount and when Status/Page changes
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    
    // Map UI Status to Database Enum
    let dbStatus: string | undefined = undefined;
    switch(activeStatus) {
      case "Queue": dbStatus = "received"; break;
      case "Preparation": dbStatus = "preparing"; break;
      case "Delivery": dbStatus = "out_for_delivery"; break;
      case "Completed": dbStatus = "completed"; break;
      case "Canceled": dbStatus = "cancelled"; break;
    }

    // 1. Fetch the summaries using server-side pagination & filtering
    const summaryResult = await getDetailedOrders({
      status: dbStatus as any,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    });

    if (summaryResult.error) {
      showToast(`Failed to load orders: ${summaryResult.error}`);
    }

    if (summaryResult.data) {
      const { data: detailedOrders, totalCount } = summaryResult.data;
      
      // Calculate and update total pages based on count
      setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
      
      const mappedOrders: OrderData[] = detailedOrders
        .filter(res => res !== null)
        .map(order => {
          // Map Database Status back to UI Status
          let uiStatus: any = "QUEUE";
          if (order.order_status === "preparing") uiStatus = "PREP";
          if (order.order_status === "out_for_delivery") uiStatus = "DELIVERY";
          if (order.order_status === "completed") uiStatus = "COMPLETED";
          if (order.order_status === "cancelled") uiStatus = "CANCELED";

          return {
            id: order.order_id,
            orderNumber: order.order_id.substring(0, 4).toUpperCase(), // Extracting short ID for display
            time: order.created_at 
              ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : "Unknown time",
              status: uiStatus,
            timer: "5:00", // Fallback (calculating real timer requires ETA logic)
            contactInfo: {
              name: order.customer?.name || "Walk-in Customer",
              address: "Address details protected", // Fallback if delivery data is missing
              phone: order.customer?.email || "No contact",
            },
            orderInfo: {
              type: order.order_type || "Take-Out",
              specialInstructions: order.order_item?.[0]?.special_instructions || "",
            },
            deliveryFee: 0,
            total: order.transaction?.[0]?.total_paid || 0,
            items: order.order_item.map(item => ({
              quantity: item.quantity,
              name: item.product?.product_name || "Unknown Item",
              price: item.product?.product_price || 0,
              addons: item.special_instructions || undefined,
            }))
          };
        });
        
      setOrders(mappedOrders);
    }
    setIsLoading(false);
  }, [activeStatus, currentPage, pageSize, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Execute Backend Mutations
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === "Cancel" && !cancelReason.trim()) {
      setShowCancelError(true);
      return;
    }

    setIsProcessing(true);

    let newDbStatus = "";
    if (confirmAction.type === "Confirm") newDbStatus = "preparing";
    else if (confirmAction.type === "Deliver") newDbStatus = "out_for_delivery";
    else if (confirmAction.type === "Cancel") newDbStatus = "cancelled";

    const result = await updateOrderStatus(confirmAction.order.id, newDbStatus);

    if (result.error) {
      showToast(`Failed to update order: ${result.error}`);
    } else {
      showToast(`Order #${confirmAction.order.orderNumber} updated successfully.`);
      await fetchOrders(); // Refresh the active list
      setConfirmAction(null);
      setSelectedOrder(null);
      setCancelReason("");
      setShowCancelError(false);
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full gap-4 md:gap-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-[10px] md:mb-8 gap-4 sm:gap-0">
        <h1 className="font-display text-[24px] md:text-[30px] leading-normal text-[#1a1210]">
          ORDER MANAGEMENT
        </h1>
        <Link href="/manage/kds" className="bg-[#CD7D39] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors text-center w-full sm:w-auto">
          View KDS
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 flex-1 min-h-0">
        <OrderSidebar 
          activeStatus={activeStatus} 
          onStatusChange={(status) => {
            setActiveStatus(status);
            setCurrentPage(1); // Reset page on filter change
          }} 
        />
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col text-left w-full rounded-xl overflow-hidden shadow-sm bg-[#FAF7F0] border border-gray-200/50 h-[280px]">
                    {/* Header Skeleton */}
                    <div className="flex justify-between items-start p-4 bg-[#efe6d8]">
                      <div>
                        <div className="h-5 w-16 bg-[#e3d6c3] rounded-full animate-pulse mb-2" />
                        <div className="h-3 w-12 bg-[#e3d6c3] rounded-full animate-pulse" />
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="h-3 w-14 bg-[#e3d6c3] rounded-full animate-pulse mb-2" />
                        <div className="h-5 w-12 bg-[#e3d6c3] rounded-full animate-pulse" />
                      </div>
                    </div>
                    {/* Body Skeleton */}
                    <div className="p-4 flex-1 flex flex-col gap-4">
                      <div>
                        <div className="h-4 w-3/4 bg-[#efe6d8] rounded-full animate-pulse mb-2" />
                        <div className="h-3 w-1/2 bg-[#efe6d8] rounded-full animate-pulse ml-5" />
                      </div>
                      <div>
                        <div className="h-4 w-2/3 bg-[#efe6d8] rounded-full animate-pulse" />
                      </div>
                    </div>
                    {/* Footer Actions Skeleton */}
                    <div className="flex w-full mt-auto h-[44px]">
                      <div className="flex-1 bg-[#efe6d8] border-r border-[#e3d6c3] animate-pulse" />
                      <div className="flex-1 bg-[#efe6d8] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-[#7A6A60] bg-white rounded-xl border border-[#F0E6D8]">
                No orders found for this status.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {orders.map(order => (
                  <div key={order.id} className="h-[280px]">
                    <OrderCard 
                      order={order} 
                      onClick={() => setSelectedOrder(order)} 
                      onAction={(type, order) => setConfirmAction({ type, order })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto pt-4">
            <ManagePagination 
              currentPage={currentPage} 
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Detail Modal */}
      <OrderDetailModal 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
        onAction={(type, order) => setConfirmAction({ type, order })}
      />

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmAction !== null}
        onClose={() => {
          setConfirmAction(null);
          setCancelReason("");
          setShowCancelError(false);
        }}
        title={confirmAction?.type === "Cancel" ? "Cancel this order?" : `Confirm ${confirmAction?.type}`}
        description={
          confirmAction?.type === "Cancel" 
            ? "Canceling this order will notify the customer. Do you want to cancel this order?"
            : `Are you sure you want to mark order #${confirmAction?.order.orderNumber} as ${confirmAction?.type === "Deliver" ? "delivered" : "confirmed"}?`
        }
        tone="default"
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setConfirmAction(null);
              setCancelReason("");
              setShowCancelError(false);
            }} disabled={isProcessing}>Back</Button>
            <Button 
              variant={confirmAction?.type === "Cancel" ? "confirm" : "primary"}
              onClick={handleConfirmAction}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : confirmAction?.type === "Cancel" ? "Confirm" : `Yes, ${confirmAction?.type}`}
            </Button>
          </>
        }
      >
        {confirmAction?.type === "Cancel" && (
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea 
              placeholder="Why do you want to cancel this order?"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (e.target.value.trim()) setShowCancelError(false);
              }}
              className={cn(
                "w-full min-h-[100px] p-3 rounded-lg border bg-white text-sm text-foreground focus:outline-none focus:ring-2 placeholder:text-[#A2938A] resize-none transition-colors",
                showCancelError ? "border-red-500 focus:ring-red-500" : "border-[#DDCDB8] focus:ring-[#E8541F]"
              )}
            />
            {showCancelError && (
              <span className="text-[13px] text-red-500 font-medium">Please provide a reason for cancellation.</span>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}