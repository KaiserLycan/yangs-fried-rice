"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_DISABLED_CODE,
  ACCOUNT_DISABLED_MESSAGE,
  EMPLOYEE_ACCOUNT_DISABLED_MESSAGE,
} from "@/lib/auth/account-status";
import { canAccessManage, resolveEmployeeRole } from "@/lib/auth/roles";
import { formatOrderNumber } from "@/lib/orders/order-number";
import { orderItemName } from "@/lib/orders/item-name";
import {
  canReportIssue,
  isOrderIssuePhotoPath,
  ORDER_ISSUE_PHOTO_BUCKET,
  ORDER_ISSUE_PHOTO_URL_TTL_SECONDS,
  ORDER_ISSUE_WINDOW_HOURS,
  reportOrderIssueSchema,
  type OrderIssueType,
  type ReportOrderIssueInput,
} from "@/lib/validation/order-issue";

/**
 * "Report a problem" (limitations #24, issue #118): a customer files one on
 * a completed order, staff see the open ones on the Orders page and close
 * them. Refunds stay manual — resolving a report records that someone dealt
 * with it, nothing more.
 *
 * The photo never passes through here. The browser uploads it straight into
 * the customer's own folder of the private `order-issue-photos` bucket (the
 * storage policy checks the folder), then sends the path. A server action
 * body is capped at 1 MB, and a phone photo is not.
 */

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string; code?: string };

export type OpenOrderIssue = {
  issueId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  issueType: OrderIssueType;
  items: { name: string; quantity: number }[];
  note: string | null;
  createdAt: string;
  /** A link that works for a few minutes, or null when there is no photo. */
  photoUrl: string | null;
};

// ---------------------------------------------------------------------------
// Customer: report
// ---------------------------------------------------------------------------

export async function reportOrderIssue(
  rawInput: ReportOrderIssueInput & { photo_path?: string | null },
): Promise<ActionResult<{ issue_id: string }>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "You must be signed in.", code: "UNAUTHORIZED" };

  const { data: customer } = await supabase
    .from("customer")
    .select("customer_id, is_account_disabled")
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!customer) {
    return { data: null, error: "You are not registered as a customer.", code: "FORBIDDEN" };
  }
  if (customer.is_account_disabled) {
    return { data: null, error: ACCOUNT_DISABLED_MESSAGE, code: ACCOUNT_DISABLED_CODE };
  }

  const parsed = reportOrderIssueSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const input = parsed.data;

  const photoPath = rawInput.photo_path?.trim() || null;
  if (photoPath && (!isOrderIssuePhotoPath(photoPath) || !photoPath.startsWith(`${user.id}/`))) {
    return { data: null, error: "That photo couldn't be attached. Please try again." };
  }

  // The database refuses all of these too; checking first gives a message
  // that says which rule it was.
  const { data: order } = await supabase
    .from("order")
    .select("order_id, order_status, completed_at, created_at")
    .eq("order_id", input.order_id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!order) return { data: null, error: "Order not found." };

  if (
    !canReportIssue({
      orderStatus: order.order_status,
      completedAt: order.completed_at,
      placedAt: order.created_at,
    })
  ) {
    return {
      data: null,
      error: `Problems can be reported within ${ORDER_ISSUE_WINDOW_HOURS} hours of picking up a completed order. Please talk to the store.`,
      code: "ISSUE_WINDOW_CLOSED",
    };
  }

  const { data: lines } = await supabase
    .from("order_item")
    .select("order_item_id")
    .eq("order_id", order.order_id);
  const lineIds = new Set((lines ?? []).map((line) => line.order_item_id));
  if (!input.order_item_ids.every((id) => lineIds.has(id))) {
    return { data: null, error: "Tick items from this order only." };
  }

  const { data: inserted, error } = await supabase
    .from("order_issue")
    .insert({
      order_id: order.order_id,
      customer_id: user.id,
      order_item_ids: input.order_item_ids,
      issue_type: input.issue_type,
      note: input.note,
      photo_path: photoPath,
    })
    .select("issue_id")
    .single();

  if (error || !inserted) {
    // 23505: order_issue_order_id_key — one report per order.
    if (error?.code === "23505") {
      return {
        data: null,
        error: "You've already reported a problem with this order. The store will be in touch.",
        code: "ALREADY_REPORTED",
      };
    }
    return { data: null, error: "We couldn't send your report. Please try again." };
  }

  revalidatePath(`/orders/${order.order_id}`);
  return { data: { issue_id: inserted.issue_id }, error: null };
}

