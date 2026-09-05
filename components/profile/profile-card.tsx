"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The read/edit card the profile screen is built out of, and the pattern the
 * addresses and password cards copy.
 *
 * A card has two states and the header is what distinguishes them. Displaying:
 * a title and an Edit control. Editing: the title, an "EDITING" marker, a
 * Cancel control, and a flame border around the whole card so it is obvious
 * at a glance which card is open. The body is the caller's — only the chrome
 * lives here, because the fields differ in every card and the chrome does not.
 *
 * The card does not own `isEditing`. Each card on the screen keeps its own
 * copy so that opening one leaves the others alone, and hoisting the state
 * into a shared parent is exactly how that stops being true.
 */
export function ProfileCard({
  id,
  title,
  isEditing,
  onEdit,
  onCancel,
  children,
}: {
  /** Anchor target for the sidebar's in-page links. */
  id?: string;
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  // Ties the header's controls to the body they open and close, so assistive
  // technology reads them as one card rather than a loose button and a form.
  const bodyId = `${React.useId()}-body`;

  return (
    <section
      id={id}
      aria-label={title}
      className={cn(
        "overflow-hidden rounded-sm border bg-card",
        isEditing ? "border-accent" : "border-rule",
      )}
    >
      <div className="flex items-center gap-[10px] border-b border-rule bg-background px-[14px] py-[12px] md:gap-[12px] md:px-[18px] md:py-[14px]">
        <h2 className="font-display text-[15px] tracking-[0.3px] text-foreground md:text-[17px] md:tracking-[0.34px]">
          {title}
        </h2>

        {isEditing ? (
          <span className="rounded-sm bg-rule px-[8px] py-[4px] text-[10.5px] font-bold uppercase tracking-[1.05px] text-primary md:text-[11px] md:tracking-[1.1px]">
            Editing
          </span>
        ) : null}

        <div className="ml-auto">
          {/* One control that swaps label and handler, rather than two that
              take turns being hidden — the frames draw them in the same slot
              at the same size, and a single button keeps focus where it was
              when the card changes state. */}
          <button
            type="button"
            onClick={isEditing ? onCancel : onEdit}
            aria-expanded={isEditing}
            aria-controls={bodyId}
            className="rounded-sm border border-rule bg-card px-[15px] py-[11px] text-[13px] font-bold text-foreground hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 md:py-[8px]"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div id={bodyId} className="p-[14px] md:p-[18px]">
        {children}
      </div>
    </section>
  );
}

/**
 * Label, control and error inside a card body.
 *
 * Not `components/ui/field.tsx`: that one is the auth screens' field, and the
 * frames give the card fields a different label — 10.5px at 1.47px tracking
 * rather than 11px at 1.1px — and add a hint line beneath the control that
 * the auth field has no slot for. Two shapes, so two components, rather than
 * one component with a mode.
 */
export function CardField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  /**
   * Explanation under the control. An error replaces it rather than stacking
   * beneath it — the line is one slot, and a customer reading why their entry
   * was rejected does not also need to be told what the field is for.
   */
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px] md:gap-[5px]">
      <span className="text-[10.5px] font-bold uppercase tracking-[1.47px] text-muted-foreground">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}
      </span>
      {children}
      {error ? (
        <p className="text-[12px] text-primary">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * A stored value in a card's display state.
 *
 * `emptyState` covers a field with nothing in it yet — date of birth today,
 * since its column does not exist. Drawn as visible placeholder copy rather
 * than an empty line, so the customer can tell the field is blank apart from
 * the page being broken.
 */
export function CardValue({
  value,
  emptyState,
}: {
  value: string;
  emptyState?: string;
}) {
  if (!value && emptyState) {
    return <p className="text-[15px] text-placeholder">{emptyState}</p>;
  }
  return <p className="text-[15px] text-foreground">{value}</p>;
}

/**
 * A text control inside a card body.
 *
 * The card fields are visibly not the auth screens' fields — 8px radius on
 * the cream raised surface rather than 12px on white, and tighter padding —
 * so the treatment lives here once instead of being pasted onto every
 * `Input` on the screen. `components/ui/input.tsx` stays generic.
 *
 * No border colour is set: `Input` owns that, and naming one here would win
 * the class merge and swallow the invalid state.
 */
export function CardInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(
        "rounded-sm bg-card px-[12px] py-[13px] text-[15px] md:py-[11px] md:text-[14px]",
        className,
      )}
      {...props}
    />
  );
}
