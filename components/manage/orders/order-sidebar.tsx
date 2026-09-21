import { cn } from "@/lib/utils";

export type OrderStatus = "All" | "Queue" | "Preparation" | "Delivering" | "Completed" | "Canceled";

interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
}

const statuses: OrderStatus[] = [
  "All",
  "Queue",
  "Preparation",
  "Delivering",
  "Completed",
  "Canceled",
];

/** The tab holds delivery orders out with a rider AND take-out orders waiting for pick up. */
const TAB_LABELS: Partial<Record<OrderStatus, string>> = {
  Delivering: "Delivering / Pick Up",
};

export function OrderSidebar({ activeStatus, onStatusChange }: OrderSidebarProps) {
  return (
    <div className="w-full md:w-[200px] flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
      <div className="hidden md:block text-xs font-bold text-gray-500 mb-2 tracking-wider">ORDER STATUS</div>
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            "whitespace-nowrap shrink-0 w-auto md:w-full text-center md:text-left px-4 py-2.5 md:py-3 rounded-[10px] md:rounded-lg text-[13px] md:text-sm font-semibold transition-colors",
            activeStatus === status
              ? "bg-[#efdfc6] text-black"
              : "text-gray-600 hover:bg-[#efdfc6]/50 hover:text-black bg-black/5 md:bg-transparent"
          )}
        >
          {TAB_LABELS[status] ?? status}
        </button>
      ))}
    </div>
  );
}