"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Transient message, shown bottom-of-screen and dismissed on its own.
 *
 * DESIGNER: there is no Figma frame for this. It is derived from the error
 * banner (`components/ui/alert.tsx`) — same radius, same padding, same text
 * size and leading, same leading glyph. It used to sit on `bg-card`, which is
 * #FFFCF6 on a #FBF6EC page: the two differ by about 1% lightness, so the
 * toast was all but invisible. Every tone is now a solid fill with light
 * text, so it reads against cream, white and the dark console alike.
 *
 * It exists because most of the profile screen's controls are deliberately
 * not wired: server-side work belongs to the backend developer, so a control
 * that cannot yet save says so rather than failing silently or pretending it
 * saved. See `.scratch/profile-page/issues/05-backend-handoff.md`.
 */

/**
 * `info` is the default, so the two-dozen callers written before tones
 * existed keep working unchanged — they just become readable.
 */
export type ToastTone = "info" | "success" | "error";

type Toast = { id: number; message: string; tone: ToastTone };

type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = React.createContext<ShowToast | null>(null);

const TONE_STYLES: Record<ToastTone, { surface: string; glyph: string }> = {
  info: { surface: "bg-foreground text-background", glyph: "i" },
  success: { surface: "bg-success text-white", glyph: "✓" },
  error: { surface: "bg-error-border text-white", glyph: "!" },
};

/** How long a message stays up before removing itself. */
const DISMISS_AFTER_MS = 4000;

export function ToastProvider({
  children,
  aboveTabBar = false,
}: {
  children: React.ReactNode;
  /**
   * Set this on a screen that renders `BottomTabBar`. That bar is fixed to
   * the bottom edge on mobile, and a toast sitting `16px` from the same edge
   * lands on top of it — covering the tabs for the four seconds it is up.
   * Off by default: most screens have no bar, and lifting the toast on those
   * would leave it floating over empty space.
   */
  aboveTabBar?: boolean;
}) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback<ShowToast>(
    (message, tone = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* The live region is always mounted, empty or not. Assistive
          technology only announces changes inside a region it was already
          watching, so a region that appears along with its first message
          tends to go unread. */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-4 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:items-end",
          // Clears the bar by the same 16px this sits from the screen edge
          // everywhere else. Desktop has no bar to clear.
          aboveTabBar
            ? "bottom-[calc(var(--tab-bar-height)_+_1rem)] md:bottom-4"
            : "bottom-4",
        )}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            data-tone={toast.tone}
            className={cn(
              "pointer-events-auto flex w-full max-w-[380px] items-start gap-[10px] rounded-md px-[14px] py-[11px]",
              "text-[13px] leading-[18.2px] shadow-[0_10px_24px_rgba(26,18,16,0.28)]",
              "animate-in fade-in slide-in-from-bottom-2",
              TONE_STYLES[toast.tone].surface,
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold leading-none"
            >
              {TONE_STYLES[toast.tone].glyph}
            </span>
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Raise a toast from anywhere beneath a `ToastProvider`.
 *
 * Throws rather than no-oping when the provider is missing: a control whose
 * only feedback is a toast would otherwise look wired while doing nothing at
 * all, which is the exact failure this component exists to prevent.
 *
 * `showToast(message)` is neutral; pass `"success"` or `"error"` as the second
 * argument when the message reports an outcome.
 */
export function useToast(): ShowToast {
  const showToast = React.useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return showToast;
}
