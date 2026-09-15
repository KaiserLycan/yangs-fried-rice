import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateNcrAddress } from "@/lib/address/validate-ncr";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to view addresses." },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("customer_address")
    .select("address_id, label, address_details, address_note, is_default")
    .eq("customer_id", user.id)
    .order("address_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in to add an address." },
      { status: 401 }
    );
  }

  let body: {
    label?: string;
    address_details?: string;
    address?: string;
    delivery_note?: string;
    is_default?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const rawAddress = body.address_details || body.address;
  if (!rawAddress || typeof rawAddress !== "string" || rawAddress.trim().length < 5) {
    return NextResponse.json(
      { error: "Address must be at least 5 characters long." },
      { status: 400 }
    );
  }

  const address = rawAddress.trim();

  // Enforce NCR boundary validation
  const validation = await validateNcrAddress(address);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error:
          validation.message ??
          "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("customer_address")
    .insert({
      customer_id: user.id,
      label: body.label?.trim() || "Home",
      address_details: address,
      address_note: body.delivery_note?.trim() || null,
      is_default: body.is_default ?? false,
    })
    .select("address_id, label, address_details, address_note, is_default")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      message: "Address successfully added.",
      address: data,
    },
    { status: 201 }
  );
}
