"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Transient message, shown bottom-of-screen and dismissed on its own.
 *
 * DESIGNER: there is no Figma frame for this. It is derived from the error
 * banner (`components/ui/alert.tsx`) — same radius, same padding, same text
 * size and leading — recoloured to the neutral raised surface, because the
 * things it announces are not errors.
 *
 * It exists because most of the profile screen's controls are deliberately
 * not wired: server-side work belongs to the backend developer, so a control
 * that cannot yet save says so rather than failing silently or pretending it
 * saved. See `.scratch/profile-page/issues/05-backend-handoff.md`.
 */

type Toast = { id: number; message: string };

const ToastContext = React.createContext<((message: string) => void) | null>(
  null,
);

/** How long a message stays up before removing itself. */
const DISMISS_AFTER_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = React.useCallback(
    (message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message }]);
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
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto w-full max-w-[380px] rounded-md border border-rule bg-card px-[14px] py-[11px]",
              "text-[13px] leading-[18.2px] text-foreground shadow-[0_10px_20px_rgba(26,18,16,0.12)]",
              "animate-in fade-in slide-in-from-bottom-2",
            )}
          >
            {toast.message}
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
