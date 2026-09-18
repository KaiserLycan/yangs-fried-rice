import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { riderSchema, riderUpdateSchema } from "@/lib/validation/rider";
import type { Database } from "@/types/database.types";

interface RouteParams {
  params: {
    id: string;
  };
}

// ---------------------------------------------------------------------------
// GET /api/riders
// ---------------------------------------------------------------------------

/**
 * Lists all riders with their vehicle and license info.
 * Requires: manager.
 */
export async function getRiders() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rider")
    .select(
      "rider_id, employee_id, vehicle_plate_number, vehicle_make_model, driver_license_number, license_expiry_date"
    )
    .order("rider_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data.length,
    data,
  });
}

// ---------------------------------------------------------------------------
// POST /api/riders
// ---------------------------------------------------------------------------

/**
 * Registers a new rider from an existing employee.
 * Body: { employee_id, vehicle_plate_number?, vehicle_make_model?,
 *         driver_license_number?, license_expiry_date? }
 * Requires: manager.
 */
export async function createRider(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format in request body" },
      { status: 400 }
    );
  }

  const parsed = riderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  // Verify the employee exists
  const { data: employee } = await supabase
    .from("employee")
    .select("employee_id")
    .eq("employee_id", parsed.data.employee_id)
    .single();

  if (!employee) {
    return NextResponse.json(
      { error: "Employee not found" },
      { status: 404 }
    );
  }

  // Check if already a rider
  const { data: existingRider } = await supabase
    .from("rider")
    .select("rider_id")
    .eq("employee_id", parsed.data.employee_id)
    .single();

  if (existingRider) {
    return NextResponse.json(
      { error: "This employee is already registered as a rider." },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("rider")
    .insert({
      employee_id: parsed.data.employee_id,
      vehicle_plate_number: parsed.data.vehicle_plate_number ?? null,
      vehicle_make_model: parsed.data.vehicle_make_model ?? null,
      driver_license_number: parsed.data.driver_license_number ?? null,
      license_expiry_date: parsed.data.license_expiry_date ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Rider registered successfully.", data },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// GET /api/riders/[id]
// ---------------------------------------------------------------------------

/**
 * Get a single rider's details by rider_id.
 */
export async function getRiderById(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("rider")
    .select(
      "rider_id, employee_id, vehicle_plate_number, vehicle_make_model, driver_license_number, license_expiry_date"
    )
    .eq("rider_id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Rider not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}

// ---------------------------------------------------------------------------
// PUT /api/riders/[id]
// ---------------------------------------------------------------------------

/**
 * Update rider vehicle/license information.
 * Body: { vehicle_plate_number?, vehicle_make_model?,
 *         driver_license_number?, license_expiry_date? }
 */
export async function updateRider(
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

  const parsed = riderUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message, details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const updatePayload: Database["public"]["Tables"]["rider"]["Update"] = {};
  if (parsed.data.vehicle_plate_number !== undefined)
    updatePayload.vehicle_plate_number = parsed.data.vehicle_plate_number;
  if (parsed.data.vehicle_make_model !== undefined)
    updatePayload.vehicle_make_model = parsed.data.vehicle_make_model;
  if (parsed.data.driver_license_number !== undefined)
    updatePayload.driver_license_number = parsed.data.driver_license_number;
  if (parsed.data.license_expiry_date !== undefined)
    updatePayload.license_expiry_date = parsed.data.license_expiry_date;

  const { data, error } = await supabase
    .from("rider")
    .update(updatePayload)
    .eq("rider_id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Rider not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    message: "Rider updated successfully.",
    data,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/riders/[id]
// ---------------------------------------------------------------------------

/**
 * Remove a rider record. Does not delete the underlying employee.
 */
export async function deleteRider(
  _request: Request,
  { params }: RouteParams
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("rider")
    .delete()
    .eq("rider_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Rider removed successfully.",
  });
}
