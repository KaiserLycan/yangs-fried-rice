import { NextResponse } from "next/server";
import { submitReview } from "@/lib/actions/customer-orders";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/customer/orders/:id/review
 *
 * Submit a rating and optional written review for a completed order.
 *
 * Body: { rating: number (1–5), comment?: string }
 *
 * Auth: requires an authenticated customer session.
 *
 * Validation (handled by the RPC):
 * - Order must exist and belong to the caller
 * - Order must have status 'completed'
 * - Order must not already have a review
 * - Rating must be 1–5
 */
export async function POST(request: Request, { params }: RouteParams) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body." },
      { status: 400 },
    );
  }

  const result = await submitReview(params.id, body);

  if (result.error || !result.data) {
    let status = 400;
    const err = result.error ?? "";
    if (err.includes("signed in") || err.includes("not registered")) {
      status = 401;
    } else if (err.includes("does not belong")) {
      status = 403;
    } else if (err.includes("not found")) {
      status = 404;
    } else if (err.includes("already reviewed")) {
      status = 409;
    }
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(
    {
      message: "Review submitted successfully.",
      data: result.data,
    },
    { status: 201 },
  );
}
