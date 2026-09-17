"use server";

import { createClient } from "@/lib/supabase/server";
import { isEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";
import {
  orderStatusSchema,
  isValidTransition,
  orderFilterSchema,
  type OrderStatus,
  type OrderFilters,
} from "@/lib/validation/orders";
import type { Tables, TablesUpdate } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

type Order = Tables<"order">;

type OrderWithDetails = Order & {
  customer: { name: string; email: string | null } | null;
  order_item: {
    order_item_id: string;
    quantity: number;
    subtotal: number;
    special_instructions: string | null;
    product: { product_name: string; product_price: number } | null;
  }[];
  transaction: {
    transaction_id: string;
    payment_method: string | null;
    payment_status: string | null;
    total_paid: number | null;
  }[];
  delivery: {
    delivery_id: string;
    delivery_status: string | null;
    rider_id: string | null;
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
  received: number;
  preparing: number;
  out_for_delivery: number;
  completed: number;
  cancelled: number;
  total: number;
};

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

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
    .select("employee_id, role")
    .eq("employee_id", user.id)
    .single();

  if (error || !employee) {
    return { data: null, error: "You are not registered as an employee." };
  }

  const role = employee.role;
  if (!role || !isEmployeeRole(role) || !canAccessManage(role)) {
    return {
      data: null,
      error: "You do not have permission to manage orders.",
    };
  }

  return {
    data: { employee_id: employee.employee_id, role: role as EmployeeRole },
    error: null,
  };
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
): Promise<ActionResult<OrderSummary[]>> {
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
    )
    .order("created_at", { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      // If the frontend sends an array like ["pending", "received"]
      query = query.in("order_status", filters.status);
    } else {
      // If the frontend sends a single string like "preparing"
      query = query.eq("order_status", filters.status);
    }
  }
  
  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;

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

  return { data: summaries, error: null };
}

/**
 * Full order detail: customer, items with product info, transactions,
 * and delivery info.
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
      customer:customer_id ( name, email ),
      order_item (
        order_item_id,
        quantity,
        subtotal,
        special_instructions,
        product:product_id ( product_name, product_price )
      ),
      transaction (
        transaction_id,
        payment_method,
        payment_status,
        total_paid
      ),
      delivery (
        delivery_id,
        delivery_status,
        rider_id
      )
    `,
    )
    .eq("order_id", orderId)
    .single();

  if (error || !data) {
    return { data: null, error: "Order not found." };
  }

  return { data: data as unknown as OrderWithDetails, error: null };
}

// ---------------------------------------------------------------------------
// Order status management
// ---------------------------------------------------------------------------

/**
 * Update an order's status through the pipeline:
 *   received → preparing → out_for_delivery → completed
 *   (cancelled is allowed from any non-terminal status)
 *
 * Sets `completed_at` when transitioning to `completed`.
 * Sets `cancelled_at` when transitioning to `cancelled`.
 *
 * Requires: admin, manager, or staff.
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
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
    .select("order_id, order_status")
    .eq("order_id", orderId)
    .single();

  if (lookupError || !order) {
    return { data: null, error: "Order not found." };
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

  if (validatedNewStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }
  if (validatedNewStatus === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { data: updated, error: updateError } = await supabase
    .from("order")
    .update(updatePayload)
    .eq("order_id", orderId)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError.message };
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
    received: 0,
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
