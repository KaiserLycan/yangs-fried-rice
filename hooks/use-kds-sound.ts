import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The KDS new-order chime.
 *
 * Browsers refuse to play audio until the page has had a click, so sound
 * starts off and the cook turns it on with a button: that click is what
 * unlocks the AudioContext. The chime is synthesised with the Web Audio API,
 * so there is no sound file to ship or fail to load.
 */
export function useKdsSound() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ring = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;

    // Two short rising notes, like a counter bell.
    const notes = [
      { freq: 880, at: 0 },
      { freq: 1318.5, at: 0.18 },
    ];
    for (const note of notes) {
      const start = ctx.currentTime + note.at;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    }
  }, []);

  /** Must run from a click handler — that is what browsers accept as permission. */
  const enable = useCallback(async () => {
    try {
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return false;
      ctxRef.current ??= new AudioCtor();
      await ctxRef.current.resume();
      setEnabled(true);
      ring(); // Confirms to the cook that sound works.
      return true;
    } catch {
      return false;
    }
  }, [ring]);

  const disable = useCallback(() => {
    setEnabled(false);
    void ctxRef.current?.suspend();
  }, []);

  const playChime = useCallback(() => {
    if (enabled) ring();
  }, [enabled, ring]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return { soundEnabled: enabled, enableSound: enable, disableSound: disable, playChime };
}