// ---------------------------------------------------------------------------
// Staff: list and resolve
// ---------------------------------------------------------------------------

async function requireStaff(): Promise<ActionResult<{ employee_id: string }>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "You must be signed in." };

  const { data: employee } = await supabase
    .from("employee")
    .select("employee_id, role, is_account_disabled")
    .eq("employee_id", user.id)
    .maybeSingle();

  if (!employee) return { data: null, error: "You are not registered as an employee." };
  if (employee.is_account_disabled) {
    return { data: null, error: EMPLOYEE_ACCOUNT_DISABLED_MESSAGE, code: ACCOUNT_DISABLED_CODE };
  }
  const role = resolveEmployeeRole(employee.role);
  if (!role || !canAccessManage(role)) {
    return { data: null, error: "You do not have permission to manage orders." };
  }
  return { data: { employee_id: employee.employee_id }, error: null };
}

/** Every unresolved report, oldest first so nobody waits longest. */
export async function getOpenOrderIssues(): Promise<ActionResult<OpenOrderIssue[]>> {
  const auth = await requireStaff();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();
  const { data: issues, error } = await supabase
    .from("order_issue")
    .select("issue_id, order_id, issue_type, note, photo_path, order_item_ids, created_at")
    .is("resolved_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return { data: null, error: "Couldn't load problem reports." };
  if (!issues || issues.length === 0) return { data: [], error: null };

  const orderIds = issues.map((issue) => issue.order_id);
  const [orders, lines] = await Promise.all([
    supabase
      .from("order")
      .select("order_id, order_number, customer:customer_id ( name, phone_number )")
      .in("order_id", orderIds)
      .then((res) => res.data ?? []),
    supabase
      .from("order_item")
      .select("order_item_id, quantity, product_name, product(product_name)")
      .in("order_id", orderIds)
      .then((res) => res.data ?? []),
  ]);

  const customerByOrder = new Map(
    orders.map((row) => [row.order_id, first(row.customer)] as const),
  );
  const numberByOrder = new Map(
    orders.map((row) => [row.order_id, row.order_number] as const),
  );
  const lineById = new Map(lines.map((line) => [line.order_item_id, line] as const));

  const result: OpenOrderIssue[] = await Promise.all(
    issues.map(async (issue) => {
      const customer = customerByOrder.get(issue.order_id) ?? null;
      let photoUrl: string | null = null;
      if (issue.photo_path && isOrderIssuePhotoPath(issue.photo_path)) {
        const { data } = await supabase.storage
          .from(ORDER_ISSUE_PHOTO_BUCKET)
          .createSignedUrl(issue.photo_path, ORDER_ISSUE_PHOTO_URL_TTL_SECONDS);
        photoUrl = data?.signedUrl ?? null;
      }
      return {
        issueId: issue.issue_id,
        orderId: issue.order_id,
        orderNumber: formatOrderNumber(numberByOrder.get(issue.order_id), issue.order_id),
        customerName: customer?.name ?? "Deleted customer",
        customerPhone: customer?.phone_number ?? null,
        issueType: issue.issue_type as OrderIssueType,
        items: issue.order_item_ids
          .map((id) => lineById.get(id))
          .filter((line): line is NonNullable<typeof line> => Boolean(line))
          .map((line) => ({
            name: orderItemName(line.product_name, first(line.product)?.product_name),
            quantity: line.quantity,
          })),
        note: issue.note,
        createdAt: issue.created_at,
        photoUrl,
      };
    }),
  );

  return { data: result, error: null };
}

export async function resolveOrderIssue(
  issueId: string,
): Promise<ActionResult<{ issue_id: string }>> {
  const auth = await requireStaff();
  if (!auth.data) return { data: null, error: auth.error, code: auth.code };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_issue")
    .update({ resolved_at: new Date().toISOString(), resolved_by: auth.data.employee_id })
    .eq("issue_id", issueId)
    .is("resolved_at", null)
    .select("issue_id")
    .maybeSingle();

  if (error) return { data: null, error: "Couldn't mark it resolved. Please try again." };
  if (!data) return { data: null, error: "This report was already resolved." };
  return { data: { issue_id: data.issue_id }, error: null };
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
