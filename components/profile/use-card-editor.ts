"use client";

import * as React from "react";
import type { z } from "zod";
import { useLiveValidation } from "@/lib/forms/use-live-validation";
import { useSubmitShortcut } from "@/lib/hooks/use-shortcut";
import {
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";

/**
 * First message per field wins — a field with two failing rules should say
 * one thing, not stack them. Kept for callers that map issues themselves.
 */
export function fieldErrorsFrom<Values>(
  issues: z.ZodIssue[],
): Partial<Record<keyof Values, string>> {
  return fieldErrorsFromIssues(issues) as Partial<Record<keyof Values, string>>;
}

/**
 * What `onValid` may hand back:
 *   - `false` keeps the card open (the save failed; the caller already said why)
 *   - `{ fieldErrors }` keeps it open and puts each message under its field
 *   - anything else closes the card
 */
type OnValidResult = boolean | void | { fieldErrors?: FieldErrors | null };

/**
 * The behaviour every read/edit card on the profile screen shares: which
 * state it is in, live field errors while it is open, whether Save may be
 * pressed, and what happens when it is cancelled.
 *
 * Validation is live (see `useLiveValidation`): a field's error appears as
 * it is typed in or left, `isValid` drives the Save button's `disabled`, and
 * a server rejection lands under the field it names. Ctrl/⌘+Enter saves.
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
  schema: z.ZodType<Values, z.ZodTypeDef, unknown>;
  /** Pulls this card's fields out of its form. */
  read: (form: FormData) => unknown;
  /** Runs only when everything parsed. */
  onValid: (values: Values) => Promise<OnValidResult> | OnValidResult;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const live = useLiveValidation<Values>({ schema, read });
  const { reset } = live;

  useSubmitShortcut(live.formRef, { enabled: isEditing });

  // Closing the card unmounts the form, and that is what makes Cancel restore
  // the values that were on screen: the inputs are uncontrolled, so the next
  // Edit mounts them fresh from the stored profile rather than from whatever
  // was half-typed.
  const cancel = React.useCallback(() => {
    setIsEditing(false);
    reset();
  }, [reset]);

  const handleSubmit = live.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const outcome = await onValid(values);
      if (outcome && typeof outcome === "object" && outcome.fieldErrors) {
        live.setServerErrors(outcome.fieldErrors);
        return;
      }
      if (outcome !== false) cancel();
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    isEditing,
    isSubmitting,
    edit: () => setIsEditing(true),
    cancel,
    errors: live.errors,
    isValid: live.isValid,
    formProps: live.formProps,
    formRef: live.formRef,
    setServerErrors: live.setServerErrors,
    handleSubmit,
  };
}
