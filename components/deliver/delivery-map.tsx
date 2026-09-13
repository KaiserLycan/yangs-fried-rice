"use client";

import dynamic from "next/dynamic";
import { DeliveryLocation } from "@/lib/mock-deliveries";

// Leaflet interacts directly with the DOM and requires the window object.
// Loading it dynamically with ssr: false ensures it only runs on the client.
const MapContent = dynamic(() => import("./map-content"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#E3E8E1] animate-pulse flex items-center justify-center text-[#4A5E44]/60 font-bold tracking-widest text-[14px]">LOADING MAP...</div>
});

export function DeliveryMap({ origin, destination }: { origin: DeliveryLocation, destination: DeliveryLocation }) {
  return (
    <div className="w-full h-full">
      <MapContent origin={origin} destination={destination} />
    </div>
  );
}
