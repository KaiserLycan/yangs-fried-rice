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
export function DialogRoot({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-[440px] overflow-visible bg-transparent p-0",
        "backdrop:bg-foreground/40",
        className
      )}
    >
      {children}
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
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  tone?: "default" | "danger";
  /** Optional body between the description and the footer. */
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const titleId = React.useId();

  return (
    <DialogRoot open={open} onClose={onClose}>
      <div
        className={cn(
          "flex flex-col gap-[12px] rounded-[20px] bg-background p-[26px]",
          tone === "danger"
            ? "border border-primary shadow-[0_30px_35px_rgba(26,18,16,0.26)]"
            : "shadow-[0_30px_35px_rgba(26,18,16,0.26)]",
        )}
      >
        <h2
          id={titleId}
          className={cn(
            "font-display text-[26px] leading-normal",
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

        <div className="flex justify-center gap-[10px] pt-[6px]">{footer}</div>
      </div>
    </DialogRoot>
  );
}
