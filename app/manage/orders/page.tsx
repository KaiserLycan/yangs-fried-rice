"use client";

import { useState } from "react";
import { OrderSidebar, OrderStatus } from "@/components/manage/orders/order-sidebar";
import { OrderCard, OrderData } from "@/components/manage/orders/order-card";
import { OrderPagination } from "@/components/manage/orders/order-pagination";

const dummyOrders: OrderData[] = [
  {
    id: "1",
    orderNumber: "2000",
    time: "12:00AM",
    status: "PREP",
    timer: "5:00",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
  {
    id: "2",
    orderNumber: "0000",
    time: "12:00AM",
    status: "PREP",
    timer: "5:00",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
  {
    id: "3",
    orderNumber: "0000",
    time: "12:00AM",
    status: "CANCELED",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
  {
    id: "4",
    orderNumber: "0000",
    time: "12:00AM",
    status: "DELIVERY",
    timer: "5:00",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
  {
    id: "5",
    orderNumber: "0000",
    time: "12:00AM",
    status: "COMPLETED",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
  {
    id: "6",
    orderNumber: "0000",
    time: "12:00AM",
    status: "QUEUE",
    timer: "5:00",
    items: [
      { quantity: 0, name: "Ordered Item", addons: "Addons" }
    ]
  },
];

export default function ManageOrdersPage() {
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = activeStatus === "All" 
    ? dummyOrders 
    : dummyOrders.filter(o => {
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
        <button className="bg-[#CD7D39] hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-colors">
          View KDS
        </button>
      </div>

      <div className="flex gap-8 flex-1 min-h-0">
        <OrderSidebar activeStatus={activeStatus} onStatusChange={setActiveStatus} />
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="h-[280px]">
                  <OrderCard order={order} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-gray-200">
            <OrderPagination 
              currentPage={currentPage} 
              totalPages={3} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
