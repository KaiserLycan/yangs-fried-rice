"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isManager, isEmployeeRole, type EmployeeRole } from "@/lib/auth/roles";
import {
  employeeProfileUpdateSchema,
  riderDetailsUpdateSchema,
  type EmployeeProfileUpdateInput,
  type RiderDetailsUpdateInput,
} from "@/lib/validation/employee-profile";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Every function below starts from the signed-in employee's own id — none
 * accept an employee_id parameter from the caller. This module is
 * self-service only, mirroring the boundary lib/actions/profile.ts draws
 * for customers. Manager-level management of OTHER employees already
 * exists in lib/actions/admin.ts — don't duplicate that here by adding an
 * id parameter for convenience.
 */
async function requireEmployee(
  supabase: ReturnType<typeof createClient>,
): Promise<{ employeeId: string; role: EmployeeRole } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase
    .from("employee")
    .select("employee_id, role")
    .eq("employee_id", user.id)
    .single();

  if (!employee || !isEmployeeRole(employee.role)) return null;

  return { employeeId: employee.employee_id, role: employee.role };
}

// ---------------------------------------------------------------------------
// Read (AC6 — exists for direct API verification, not called by the
// frontend, same pattern as lib/actions/profile.ts's getMyProfile)
// ---------------------------------------------------------------------------

export async function getMyEmployeeProfile(): Promise<
  ActionResult<{
    name: string;
    email: string;
    role: EmployeeRole;
    scheduleShift: string | null;
    profileImageUrl: string | null;
    passwordLastUpdated: string | null;
    isAccountDisabled: boolean;
    rider: {
      vehicleMakeModel: string | null;
      vehiclePlateNumber: string | null;
      driverLicenseNumber: string | null;
      licenseExpiryDate: string | null;
    } | null;
  }>
