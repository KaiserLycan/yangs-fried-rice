import { requireApiEmployee } from "@/lib/auth/api-guard";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  transactionSchema,
  transactionUpdateSchema,
} from "@/lib/validation/transaction";

interface RouteParams {
  params: {
    id: string;
  };
}

// ---------------------------------------------------------------------------
// GET /api/transactions
// ---------------------------------------------------------------------------

/**
 * Lists transactions with optional filters.
 * Query params: ?order_id=, ?payment_status=, ?limit=, ?offset=
 * Requires: manager or staff.
 */
export async function getTransactions(request: Request) {
  const guard = await requireApiEmployee("MANAGER", "STAFF");
  if (guard.response) return guard.response;

  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const orderId = searchParams.get("order_id");
  const paymentStatus = searchParams.get("payment_status");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  let query = supabase
    .from("transaction")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (orderId) {
    query = query.eq("order_id", orderId);
  }
  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }
  if (limitParam) {
    const limit = parseInt(limitParam, 10);
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

// ---------------------------------------------------------------------------
// POST /api/transactions
// ---------------------------------------------------------------------------

/**
 * Records a new transaction for an order.
 * Body: { order_id, payment_method, payment_status, subtotal, tax_amount,
 *         discount_amount, discount_type, discount_id_number, total_paid,
 *         transaction_type }
 */
export async function createTransaction(request: Request) {
  const guard = await requireApiEmployee("MANAGER", "STAFF");
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Verify the order exists
  const { data: order } = await supabase
    .from("order")
    .select("order_id")
    .eq("order_id", parsed.data.order_id)
    .single();

  if (!order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("transaction")
    .insert({
      order_id: parsed.data.order_id,
      payment_method: parsed.data.payment_method,
      payment_status: parsed.data.payment_status,
      subtotal: parsed.data.subtotal,
      tax_amount: parsed.data.tax_amount,
      discount_amount: parsed.data.discount_amount,
      discount_type: parsed.data.discount_type ?? null,
      discount_id_number: parsed.data.discount_id_number ?? null,
      total_paid: parsed.data.total_paid,
      transaction_type: parsed.data.transaction_type ?? null,
      transaction_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Transaction recorded successfully.", data },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// GET /api/transactions/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single transaction by its ID.
 */
export async function getTransactionById(
  _request: Request,
  { params }: RouteParams
) {
  const guard = await requireApiEmployee("MANAGER", "STAFF");
  if (guard.response) return guard.response;

  const supabase = createClient();

  const { data, error } = await supabase
    .from("transaction")
    .select("*")
    .eq("transaction_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// ---------------------------------------------------------------------------
// PATCH /api/transactions/[id]
// ---------------------------------------------------------------------------

/**
 * Update a transaction's payment status.
 * Body: { payment_status: "pending" | "paid" | "failed" | "refunded" }
 */
export async function updateTransactionStatus(
  request: Request,
  { params }: RouteParams
) {
  const guard = await requireApiEmployee("MANAGER", "STAFF");
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("transaction")
    .update({ payment_status: parsed.data.payment_status })
    .eq("transaction_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Transaction status updated successfully.",
    data,
  });
}
