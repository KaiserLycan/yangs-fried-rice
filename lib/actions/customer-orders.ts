"use server";

import { createClient } from "@/lib/supabase/server";
import { reviewSubmissionSchema, type ReviewSubmission } from "@/lib/validation/reviews";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/** Shape returned by the get_customer_order_history RPC. */
export type OrderHistoryItem = {
  order_id: string;
  order_status: string | null;
  order_type: string | null;
  created_at: string | null;
  completed_at: string | null;
  special_instructions: string | null;
  delivery_fee: number | null;
  items: {
    order_item_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
    special_instructions: string | null;
  }[];
  transactions: {
    transaction_id: string;
    payment_method: string | null;
    payment_status: string | null;
    subtotal: number | null;
    tax_amount: number | null;
    discount_amount: number | null;
    total_paid: number | null;
  }[];
  review: {
    review_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  } | null;
};

/** Shape returned by the submit_order_review RPC. */
export type ReviewResult = {
  review_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/** Detailed single-order view (direct Supabase query, not RPC). */
export type OrderDetail = {
  order_id: string;
  order_status: string | null;
  order_type: string | null;
  created_at: string | null;
  completed_at: string | null;
  special_instructions: string | null;
  delivery_fee: number | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
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
    subtotal: number | null;
    tax_amount: number | null;
    discount_amount: number | null;
    total_paid: number | null;
  }[];
  review: {
    review_id: string;
    rating: number | null;
    comment: string | null;
    created_at: string | null;
  }[];
};

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function requireCustomer(): Promise<
  ActionResult<{ customer_id: string }>
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in." };
  }

  // Verify the user is actually a customer (not just any authenticated user)
  const { data: customer } = await supabase
    .from("customer")
    .select("customer_id")
    .eq("customer_id", user.id)
    .single();

  if (!customer) {
    return { data: null, error: "You are not registered as a customer." };
  }

  return { data: { customer_id: user.id }, error: null };
}

// ---------------------------------------------------------------------------
// Get order history (all orders for the logged-in customer)
// ---------------------------------------------------------------------------

/**
 * Fetch the logged-in customer's full order history with itemised
 * receipts, payment info, and review status.
 *
 * Calls the `get_customer_order_history` RPC.
 */
export async function getMyOrders(): Promise<
  ActionResult<OrderHistoryItem[]>
> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_customer_order_history", {
    p_customer_id: auth.data.customer_id,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  // The RPC returns a JSON value. Supabase parses it for us.
  const orders = (Array.isArray(data) ? data : []) as OrderHistoryItem[];
  return { data: orders, error: null };
}

// ---------------------------------------------------------------------------
// Get single order detail
// ---------------------------------------------------------------------------

/**
 * Fetch a single order's full receipt detail. Uses a direct Supabase
 * query (not the RPC) so we get the full column set including
 * cancellation info.
 *
 * RLS ensures the customer can only see their own orders.
 */
export async function getMyOrderDetail(
  orderId: string,
): Promise<ActionResult<OrderDetail>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("order")
    .select(
      `
      order_id,
      order_status,
      order_type,
      created_at,
      completed_at,
      special_instructions,
      delivery_fee,
      cancelled_at,
      cancellation_reason,
      customer_id,
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
        subtotal,
        tax_amount,
        discount_amount,
        total_paid
      ),
      review (
        review_id,
        rating,
        comment,
        created_at
      )
    `,
    )
    .eq("order_id", orderId)
    .single();

  if (error || !data) {
    return { data: null, error: "Order not found." };
  }

  // RLS already filters by customer_id, but belt-and-suspenders:
  if ((data as any).customer_id !== auth.data.customer_id) {
    return { data: null, error: "Order not found." };
  }

  return { data: data as unknown as OrderDetail, error: null };
}

// ---------------------------------------------------------------------------
// Submit review
// ---------------------------------------------------------------------------

/**
 * Submit a rating and optional comment for a completed order.
 *
 * Calls the `submit_order_review` RPC, which handles:
 * - Ownership check (order belongs to the caller)
 * - Completion check (order_status = 'completed')
 * - Duplicate check (one review per order)
 * - Rating range check (1–5)
 */
export async function submitReview(
  orderId: string,
  rawData: unknown,
): Promise<ActionResult<ReviewResult>> {
  const auth = await requireCustomer();
  if (!auth.data) return { data: null, error: auth.error };

  // Validate input
  const parsed = reviewSubmissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return { data: null, error: parsed.error.errors[0].message };
  }

  const { rating, comment } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_order_review", {
    p_order_id: orderId,
    p_rating: rating,
    p_comment: comment ?? undefined,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ReviewResult, error: null };
}
