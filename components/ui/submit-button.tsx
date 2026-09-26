"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUTS } from "@/lib/hooks/use-shortcut";

/**
 * The submit button every form uses: disabled until the form is valid (and
 * while it is sending), with a tooltip that says what it does — or, while
 * disabled, what is stopping it — plus the Ctrl/⌘+Enter shortcut.
 */
export function SubmitButton({
  pending = false,
  invalid = false,
  pendingLabel,
  hint,
  blockedHint = "Complete the highlighted fields to continue.",
  wrapperClassName,
  children,
  disabled,
  ...props
}: ButtonProps & {
  pending?: boolean;
  /** The form doesn't pass validation yet. */
  invalid?: boolean;
  pendingLabel?: React.ReactNode;
  /** What pressing it does. */
  hint: string;
  /** Shown instead of `hint` while the button is disabled for `invalid`. */
  blockedHint?: string;
  /** Classes for the tooltip wrapper — e.g. `flex-1` or `w-full`. */
  wrapperClassName?: string;
}) {
  const isDisabled = pending || invalid || Boolean(disabled);
  return (
    <Tooltip
      content={invalid && !pending ? blockedHint : hint}
      shortcut={isDisabled ? undefined : SHORTCUTS.submitForm.combo}
      className={wrapperClassName ?? "w-full md:w-auto"}
    >
      <Button type="submit" disabled={isDisabled} aria-disabled={isDisabled} {...props}>
        {pending && pendingLabel ? pendingLabel : children}
      </Button>
    </Tooltip>
  );
}
