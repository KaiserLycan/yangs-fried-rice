"use client";

import { useEffect, useState } from "react";
import { DeliveryDetailsPanel } from "@/components/deliver/delivery-details-panel";
import { DeliveryMap } from "@/components/deliver/delivery-map";
import { MOCK_DELIVERIES, DeliveryLocation } from "@/lib/mock-deliveries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DeliveryDetailsPage() {
  const params = useParams();
  const deliveryId = params?.deliveryId as string;
  const delivery = MOCK_DELIVERIES.find(d => d.id === deliveryId) || MOCK_DELIVERIES[0];

  const [currentLocation, setCurrentLocation] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation(delivery.origin);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.warn("Geolocation tracking failed, falling back to mock origin.", error);
        setCurrentLocation(delivery.origin);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [delivery.origin]);

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      
      {/* Mobile Back Button - floats over the map */}
      <Link 
        href="/deliver"
        className="md:hidden absolute top-[16px] left-[16px] z-20 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md flex items-center justify-center text-[#1A1210] hover:bg-white"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link>

      {/* Interactive Route Map */}
      <div className="flex-1 w-full relative min-h-[300px]">
        {currentLocation ? (
          <DeliveryMap 
            origin={currentLocation} 
            destination={delivery.destination} 
          />
        ) : (
          <div className="w-full h-full bg-[#E3E8E1] animate-pulse flex items-center justify-center text-[#4A5E44]/60 font-bold tracking-widest text-[14px]">
            LOCATING RIDER...
          </div>
        )}
      </div>

      {/* Details Panel (anchored to bottom) */}
      <div className="shrink-0 w-full bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] -mt-[24px] z-10 overflow-hidden flex flex-col max-h-[60vh] md:max-h-[50vh]">
        <DeliveryDetailsPanel deliveryId={deliveryId} />
      </div>
    </div>
  );
}
