"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { switchOrderToCashOnDelivery } from "@/lib/actions/cart";

/**
 * The way out of a wallet payment that will not go through.
 *
 * A wallet order is held at `awaiting_payment` — or `payment_failed` once
 * PayMongo refuses it — and nobody cooks it while it sits there. Issue #106
 * asks for exactly two ways forward from that state: pay again, or switch to
 * cash on delivery. `PaymentStatusCard` owns the first; this is the second.
 *
 * On success the order becomes `pending` and joins the kitchen queue, so the
 * page is refreshed rather than navigated: the receipt it re-renders is the
 * same one, now with a Track link.
 */
export function SwitchToCodButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const showToast = useToast();
  const [pending, setPending] = React.useState(false);

  async function handleSwitch() {
    setPending(true);
    const result = await switchOrderToCashOnDelivery(orderId);

    if (result.error) {
      showToast(result.error);
      setPending(false);
      return;
    }

    showToast("Switched to cash on delivery — pay the rider when it arrives.");
    // Deliberately not clearing `pending`: the refresh replaces this button
    // with the Track link, and a button that woke up in between invites a
    // second switch on an order that has already moved.
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSwitch()}
      disabled={pending}
      className="rounded-[13px] border border-rule bg-card p-[16px] text-center text-[15px] font-bold text-foreground transition-colors hover:bg-black/5 disabled:opacity-60"
    >
      {pending ? "Switching…" : "Switch to Cash on Delivery"}
    </button>
  );
}
