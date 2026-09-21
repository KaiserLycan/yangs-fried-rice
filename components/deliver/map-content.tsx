"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { DeliveryLocation } from "@/lib/mock-deliveries";
import "leaflet/dist/leaflet.css";

if (typeof window !== "undefined") {
  // @ts-ignore - Leaflet routing machine expects L to be globally available
  window.L = L;
  require("leaflet-routing-machine");
}

// Component to trigger Leaflet resize when container changes size
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(map.getContainer());

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

function RoutingMachine({ 
  origin, 
  destination,
  originLabel = "RIDER",
  destinationLabel = "DESTINATION"
}: { 
  origin: DeliveryLocation;
  destination: DeliveryLocation;
  originLabel?: string;
  destinationLabel?: string;
}) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    const createMarkerIcon = (isOrigin: boolean) => {
      const bgColor = isOrigin ? "#1A1210" : "#E8541F";
      const labelText = isOrigin ? originLabel : destinationLabel;
      return L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); width: max-content;">
            <div style="background-color: ${bgColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; font-family: sans-serif; letter-spacing: 1px; margin-bottom: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-align: center;">
              ${labelText}
            </div>
            <div style="background-color: ${bgColor}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    };

    const originLatLng = L.latLng(origin.lat, origin.lng);
    const destLatLng = L.latLng(destination.lat, destination.lng);

    if (!routingControlRef.current) {
      // First time initialization
      const routingControl = (L as any).Routing.control({
        waypoints: [originLatLng, destLatLng],
        lineOptions: {
          styles: [{ color: "#E8541F", opacity: 0.8, weight: 6 }],
          extendToWaypoints: true,
          missingRouteTolerance: 1,
        },
        show: false,
        addWaypoints: false,
        // @ts-ignore - draggableWaypoints is a valid option but missing from some type definitions
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        createMarker: (index: number, waypoint: { latLng: L.LatLng }) => {
          return L.marker(waypoint.latLng, {
            icon: createMarkerIcon(index === 0),
          });
        },
      }).addTo(map);

      routingControlRef.current = routingControl;
    } else {
      routingControlRef.current.setWaypoints([originLatLng, destLatLng]);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          routingControlRef.current.setWaypoints([]);
          map.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (error) {
          console.warn("Leaflet cleanup skipped to prevent crash");
        }
      }
    };
  }, [map, origin, destination, originLabel, destinationLabel]);

  return null;
}

export default function MapContent({ 
  origin, 
  destination,
  originLabel,
  destinationLabel,
  locationIqApiKey
}: { 
  origin: DeliveryLocation; 
  destination: DeliveryLocation; 
  originLabel?: string;
  destinationLabel?: string;
  locationIqApiKey?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) return;
    mapRef.current.invalidateSize();
  }, [mounted]);

  if (!mounted) {
    return <div className="w-full h-full bg-[#E3E8E1] animate-pulse" />;
  }

  const centerLat = (origin.lat + destination.lat) / 2;
  const centerLng = (origin.lng + destination.lng) / 2;

  return (
    <div className="relative z-0 h-full w-full">
      <style>{`
        .leaflet-routing-container {
          display: none !important;
        }
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
          background: #dfe6de;
        }
      `}</style>
      <MapContainer
        ref={mapRef}
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution="&copy; <a href='https://locationiq.com/?ref=link'>LocationIQ</a> &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url={locationIqApiKey ? `https://{s}-tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=${locationIqApiKey}` : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"}
        />
        <MapResizer />
        <RoutingMachine 
          origin={origin} 
          destination={destination} 
          originLabel={originLabel}
          destinationLabel={destinationLabel}
        />
      </MapContainer>
    </div>
  );
}
