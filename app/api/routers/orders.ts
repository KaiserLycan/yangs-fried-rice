import { NextResponse } from "next/server";
import {
  getAllOrders as getOrdersAction,
  getOrderDetail as getOrderDetailAction,
  updateOrderStatus as updateOrderStatusAction,
  getOrderStats as getOrderStatsAction,
} from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/validation/orders";

interface RouteParams {
  params: {
    id: string;
  };
}

function errorToStatus(error: string): number {
  if (error.includes("must be signed in") || error.includes("not registered")) {
    return 401;
  }
  if (error.includes("permission")) {
    return 403;
  }
  if (error.toLowerCase().includes("not found")) {
    return 404;
  }
  return 400;
}

/**
 * GET /api/orders
 * List orders with optional filters:
 *  ?status=received
 *  ?startDate=2026-09-01
 *  ?endDate=2026-09-10
 *  ?limit=20
 *  ?offset=0
 * Requires: admin, manager, or staff.
 */
export async function getOrders(request: Request) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") as OrderStatus | null;
  const startDate = searchParams.get("startDate") ?? searchParams.get("start_date");
  const endDate = searchParams.get("endDate") ?? searchParams.get("end_date");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const filters = {
    ...(status ? { status } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
    ...(limitParam ? { limit: parseInt(limitParam, 10) } : {}),
    ...(offsetParam ? { offset: parseInt(offsetParam, 10) } : {}),
  };

  const result = await getOrdersAction(filters);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    count: result.data.totalCount,
    data: result.data.data,
  });
}

/**
 * GET /api/orders/stats
 * Quick count of orders grouped by status.
 * Requires: admin, manager, or staff.
 */
export async function getOrderStats() {
  const result = await getOrderStatsAction();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * GET /api/orders/[id]
 * Get full order details.
 * Requires: admin, manager, or staff.
 */
export async function getOrderDetail(
  _request: Request,
  { params }: RouteParams
) {
  const result = await getOrderDetailAction(params.id);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    data: result.data,
  });
}

/**
 * PATCH /api/orders/[id]/status
 * Advance or update order status through distinct stages.
 * Body: { new_status: 'received' | 'preparing' | 'out_for_delivery' | 'completed' | 'cancelled' }
 * Requires: admin, manager, or staff.
 */
export async function updateOrderStatus(
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

  const newStatus =
    (body as any)?.new_status ?? (body as any)?.status;

  if (!newStatus) {
    return NextResponse.json(
      { error: "Field 'new_status' is required" },
      { status: 400 }
    );
  }

  const result = await updateOrderStatusAction(params.id, newStatus);
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error },
      { status: errorToStatus(result.error || "") }
    );
  }

  return NextResponse.json({
    message: "Order status updated successfully",
    data: result.data,
  });
}
