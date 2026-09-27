import type { createClient } from "@/lib/supabase/server";
import { orderCancelledEmail } from "@/lib/email/order-cancelled";
import { sendEmail } from "@/lib/email/send-email";
import { formatOrderNumber } from "@/lib/orders/order-number";

/**
 * Emails the customer that their order was cancelled (F23, issue #118).
 *
 * Called by the two actions that cancel an order — staff through
 * `updateOrderStatus`, the customer through `cancelCustomerOrder` — *after*
 * the cancel has been saved. It never throws and never fails the cancel: an
 * order that is cancelled in the database but whose email bounced is still
 * cancelled, and the in-app notification (written by the database trigger)
 * still reaches the customer.
 *
 * Reads through the caller's own session, not the service role: staff may
 * read every order and customer, and a customer their own, which is exactly
 * what this needs.
 */
export async function notifyOrderCancelled(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
  cancelledBy: "store" | "customer",
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("order")
      .select(
        "order_id, cancellation_reason, customer:customer_id ( email, first_name ), transaction ( payment_method, payment_status, total_paid, subtotal, discount_amount )",
      )
      .eq("order_id", orderId)
      .maybeSingle();

    const customer = first(order?.customer);
    const email = customer?.email?.trim();
    if (!order || !email) return;

    const transaction = first(order.transaction);
    // `total_paid` is filled when money arrives; fall back to what the order
    // came to for a row where it was never written.
    const amount = transaction
      ? Number(transaction.total_paid) > 0
        ? Number(transaction.total_paid)
        : Math.max(0, Number(transaction.subtotal ?? 0) - Number(transaction.discount_amount ?? 0))
      : 0;

    const message = orderCancelledEmail({
      firstName: customer?.first_name ?? null,
      orderNumber: formatOrderNumber(order.order_id),
      reason: order.cancellation_reason,
      cancelledBy,
      payment: transaction
        ? { method: transaction.payment_method, status: transaction.payment_status, amount }
        : null,
    });

    const result = await sendEmail({ to: email, ...message });
    if (!result.sent && result.reason === "failed") {
      console.error(`Cancellation email for order ${orderId} was not sent: ${result.detail}`);
    }
  } catch (error) {
    console.error(`Cancellation email for order ${orderId} was not sent:`, error);
  }
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
