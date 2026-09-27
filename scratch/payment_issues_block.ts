
export type PaymentIssueType = "payment_failed" | "pickup_overdue";

export interface PaymentIssueOrder {
  type: PaymentIssueType;
  order: OrderWithDetails;
}

async function _fetchPaymentIssuesBase(supabase: ReturnType<typeof createClient>): Promise<ActionResult<PaymentIssueOrder[]>> {
  // We need to fetch two groups:
  // 1. payment_failed: (order_status = 'payment_failed' OR (order_status = 'awaiting_payment' AND created_at < 5 mins ago)) AND payment_method IN ('gcash','paymongo')
  // 2. pickup_overdue: order_status = 'ready' AND order_type = 'take_out' AND payment_method IN ('pay_in_store', 'pay-in-store', 'cash') AND ready_at < 90 mins ago

  const { data, error } = await supabase
    .from("order")
    .select(`
      *,
      customer:customer_id ( name, email, phone_number ),
      order_item ( 
        order_item_id, 
        quantity, 
        subtotal, 
        product ( product_name, image_url ),
        order_item_add_on (
          order_item_add_on_id,
          add_on ( add_on_name, price )
        )
      ),
      transaction ( transaction_id, payment_method, payment_status, total_paid )
    `)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return { data: null, error: error?.message || "Failed to fetch payment issues" };
  }

  // Filter in memory for complex conditions
  const now = Date.now();
  const issues: PaymentIssueOrder[] = [];

  for (const order of data as unknown as OrderWithDetails[]) {
    const tx = Array.isArray(order.transaction) ? order.transaction[0] : order.transaction;
    const paymentMethod = tx?.payment_method || "";

    // 1. payment_failed
    const isEwallet = ["gcash", "paymongo"].includes(paymentMethod);
    if (isEwallet) {
      if (order.order_status === "payment_failed") {
        issues.push({ type: "payment_failed", order });
        continue;
      }
      if (order.order_status === "awaiting_payment") {
        const elapsedMins = (now - new Date(order.created_at).getTime()) / 60000;
        if (elapsedMins >= 5) {
          issues.push({ type: "payment_failed", order });
          continue;
        }
      }
    }

    // 2. pickup_overdue
    const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(paymentMethod);
    if (order.order_status === "ready" && order.order_type === "take_out" && isCash && order.ready_at) {
      const elapsedMins = (now - new Date(order.ready_at).getTime()) / 60000;
      if (elapsedMins >= 90) {
        issues.push({ type: "pickup_overdue", order });
      }
    }
  }

  await attachOrderAddOns(supabase, issues.map(i => i.order));
  return { data: issues, error: null };
}

export async function getPaymentIssuesForKds(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase);
}

export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase);
}
