import { Button } from "@/components/ui/button";
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { markRefundedByHand, type RefundRow } from "@/lib/actions/refunds";

/**
 * Refunds for cancelled paid orders (issue #115). The `process-refunds` job
 * sends them every 5 minutes; this is where a manager sees the ones PayMongo
 * refused, refunds them by hand in the PayMongo dashboard, and marks them
 * done. Hidden entirely when there is nothing to show.
 */
export function RefundsPanel({ refunds }: { refunds: RefundRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  if (refunds.length === 0) return null;

  const failed = refunds.filter((r) => r.status === "refund_failed").length;

  const markDone = (transactionId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await markRefundedByHand(transactionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section
      aria-labelledby="refunds"
      className="flex flex-col gap-3 rounded-lg border border-rule bg-white p-4"
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <h2 id="refunds" className="font-display text-2xl leading-normal text-foreground">
          Refunds
        </h2>
        <span className={`text-xs font-bold ${failed > 0 ? "text-destructive" : "text-muted-strong"}`}>
          {failed > 0
            ? `${failed} need${failed === 1 ? "s" : ""} a manual refund in PayMongo`
            : "Cancelled paid orders are refunded automatically every 5 minutes"}
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-rule">
        {refunds.map((refund) => (
          <li
            key={refund.transactionId}
            className="flex flex-col gap-1 py-2 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">
                Order #{refund.orderNumber} · ₱
                {refund.amount.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {refund.status === "refund_failed" && refund.error ? (
                <span className="text-xs text-destructive">{refund.error}</span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={refund.status} />
              {refund.status === "refund_failed" ? (
                <Button variant="unstyled"
                  type="button"
                  disabled={isPending}
                  onClick={() => markDone(refund.transactionId)}
                  className="rounded-md border border-success px-3 py-1 text-xs font-bold text-success disabled:opacity-60"
                >
                  Mark refunded
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="text-xs font-bold text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function StatusBadge({ status }: { status: RefundRow["status"] }) {
  const style = {
    refund_failed: "bg-destructive text-white",
    refund_pending: "bg-amber-100 text-amber-900",
    refunded: "bg-success/20 text-success",
  }[status];
  const label = {
    refund_failed: "Failed",
    refund_pending: "Sending",
    refunded: "Refunded",
  }[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-[0.8px] ${style}`}>
      {label}
    </span>
  );
}
