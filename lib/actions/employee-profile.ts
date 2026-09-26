"use server";

import type { TablesUpdate } from "@/types/database.types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMAGE_BUCKETS } from "@/lib/storage/stored-image";
import { removeStoredImage } from "@/lib/storage/remove-stored-image";
import { isManager, resolveEmployeeRole, type EmployeeRole } from "@/lib/auth/roles";
import { toInternationalMobile } from "@/lib/validation/phone";
import { joinFullName } from "@/lib/validation/fields";
import {
  employeeProfileUpdateSchema,
  type EmployeeProfileUpdateInput,
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
    .select("employee_id, role, is_account_disabled")
    .eq("employee_id", user.id)
    .single();

  const role = resolveEmployeeRole(employee?.role);
  // A disabled account is treated as not signed in: every caller below then
  // refuses with its "sign in" error, and the middleware has already sent
  // the browser to /employee/login?error=account-disabled (issue #114).
  if (!employee || !role || employee.is_account_disabled) return null;

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
      'first_name, last_name, name, email, role, schedule_shift, profileImage_URL, date_of_birth, phone_number, password_last_updated, is_account_disabled',
    )
    .eq("employee_id", caller.employeeId)
    .single();

  if (employeeError || !employee) {
    return { success: false, error: "Could not load your profile." };
  }

  return {
    success: true,
    data: {
      firstName: employee.first_name,
      lastName: employee.last_name,
      // A generated column (first + last), which Postgres always reports as
      // nullable; rebuilt the same way if it ever does come back empty.
      name: employee.name ?? joinFullName(employee.first_name, employee.last_name),
      email: employee.email,
      phoneNumber: employee.phone_number ?? null,
      dateOfBirth: employee.date_of_birth ?? null,
      role: (resolveEmployeeRole(employee.role) ?? employee.role) as EmployeeRole,
      scheduleShift: employee.schedule_shift,
      profileImageUrl: employee.profileImage_URL,
      passwordLastUpdated: employee.password_last_updated,
      isAccountDisabled: employee.is_account_disabled,
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
 * only a caller who IS a Manager may change it, whatever the client sends.
 * The database refuses it too (`guard_employee_self_update`, issue #114).
 * `department` is validated but not persisted — no matching column exists
 * on `employee` yet.
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

  // Role and shift are assigned by a manager, never self-served — a staff
  // member must not be able to rewrite their own shift by calling this
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
    updatePayload.phone_number = toInternationalMobile(mobile) || null;
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
  if (error.code === "42703" || error.code === "PGRST204" || /phone_number/.test(message)) {
    return "Couldn't save: the database is missing the employee phone number column (or its API cache is stale). Add the column and reload the API schema, then try again.";
  }
  // 23514 = check_violation — e.g. a stored role the role constraint rejects
  if (error.code === "23514") {
    return "Couldn't save: your employee record has a role the database doesn't accept. Ask a manager to set it to Manager or Staff.";
  }
  // 42501 = insufficient_privilege (row-level security)
  if (error.code === "42501") {
    return "Couldn't save: you don't have permission to update this profile.";
  }
  return `Could not update your profile${message ? ` (${message})` : ""}.`;
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
 * they have no historical records referencing them (reports generated). Employee history is an audit
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

  // `order.employee_id` and the `delivery` table are both gone (nothing
  // wrote the first; the second went with pickup-only, issue #114), so
  // generated reports are the history left to protect. A failed count is
  // treated as history: refusing is the safe answer when we can't tell.
  const reportsResult = await supabase
    .from("reports")
    .select("report_id", { count: "exact", head: true })
    .eq("generated_by_employee_id", caller.employeeId);

  if (reportsResult.error || (reportsResult.count ?? 0) > 0) {
    return {
      success: false,
      error:
        "Your account has report history and can't be deleted. Deactivate your account instead.",
    };
  }

  // Read before the row goes: the photo is only reachable through it.
  const { data: photoRow } = await supabase
    .from("employee")
    .select("profileImage_URL")
    .eq("employee_id", caller.employeeId)
    .maybeSingle();

  // Service role: `employee` has no DELETE policy (RLS), so a session delete
  // would match zero rows and "succeed" while leaving the row behind, and the
  // auth user below would then be orphaned from it. The caller is verified
  // above and the delete is pinned to their own id.
  const admin = createAdminClient();
  const { data: deletedRows, error: employeeError } = await admin
    .from("employee")
    .delete()
    .eq("employee_id", caller.employeeId)
    .select("employee_id");
  if (employeeError || !deletedRows || deletedRows.length === 0) {
    return { success: false, error: "Could not delete your account. Please try again." };
  }

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

  await removeStoredImage(IMAGE_BUCKETS.employeeAvatar, photoRow?.profileImage_URL);
  await supabase.auth.signOut();
  return { success: true, data: undefined };
}