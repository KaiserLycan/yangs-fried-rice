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
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  tone = "default",
  placement = "center",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  tone?: "default" | "danger";
  /**
   * Where the panel sits on a small screen. `center` is the profile screen's
   * dialog, centred at every width. `sheet` is the cancel-order frames
   * (`132:603`, `133:1251`): anchored to the bottom edge on mobile, and the
   * same centred 440px modal from `md` up.
   *
   * One component with a placement rather than a second Sheet component:
   * everything a confirmation has to get right — Escape, focus, inertness,
   * top-layer stacking — is identical either way, and only the panel's
   * position, radius, padding and heading size move.
   */
  placement?: "center" | "sheet";
  /** Optional body between the description and the footer. */
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const sheet = placement === "sheet";
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape closes the dialog natively, but React still owns `open`, so
      // the default is prevented and the same handler runs as every other
      // dismissal. Without this the element closes while state says it is
      // open, and it cannot be reopened.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A click that lands on the dialog element itself rather than on the
      // panel inside it is a backdrop click. This works only because the
      // element carries no padding of its own.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      // overflow-visible undoes the `overflow: auto` the browser's own
      // stylesheet puts on every <dialog>. That default makes the element a
      // scroll container, and a scroll container clips whatever is painted
      // outside it — which is the whole of the panel's glow and drop shadow.
      // Without this the modal renders as a flat rectangle on a dimmed page.
      className={cn(
        "max-w-[440px] overflow-visible bg-transparent p-0",
        // A sheet is pushed to the bottom edge by the auto margin above it,
        // and inset 18px from the three edges it touches. From `md` up it is
        // the centred modal again, so the desktop frame is unaffected.
        sheet
          ? "mx-auto mb-[18px] mt-auto w-[calc(100%-36px)] md:my-auto md:w-[calc(100%-2rem)]"
          : "m-auto w-[calc(100%-2rem)]",
        "backdrop:bg-foreground/40",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-[12px] bg-background",
          sheet
            ? "rounded-[22px] p-[22px] md:rounded-[20px] md:p-[26px]"
            : "rounded-[20px] p-[26px]",
          tone === "danger"
            ? "border border-primary shadow-[0_0_10px_hsl(var(--primary))]"
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
    </dialog>
  );
}
