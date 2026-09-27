"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_DISABLED_CODE,
  EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";
import { resolveEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/actions/admin";
import {
  orderStatusSchema,
  isValidTransition,
  orderFilterSchema,
  UNPAID_ORDER_STATUSES,
  type OrderStatus,
  type OrderFilters,
} from "@/lib/validation/orders";
import { isPickupOrder } from "@/lib/orders/format";
import { orderIdRangeFor } from "@/lib/orders/order-number";
import { notifyOrderCancelled } from "@/lib/email/notify-order-cancelled";
import type { Tables, TablesUpdate } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; code?: string };

type Order = Tables<"order">;

type OrderWithDetails = Order & { ready_at?: string | null;
  customer: { name: string; email: string | null; phone_number: string | null } | null;
  order_item: {
    order_item_id: string;
    quantity: number;
    subtotal: number;
    special_instructions: string | null;
    /** Snapshot of what was ordered — see `lib/orders/item-name.ts`. */
    product_name: string | null;
    unit_price: number | null;
    product: { product_name: string; product_price: number } | null;
    order_item_add_on: { add_on: { name: string; price: number } | null }[] | null;
  }[];
  order_add_on: { price: number | null }[] | null;
  transaction: {
    transaction_id: string;
    payment_method: string | null;
    payment_status: string | null;
    total_paid: number | null;
  }[];
};

type OrderSummary = {
  order_id: string;
  order_status: string | null;
  order_type: string | null;
  created_at: string | null;
  customer: { name: string } | null;
  item_count: number;
  total_paid: number | null;
};

type OrderStats = {
  pending: number;
  preparing: number;
  out_for_delivery: number;
  completed: number;
  cancelled: number;
  total: number;
};

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

export async function getEmployeeAccess(): Promise<ActionResult<{ employee_id: string; role: string; isManager: boolean }>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };
  return { data: { employee_id: auth.data.employee_id, role: auth.data.role, isManager: auth.data.role.toLowerCase() === 'manager' }, error: null };
}

async function requireManageAccess(): Promise<
  ActionResult<{ employee_id: string; role: EmployeeRole }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  const { data: employee, error } = await supabase
    .from("employee")
    .select("employee_id, role, is_account_disabled")
    .eq("employee_id", user.id)
    .single();

  if (error || !employee) {
    return { data: null, error: "You are not registered as an employee." };
  }

  // A disabled account can still hold a live session; refuse it here too
  // (issue #114).
  if (employee.is_account_disabled) {
    return {
      data: null,
      error: EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
      code: ACCOUNT_DISABLED_CODE,
    };
  }

  const role = resolveEmployeeRole(employee.role);
  if (!role || !canAccessManage(role)) {
    return {
      data: null,
      error: "You do not have permission to manage orders.",
    };
  }

  return {
    data: { employee_id: employee.employee_id, role },
    error: null,
  };
}

/**
 * Order-level add-ons (`order_add_on`) are loaded in their own query instead of
 * being embedded in the order select. An embed makes the WHOLE orders list fail
 * ("Could not find a relationship between 'order' and 'order_add_on'") whenever
 * that table is missing or PostgREST's schema cache is stale; a separate read
 * just leaves the add-ons empty in that case, and the orders still load.
 */
async function attachOrderAddOns(
  supabase: ReturnType<typeof createClient>,
  orders: OrderWithDetails[],
): Promise<void> {
  const ids = orders.map((order) => order.order_id);
  for (const order of orders) order.order_add_on = [];
  if (ids.length === 0) return;

  const { data, error } = await supabase
    .from("order_add_on")
    .select("order_id, price")
    .in("order_id", ids);

  if (error || !data) return;

  for (const row of data) {
    const order = orders.find((o) => o.order_id === row.order_id);
    if (order) (order.order_add_on ??= []).push({ price: row.price });
  }
}

// ---------------------------------------------------------------------------
// Order listing
// ---------------------------------------------------------------------------

/**
 * List all orders with summary info: customer name, item count, total
 * paid. Supports filtering by status, date range, and pagination.
 *
 * Requires: admin, manager, or staff.
 */
