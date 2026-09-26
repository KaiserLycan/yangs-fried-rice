"use client";

import * as React from "react";

/**
 * Keyboard shortcuts for the app's primary actions.
 *
 * A combo is written `mod+enter`, `/`, `shift+?`, `c` … — `mod` is Ctrl on
 * Windows/Linux and ⌘ on macOS. Single-key shortcuts (`/`, `c`) do not fire
 * while the person is typing in a field; anything with `mod` or `alt` does,
 * because that is the point of Ctrl+Enter-to-submit.
 *
 * Every shortcut registered here is also listed in the "?" help overlay
 * (`components/ui/shortcuts-help.tsx`) via `SHORTCUTS`, so the list the
 * person reads and the keys that work come from one table.
 */
export const SHORTCUTS = {
  submitForm: { combo: "mod+enter", label: "Save / submit the open form" },
  focusSearch: { combo: "/", label: "Search the menu" },
  openCart: { combo: "shift+c", label: "Go to your cart" },
  openOrders: { combo: "shift+o", label: "Go to your orders" },
  placeOrder: { combo: "mod+enter", label: "Place order (checkout)" },
  newItem: { combo: "shift+n", label: "Add a new item (manage screens)" },
  showHelp: { combo: "shift+?", label: "Show keyboard shortcuts" },
} as const;

export type ShortcutName = keyof typeof SHORTCUTS;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
}

export function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantMod = parts.includes("mod");
  const wantShift = parts.includes("shift");
  const wantAlt = parts.includes("alt");

  const mod = event.ctrlKey || event.metaKey;
  if (wantMod !== mod) return false;
  if (wantAlt !== event.altKey) return false;
  // "?" and "/" are shifted characters on some layouts, so shift is only
  // checked when the combo names a letter.
  if (/^[a-z]$/.test(key) && wantShift !== event.shiftKey) return false;

  const pressed = event.key.toLowerCase();
  return pressed === key || (key === "enter" && pressed === "enter");
}

/** The keys as they should be printed: "Ctrl+Enter" / "⌘ Enter". */
export function formatCombo(combo: string, mac = isMac()): string {
  return combo
    .split("+")
    .map((part) => {
      switch (part) {
        case "mod":
          return mac ? "⌘" : "Ctrl";
        case "shift":
          return mac ? "⇧" : "Shift";
        case "alt":
          return mac ? "⌥" : "Alt";
        case "enter":
          return "Enter";
        default:
          return part.length === 1 ? part.toUpperCase() : part;
      }
    })
    .join(mac ? " " : "+");
}

export function useShortcut(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!enabled) return;
    const needsModifier = /mod|alt/.test(combo);

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if (!needsModifier && isTypingTarget(event.target)) return;
      if (!matchesCombo(event, combo)) return;
      event.preventDefault();
      handlerRef.current(event);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled]);
}

/**
 * Ctrl/⌘+Enter submits the given form — the shortcut every editable form in
 * the app shares. Uses `requestSubmit` so the form's own validation and
 * submit handler run exactly as if its button had been clicked, and does
 * nothing while that button is disabled.
 */
export function useSubmitShortcut(
  formRef: React.RefObject<HTMLFormElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  useShortcut(
    SHORTCUTS.submitForm.combo,
    () => {
      const form = formRef.current;
      if (!form) return;
      const submitter = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button[type="submit"]'),
      ).find((button) => button.form === form);
      if (submitter?.disabled) return;
      form.requestSubmit(submitter);
    },
    { enabled },
  );
}
