import { cn } from "@/lib/utils";

import { OrderData } from "@/lib/mock-orders";
import { canCancel, primaryActionFor, statusLabelFor, type StaffAction } from "@/lib/orders/staff-actions";

interface OrderCardProps {
  order: OrderData;
  // The onClick handler allows the parent to open the OrderDetailModal when the card itself is clicked.
  onClick?: () => void;
  // The onAction callback handles specific button interactions (Cancel, Deliver, Confirm)
  // independent of the card's main click handler. This triggers the confirmation dialog.
  onAction?: (type: StaffAction, order: OrderData) => void;
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
    label: "DELIVERING",
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

export function OrderCard({ order, onClick, onAction }: OrderCardProps) {
  const config = statusConfig[order.status];
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
      className="flex flex-col text-left w-full rounded-xl overflow-hidden shadow-sm bg-[#FAF7F0] border border-field-border h-full transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CD7D39]"
    >
      {/* Header */}
      <div className={cn("flex justify-between items-start p-4 text-white", config.headerBg)}>
        <div>
          {/* The same eight characters the customer sees since issue
              #106 — this used to be the id's first four. */}
          <div className="text-xl font-bold tracking-wider leading-none mb-1">
            #{order.orderNumber}
          </div>
          <div className="text-xs font-medium tracking-wide opacity-90">{order.time}</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
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
      {(canCancel(order) || primary) && (
        <div className="flex w-full mt-auto">
          {canCancel(order) && (
            <button 
              onClick={(e) => {
                // e.stopPropagation() prevents the click event from bubbling up to the card's main container.
                // This ensures that clicking "Cancel" only triggers the onAction callback (opening the confirmation dialog),
                // and does not also trigger the onClick callback (opening the details modal).
                e.stopPropagation();
                onAction?.("Cancel", order);
              }}
              className="flex-1 py-3 bg-[#C73926] hover:bg-red-800 transition-colors text-white text-sm font-semibold text-center"
            >
              Cancel
            </button>
          )}
          {primary && (
            <button 
              onClick={(e) => {
                // StopPropagation logic isolates button clicks from card clicks.
                e.stopPropagation();
                onAction?.(primary.type, order);
              }}
              className="flex-1 py-3 bg-[#48995F] hover:bg-green-700 transition-colors text-white text-sm font-semibold text-center"
            >
              {primary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
