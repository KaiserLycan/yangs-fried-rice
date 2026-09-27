import { Bike, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Who walks up to the counter for this order: the customer, or a courier
 * they booked (Lalamove, Grab…). Chosen by the customer at checkout and
 * stored on `order.fulfillment_method`. Orders placed before the choice
 * existed have no value and say so rather than guess.
 */
export function FulfillmentBadge({
  method,
  className,
}: {
  method?: string | null;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider";

  if (method === "3rd_party_courier") {
    return (
      <span className={cn(base, "bg-indigo-600 text-white", className)}>
        <Bike className="h-3 w-3" aria-hidden />
        3rd party courier
      </span>
    );
  }
  if (method === "self_pickup") {
    return (
      <span className={cn(base, "bg-teal-600 text-white", className)}>
        <User className="h-3 w-3" aria-hidden />
        Self pickup
      </span>
    );
  }
  return (
    <span className={cn(base, "bg-[#e3d6c3] text-[#5c4d44]", className)}>
      Pickup by: not specified
    </span>
  );
}
