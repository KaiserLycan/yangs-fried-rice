import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
export type OrderStatus = "All" | "Queue" | "Preparation" | "Delivering" | "Completed" | "Canceled" | "Payment Issues";

interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  isManager?: boolean;
}

const getStatuses = (isManager: boolean): OrderStatus[] => {
  const base: OrderStatus[] = ["All", "Queue", "Preparation", "Delivering", "Completed", "Canceled"];
  if (isManager) {
    base.splice(1, 0, "Payment Issues");
  }
  return base;
};

/** The tab holds delivery orders out with a rider AND take-out orders waiting for pick up. */
const TAB_LABELS: Partial<Record<OrderStatus, string>> = {
  Delivering: "Delivering / Pick Up",
};

export function OrderSidebar({ activeStatus, onStatusChange, isManager = false }: OrderSidebarProps) {
  const statuses = getStatuses(isManager);
  return (
    <div className="relative w-full md:w-[200px] flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
      <div className="hidden md:block text-xs font-bold text-muted-foreground mb-2 tracking-wider">ORDER STATUS</div>
      {statuses.map((status) => (
        <Button variant="unstyled"
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            "whitespace-nowrap shrink-0 w-auto md:w-full text-center md:text-left px-4 py-2.5 md:py-3 rounded-md md:rounded-lg text-sm md:text-sm font-semibold transition-colors",
            activeStatus === status
              ? "bg-selected text-black"
              : "text-muted-foreground hover:bg-selected/50 hover:text-black bg-black/5 md:bg-transparent"
          )}
        >
          {TAB_LABELS[status] ?? status}
        </Button>
      ))}
    </div>
  );
}