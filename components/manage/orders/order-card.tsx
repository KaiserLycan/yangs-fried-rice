import { cn } from "@/lib/utils";

export type OrderData = {
  id: string;
  orderNumber: string;
  time: string;
  status: "QUEUE" | "PREP" | "DELIVERY" | "COMPLETED" | "CANCELED";
  timer?: string;
  items: {
    quantity: number;
    name: string;
    addons?: string;
  }[];
};

interface OrderCardProps {
  order: OrderData;
}

const statusConfig = {
  QUEUE: {
    headerBg: "bg-[#C73926]",
    label: "QUEUE",
  },
  PREP: {
    headerBg: "bg-[#CD7D39]",
    label: "PREP",
  },
  DELIVERY: {
    headerBg: "bg-[#507A9D]",
    label: "DELIVERY",
  },
  COMPLETED: {
    headerBg: "bg-[#48995F]",
    label: "COMPLETED",
  },
  CANCELED: {
    headerBg: "bg-[#797167]",
    label: "CANCELED",
  },
};

export function OrderCard({ order }: OrderCardProps) {
  const config = statusConfig[order.status];

  return (
    <div className="flex flex-col rounded-xl overflow-hidden shadow-sm bg-[#FAF7F0] border border-gray-200/50 h-full">
      {/* Header */}
      <div className={cn("flex justify-between items-start p-4 text-white", config.headerBg)}>
        <div>
          <div className="text-xl font-bold tracking-wider leading-none mb-1">
            #{order.orderNumber}
          </div>
          <div className="text-xs font-medium tracking-wide opacity-90">{order.time}</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
            {config.label}
          </div>
          {order.timer && (
            <div className="text-lg font-bold tracking-wider leading-none">
              {order.timer}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1">
        {order.items.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-sm text-gray-900">
              <span className="font-bold">{item.quantity}x</span> {item.name}
            </div>
            {item.addons && (
              <div className="text-[#C73926] text-xs italic mt-1 pl-5">
                {item.addons}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {(order.status === "QUEUE" || order.status === "PREP") && (
        <div className="flex w-full mt-auto">
          <button className="flex-1 py-3 bg-[#C73926] hover:bg-red-800 transition-colors text-white text-sm font-semibold text-center">
            Cancel
          </button>
          <button className="flex-1 py-3 bg-[#48995F] hover:bg-green-700 transition-colors text-white text-sm font-semibold text-center">
            {order.status === "QUEUE" ? "Confirm" : "Deliver"}
          </button>
        </div>
      )}
    </div>
  );
}
