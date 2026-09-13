import { cn } from "@/lib/utils";

export type OrderStatus = "All" | "Queue" | "Preparation" | "Delivery" | "Completed" | "Canceled";

interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}

const statuses: OrderStatus[] = [
  "All",
  "Queue",
  "Preparation",
  "Delivery",
  "Completed",
  "Canceled",
];

export function OrderSidebar({ activeStatus, onStatusChange }: OrderSidebarProps) {
  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col gap-2">
      <div className="text-xs font-bold text-gray-500 mb-2 tracking-wider">ORDER STATUS</div>
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            "w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
            activeStatus === status
              ? "bg-[#efdfc6] text-black"
              : "text-gray-600 hover:bg-[#efdfc6]/50 hover:text-black"
          )}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
