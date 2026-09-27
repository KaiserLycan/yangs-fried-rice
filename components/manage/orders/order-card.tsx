import { cn } from "@/lib/utils";

import type { OrderData } from "@/types/staff-order";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";
import { isPendingTooLong } from "@/lib/orders/order-stage";
import { Button } from "@/components/ui/button";

interface OrderCardProps {
  order: OrderData;
  // The onClick handler allows the parent to open the OrderDetailModal when the card itself is clicked.
  onClick?: () => void;
  // The onAction callback handles specific button interactions (Cancel, Deliver, Confirm)
  // independent of the card's main click handler. This triggers the confirmation dialog.
  onAction?: (type: StaffAction, order: OrderData) => void;
  /**
   * The page's clock, ticked by `useNow` so a card starts flashing without
   * a refetch. An order unaccepted for 5 minutes flashes (issue #115).
   */
  now?: Date;
}

const statusConfig = {
  QUEUE: {
    headerBg: "bg-status-received",
  },
  PREP: {
    headerBg: "bg-status-preparing",
  },
  DELIVERY: {
    headerBg: "bg-status-ready",
  },
  COMPLETED: {
    headerBg: "bg-status-done",
  },
  CANCELED: {
    headerBg: "bg-status-cancelled",
  },
};

export function OrderCard({ order, onClick, onAction, now }: OrderCardProps) {
  const config = statusConfig[order.status];
  const waitingTooLong = isPendingTooLong(order.pendingAt, now);
  const primary = primaryActionFor(order);

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
      data-waiting-too-long={waitingTooLong || undefined}
      className={cn(
        "flex flex-col text-left w-full rounded-md overflow-hidden shadow-sm bg-background border border-field-border h-full transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-status-preparing",
        waitingTooLong && "pending-flash",
      )}
    >
      {/* Header */}
      <div className={cn("flex justify-between items-start p-4 text-white", config.headerBg)}>
        <div>
          {/* The same eight characters the customer sees since issue
              #106 — this used to be the id's first four. */}
          <div className="text-lg font-bold tracking-wider leading-none mb-1">
            #{order.orderNumber}
          </div>
          <div className="text-xs leading-4 font-medium tracking-wide opacity-90">{order.time}</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-xs font-bold uppercase tracking-widest leading-none mb-1">
            {statusLabelFor(order)}
          </div>
          {order.timer && (
            <div className="text-lg font-bold tracking-wider leading-none">
              {order.timer}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 overflow-y-auto min-h-0">
        {order.seniorPwd && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-100/90 px-3 py-2 text-xs font-semibold text-amber-950">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-600 animate-pulse" />
              Verify ID · {order.seniorPwd.type === "senior_citizen" ? "Senior Citizen" : "PWD"}
            </span>
            <span className="font-bold">−₱{order.seniorPwd.discount.toFixed(2)}</span>
          </div>
        )}

        {order.items.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <div className="font-semibold text-sm leading-5 text-gray-900">
              <span className="font-bold">{item.quantity}x</span> {item.name}
            </div>
            {/* Add-ons and the line's note on separate rows (P30). */}
            {item.addons && (
              <div className="text-status-received text-xs leading-4 italic mt-1 pl-5">
                + {item.addons}
              </div>
            )}
            {item.instructions && (
              <div className="text-gray-800 text-xs leading-4 mt-1 pl-5">
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
              className="flex-1 py-3 bg-status-received hover:bg-red-800 transition-colors text-white text-sm leading-5 font-semibold text-center"
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
              className="flex-1 py-3 bg-status-done hover:bg-green-700 transition-colors text-white text-sm leading-5 font-semibold text-center"
            >
              {primary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
