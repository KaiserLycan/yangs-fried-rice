import { useEffect, useState } from "react";
import type { StoreStatus } from "@/lib/store/store-status";

/** How often the banner re-asks. A pause reaches customers within this. */
const POLL_MS = 60_000;

/**
 * The shop's open / paused / busy status, from `/api/store/status`, kept
 * fresh by polling.
 *
 * Null until the first answer arrives, so callers draw nothing rather than
 * flashing "closed" (or "open") before they know. A failed poll keeps the
 * last answer: the database checks again at checkout either way.
 */
export function useStoreStatus(): StoreStatus | null {
  const [status, setStatus] = useState<StoreStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/store/status", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as StoreStatus;
        if (!cancelled) setStatus(next);
      } catch {
        // Keep the last answer.
      }
    };

    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return status;
}
