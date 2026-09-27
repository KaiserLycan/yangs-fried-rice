import { useEffect, useRef, useState } from "react";
import type { OrderData } from "@/types/staff-order";

export function useKdsSound(orders: OrderData[]) {
  const previousOrderIds = useRef<Set<string>>(new Set());
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Browsers block audio unless the user has interacted with the document
    const handleInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
    
    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);
    
    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));

    // Don't play sound on initial load
    if (previousOrderIds.current.size === 0) {
      previousOrderIds.current = currentIds;
      return;
    }

    // Check for new orders
    let hasNewOrder = false;
    for (const id of currentIds) {
      if (!previousOrderIds.current.has(id)) {
        hasNewOrder = true;
        break;
      }
    }

    if (hasNewOrder && hasUserInteracted) {
      try {
        // Create a simple beep using Web Audio API so we don't need external files
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Bell sound synthesis
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } catch (e) {
        console.error("Failed to play notification sound", e);
      }
    }

    previousOrderIds.current = currentIds;
  }, [orders, hasUserInteracted]);
}
