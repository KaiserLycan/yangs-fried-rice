"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { DeliveryLocation } from "@/lib/mock-deliveries";

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

    // Create a custom icon for markers
    const createMarkerIcon = (isOrigin: boolean) => {
      const bgColor = isOrigin ? "#1A1210" : "#E8541F";
      const labelText = isOrigin ? originLabel : destinationLabel;
      
      return L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="display: flex; flex-direction: column; items-center: center; transform: translate(-50%, -100%); width: max-content;">
            <div style="background-color: ${bgColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; font-family: sans-serif; letter-spacing: 1px; margin-bottom: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); text-align: center;">
              ${labelText}
            </div>
            <div style="background-color: ${bgColor}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); margin: 0 auto;"></div>
          </div>
        `,
        iconSize: [0, 0], // Size is handled by the translate transform
        iconAnchor: [0, 0] // Anchor at the very bottom center (due to translate)
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
          missingRouteTolerance: 1
        },
        show: false, // Hide the turn-by-turn instruction box
        addWaypoints: false,
        // @ts-ignore - draggableWaypoints is a valid option but missing from some type definitions
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        createMarker: (i: number, waypoint: any, n: number) => {
          return L.marker(waypoint.latLng, {
            icon: createMarkerIcon(i === 0)
          });
        }
      }).addTo(map);

      routingControlRef.current = routingControl;
    } else {
      // Update existing control
      routingControlRef.current.setWaypoints([originLatLng, destLatLng]);
    }

    return () => {
      // Only clean up when the map is actually unmounting.
      // Next.js fast refresh might still trigger this, but updating waypoints instead of recreating
      // fixes the normal navigation errors. We catch just in case.
      if (routingControlRef.current && map) {
        // Do not immediately remove here to avoid the Leaflet removeLayer null bug when destination changes.
        // We let the map tear down handle it naturally if the map unmounts.
      }
    };
  }, [map, origin, destination, originLabel, destinationLabel]);

  return null;
}

export default function MapContent({ 
  origin, 
  destination,
  originLabel,
  destinationLabel
}: { 
  origin: DeliveryLocation; 
  destination: DeliveryLocation; 
  originLabel?: string;
  destinationLabel?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-[#E3E8E1] animate-pulse" />;
  }

  // Calculate center between origin and destination for initial view
  const centerLat = (origin.lat + destination.lat) / 2;
  const centerLng = (origin.lng + destination.lng) / 2;

  return (
    <div className="w-full h-full relative z-0">
      <style>{`
        /* Force hide the unstyled routing instructions list */
        .leaflet-routing-container {
          display: none !important;
        }
      `}</style>
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={14} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
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
