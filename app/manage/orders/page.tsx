"use client";

import { useState } from "react";
import Link from "next/link";
import { OrderSidebar, OrderStatus } from "@/components/manage/orders/order-sidebar";
import { OrderCard } from "@/components/manage/orders/order-card";
import { OrderData, MOCK_ORDERS } from "@/lib/mock-orders";
import { OrderDetailModal } from "@/components/manage/orders/order-detail-modal";
import { ManagePagination } from "@/components/manage/manage-pagination";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



// TODO (Backend): Integration Checklist for Order Management
// 1. Data Fetching & State: Replace `dummyOrders` with a real Supabase/API fetch. 
//    Subscribe to real-time updates (Supabase channels) to receive new orders and status changes instantly.
// 2. Mutations: Wire up the confirmation button in the dialog to hit endpoints that update the order status
//    (e.g., to PREP, DELIVERY, COMPLETED, or CANCELED). Make sure to pass `cancelReason` when canceling.
// 3. Pagination & Filtering: Update the `activeStatus` filter and `currentPage` to query the database
//    using skip/limit and WHERE clauses, rather than relying on client-side array filtering.
// 4. UX: Add toast notifications (success/error) and button loading states while waiting for API mutations to resolve.

export default function ManageOrdersPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  
  // ADDED: State to manage the visibility and data context of the generic confirmation dialog.
  // This allows us to reuse one Dialog component for Cancel, Deliver, and Confirm actions.
  const [confirmAction, setConfirmAction] = useState<{ type: 'Cancel' | 'Deliver' | 'Confirm', order: OrderData } | null>(null);
  
  // ADDED: State to capture the cancellation reason and manage validation errors.
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelError, setShowCancelError] = useState(false);

  const filteredOrders = activeStatus === "All" 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(o => {
        if (activeStatus === "Preparation") return o.status === "PREP";
        return o.status.toUpperCase() === activeStatus.toUpperCase();
      });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-[10px] mb-8">
        <h1 className="font-display text-[30px] leading-normal text-[#1a1210]">
          ORDER MANAGEMENT
        </h1>
        <Link href="/manage/kds" className="bg-[#CD7D39] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors">
          View KDS
        </Link>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        <OrderSidebar activeStatus={activeStatus} onStatusChange={setActiveStatus} />
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="h-[280px]">
                  <OrderCard 
                    order={order} 
                    onClick={() => setSelectedOrder(order)} 
                    onAction={(type, order) => setConfirmAction({ type, order })}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4">
            <ManagePagination 
              currentPage={currentPage} 
              totalPages={3} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </div>
      
      <OrderDetailModal 
        isOpen={selectedOrder !== null} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
        onAction={(type, order) => setConfirmAction({ type, order })}
      />

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
            }}>Back</Button>
            <Button 
              variant={confirmAction?.type === "Cancel" ? "confirm" : "primary"}
              onClick={() => {
                // ADDED: Validation check for the Cancel action.
                // If the user tries to confirm a cancellation without providing a reason,
                // we block the action and show the inline error message.
                if (confirmAction?.type === "Cancel" && !cancelReason.trim()) {
                  setShowCancelError(true);
                  return;
                }
                console.log(`${confirmAction?.type} order`, confirmAction?.order.id, cancelReason);
                setConfirmAction(null);
                setSelectedOrder(null);
                setCancelReason("");
                setShowCancelError(false);
              }}
            >
              {confirmAction?.type === "Cancel" ? "Confirm" : `Yes, ${confirmAction?.type}`}
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