export async function getAllOrders(
  rawFilters?: Partial<OrderFilters>,
): Promise<ActionResult<{ data: OrderSummary[]; totalCount: number }>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = orderFilterSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const filters = parsed.data;

  const supabase = createClient();

  let query = supabase
    .from("order")
    .select(
      `
      order_id,
      order_status,
      order_type,
      created_at,
      customer:customer_id ( name ),
      order_item ( order_item_id ),
      transaction ( total_paid )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      // If the frontend sends an array like ["pending", "preparing"]
      query = query.in("order_status", filters.status);
    } else {
      // If the frontend sends a single string like "preparing"
      query = query.eq("order_status", filters.status);
    }
  } else {
    // No explicit filter means "everything staff should be working on", which
    // is not the same as every row. An order whose online payment was never
    // completed or came back refused is not the kitchen's problem until the
    // money lands, so it is hidden unless asked for by name (issue #106).
    query = query.not(
      "order_status",
      "in",
      `(${UNPAID_ORDER_STATUSES.join(",")})`,
    );
  }

  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, count, error } = await query;

  if (error) return { data: null, error: error.message };

  const summaries: OrderSummary[] = (data ?? []).map((row: any) => ({
    order_id: row.order_id,
    order_status: row.order_status,
    order_type: row.order_type,
    created_at: row.created_at,
    customer: row.customer,
    item_count: Array.isArray(row.order_item) ? row.order_item.length : 0,
    total_paid: Array.isArray(row.transaction) && row.transaction.length > 0
      ? row.transaction[0].total_paid
      : null,
  }));

  return { data: { data: summaries, totalCount: count ?? 0 }, error: null };
}

/**
 * List all orders with full details: customer, items with product info, 
 * and transactions. Supports filtering by status, date range, 
 * and pagination. Highly optimized to avoid N+1 queries.
 *
 * Requires: admin, manager, or staff.
 */
export async function getDetailedOrders(
  rawFilters?: Partial<OrderFilters>,
): Promise<ActionResult<{ data: OrderWithDetails[]; totalCount: number }>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const parsed = orderFilterSchema.safeParse(rawFilters ?? {});
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }
  const filters = parsed.data;

  const supabase = createClient();
  
  // Decide if we need inner joins based on filters
  const needCustomerInner = !!(filters.customer_name || filters.customer_phone);
  const customerJoin = needCustomerInner 
    ? 'customer!inner ( name, email, phone_number )' 
    : 'customer:customer_id ( name, email, phone_number )';
    
  const needTransactionInner = !!filters.payment_method;
  const transactionJoin = needTransactionInner
    ? 'transaction!inner ( transaction_id, payment_method, payment_status, total_paid )'
    : 'transaction ( transaction_id, payment_method, payment_status, total_paid )';

  let query = supabase
    .from("order")
    .select(
      `
      *,
      ${customerJoin},
      order_item (
        order_item_id,
        quantity,
        subtotal,
        special_instructions,
        product_name,
        unit_price,
        product:product_id ( product_name, product_price ),
        order_item_add_on ( add_on ( name, price ) )
      ),
      ${transactionJoin}
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.payment_issues) {
    // Manager-only Payment Issues tab: refused payments, and online payments
    // that have sat unpaid long enough that the customer is probably stuck.
    if (auth.data.role !== "MANAGER") {
      return { data: null, error: "Only managers can view payment issues." };
    }
    const stuckSince = new Date(Date.now() - STUCK_PAYMENT_MINUTES * 60000).toISOString();
    query = query.or(
      `order_status.eq.payment_failed,and(order_status.eq.awaiting_payment,created_at.lte.${stuckSince})`,
    );
  } else if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("order_status", filters.status);
    } else {
      query = query.eq("order_status", filters.status);
    }
  } else if (!filters.include_unpaid) {
    query = query.not(
      "order_status",
      "in",
      `(${UNPAID_ORDER_STATUSES.join(",")})`,
    );
  }

  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to);
  }
  if (filters.search?.trim()) {
    const range = orderIdRangeFor(filters.search);
    if (!range) return { data: { data: [], totalCount: 0 }, error: null };
    query = query.gte("order_id", range.from).lte("order_id", range.to);
  }
  
  if (filters.customer_id) {
    query = query.eq("customer_id", filters.customer_id);
  }
  if (filters.customer_name) {
    query = query.ilike("customer.name", `%${filters.customer_name}%`);
  }
  if (filters.customer_phone) {
    query = query.ilike("customer.phone_number", `%${filters.customer_phone}%`);
  }
  if (filters.payment_method) {
    if (filters.payment_method === "wallet") {
      query = query.in("transaction.payment_method", ["paymongo", "gcash", "paymaya"]);
    } else if (filters.payment_method === "pay_in_store") {
      query = query.in("transaction.payment_method", ["pay_in_store", "pay-in-store", "cash"]);
    } else {
      query = query.eq("transaction.payment_method", filters.payment_method);
    }
  }

  const { data, count, error } = await query;

  if (error) return { data: null, error: error.message };

  return { 
    data: { 
      data: data as unknown as OrderWithDetails[], 
      totalCount: count ?? 0 
    }, 
    error: null 
  };
}

