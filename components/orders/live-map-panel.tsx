import { cn } from "@/lib/utils";
import { DeliveryMap } from "@/components/deliver/delivery-map";
import { RESTAURANT_LOCATION } from "@/lib/mock-deliveries";

/**
 * The map panel — now integrated with Leaflet to show real map rendering.
 */
export function LiveMapPanel({
  riderName,
  destinationCoordinates,
  className,
  locationIqApiKey,
}: {
  riderName: string | null;
  destinationCoordinates?: { lat: number; lng: number } | null;
  className?: string;
  locationIqApiKey?: string;
}) {

  return (
    <div
      role="region"
      aria-label={
        riderName
          ? `Live map showing rider ${riderName} delivering this order.`
          : "Order is still being prepared. This is the restaurant location."
      }
      className={cn(
        "relative overflow-clip bg-map-surface",
        "h-[168px] border-b border-map-border",
        "md:h-full md:min-h-[470px] md:rounded-lg md:border md:border-rule",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        {destinationCoordinates ? (
          <DeliveryMap 
            origin={RESTAURANT_LOCATION} 
            destination={destinationCoordinates} 
            originLabel={riderName ? "RIDER" : "RESTAURANT"}
            locationIqApiKey={locationIqApiKey}
          />
        ) : (
          <div className="w-full h-full bg-[#E3E8E1] flex items-center justify-center text-[#4A5E44]/60 font-bold tracking-widest text-[14px]">
            MAP NOT AVAILABLE
          </div>
        )}
      </div>

      <div className="relative z-10 flex h-full items-center justify-center pointer-events-none md:hidden">
        <span 
          className="text-[11px] font-bold tracking-[1.32px] text-map-label"
          style={{ textShadow: "0 1px 4px rgba(255,255,255,0.8)" }}
        >
          LIVE MAP
        </span>
      </div>

      {/* The frame captions this "Rider Ariel S. · 2.4 km away". */}
      <div className="absolute bottom-[20px] left-[22px] z-10 hidden rounded-md bg-foreground px-[16px] py-[12px] md:block pointer-events-none">
        <p className="text-[13px] leading-[19.5px] text-on-ink">
          {riderName ? `Rider ${riderName}` : "Yang's Fried Rice"}
        </p>
        <p className="text-[13px] leading-[19.5px] text-on-ink-muted">
          {riderName ? "Live map" : "Restaurant location"}
        </p>
      </div>
    </div>
  );
}
