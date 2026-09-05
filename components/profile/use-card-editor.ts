"use client";

import * as React from "react";
import type { z } from "zod";

/**
 * First message per field wins — a field with two failing rules should say
 * one thing, not stack them.
 *
 * Exported so a dialog form whose open/close isn't owned by this hook (the
 * delivery-address form, opened and closed by its parent's own dialog state)
 * can still use the same field-error mapping `useCardEditor` uses, rather
 * than an independently-maintained copy of this loop drifting from it.
 */
export function fieldErrorsFrom<Values>(
  issues: z.ZodIssue[],
): Partial<Record<keyof Values, string>> {
  const next: Partial<Record<keyof Values, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as keyof Values;
    next[key] ??= issue.message;
  }
  return next;
}

/**
 * The behaviour every read/edit card on the profile screen shares: which
 * state it is in, the field errors from its last submit, and what happens
 * when it is cancelled.
 *
 * `ProfileCard` is the chrome and this is the conduct. They are separate
 * because a card that only displays values — the delivery address in its
 * collapsed state, say — wants the chrome without any of this.
 *
 * Each card calls this for itself. Nothing here is shared between cards, and
 * that is the point: hoisting it into one parent is exactly how opening one
 * card would start closing another.
 */
export function useCardEditor<Values extends Record<string, unknown>>({
  schema,
  read,
  onValid,
}: {
  schema: z.ZodType<Values>;
  /** Pulls this card's fields out of its form. */
  read: (form: FormData) => unknown;
  /** Runs only when everything parsed. Today: raise the toast. */
  onValid: (values: Values) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof Values, string>>
  >({});

  // Closing the card unmounts the form, and that is what makes Cancel restore
  // the values that were on screen: the inputs are uncontrolled, so the next
  // Edit mounts them fresh from the stored profile rather than from whatever
  // was half-typed.
  const cancel = React.useCallback(() => {
    setIsEditing(false);
    setErrors({});
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse(read(new FormData(event.currentTarget)));

    if (!result.success) {
      setErrors(fieldErrorsFrom<Values>(result.error.issues));
      return;
    }

    cancel();
    onValid(result.data);
  }

  return {
    isEditing,
    edit: () => setIsEditing(true),
    cancel,
    errors,
    handleSubmit,
  };
}