/**
 * Full order detail: customer, items with product info, transactions,
 * and payment.
 *
 * Requires: admin, manager, or staff.
 */
export async function getOrderDetail(
  orderId: string,
): Promise<ActionResult<OrderWithDetails>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("order")
    .select(
      `
      *,
      customer:customer_id ( name, email, phone_number ),
      order_item (
        order_item_id,
        quantity,
        subtotal,
        special_instructions,
        product:product_id ( product_name, product_price ),
        order_item_add_on ( add_on ( name, price ) )
      ),
      transaction (
        transaction_id,
        payment_method,
        payment_status,
        total_paid
      )
    `,
    )
    .eq("order_id", orderId)
    .single();

  if (error || !data) {
    return { data: null, error: "Order not found." };
  }

  const detail = data as unknown as OrderWithDetails;
  await attachOrderAddOns(supabase, [detail]);

  return { data: detail, error: null };
}

// ---------------------------------------------------------------------------
// Order status management
// ---------------------------------------------------------------------------

/**
 * Update an order's status through the pipeline:
 *   pending → preparing → ready → completed
 *   (cancelled is allowed from any non-terminal status)
 *
 * Sets `completed_at` when transitioning to `completed`.
 * Sets `cancelled_at` when transitioning to `cancelled`, and
 * `cancellation_reason` when staff gave one — the customer's tracking screen
 * shows it (P50). The staff dialog always asked for a reason, but it was
 * never sent here, so every kitchen cancel reached the customer blank.
 *
 * Requires: admin, manager, or staff.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  cancellationReason?: string,
): Promise<ActionResult<Order>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };

  // Validate the new status string.
  const statusParsed = orderStatusSchema.safeParse(newStatus);
  if (!statusParsed.success) {
    return { data: null, error: statusParsed.error.errors[0].message };
  }
  const validatedNewStatus = statusParsed.data;

  const supabase = createClient();

  // Fetch current status.
  const { data: order, error: lookupError } = await supabase
    .from("order")
    .select("order_id, order_status, order_type")
    .eq("order_id", orderId)
    .single();

  if (lookupError || !order) {
    return { data: null, error: "Order not found." };
  }

  // A take-out order never goes out with a rider, so no rider queue will
  // ever show it. Letting it reach out_for_delivery left staff seeing
  // "delivering" for an order no rider could find (P52).
  if (validatedNewStatus === "out_for_delivery" && isPickupOrder(order.order_type)) {
    return {
      data: null,
      error: "Take-out orders can't go out for delivery. Mark it ready for pick up instead.",
    };
  }

  const currentStatus = order.order_status as OrderStatus | null;
  if (!currentStatus) {
    return { data: null, error: "Order has no current status." };
  }

  // Validate the transition is legal.
  if (!isValidTransition(currentStatus as OrderStatus, validatedNewStatus)) {
    return {
      data: null,
      error: `Cannot change order from "${currentStatus}" to "${validatedNewStatus}".`,
    };
  }

  // Build update payload.
  const updatePayload: TablesUpdate<"order"> = {
    order_status: validatedNewStatus,
  };

  if (validatedNewStatus === "ready") {
    // @ts-ignore
    updatePayload.ready_at = new Date().toISOString();
  }
  if (validatedNewStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }
  if (validatedNewStatus === "cancelled") {
    const reason = cancellationReason?.trim().slice(0, 300);
    if (!reason) {
      return { data: null, error: "A cancellation reason is required." };
    }
    updatePayload.cancelled_at = new Date().toISOString();
    updatePayload.cancellation_reason = reason;
  }

  const { data: updated, error: updateError } = await supabase
    .from("order")
    .update(updatePayload)
    .eq("order_id", orderId)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError.message };

  
  // Fix total_paid for pay-in-store orders upon completion (issue #27)
  if (validatedNewStatus === "completed") {
    const { data: txs } = await supabase
      .from("transaction")
      .select("transaction_id, payment_method, total_paid")
      .eq("order_id", orderId);
      
    const tx = txs?.[0];
    if (tx && (tx.payment_method === "pay_in_store" || tx.payment_method === "pay-in-store" || tx.payment_method === "cash") && tx.total_paid === 0) {
      const { data: orderDetails } = await supabase
        .from("order_item")
        .select("subtotal")
        .eq("order_id", orderId);
      const { data: orderAddOns } = await supabase
        .from("order_item_add_on")
        .select("add_on(price)")
        .eq("order_item_id", "some_join"); // Wait, we can just fetch order_item(subtotal), order_item_add_on(add_on(price))
        
      // A safer way is to fetch the full total via getOrderDetail
      const fullOrder = await getOrderDetail(orderId);
      if (fullOrder.data) {
        const itemsTotal = fullOrder.data.order_item.reduce((acc, item) => acc + (item.subtotal || 0), 0);
        const addOnsTotal = fullOrder.data.order_item.reduce((acc, item) => 
          acc + (item.order_item_add_on || []).reduce((sum, ao) => sum + (ao.add_on?.price || 0), 0)
        , 0);
        const deliveryFee = updated.delivery_fee || 0;
        const totalToPay = itemsTotal + addOnsTotal + deliveryFee;
        
        await supabase
          .from("transaction")
          .update({
            payment_status: "paid",
            total_paid: totalToPay
          })
          .eq("transaction_id", tx.transaction_id);
      }
    }
  }


  // The in-app notification is written by a database trigger on this same
  // update; the email goes from here (F23). It never fails the cancel.
  if (validatedNewStatus === "cancelled") {
    await notifyOrderCancelled(supabase, orderId, "store");
  }

  return { data: updated, error: null };
}

// ---------------------------------------------------------------------------
// Order stats
// ---------------------------------------------------------------------------

/**
 * Quick counts by status — useful for dashboard cards.
 * Requires: admin, manager, or staff.
 */
