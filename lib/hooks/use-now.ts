import { useEffect, useState } from "react";

/**
 * The current time, re-read every `intervalMs`. For anything drawn from the
 * clock — a pause countdown, "pending for 6 min" — that has to move on
 * without new data arriving.
 */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
