"use client";

import * as React from "react";

/**
 * Keyboard and screen-reader behaviour for the app's hand-built dropdowns —
 * a trigger `<button>` that opens a list of option `<button>`s.
 *
 * Each dropdown used to wire this up itself, and none of them finished the
 * job: most dismissed through a full-screen `fixed inset-0` div (a click
 * target, not a key handler, so Escape did nothing), none announced itself
 * as a listbox or said whether it was open, and several set `outline-none`
 * on the trigger with no focus ring to replace it. This hook is the one
 * place that behaviour lives:
 *
 * - Escape closes the list and puts focus back on the trigger. Inside a
 *   modal it closes only the list, not the modal around it.
 * - A pointer press anywhere outside the trigger and list closes it, which
 *   replaces the overlay div.
 * - Opening moves focus to the selected option; ArrowUp / ArrowDown / Home /
 *   End move between options, and Tab closes the list and moves on.
 * - ArrowDown on the closed trigger opens it, as a native select does.
 * - `aria-haspopup`, `aria-expanded`, `aria-controls`, `role="listbox"` and
 *   `role="option"` + `aria-selected` are filled in by the prop getters.
 *
 * The visuals stay with each caller; `DROPDOWN_FOCUS_RING` is the focus ring
 * to put on triggers and options.
 */

/** Focus ring for dropdown triggers and options — the brand flame, like inputs. */
export const DROPDOWN_FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8541F] focus-visible:ring-offset-1";

export function useDropdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const baseId = React.useId();
  const labelId = `${baseId}-label`;
  const triggerId = `${baseId}-trigger`;
  const listId = `${baseId}-list`;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Read through a ref so the listeners below are not re-bound every render.
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Capture phase + preventDefault: a <dialog> treats Escape as "close
      // the dialog", and the list is the thing the user means to close.
      event.preventDefault();
      event.stopPropagation();
      onOpenChangeRef.current(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      onOpenChangeRef.current(false);
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Land on the current choice, so Enter on open re-confirms it.
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const target =
      list?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]') ??
      list?.querySelector<HTMLElement>('[role="option"]');
    target?.focus();
  }, [open]);

  const onListKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const options = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    if (options.length === 0) return;
    const current = options.indexOf(document.activeElement as HTMLElement);

    let next: number | null = null;
    if (event.key === "ArrowDown") next = current < 0 ? 0 : Math.min(current + 1, options.length - 1);
    else if (event.key === "ArrowUp") next = current < 0 ? options.length - 1 : Math.max(current - 1, 0);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Tab") onOpenChange(false);

    if (next !== null) {
      event.preventDefault();
      options[next].focus();
    }
  };

  return {
    /** Spread on the visible label, so the trigger can name itself by it. */
    labelProps: { id: labelId },
    triggerProps: {
      ref: triggerRef,
      id: triggerId,
      type: "button" as const,
      "aria-haspopup": "listbox" as const,
      "aria-expanded": open,
      "aria-controls": open ? listId : undefined,
      // Label first, then the current value shown on the button: "Role, Staff".
      "aria-labelledby": `${labelId} ${triggerId}`,
      onClick: () => onOpenChange(!open),
      onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
          onOpenChange(true);
        }
      },
    },
    listProps: {
      ref: listRef,
      id: listId,
      role: "listbox" as const,
      "aria-labelledby": labelId,
      tabIndex: -1,
      onKeyDown: onListKeyDown,
    },
    optionProps: (selected: boolean) => ({
      type: "button" as const,
      role: "option" as const,
      "aria-selected": selected,
    }),
    /** Close and hand focus back to the trigger — call after a choice. */
    close: () => {
      onOpenChange(false);
      triggerRef.current?.focus();
    },
  };
}
