import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KdsOrderCard } from "@/components/manage/kds/kds-order-card";
import { MOCK_ORDERS } from "@/lib/mock-orders";

export default function KdsPage() {
  const kdsOrders = MOCK_ORDERS.filter(o => o.status === "QUEUE" || o.status === "PREP");
  const inQueue = kdsOrders.filter(o => o.status === "QUEUE").length;
  // Mock average prep time
  const avgPrep = "10 MIN";

  return (
    <div className="flex flex-col h-full w-full bg-[#efe6d8]">
      {/* Header */}
      <div className="bg-[#b8352a] border-[#2e2523] border-b flex flex-wrap md:flex-nowrap gap-3 md:gap-[20px] items-center px-4 md:px-[24px] py-[12px] md:py-[18px] shrink-0 w-full z-10 shadow-sm">
        
        {/* Back Button */}
        <Link 
          href="/manage/orders" 
          className="text-[#fbf6ec] hover:opacity-80 transition-opacity flex items-center justify-center"
          title="Back to Orders"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </Link>

        {/* Title */}
        <div className="flex flex-col items-start ml-2 flex-1 md:flex-none">
          <div className="font-display text-[18px] md:text-[22px] tracking-[0.44px] whitespace-nowrap leading-none">
            <span className="text-[#f0b27a]">KITCHEN</span>
            <span>{` `}</span>
            <span className="text-[#fbf6ec]">DISPLAY</span>
          </div>
        </div>
        
        <div className="flex-1 hidden md:block" />
        
        {/* Stats */}
        <div className="flex flex-col items-end text-right justify-center ml-auto md:ml-0">
          <p className="font-bold text-[#fbf6ec] text-[9px] md:text-[10px] tracking-[1.4px] leading-none mb-1">IN QUEUE</p>
          <p className="font-display text-[#f0b27a] text-[18px] md:text-[22px] leading-none">{inQueue}</p>
        </div>
        
        <div className="flex flex-col items-end text-right justify-center ml-4 md:ml-2">
          <p className="font-bold text-[#fbf6ec] text-[9px] md:text-[10px] tracking-[1.4px] leading-none mb-1">AVG PREP</p>
          <p className="font-display text-[#f0b27a] text-[18px] md:text-[22px] leading-none">{avgPrep}</p>
        </div>
      </div>
      
      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-[10px] w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[10px] items-start content-start">
          {kdsOrders.map((order) => (
            <KdsOrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}
