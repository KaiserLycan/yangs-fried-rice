import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addressForGeocoding, validateNcrAddress } from "@/lib/address/validate-ncr";
import { ADDRESS_COLUMNS, addressRowFromParts } from "@/lib/address/format";
import { deliveryAddressSchema } from "@/lib/validation/profile";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
} from "@/lib/validation/field-errors";

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
    .select(ADDRESS_COLUMNS)
    .eq("customer_id", user.id)
    .order("address_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: data ?? [] }, { status: 200 });
}

/**
 * POST /api/customer/addresses
 * Body: { label?, buildingNo, street, barangay, city, zip, deliveryNote?, is_default? }
 *
 * The address is five atomic parts, each validated on its own; a 400 names
 * the failing ones in `fieldErrors`.
 */
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = deliveryAddressSchema.safeParse({
    label: typeof body.label === "string" ? body.label : "",
    buildingNo: body.buildingNo ?? "",
    street: body.street ?? "",
    barangay: body.barangay ?? "",
    city: body.city ?? "",
    zip: body.zip ?? "",
    deliveryNote: typeof body.deliveryNote === "string" ? body.deliveryNote : "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Some address fields need fixing.",
        fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
      },
      { status: 400 }
    );
  }

  // Enforce NCR boundary validation
  const validation = await validateNcrAddress(addressForGeocoding(parsed.data));
  if (!validation.valid) {
    const message =
      validation.message ??
      "Delivery is currently restricted to Metro Manila (NCR). Addresses outside NCR cannot be accepted.";
    return NextResponse.json(
      { error: message, fieldErrors: { city: message } },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("customer_address")
    .insert({
      customer_id: user.id,
      label: parsed.data.label || "Home",
      ...addressRowFromParts(parsed.data),
      address_note: parsed.data.deliveryNote || null,
      is_default: body.is_default === true,
    })
    .select(ADDRESS_COLUMNS)
    .single();

  if (error) {
    const fieldErrors = fieldErrorFromDbError(error);
    return NextResponse.json(
      { error: error.message, fieldErrors: fieldErrors ?? undefined },
      { status: fieldErrors ? 400 : 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Address successfully added.",
      address: data,
    },
    { status: 201 }
  );
}
