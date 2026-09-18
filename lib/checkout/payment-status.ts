/**
 * What the confirmation screen says about an order's payment, folded from
 * its `transaction` rows.
 *
 * An order can own more than one row: `create-payment-intent` reuses a
 * pending row when there is one, but a retry after a `failed` row inserts a
 * fresh pending one beside it. So the status is read across all of them,
 * not from "the" row — a paid row settles it whatever else is there, an
 * open pending row means the wallet has not answered yet, and only when
 * every attempt failed is the order reported as failed.
 */
export type PaymentStatus = "paid" | "refunded" | "pending" | "failed";

export function foldPaymentStatus(
  rows: { payment_status: string | null }[],
): PaymentStatus | null {
  const statuses = rows.map((row) => row.payment_status?.trim().toLowerCase());
  if (statuses.includes("paid")) return "paid";
  if (statuses.includes("refunded")) return "refunded";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("failed")) return "failed";
  return null;
}
