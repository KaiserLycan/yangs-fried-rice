import { useState, useEffect } from "react";

export type TimerColor = "default" | "amber" | "red";

export function useKdsTimer(rawTimestamp?: string | null, amberMins: number = 15, redMins: number = 25) {
  const [timerString, setTimerString] = useState("0:00");
  const [color, setColor] = useState<TimerColor>("default");

  useEffect(() => {
    if (!rawTimestamp) {
      setTimerString("0:00");
      setColor("default");
      return;
    }

    const created = new Date(rawTimestamp).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsedMs = now - created;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      
      if (elapsedSec < 0) {
        setTimerString("0:00");
        setColor("default");
        return;
      }

      const m = Math.floor(elapsedSec / 60);
      const s = elapsedSec % 60;
      setTimerString(`${m}:${s.toString().padStart(2, "0")}`);

      if (m >= redMins) {
        setColor("red");
      } else if (m >= amberMins && m < redMins) {
        setColor("amber");
      } else {
        setColor("default");
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [rawTimestamp, amberMins, redMins]);

  return { timerString, color };
}
