"use client";

import * as React from "react";
import type { z } from "zod";
import {
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";

/**
 * Real-time validation for the app's forms.
 *
 * - A field's error shows the moment the person types in it or leaves it,
 *   not after Submit. Untouched fields stay quiet until Submit is pressed,
 *   so an empty form is not shouting at someone who has not started yet.
 * - `isValid` is the whole schema passing on what is on screen right now, and
 *   is what the Submit button's `disabled` is tied to.
 * - `setServerErrors` puts a backend rejection under the field it is about;
 *   it clears as soon as that field is edited again.
 *
 * Works with uncontrolled inputs: spread `formProps` onto the `<form>` and
 * `read` pulls the values out of its FormData, the way the forms already did
 * on submit.
 *
 * Typing is debounced. Every keystroke used to rebuild the whole FormData and
 * re-parse the entire schema — on signup that is eleven fields plus an
 * address, per character (issue #106). Leaving a field, submitting and
 * mounting all still check immediately, so nothing a person waits on is
 * delayed; only the running commentary while they are mid-word is.
 */

/** Long enough to cover a fast typist's gaps, short enough to feel live. */
const REVALIDATE_DEBOUNCE_MS = 200;
export function useLiveValidation<Values>({
  schema,
  read,
}: {
  schema: z.ZodType<Values, z.ZodTypeDef, unknown>;
  read: (form: FormData) => unknown;
}) {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [clientErrors, setClientErrors] = React.useState<FieldErrors>({});
  const [serverErrors, setServerErrorsState] = React.useState<FieldErrors>({});
  const [isValid, setIsValid] = React.useState(false);

  // `read` is usually an inline arrow; keeping the latest in a ref stops it
  // from re-running the mount effect on every render.
  const readRef = React.useRef(read);
  readRef.current = read;

  const pending = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPending = React.useCallback(() => {
    if (pending.current === null) return;
    clearTimeout(pending.current);
    pending.current = null;
  }, []);

  // Immediate, and the only one that returns a result — a caller that needs
  // an answer (submit) cannot be handed a promise of one later.
  const revalidate = React.useCallback(() => {
    cancelPending();
    const form = formRef.current;
    if (!form) return null;
    const result = schema.safeParse(readRef.current(new FormData(form)));
    setClientErrors(result.success ? {} : fieldErrorsFromIssues(result.error.issues));
    setIsValid(result.success);
    return result;
  }, [schema, cancelPending]);

  const revalidateSoon = React.useCallback(() => {
    cancelPending();
    pending.current = setTimeout(() => {
      pending.current = null;
      revalidate();
    }, REVALIDATE_DEBOUNCE_MS);
  }, [revalidate, cancelPending]);

  // A form that unmounts mid-word — a dialog being closed — must not run a
  // check against a node that is no longer there.
  React.useEffect(() => cancelPending, [cancelPending]);

  // A callback ref rather than a mount effect: profile cards and dialogs only
  // render their <form> while open, so validation has to run whenever the
  // form appears — for the initial values (an edit form opens already valid)
  // and once more after browser autofill has had a chance to fill fields.
  const attach = React.useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (!node) return;
      revalidate();
      setTimeout(revalidate, 500);
    },
    [revalidate],
  );

  const touch = React.useCallback((name: string) => {
    if (!name) return;
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
    setServerErrorsState((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const onChange = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      // Touching is immediate: it is what decides whether this field's error
      // is allowed to show at all, and delaying it would make an error the
      // person has already fixed appear 200ms after they fixed it.
      touch((event.target as HTMLInputElement).name);
      revalidateSoon();
    },
    [touch, revalidateSoon],
  );

  const onBlur = React.useCallback(
    (event: React.FocusEvent<HTMLFormElement>) => {
      const name = (event.target as unknown as HTMLInputElement).name;
      if (!name) return;
      setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
      revalidate();
    },
    [revalidate],
  );

  const errors: FieldErrors = { ...serverErrors };
  for (const [key, message] of Object.entries(clientErrors)) {
    if (!(key in errors) && (submitAttempted || touched.has(key))) {
      errors[key] = message;
    }
  }

  /**
   * Wraps the submit handler: marks every field as shown, re-checks, and only
   * calls `onValid` when the schema passes.
   */
  const handleSubmit = React.useCallback(
    (onValid: (values: Values) => void | Promise<void>) =>
      async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitAttempted(true);
        const result = revalidate();
        if (!result || !result.success) return;
        await onValid(result.data);
      },
    [revalidate],
  );

  const setServerErrors = React.useCallback((next: FieldErrors | null | undefined) => {
    setServerErrorsState(next ?? {});
  }, []);

  const reset = React.useCallback(() => {
    setTouched(new Set());
    setSubmitAttempted(false);
    setServerErrorsState({});
  }, []);

  return {
    formRef,
    formProps: { ref: attach, onChange, onBlur, noValidate: true } as const,
    errors: errors as Partial<Record<Extract<keyof Values, string>, string>> & FieldErrors,
    isValid: isValid && Object.keys(serverErrors).length === 0,
    handleSubmit,
    setServerErrors,
    revalidate,
    touch,
    reset,
  };
}

