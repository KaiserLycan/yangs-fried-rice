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
  | { data: unknown; error: null }
  | { data: null; error: string; code?: string };

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
 * `useTransition` is React's own way to track an async action from a click:
 * `pending` is true from the call until the refresh settles, which is what
 * the disabled state hangs off.
 */
export function useCartAction() {
  const router = useRouter();
  const showToast = useToast();
  const [pending, startTransition] = React.useTransition();

  const run = React.useCallback(
    <R extends ActionResult>(
      action: () => Promise<R>,
      onSuccess?: (data: NonNullable<R["data"]>) => void,
    ) => {
      startTransition(async () => {
        // The actions report failures as `{ error }`, but a dropped
        // connection or a stale deployment makes the call itself throw.
        // Without this catch React would hand that to the nearest error
        // boundary — the whole page replaced by an error, for a button press.
        let result: R;
        try {
          result = await action();
        } catch {
          showToast(NETWORK_FAILED);
          return;
        }
        if (result.error !== null) {
          showToast(result.error);
          return;
        }
        onSuccess?.(result.data as NonNullable<R["data"]>);
        router.refresh();
      });
    },
    [router, showToast],
  );

  return { run, pending };
}