> {
  const supabase = createClient();
  const caller = await requireEmployee(supabase);
  if (!caller) {
    return { success: false, error: "You must be signed in as an employee." };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employee")
    .select(
      "name, email, role, schedule_shift, profileImage_URL, password_last_updated, is_account_disabled",
    )
    .eq("employee_id", caller.employeeId)
    .single();

  if (employeeError || !employee) {
    return { success: false, error: "Could not load your profile." };
  }

  const { data: riderRow } = await supabase
    .from("rider")
    .select(
      "vehicle_make_model, vehicle_plate_number, driver_license_number, license_expiry_date",
    )
    .eq("employee_id", caller.employeeId)
    .maybeSingle();

  return {
    success: true,
    data: {
      name: employee.name,
      email: employee.email,
      role: employee.role as EmployeeRole,
      scheduleShift: employee.schedule_shift,
      profileImageUrl: employee.profileImage_URL,
      passwordLastUpdated: employee.password_last_updated,
      isAccountDisabled: employee.is_account_disabled,
      rider: riderRow
        ? {
            vehicleMakeModel: riderRow.vehicle_make_model,
            vehiclePlateNumber: riderRow.vehicle_plate_number,
            driverLicenseNumber: riderRow.driver_license_number,
            licenseExpiryDate: riderRow.license_expiry_date,
          }
        : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Update (AC2)
// ---------------------------------------------------------------------------

/**
 * Updates whichever fields are present.
 *
 * `role` is the one field with an extra gate beyond schema validation:
 * only a caller who IS a Manager may change it. This closes a real gap
 * in the current UI: components/profile/rider-details-cards.tsx's
 * EmployeeDetailsCard (used on /deliver/profile) has no such gate
 * client-side, so without this check a Rider could submit a role change
 * and have nothing stop it. `mobile`/`department` are validated but not
 * persisted — no matching columns exist on `employee` yet.
 */
export async function updateMyEmployeeProfile(
  input: EmployeeProfileUpdateInput,
): Promise<ActionResult<undefined>> {
  const supabase = createClient();
  const caller = await requireEmployee(supabase);
  if (!caller) {
    return { success: false, error: "You must be signed in as an employee." };
  }

  const parsed = employeeProfileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Some fields need fixing.",
    };
  }
  const { name, scheduleShift, role } = parsed.data;

  if (role !== undefined && !isManager(caller.role)) {
    return {
      success: false,
      error: "Only a manager can change an employee's role.",
    };
  }

  const updatePayload: Record<string, unknown> = {};
  if (name !== undefined) updatePayload.name = name;
  if (scheduleShift !== undefined) updatePayload.schedule_shift = scheduleShift;
  if (role !== undefined) updatePayload.role = role;

  if (Object.keys(updatePayload).length === 0) {
    // Nothing persistable was actually sent (e.g. only mobile/department,
    // which have no column yet) — not an error, just nothing to write.
    return { success: true, data: undefined };
  }

  const { error } = await supabase
    .from("employee")
    .update(updatePayload)
    .eq("employee_id", caller.employeeId);

  if (error) {
    return { success: false, error: "Could not update your profile." };
  }

  return { success: true, data: undefined };
}

/**
 * Updates the caller's own `rider` row. Returns an error if the caller
 * has no rider row at all (e.g. a Staff or Manager account) rather than
 * silently doing nothing.
 */
export async function updateMyRiderDetails(
  input: RiderDetailsUpdateInput,
): Promise<ActionResult<undefined>> {
  const supabase = createClient();
  const caller = await requireEmployee(supabase);
  if (!caller) {
    return { success: false, error: "You must be signed in as an employee." };
  }

  const parsed = riderDetailsUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Some fields need fixing.",
    };
  }
  const { vehicleMakeModel, vehiclePlateNumber, driverLicenseNumber, licenseExpiryDate } =
    parsed.data;

  const updatePayload: Record<string, unknown> = {};
  if (vehicleMakeModel !== undefined) updatePayload.vehicle_make_model = vehicleMakeModel;
  if (vehiclePlateNumber !== undefined)
    updatePayload.vehicle_plate_number = vehiclePlateNumber;
  if (driverLicenseNumber !== undefined)
    updatePayload.driver_license_number = driverLicenseNumber;
  if (licenseExpiryDate !== undefined)
    updatePayload.license_expiry_date = licenseExpiryDate;

  if (Object.keys(updatePayload).length === 0) {
    return { success: true, data: undefined };
  }

  const { error, count } = await supabase
    .from("rider")
    .update(updatePayload)
    .eq("employee_id", caller.employeeId);

  if (error) {
    return { success: false, error: "Could not update your driver details." };
  }
  if (count === 0) {
    return {
      success: false,
      error: "No rider profile found for your account.",
    };
  }

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Deactivate / Delete (AC3)
// ---------------------------------------------------------------------------

/**
 * Deactivates the caller's own account. Always available regardless of
 * history — reversible by a Manager later (lib/actions/admin.ts's
 * toggleEmployeeDisabled), unlike deletion.
 */
export async function deactivateMyEmployeeAccount(): Promise<
  ActionResult<undefined>
> {
  const supabase = createClient();
  const caller = await requireEmployee(supabase);
  if (!caller) {
    return { success: false, error: "You must be signed in as an employee." };
  }

  const { error } = await supabase
    .from("employee")
    .update({ is_account_disabled: true })
    .eq("employee_id", caller.employeeId);

  if (error) {
    return { success: false, error: "Could not deactivate your account." };
  }

  await supabase.auth.signOut();
  return { success: true, data: undefined };
}

/**
 * Permanently deletes the caller's own employee account — ONLY when
 * they have no historical records referencing them (orders processed,
 * deliveries handled, reports generated). Employee history is an audit
 * trail, not personal data the way a customer's cart is; deleting an
 * employee who has processed real orders would either violate FK
 * constraints or destroy accountability records depending on how those
 * FKs are configured. Per AC3's own wording ("preserved for record-
 * keeping... as required"), deactivation is the correct action once any
 * history exists — this function refuses deletion in that case rather
 * than silently anonymizing records that matter for accountability.
 */
export async function deleteMyEmployeeAccount(): Promise<
  ActionResult<undefined>
> {
  const supabase = createClient();
  const caller = await requireEmployee(supabase);
  if (!caller) {
    return { success: false, error: "You must be signed in as an employee." };
  }

  const [ordersResult, deliveriesResult, reportsResult] = await Promise.all([
    supabase
      .from("order")
      .select("order_id", { count: "exact", head: true })
      .eq("employee_id", caller.employeeId),
    supabase
      .from("delivery")
      .select("delivery_id", { count: "exact", head: true })
      .eq("employee_id", caller.employeeId),
    supabase
      .from("reports")
      .select("report_id", { count: "exact", head: true })
      .eq("generated_by_employee_id", caller.employeeId),
  ]);

  const hasHistory =
    (ordersResult.count ?? 0) > 0 ||
    (deliveriesResult.count ?? 0) > 0 ||
    (reportsResult.count ?? 0) > 0;

  if (hasHistory) {
    return {
      success: false,
      error:
        "Your account has order, delivery, or report history and can't be deleted. Deactivate your account instead.",
    };
  }

  const { error: riderError } = await supabase
    .from("rider")
    .delete()
    .eq("employee_id", caller.employeeId);
  if (riderError) {
    return { success: false, error: "Could not delete your account. Please try again." };
  }

  const { error: employeeError } = await supabase
    .from("employee")
    .delete()
    .eq("employee_id", caller.employeeId);
  if (employeeError) {
    return { success: false, error: "Could not delete your account. Please try again." };
  }

  const admin = createAdminClient();
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(
    caller.employeeId,
  );
  if (authDeleteError) {
    return {
      success: false,
      error:
        "Your data was removed, but we couldn't fully close your account. Please contact support.",
    };
  }

  await supabase.auth.signOut();
  return { success: true, data: undefined };
}