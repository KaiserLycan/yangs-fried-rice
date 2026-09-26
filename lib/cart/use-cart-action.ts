"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

/**
 * The shape every write in `lib/actions/cart.ts` returns: exactly one of
 * `data` and `error` is set. Typed here rather than imported because the
 * backend keeps its `ActionResult` private.
 */
const NETWORK_FAILED = "Couldn’t reach the server. Please try again.";

type ActionResult =
  { data: unknown; error: null } | { data: null; error: string; code?: string };

/**
 * Runs one cart write from a button, the same way for all of them: the
 * control is disabled while the action is in flight (so a double tap can't
 * add a dish twice), a failure shows the backend's own message in a toast,
 * and a success re-reads the page so the server's value is what renders.
 *
 * That last step is the point. The quantity on a cart line is the persisted
 * value, not local state — ticket 04 rejected faking the number moving
 * because it "looks like it worked but vanishes on refresh". `router.refresh()`
 * re-runs the Server Components for the current route, so the new quantity
 * arrives the same way the old one did, from `readCart()`.
 *
 * `pending` is true from the press until the refresh settles, in two parts:
 *
 * - `inFlight` covers the network call, tracked by hand. On React 18
 *   `useTransition` only scopes the synchronous part of its callback, so an
 *   `await` inside one is invisible to it (React 19 changes this).
 * - `refreshing` covers the re-read. `router.refresh()` is wrapped in its own
 *   sync `startTransition`, the pattern Next documents, so `isPending` holds
 *   until the new Server Component output has actually rendered — not just
 *   until the refresh was requested.
 */
export function useCartAction() {
  const router = useRouter();
  const showToast = useToast();
  const [inFlight, setInFlight] = React.useState(false);
  const [refreshing, startTransition] = React.useTransition();

  const run = React.useCallback(
    <R extends ActionResult>(
      action: () => Promise<R>,
      onSuccess?: (data: NonNullable<R["data"]>) => void | Promise<void>,
    ) => {
      setInFlight(true);
      void (async () => {
        try {
          // The actions report failures as `{ error }`, but a dropped
          // connection or a stale deployment makes the call itself throw.
          // Without this catch the rejection would go unhandled — an error
          // in the console and a button that silently did nothing.
          let result: R;
          try {
            result = await action();
          } catch {
            showToast(NETWORK_FAILED, "error");
            startTransition(() => router.refresh());
            return;
          }
          if (result.error !== null) {
            showToast(result.error, "error");
            startTransition(() => router.refresh());
            return;
          }
          // Awaited so a follow-up that is itself a network call — starting
          // an online payment after the order exists — keeps the button
          // disabled until it has finished too.
          await onSuccess?.(result.data as NonNullable<R["data"]>);
          startTransition(() => router.refresh());
        } finally {
          setInFlight(false);
        }
      })();
    },
    [router, showToast],
  );

  return { run, pending: inFlight || refreshing };
}
