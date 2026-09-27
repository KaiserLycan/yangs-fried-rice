"use client";

import * as React from "react";
import { getOrderStatusHistory, type OrderHistoryEntry } from "@/lib/actions/orders";

/**
 * Who moved the order and when, from `order_status_log` (limitations #9,
 * FINALE 9.7). Collapsed by default and loaded only when opened, so the
 * detail modal costs nothing extra for the usual glance.
 */
const STATUS_WORDS: Record<string, string> = {
  awaiting_payment: "Waiting for online payment",
  payment_failed: "Online payment failed",
  pending: "Placed — waiting for staff",
  preparing: "Accepted — cooking",
  ready: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Picked up",
  cancelled: "Cancelled",
};

function when(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function OrderHistory({ orderId }: { orderId: string }) {
  const [entries, setEntries] = React.useState<OrderHistoryEntry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEntries(null);
    setError(null);
  }, [orderId]);

  async function load() {
    if (entries || error) return;
    try {
      const result = await getOrderStatusHistory(orderId);
      if (result.error !== null) setError(result.error);
      else setEntries(result.data);
    } catch {
      setError("Couldn't load this order's history.");
    }
  }

  return (
    <details
      className="mb-6 rounded-md border border-rule"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) void load();
      }}
    >
      <summary className="flex min-h-[44px] cursor-pointer items-center px-4 text-sm font-bold text-foreground">
        History
      </summary>
      <div className="border-t border-rule px-4 py-3 text-sm">
        {error ? (
          <p className="text-destructive">{error}</p>
        ) : entries === null ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground">No status changes recorded.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <li key={index} className="flex flex-col">
                <span className="font-bold text-foreground">
                  {STATUS_WORDS[entry.toStatus] ?? entry.toStatus}
                </span>
                <span className="text-muted-strong">
                  {when(entry.changedAt)} · {entry.changedBy}
                  {entry.reason ? ` · “${entry.reason}”` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
