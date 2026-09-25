"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Transient message, shown bottom-of-screen and dismissed on its own.
 *
 * DESIGNER: there is no Figma frame for this. It is derived from the error
 * banner (`components/ui/alert.tsx`) — same radius, same padding, same text
 * size and leading — and now shares its tones and glyphs too, so a failure
 * looks the same whichever of the two announces it.
 *
 * It exists because most of the profile screen's controls are deliberately
 * not wired: server-side work belongs to the backend developer, so a control
 * that cannot yet save says so rather than failing silently or pretending it
 * saved. See `.scratch/profile-page/issues/05-backend-handoff.md`.
 */

/**
 * What kind of thing happened. Everything a toast announced used to look
 * identical, so "Added 2 items to your cart" and "Couldn't reach the server"
 * arrived in the same neutral box (issue #106).
 */
export type ToastTone = "info" | "success" | "error";

type Toast = { id: number; message: string; tone: ToastTone };

/**
 * Surface, border and glyph per tone. The two coloured pairs are the ones
 * `components/ui/alert.tsx` already uses, so a failure looks the same
 * whether it lands in a banner or a toast.
 *
 * `info` is the one that changed most. It used to be `bg-card` (#FFFCF6) on
 * the app's cream background (#FBF6EC) — a three-hundredth of a shade apart,
 * which is why these were reported as invisible. It is now the ink colour
 * with cream text: unmistakable against every screen in the app, and still
 * clearly not an error.
 */
const TONE_STYLES: Record<ToastTone, string> = {
  info: "border-foreground bg-foreground text-background",
  success: "border-green-700/30 bg-green-50 text-green-800",
  error: "border-error-border bg-error-surface text-error-border",
};

const TONE_GLYPHS: Record<ToastTone, string> = {
  info: "i",
  success: "✓",
  error: "!",
};

type ShowToast = (message: string, tone?: ToastTone) => void;

const ToastContext = React.createContext<ShowToast | null>(null);

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

  // `tone` is optional so every existing `showToast(message)` call keeps
  // working and keeps looking neutral.
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
              "pointer-events-auto flex w-full max-w-[380px] items-start gap-[10px] rounded-md border px-[14px] py-[11px]",
              "text-[13px] leading-[18.2px] shadow-[0_10px_20px_rgba(26,18,16,0.12)]",
              "animate-in fade-in slide-in-from-bottom-2",
              TONE_STYLES[toast.tone],
            )}
          >
            {/* Decorative: the message already says what happened, and the
                live region reads it. A screen reader announcing "i" or "!"
                before every toast would be noise. */}
            <span
              aria-hidden="true"
              className="text-[14px] font-bold leading-[18.2px]"
            >
              {TONE_GLYPHS[toast.tone]}
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
 */
export function useToast() {
  const showToast = React.useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return showToast;
}