/**
 * The same behaviour for a form whose values live in React state (the
 * manager's employee dialog), where there is no `<form>` to read from.
 * Call `touch(name)` from each input's onChange/onBlur.
 */
export function useValidatedValues<Values>(
  schema: z.ZodType<Values, z.ZodTypeDef, unknown>,
  values: unknown,
) {
  const [touched, setTouched] = React.useState<ReadonlySet<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [serverErrors, setServerErrorsState] = React.useState<FieldErrors>({});

  const result = React.useMemo(() => schema.safeParse(values), [schema, values]);
  const allErrors = result.success ? {} : fieldErrorsFromIssues(result.error.issues);

  const errors: FieldErrors = { ...serverErrors };
  for (const [key, message] of Object.entries(allErrors)) {
    if (!(key in errors) && (submitAttempted || touched.has(key))) errors[key] = message;
  }

  const touch = React.useCallback((name: string) => {
    setTouched((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
    setServerErrorsState((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const reset = React.useCallback(() => {
    setTouched(new Set());
    setSubmitAttempted(false);
    setServerErrorsState({});
  }, []);

  const attemptSubmit = React.useCallback(() => setSubmitAttempted(true), []);

  /**
   * Stable across renders, and a no-op when nothing actually changed.
   *
   * Both halves matter. This used to be an inline arrow in the returned
   * object, so every render handed callers a new function — and a caller
   * that mirrors a prop into here, as the employee modal does:
   *
   *     useEffect(() => { setServerErrors(serverErrors); },
   *               [serverErrors, setServerErrors]);
   *
   * saw its dependency change on every render. Effect runs, state is set,
   * component re-renders, a new function appears, effect runs again:
   * "Maximum update depth exceeded", and the render loop pegs the main
   * thread. The page still paints, so it looks fine — but nothing responds
   * to a click, including navigation elsewhere on the screen, because React
   * never gets an idle moment to process the event. That was reported as
   * "the sidebar doesn't work on /manage/employee".
   *
   * The equality check is the second half: `next ?? {}` produced a brand new
   * empty object each call, so even a stable function would have re-rendered
   * every consumer that passes null.
   */
  const setServerErrors = React.useCallback(
    (next: FieldErrors | null | undefined) => {
      setServerErrorsState((prev) => {
        const incoming = next ?? {};
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(incoming);
        if (
          prevKeys.length === nextKeys.length &&
          prevKeys.every((key) => prev[key] === incoming[key])
        ) {
          return prev;
        }
        return incoming;
      });
    },
    [],
  );

  return {
    errors,
    isValid: result.success && Object.keys(serverErrors).length === 0,
    parsed: result.success ? result.data : null,
    touch,
    attemptSubmit,
    setServerErrors,
    reset,
  };
}
