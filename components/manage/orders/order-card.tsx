import { cn } from "@/lib/utils";

import type { OrderData } from "@/types/staff-order";
import { useKdsTimer } from "@/hooks/use-kds-timer";
import { FulfillmentBadge } from "@/components/manage/orders/fulfillment-badge";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";

import { Button } from "@/components/ui/button";
interface OrderCardProps {
  order: OrderData;
  // The onClick handler allows the parent to open the OrderDetailModal when the card itself is clicked.
  onClick?: () => void;
  // The onAction callback handles specific button interactions (Cancel, Deliver, Confirm)
  // independent of the card's main click handler. This triggers the confirmation dialog.
  onAction?: (type: StaffAction, order: OrderData) => void;
}

const statusConfig = {
  UNPAID: {
    headerBg: "bg-status-unpaid",
    label: "UNPAID",
  },
  QUEUE: {
    headerBg: "bg-status-received",
    label: "QUEUE",
  },
  PREP: {
    headerBg: "bg-status-preparing",
    label: "PREP",
  },
  DELIVERY: {
    headerBg: "bg-status-ready",
    label: "DELIVERING",
  },
  COMPLETED: {
    headerBg: "bg-status-done",
    label: "COMPLETED",
  },
  CANCELED: {
    headerBg: "bg-status-cancelled",
    label: "CANCELED",
  },
};

export function OrderCard({ order, onClick, onAction }: OrderCardProps) {
  const { timerString, color: timerColor } = useKdsTimer(order.rawCreatedAt);
  const config = statusConfig[order.status];
  const primary = primaryActionFor(order);
  
  // Timer overrides colors only for active orders (QUEUE/PREP)
  let headerBg = config.headerBg;
  if ((order.status === "QUEUE" || order.status === "PREP") && timerColor === "red") {
    headerBg = "bg-destructive animate-pulse";
  } else if ((order.status === "QUEUE" || order.status === "PREP") && timerColor === "amber") {
    headerBg = "bg-warning";
  }

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="flex flex-col text-left w-full rounded-md overflow-hidden shadow-sm bg-background border border-field-border h-full transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-status-preparing"
    >
      {/* Header */}
      <div className={cn("flex justify-between items-start p-4 text-white", headerBg)}>
        <div>
          {/* The same eight characters the customer sees since issue
              #106 — this used to be the id's first four. */}
          <div className="text-lg font-bold tracking-wider leading-none mb-1">
            #{order.orderNumber}
          </div>
          <div className="text-xs font-medium tracking-wide opacity-90">{order.time}</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs font-bold uppercase tracking-widest leading-none mb-1">
            {statusLabelFor(order)}
          </div>
          {(order.status === "QUEUE" || order.status === "PREP") && (
              <div className="text-lg font-bold tracking-wider leading-none">
                {timerString}
              </div>
            )}
        </div>
      </div>

      {/* Who collects it: the customer or their courier */}
      <div className="px-4 pt-2">
        <FulfillmentBadge method={order.fulfillmentMethod} />
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto min-h-0">
        {order.items.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-sm text-foreground">
              <span className="font-bold">{item.quantity}x</span> {item.name}
            </div>
            {/* Add-ons and the line's note on separate rows (P30). */}
            {item.addons && (
              <div className="text-status-received text-xs italic mt-1 pl-5">
                + {item.addons}
              </div>
            )}
            {item.instructions && (
              <div className="text-foreground text-xs mt-1 pl-5">
                <span className="font-bold">Note:</span> {item.instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      {(canCancel(order) || primary) && (
        <div className="flex w-full mt-auto">
          {canCancel(order) && (
            <Button variant="unstyled" 
              onClick={(e) => {
                // e.stopPropagation() prevents the click event from bubbling up to the card's main container.
                // This ensures that clicking "Cancel" only triggers the onAction callback (opening the confirmation dialog),
                // and does not also trigger the onClick callback (opening the details modal).
                e.stopPropagation();
                onAction?.("Cancel", order);
              }}
              className="flex-1 py-3 bg-status-received hover:bg-destructive/90 transition-colors text-white text-sm font-semibold text-center"
            >
              Cancel
            </Button>
          )}
          {primary && (
            <Button variant="unstyled" 
              onClick={(e) => {
                // StopPropagation logic isolates button clicks from card clicks.
                e.stopPropagation();
                onAction?.(primary.type, order);
              }}
              className="flex-1 py-3 bg-status-done hover:bg-success/90 transition-colors text-white text-sm font-semibold text-center"
            >
              {primary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
