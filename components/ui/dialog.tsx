"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Confirmation dialog, from the profile screen's two frames (`2050:30`,
 * `2050:43`).
 *
 * Built on the native `<dialog>` element rather than a hand-rolled overlay.
 * `showModal()` gives us the things a confirmation dialog has to get right —
 * Escape to dismiss, focus moved inside on open and returned to the trigger
 * on close, the rest of the page made inert, and top-layer stacking that no
 * z-index can lose — none of which are worth reimplementing.
 *
 * The two frames are one component with a `tone`, not two dialogs: they share
 * their radius, padding, gap and the whole footer, and differ only in the
 * heading colour and the panel's border and shadow.
 *
 * The frames draw a white fill behind the button row. That reads as a stray
 * fill on an auto-layout frame rather than intent — it would paint a white
 * band across a cream panel — so it is not reproduced. Flagged for the
 * designer.
 *
 * Unsaved edits: pass `dirty` from a form dialog and every way of dismissing
 * it — Escape, a click on the backdrop, and a Cancel button that calls
 * `useDialogRequestClose()` — asks "Discard changes?" first instead of
 * throwing the typing away. Closing by setting `open` to false (what a parent
 * does after a successful save) never asks.
 */

/**
 * Ask the enclosing dialog to close, going through its unsaved-changes guard.
 * Outside a `DialogRoot` there is no guard, so it falls back to `fallback`.
 */
const DialogRequestCloseContext = React.createContext<(() => void) | null>(null);

export function useDialogRequestClose(fallback: () => void): () => void {
  return React.useContext(DialogRequestCloseContext) ?? fallback;
}

/**
 * The same hook for a component that renders its own `DialogRoot` and so
 * cannot call it from outside the provider: render the Cancel button through
 * this, inside the dialog, and it receives the guarded close.
 */
export function DialogDismiss({
  fallback,
  children,
}: {
  fallback: () => void;
  children: (requestClose: () => void) => React.ReactNode;
}) {
  return <>{children(useDialogRequestClose(fallback))}</>;
}

export function DialogRoot({
  open,
  onClose,
  children,
  className,
  placement = "modal",
  dirty = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  placement?: "sheet" | "modal";
  /** The form inside has unsaved edits; confirm before dismissing. */
  dirty?: boolean;
}) {
  const sheet = placement === "sheet";
  const ref = React.useRef<HTMLDialogElement>(null);
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setConfirmingDiscard(false);
  }, [open]);

  // Put focus on the safe choice, so a reflexive Enter keeps the edits.
  React.useEffect(() => {
    if (confirmingDiscard) keepEditingRef.current?.focus();
  }, [confirmingDiscard]);

  const requestClose = React.useCallback(() => {
    if (dirty) setConfirmingDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  const discard = () => {
    setConfirmingDiscard(false);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        // Escape on the discard prompt backs out of the prompt, not the form.
        if (confirmingDiscard) setConfirmingDiscard(false);
        else requestClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current && !confirmingDiscard) requestClose();
      }}
      className={cn(
        "max-w-[440px] overflow-visible bg-transparent p-0",
        // A sheet is pushed to the bottom edge by the auto margin above it,
        // and inset 18px from the three edges it touches. From `md` up it is
        // the centred modal again, so the desktop frame is unaffected.
        sheet
          ? "mx-auto mb-[18px] mt-auto w-[calc(100%-36px)] md:my-auto md:w-[calc(100%-2rem)]"
          : "m-auto w-[calc(100%-2rem)]",
        "backdrop:bg-foreground/40",
        className
      )}
    >
      <DialogRequestCloseContext.Provider value={requestClose}>
        {children}
      </DialogRequestCloseContext.Provider>
      {confirmingDiscard ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-discard-title"
          aria-describedby="dialog-discard-description"
          className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-foreground/40 p-4"
        >
          <div className="flex w-full max-w-[340px] flex-col gap-[12px] rounded-[20px] bg-background p-[22px] shadow-[0_30px_35px_rgba(26,18,16,0.26)]">
            <h2 id="dialog-discard-title" className="font-display text-[22px] leading-normal text-foreground">
              Discard changes?
            </h2>
            <p id="dialog-discard-description" className="text-[13px] leading-[19.5px] text-muted-strong">
              You have edits that haven&rsquo;t been saved. If you close now, they&rsquo;ll be lost.
            </p>
            <div className="flex gap-[10px] pt-[6px]">
              <button
                ref={keepEditingRef}
                type="button"
                onClick={() => setConfirmingDiscard(false)}
                className="flex-1 rounded-[13px] border border-field-border py-[10px] text-[14px] font-bold text-muted-strong transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={discard}
                className="flex-1 rounded-[13px] bg-primary py-[10px] text-[14px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  tone = "default",
  children,
  footer,
  placement = "modal",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  tone?: "default" | "danger";
  /** Optional body between the description and the footer. */
  children?: React.ReactNode;
  footer: React.ReactNode;
  placement?: "sheet" | "modal";
}) {
  const titleId = React.useId();
  const sheet = placement === "sheet";

  return (
    <DialogRoot open={open} onClose={onClose} placement={placement}>
      <div
        className={cn(
          "flex flex-col gap-[12px] bg-background",
          sheet
            ? "rounded-[22px] p-[22px] md:rounded-[20px] md:p-[26px]"
            : "rounded-[20px] p-[26px]",
          tone === "danger"
            ? "border border-primary shadow-[0_30px_35px_rgba(26,18,16,0.26)]"
            : "shadow-[0_30px_35px_rgba(26,18,16,0.26)]",
        )}
      >
        <h2
          id={titleId}
          className={cn(
            "font-display leading-normal",
            sheet ? "text-[22px] md:text-[26px]" : "text-[26px]",
            tone === "danger" ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </h2>

        {description ? (
          <p className="text-[13px] leading-[19.5px] text-muted-strong">
            {description}
          </p>
        ) : null}

        {children}

        {/* The sheet stacks its buttons because a 390px screen has no room
            for two side by side; the desktop modal keeps them in a row. */}
        <div
          className={cn(
            "flex justify-center gap-[10px] pt-[6px]",
            sheet && "flex-col md:flex-row",
          )}
        >
          {footer}
        </div>
      </div>
    </DialogRoot>
  );
}
