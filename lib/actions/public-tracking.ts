"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/order-number";

/**
 * Order status for someone holding the tracking link, signed in or not
 * (FINALE "More things": updates without an account). The link's token is
 * checked by `get_public_order_tracking()`, which returns nothing personal.
 */
export type PublicTrackedOrder = {
  orderId: string;
  orderNumber: string;
  orderStatus: string | null;
  orderType: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  placedAt: string | null;
  completedAt: string | null;
  pendingAt: string | null;
  promisedAt: string | null;
  readyAt: string | null;
  items: { name: string; quantity: number; subtotal: number }[];
  statusLog: { toStatus: string | null; changedAt: string }[];
  payment: { method: string | null; status: string | null; due: number } | null;
};

const idsSchema = z.object({ orderId: z.string().uuid(), token: z.string().uuid() });

type Row = {
  order_id: string;
  order_number: number | null;
  order_status: string | null;
  order_type: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
  completed_at: string | null;
  pending_at: string | null;
  promised_at: string | null;
  ready_at: string | null;
  items: { name: string; quantity: number; subtotal: number }[];
  status_log: { to_status: string | null; changed_at: string }[];
  payment: { method: string | null; status: string | null; due: number } | null;
};

export async function readPublicOrderTracking(
  orderId: string,
  token: string,
): Promise<PublicTrackedOrder | null> {
  const parsed = idsSchema.safeParse({ orderId, token });
  if (!parsed.success) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_order_tracking", {
    p_order_id: parsed.data.orderId,
    p_token: parsed.data.token,
  });
  if (error || !data) return null;

  const row = data as unknown as Row;
  return {
    orderId: row.order_id,
    orderNumber: formatOrderNumber(row.order_number, row.order_id),
    orderStatus: row.order_status,
    orderType: row.order_type,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    placedAt: row.created_at,
    completedAt: row.completed_at,
    pendingAt: row.pending_at,
    promisedAt: row.promised_at,
    readyAt: row.ready_at,
    items: (row.items ?? []).map((item) => ({ ...item, subtotal: Number(item.subtotal) })),
    statusLog: (row.status_log ?? []).map((entry) => ({ toStatus: entry.to_status, changedAt: entry.changed_at })),
    payment: row.payment ? { ...row.payment, due: Number(row.payment.due) } : null,
  };
}
