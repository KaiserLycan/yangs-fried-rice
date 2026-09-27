import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type OrderStatus = "All" | "PaymentIssues" | "Received" | "Preparing" | "Ready" | "PickedUp" | "Cancelled";

interface OrderSidebarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  isManager?: boolean;
}

/**
 * The Orders tabs, named exactly as the customer's timeline names the same
 * stages (docs/copy-glossary.md): Order received → Preparing → Ready for
 * pickup → Picked up, or Cancelled. The shop is pickup-only (#114), so the old
 * "Delivering / Pick Up" tab is "Ready for pickup"; it still lists any legacy
 * order left at out_for_delivery so staff can finish it.
 */
export const ORDER_TABS: {
  id: OrderStatus;
  label: string;
  dbStatus?: string | string[];
  /** Wallet payments that are stuck or failed: a manager's job to chase. */
  managerOnly?: boolean;
}[] = [
  { id: "All", label: "All" },
  { id: "PaymentIssues", label: "Payment issues", managerOnly: true },
  { id: "Received", label: "Received", dbStatus: "pending" },
  { id: "Preparing", label: "Preparing", dbStatus: "preparing" },
  { id: "Ready", label: "Ready for pickup", dbStatus: ["ready", "out_for_delivery"] },
  { id: "PickedUp", label: "Picked up", dbStatus: "completed" },
  { id: "Cancelled", label: "Cancelled", dbStatus: "cancelled" },
];

/** The `order_status` value(s) a tab lists; undefined for All. */
export function dbStatusForTab(tab: OrderStatus): string | string[] | undefined {
  return ORDER_TABS.find((t) => t.id === tab)?.dbStatus;
}

export function OrderSidebar({ activeStatus, onStatusChange, isManager = false }: OrderSidebarProps) {
  return (
    <div className="relative w-full md:w-[200px] flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
      <div className="hidden md:block text-xs leading-4 font-bold text-muted-foreground mb-2 tracking-wider">ORDER STATUS</div>
      {ORDER_TABS.filter((tab) => isManager || !tab.managerOnly).map(({ id: status, label }) => (
        <Button variant="unstyled"
          key={status}
          onClick={() => onStatusChange(status)}
          className={cn(
            "whitespace-nowrap shrink-0 w-auto md:w-full text-center md:text-left px-4 py-2.5 md:py-3 rounded-md md:rounded-lg text-sm md:text-sm md:leading-5 font-semibold transition-colors",
            activeStatus === status
              ? "bg-selected text-black"
              : "text-muted-foreground hover:bg-selected/50 hover:text-black bg-black/5 md:bg-transparent"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}