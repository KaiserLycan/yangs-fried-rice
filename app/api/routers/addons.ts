import { requireApiEmployee } from "@/lib/auth/api-guard";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addonSchema, addonUpdateSchema } from "@/lib/validation/addons";
import type { Database } from "@/types/database.types";

interface RouteParams {
  params: {
    id: string;
  };
}

// ---------------------------------------------------------------------------
// Product-scoped endpoints: /api/menu/products/[id]/addons
// ---------------------------------------------------------------------------

/**
 * GET /api/menu/products/{id}/addons
 * Lists all add-ons for a given product.
 */
export async function getProductAddons(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("add_on")
    .select("addon_id, name, price, product_id")
    .eq("product_id", params.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

/**
 * POST /api/menu/products/{id}/addons
 * Creates a new add-on for a product.
 * Body: { name: string, price: number }
 * Requires: manager or staff.
 */
export async function createProductAddon(
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

  const parsed = addonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Verify the product exists
  const { data: product } = await supabase
    .from("product")
    .select("product_id")
    .eq("product_id", params.id)
    .single();

  if (!product) {
    return NextResponse.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("add_on")
    .insert({
      name: parsed.data.name,
      price: parsed.data.price,
      product_id: params.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Add-on created successfully.", data },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// Direct add-on endpoints: /api/menu/addons/[id]
// ---------------------------------------------------------------------------

/**
 * GET /api/menu/addons/{id}
 * Get a single add-on by its ID.
 */
export async function getAddonById(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("add_on")
    .select("addon_id, name, price, product_id")
    .eq("addon_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Add-on not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

/**
 * PUT /api/menu/addons/{id}
 * Update an add-on's name and/or price.
 * Body: { name?: string, price?: number }
 */
export async function updateAddon(
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

  const parsed = addonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const updatePayload: Database["public"]["Tables"]["add_on"]["Update"] = {};
  if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
  if (parsed.data.price !== undefined) updatePayload.price = parsed.data.price;

  const { data, error } = await supabase
    .from("add_on")
    .update(updatePayload)
    .eq("addon_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Add-on not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Add-on updated successfully.",
    data,
  });
}

/**
 * DELETE /api/menu/addons/{id}
 * Delete an add-on.
 */
export async function deleteAddon(
  _request: Request,
  { params }: RouteParams
) {
  const guard = await requireApiEmployee("MANAGER", "STAFF");
  if (guard.response) return guard.response;

  const supabase = createClient();

  const { error } = await supabase
    .from("add_on")
    .delete()
    .eq("addon_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Add-on deleted successfully.",
  });
}
