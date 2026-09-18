import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deliveryUpdateSchema } from "@/lib/validation/delivery";
import type { Database } from "@/types/database.types";

interface RouteParams {
  params: {
    id: string;
  };
}

// ---------------------------------------------------------------------------
// GET /api/deliveries
// ---------------------------------------------------------------------------

/**
 * Lists all deliveries with optional filters.
 * Query params: ?status=, ?rider_id=, ?order_id=
 * Requires: manager or staff.
 */
export async function getDeliveries(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const riderId = searchParams.get("rider_id");
  const orderId = searchParams.get("order_id");

  let query = supabase
    .from("delivery")
    .select(
      "delivery_id, order_id, rider_id, employee_id, delivery_status, estimated_time, completed_at, proof_of_delivery"
    )
    .order("estimated_time", { ascending: false, nullsFirst: false });

  if (status) {
    query = query.eq("delivery_status", status);
  }
  if (riderId) {
    query = query.eq("rider_id", riderId);
  }
  if (orderId) {
    query = query.eq("order_id", orderId);
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
// GET /api/deliveries/[id]
// ---------------------------------------------------------------------------

/**
 * Get full delivery details including related order info.
 */
export async function getDeliveryById(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("delivery")
    .select(
      "delivery_id, order_id, rider_id, employee_id, delivery_status, estimated_time, completed_at, proof_of_delivery"
    )
    .eq("delivery_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Delivery not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// ---------------------------------------------------------------------------
// PATCH /api/deliveries/[id]
// ---------------------------------------------------------------------------

/**
 * Update delivery: assign rider, change status, or update estimated time.
 * Body: { delivery_status?, rider_id?, estimated_time? }
 */
export async function updateDelivery(
  request: Request,
  { params }: RouteParams
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = deliveryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const updatePayload: Database["public"]["Tables"]["delivery"]["Update"] = {};
  if (parsed.data.delivery_status !== undefined) {
    updatePayload.delivery_status = parsed.data.delivery_status;
    if (parsed.data.delivery_status === "delivered") {
      updatePayload.completed_at = new Date().toISOString();
    }
  }
  if (parsed.data.rider_id !== undefined) {
    updatePayload.rider_id = parsed.data.rider_id;
  }
  if (parsed.data.estimated_time !== undefined) {
    updatePayload.estimated_time = parsed.data.estimated_time;
  }

  const { data, error } = await supabase
    .from("delivery")
    .update(updatePayload)
    .eq("delivery_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Delivery not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Delivery updated successfully.",
    data,
  });
}