export async function getOrderStats(): Promise<ActionResult<OrderStats>> {
  const auth = await requireManageAccess();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("order")
    .select("order_status");

  if (error) return { data: null, error: error.message };

  const stats: OrderStats = {
    pending: 0,
    preparing: 0,
    out_for_delivery: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };

  for (const row of data ?? []) {
    stats.total++;
    const status = row.order_status as OrderStatus | null;
    if (status && status in stats) {
      stats[status as keyof Omit<OrderStats, "total">]++;
    }
  }

  return { data: stats, error: null };
}

export type PaymentIssueType = "payment_failed" | "pickup_overdue";

export interface PaymentIssueOrder {
  type: PaymentIssueType;
  order: OrderWithDetails;
}

async function _fetchPaymentIssuesBase(supabase: ReturnType<typeof createClient>, isKds: boolean): Promise<ActionResult<PaymentIssueOrder[]>> {
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
          add_on ( name, price )
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
        const elapsedMins = (now - new Date(order.created_at as string).getTime()) / 60000;
        if (elapsedMins >= 5) {
          issues.push({ type: "payment_failed", order });
          continue;
        }
      }
    }

    // 2. pickup_overdue
    const isCash = ["pay_in_store", "pay-in-store", "cash"].includes(paymentMethod);
    if (order.order_status === "ready" && (order.order_type === "take_out" || order.order_type === "pickup") && isCash && order.ready_at) {
      const elapsedMins = (now - new Date(order.ready_at as string).getTime()) / 60000;
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
  return _fetchPaymentIssuesBase(supabase, true);
}

export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase, false);
}
