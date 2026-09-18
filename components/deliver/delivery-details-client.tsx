"use client";

import { useEffect, useState } from "react";
import { DeliveryDetailsPanel } from "@/components/deliver/delivery-details-panel";
import { DeliveryMap } from "@/components/deliver/delivery-map";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export type DeliveryDetailsClientProps = {
  initialDelivery: {
    id: string;
    customer: string;
    address: string;
    phone: string;
    notes: string;
    paymentMethod: string;
    total: number;
    status: "ready" | "delivering" | "completed";
    items: { qty: number; name: string }[];
    proofOfDelivery?: string | null;
    deliveryStatus?: string | null;
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  };
};

export function DeliveryDetailsClient({ initialDelivery }: DeliveryDetailsClientProps) {
  const [delivery, setDelivery] = useState(initialDelivery);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!delivery || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation tracking failed, falling back to database origin.", error);
        setCurrentLocation(delivery.origin);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [delivery]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#E8541F]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
      <Link
        href="/deliver"
        className="md:hidden absolute top-[16px] left-[16px] z-20 bg-white/90 backdrop-blur rounded-full p-2.5 shadow-md flex items-center justify-center text-[#1A1210] hover:bg-white"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link>

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

      <div className="shrink-0 w-full bg-white rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] -mt-[24px] z-10 overflow-hidden flex flex-col max-h-[60vh] md:max-h-[50vh]">
        <DeliveryDetailsPanel delivery={delivery} />
      </div>
    </div>
  );
}
