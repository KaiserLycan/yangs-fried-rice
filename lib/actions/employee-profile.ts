"use server";

import type { TablesUpdate } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isManager, resolveEmployeeRole, type EmployeeRole } from "@/lib/auth/roles";
import { toInternationalMobile } from "@/lib/validation/phone";
import {
  employeeProfileUpdateSchema,
  riderDetailsUpdateSchema,
  type EmployeeProfileUpdateInput,
  type RiderDetailsUpdateInput,
} from "@/lib/validation/employee-profile";
import {
  fieldErrorFromDbError,
  fieldErrorsFromIssues,
  type FieldErrors,
} from "@/lib/validation/field-errors";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

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

  const role = resolveEmployeeRole(employee?.role);
  if (!employee || !role) return null;

  return { employeeId: employee.employee_id, role };
}

// ---------------------------------------------------------------------------
// Read (AC6 — exists for direct API verification, not called by the
// frontend, same pattern as lib/actions/profile.ts's getMyProfile)
// ---------------------------------------------------------------------------

export async function getMyEmployeeProfile(): Promise<
  ActionResult<{
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    dateOfBirth: string | null;
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
      'first_name, last_name, name, email, role, schedule_shift, profileImage_URL, date_of_birth, "phone-num", password_last_updated, is_account_disabled',
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
      firstName: employee.first_name,
      lastName: employee.last_name,
      name: employee.name,
      email: employee.email,
      phoneNumber: (employee as any)["phone-num"] ?? null,
      dateOfBirth: employee.date_of_birth ?? null,
      role: (resolveEmployeeRole(employee.role) ?? employee.role) as EmployeeRole,
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
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }
  const { firstName, lastName, mobile, dateOfBirth, scheduleShift, role } = parsed.data;

  if (role !== undefined && !isManager(caller.role)) {
    return {
      success: false,
      error: "Only a manager can change an employee's role.",
    };
  }

  // Role and shift are assigned by a manager, never self-served — a rider or
  // staff member must not be able to rewrite their own shift by calling this
  // endpoint directly, whatever the profile card shows.
  if (scheduleShift !== undefined && !isManager(caller.role)) {
    return {
      success: false,
      error: "Only a manager can change an employee's shift.",
    };
  }

  const updatePayload: TablesUpdate<"employee"> = {} as TablesUpdate<"employee">;
  // Names are one pair — the card always sends both.
  if ((firstName === undefined) !== (lastName === undefined)) {
    return {
      success: false,
      error: "Send both first and last name.",
      fieldErrors: firstName === undefined
        ? { firstName: "Enter first name." }
        : { lastName: "Enter last name." },
    };
  }
  if (firstName !== undefined) updatePayload.first_name = firstName;
  if (lastName !== undefined) updatePayload.last_name = lastName;
  if (scheduleShift !== undefined) updatePayload.schedule_shift = scheduleShift;
  if (role !== undefined) updatePayload.role = role;
  if (dateOfBirth !== undefined) {
    (updatePayload as Record<string, string | null>).date_of_birth = dateOfBirth || null;
  }
  if (mobile !== undefined) {
    (updatePayload as Record<string, string | null>)["phone-num"] =
      toInternationalMobile(mobile) || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    // Nothing persistable was actually sent (e.g. only mobile/department,
    // which have no column yet) — not an error, just nothing to write.
    return { success: true, data: undefined };
  }

  // `.select()` so a write that silently matched no row (blocked by RLS) is
  // caught instead of reported as a success.
  const { data: updatedRows, error } = await supabase
    .from("employee")
    .update(updatePayload)
    .eq("employee_id", caller.employeeId)
    .select("employee_id");

  if (error) {
    console.error("updateMyEmployeeProfile failed:", error);
    return {
      success: false,
      error: describeProfileUpdateError(error),
      fieldErrors: fieldErrorFromDbError(error) ?? undefined,
    };
  }
  if (!updatedRows || updatedRows.length === 0) {
    return {
      success: false,
      error:
        "Your profile could not be updated — the database didn't allow the change. Ask a manager to check your employee record.",
    };
  }

  return { success: true, data: undefined };
}

/**
 * Turns a Postgres/PostgREST error into something the person (and whoever is
 * helping them) can act on. The old blanket "Could not update your profile."
 * hid the real cause — a missing column, a role the database rejects, a
 * permission block — behind the same sentence every time.
 */
function describeProfileUpdateError(error: {
  code?: string;
  message?: string;
}): string {
  const message = error.message ?? "";

  // 42703 = undefined_column, PGRST204 = column not in PostgREST's schema cache
  if (error.code === "42703" || error.code === "PGRST204" || /phone-num/.test(message)) {
    return "Couldn't save: the database is missing the employee phone number column (or its API cache is stale). Add the column and reload the API schema, then try again.";
  }
  // 23514 = check_violation — e.g. a stored role the role constraint rejects
  if (error.code === "23514") {
    return "Couldn't save: your employee record has a role the database doesn't accept. Ask a manager to set it to Manager, Staff or Delivery.";
  }
  // 42501 = insufficient_privilege (row-level security)
  if (error.code === "42501") {
    return "Couldn't save: you don't have permission to update this profile.";
  }
  return `Could not update your profile${message ? ` (${message})` : ""}.`;
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
      fieldErrors: fieldErrorsFromIssues(parsed.error.issues),
    };
  }
  const { vehicleMakeModel, vehiclePlateNumber, driverLicenseNumber, licenseExpiryDate } =
    parsed.data;

    const updatePayload: TablesUpdate<"rider"> = {};
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
    const constraint = `${error.message ?? ""} ${error.details ?? ""}`;
    const fieldErrors: FieldErrors | undefined = /plate/.test(constraint)
      ? { vehiclePlateNumber: "Plate number was rejected. Use e.g. ABC 1234." }
      : /license/.test(constraint)
        ? { driverLicenseNumber: "Licence number was rejected. Use e.g. N01-12-345678." }
        : /make_model/.test(constraint)
          ? { vehicleMakeModel: "Vehicle must be 2–50 characters." }
          : undefined;
    return { success: false, error: "Could not update your driver details.", fieldErrors };
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