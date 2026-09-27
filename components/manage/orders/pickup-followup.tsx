"use client";

import * as React from "react";
import { Loader2, RotateCcw, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markOrderNoShow, undoOrderPickedUp } from "@/lib/actions/orders";
import { NO_SHOW_REASONS, UNDO_PICKUP_MINUTES, type NoShowReason } from "@/lib/checkout/order-rules";
import type { OrderData } from "@/types/staff-order";

/**
 * What the counter can do after an order is ready (panel feedback F14,
 * FINALE 9.9):
 *   - ready for pickup → "Customer didn't pick up", with a reason. Two on
 *     pay-in-store orders and the account can't pay in store again.
 *   - picked up in the last 10 minutes → "Undo Picked up", for a greasy
 *     tablet or the wrong ticket tapped. The database enforces the window.
 */
export function PickupFollowup({
  order,
  onChanged,
  now = new Date(),
}: {
  order: OrderData;
  onChanged?: () => void;
  now?: Date;
}) {
  const [reason, setReason] = React.useState<NoShowReason | "">("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isReady = order.status === "DELIVERY";
  const completedAt = order.rawCompletedAt ? new Date(order.rawCompletedAt).getTime() : null;
  const canUndo =
    order.status === "COMPLETED" &&
    completedAt !== null &&
    now.getTime() - completedAt < UNDO_PICKUP_MINUTES * 60_000;

  if (!isReady && !canUndo) return null;

  async function run(action: () => Promise<{ error: string | null }>) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result.error) setError(result.error);
    else onChanged?.();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-track bg-background px-6 py-4">
      {isReady && (
        <>
          <label htmlFor={`no-show-${order.id}`} className="text-sm font-bold text-foreground">
            Customer didn&apos;t pick up?
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              id={`no-show-${order.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value as NoShowReason)}
              className="h-11 flex-1 rounded-md border border-field-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="">Choose why…</option>
              {Object.entries(NO_SHOW_REASONS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <Button
              variant="unstyled"
              type="button"
              disabled={!reason || pending}
              onClick={() => reason && run(() => markOrderNoShow(order.id, reason))}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-status-cancelled px-4 text-sm font-bold text-white hover:bg-status-cancelled/90"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserX className="size-4" aria-hidden />}
              Mark not picked up
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Cancels the order and counts a missed pick-up. Two on pay-in-store orders and the customer must pay by wallet.
          </p>
        </>
      )}

      {canUndo && (
        <Button
          variant="unstyled"
          type="button"
          disabled={pending}
          onClick={() => run(() => undoOrderPickedUp(order.id))}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-field-border bg-card px-4 text-sm font-bold text-foreground hover:bg-highlight"
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
          Undo &ldquo;Picked up&rdquo; — back to ready
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
