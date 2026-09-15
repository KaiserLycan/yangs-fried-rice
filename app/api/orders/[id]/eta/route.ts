import { NextResponse } from "next/server";
import { getOrderEtaAction } from "@/lib/actions/eta";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Order ID parameter is required." },
      { status: 400 }
    );
  }

  const result = await getOrderEtaAction(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "Order not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Order ID parameter is required." },
      { status: 400 }
    );
  }

  let customCoords = null;
  try {
    const body = await request.json();
    if (
      body &&
      typeof body.latitude === "number" &&
      typeof body.longitude === "number"
    ) {
      customCoords = {
        latitude: body.latitude,
        longitude: body.longitude,
      };
    }
  } catch {
    // Empty body is acceptable for recalculation
  }

  const result = await getOrderEtaAction(id, customCoords);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error ?? "Order not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
